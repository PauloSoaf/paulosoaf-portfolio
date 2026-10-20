/** Lightweight read-only highlighter for TS/TSX/CSS/MJS: no runtime dependency, line by line. */
export type TokenKind = "plain" | "comment" | "string" | "keyword" | "number" | "tag" | "type" | "punct" | "property";
export type Token = { kind: TokenKind; text: string };

const KEYWORDS = new Set(("import export from const let var function return if else for while do switch case break continue default new class extends implements interface type enum as typeof keyof in of instanceof void null undefined true false this super async await yield try catch finally throw readonly private public protected static declare satisfies override get set").split(" "));
type State = { block: boolean; template: boolean; depth: number };

function readString(line: string, start: number, quote: string) {
  let index = start + 1;
  while (index < line.length) { if (line[index] === "\\") { index += 2; continue; } if (line[index] === quote) return index + 1; index++; }
  return -1;
}

function tokenizeLine(line: string, state: State, css: boolean): Token[] {
  const tokens: Token[] = [];
  const push = (kind: TokenKind, value: string) => { if (!value) return; const last = tokens.at(-1); if (last && last.kind === kind) last.text += value; else tokens.push({ kind, text: value }); };
  let index = 0;
  while (index < line.length) {
    if (state.block) {
      const end = line.indexOf("*/", index);
      if (end < 0) { push("comment", line.slice(index)); return tokens; }
      push("comment", line.slice(index, end + 2)); index = end + 2; state.block = false; continue;
    }
    if (state.template) {
      const end = readString("`" + line.slice(index), 0, "`");
      if (end < 0) { push("string", line.slice(index)); return tokens; }
      push("string", line.slice(index, index + end - 1)); index += end - 1; state.template = false; continue;
    }
    const rest = line.slice(index), char = line[index]!;
    if (!css && rest.startsWith("//")) { push("comment", rest); break; }
    if (rest.startsWith("/*")) { state.block = true; continue; }
    if (char === '"' || char === "'" || (char === "`" && !css)) {
      const end = readString(line, index, char);
      if (end < 0) { push("string", rest); if (char === "`") state.template = true; break; }
      push("string", line.slice(index, end)); index = end; continue;
    }
    const number = /^(?:0x[\da-f]+|\d[\d_]*\.?\d*(?:e[+-]?\d+)?|\.\d+)(?:px|rem|em|ms|s|deg|vh|vw|%|fr|n)?/i.exec(rest);
    if (number && !/[\w$]/.test(line[index - 1] ?? "")) { push("number", number[0]); index += number[0].length; continue; }
    if (!css && char === "<" && /^<\/?[A-Za-z]/.test(rest)) {
      const tag = /^<\/?[A-Za-z][\w.]*/.exec(rest)![0]; push("tag", tag); index += tag.length; continue;
    }
    const word = /^[A-Za-z_$][\w$-]*/.exec(rest);
    if (word) {
      const value = css ? word[0] : word[0].replace(/-.*$/, "");
      const next = line.slice(index + value.length).trimStart()[0];
      push(css ? (next === ":" && state.depth > 0 ? "property" : "plain") : KEYWORDS.has(value) ? "keyword" : /^[A-Z]/.test(value) ? "type" : "plain", value);
      index += value.length; continue;
    }
    if (char === "{") state.depth++; else if (char === "}") state.depth = Math.max(0, state.depth - 1);
    push(/[{}()[\];,.:=<>+\-*/!?&|%^~@#]/.test(char) ? "punct" : "plain", char); index++;
  }
  return tokens;
}

export function highlight(source: string, language: string): Token[][] {
  const state: State = { block: false, template: false, depth: 0 }, css = language === "css";
  return source.replace(/\r\n?/g, "\n").split("\n").map((line) => tokenizeLine(line, state, css));
}
