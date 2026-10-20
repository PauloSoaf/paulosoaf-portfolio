export type TextSelection = { value: string; start: number; end: number };
export type TextPort = { read: () => TextSelection; write: (next: TextSelection) => void; focus: () => void };
const shifted: Record<string, string> = { "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "*", "9": "(", "0": ")", ",": "<", ".": ">", "\\": "|" };

/** Edits the owned app's model directly. No synthetic keyboard/input events or iframe access. */
export function editText(selection: TextSelection, key: string): TextSelection {
  const { value } = selection;
  const start = Math.max(0, Math.min(value.length, selection.start)), end = Math.max(start, Math.min(value.length, selection.end));
  let from = start, insert = key;
  const to = end;
  if (key === "Backspace") { from = start === end ? Math.max(0, start - 1) : start; insert = ""; }
  if (key.startsWith("Arrow")) {
    let caret = start;
    if (key === "ArrowLeft") caret = start === end ? Math.max(0, start - 1) : start;
    if (key === "ArrowRight") caret = start === end ? Math.min(value.length, end + 1) : end;
    const column = start - (value.lastIndexOf("\n", start - 1) + 1);
    if (key === "ArrowUp") { const lineEnd = value.lastIndexOf("\n", start - 1); const lineStart = value.lastIndexOf("\n", lineEnd - 1) + 1; caret = lineEnd < 0 ? 0 : Math.min(lineStart + column, lineEnd); }
    if (key === "ArrowDown") { const next = value.indexOf("\n", start); const endNext = value.indexOf("\n", next + 1); caret = next < 0 ? value.length : Math.min(next + 1 + column, endNext < 0 ? value.length : endNext); }
    return { value, start: caret, end: caret };
  }
  if (key === "Enter") insert = "\n";
  if (key === "Tab") insert = "  ";
  if (!["Enter", "Tab", "Backspace"].includes(key) && [...key].length !== 1) return selection;
  const next = value.slice(0, from) + insert + value.slice(to), caret = from + insert.length;
  return { value: next, start: caret, end: caret };
}

export class NotebookInputController {
  document: TextSelection = { value: "", start: 0, end: 0 };
  port: TextPort | null = null;
  shift = false; caps = false;
  pressed = new Map<string, number>();
  /** Per-key vertical jolt (scene units) after impacts: offset and velocity per instance. */
  jolts: { offset: number; velocity: number }[] = [];
  wake = () => {};
  onEscape = () => {};
  onKey: (label: string) => void = () => {};
  onFeedback: (message: "local" | "external" | "ready") => void = () => {};
  external = false;
  get animating() { return this.pressed.size > 0 || this.jolts.some((jolt) => jolt.offset !== 0 || jolt.velocity !== 0); }
  /** A hard landing makes random keycaps hop out and settle back. */
  jolt(count: number, strength: number) {
    if (this.jolts.length !== count) this.jolts = Array.from({ length: count }, () => ({ offset: 0, velocity: 0 }));
    for (const jolt of this.jolts) if (Math.random() < .55) jolt.velocity += strength * (.35 + Math.random() * .65);
    this.wake();
  }
  key(label: string) {
    this.pressed.set(label, performance.now() + 160); this.onKey(label); this.wake();
    if (this.external) { this.onFeedback("external"); return; }
    this.onFeedback("local");
    if (label === "shift") { this.shift = !this.shift; return; }
    if (label === "caps") { this.caps = !this.caps; return; }
    if (label === "esc") { this.onEscape(); return; }
    if (label === "ctrl" || label === "alt") return;
    const special: Record<string, string> = { "⌫": "Backspace", enter: "Enter", space: " ", tab: "Tab", "←": "ArrowLeft", "→": "ArrowRight", "↑": "ArrowUp", "↓": "ArrowDown" };
    let key = special[label] ?? label.toLowerCase();
    if (/^[a-z]$/.test(key) && this.shift !== this.caps) key = key.toUpperCase();
    else if (this.shift) key = shifted[key] ?? key;
    if (this.port) { this.port.write(editText(this.port.read(), key)); this.port.focus(); }
    this.shift = false;
  }
}
