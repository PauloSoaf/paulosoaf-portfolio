import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { runCommand } from "@/features/workstation/terminal/commands";
import { TerminalSession } from "@/features/workstation/terminal/session";
import { highlight } from "@/features/workstation/code/highlight";
import { INSPECT_REGISTRY, resolveInspectTarget } from "@/features/workstation/code/inspect";
import { initialWorkstationState, workstationReducer } from "@/features/workstation/state/workstation-machine";
import { buildIndex, MANIFEST, ROOT, scanSecrets, validatePath } from "../../scripts/generate-workstation-code.mjs";

describe("curated terminal", () => {
  it("maps commands in every locale to page and notebook effects", () => {
    expect(runCommand("projetos", "pt").effects).toEqual([{ type: "scroll", section: "work" }]);
    expect(runCommand("contact", "en").effects).toEqual([{ type: "scroll", section: "contact" }]);
    expect(runCommand("idioma es", "pt").effects).toEqual([{ type: "locale", locale: "es" }]);
    expect(runCommand("abrir nutriopus", "pt").effects).toEqual([{ type: "open", app: "nutriopus" }]);
    expect(runCommand("codigo WorkstationScene.client.tsx", "pt").effects[0]).toMatchObject({ type: "code" });
    expect(runCommand("pular", "pt").effects).toEqual([{ type: "notebook", action: "hop" }]);
    expect(runCommand("sudo rm -rf /", "en")).toMatchObject({ tone: "joke", effects: [{ type: "notebook", action: "hop" }] });
    expect(runCommand("ayuda", "es").output.length).toBeGreaterThan(2);
  });
  it("never resolves prototype keys or unknown input to an effect", () => {
    for (const line of ["constructor", "__proto__", "toString", "hasOwnProperty", "abrir constructor", "idioma de", "eval(1)", "<script>"]) {
      expect(runCommand(line, "pt").effects).toEqual([]);
    }
    expect(runCommand("x".repeat(5000), "pt").output[0]!.length).toBeLessThan(120);
    expect(runCommand("   ", "pt")).toEqual({ output: [], effects: [] });
  });
  it("keeps a bounded shared history and runs effects outside", () => {
    const session = new TerminalSession(), effect = vi.fn();
    session.onEffect = effect;
    session.submit("tema", "pt", "$"); session.submit("ajuda", "pt", "$");
    expect(effect).toHaveBeenCalledWith({ type: "theme" });
    expect(session.lines.some((line) => line.kind === "input" && line.text === "$ tema")).toBe(true);
    session.submit("limpar", "pt", "$"); expect(session.lines).toEqual([]);
    for (let i = 0; i < 200; i++) session.submit(`echo ${i}`, "pt", "$");
    expect(session.lines.length).toBeLessThanOrEqual(80); expect(session.history.length).toBeLessThanOrEqual(30);
  });
});

describe("Code app source index", () => {
  it("marks the first unstaged, staged and untracked source as local and never links it to a clean commit", () => {
    const root = mkdtempSync(join(tmpdir(), "ws-code-git-"));
    const git = (...args: string[]) => execFileSync("git", args, { cwd: root, stdio: "pipe", encoding: "utf8" });
    const path = "src/features/source.ts", manifest: [string, string, string][] = [["notebook", "source", path]];
    try {
      mkdirSync(join(root, "src/features"), { recursive: true });
      writeFileSync(join(root, path), "export const version = 1;\n");
      git("init"); git("config", "remote.origin.url", "https://github.com/PauloSoaf/paulosoaf-portfolio.git");
      git("add", "."); git("-c", "user.name=QA fixture", "-c", "user.email=qa@example.invalid", "commit", "-m", "fixture");
      const sha = git("rev-parse", "HEAD").trim();
      expect(buildIndex({ root, manifest }).files[0]).toMatchObject({ dirty: false, url: null });
      git("update-ref", "refs/remotes/origin/main", sha);
      expect(buildIndex({ root, manifest }).files[0]).toMatchObject({ dirty: false, url: `https://github.com/PauloSoaf/paulosoaf-portfolio/blob/${sha}/${path}` });
      writeFileSync(join(root, path), "export const version = 2;\n");
      expect(buildIndex({ root, manifest }).files[0]).toMatchObject({ dirty: true, url: null, content: "export const version = 2;\n" });
      git("add", ".");
      expect(buildIndex({ root, manifest }).files[0]).toMatchObject({ dirty: true, url: null });
      const fresh = "src/features/new-source.ts";
      writeFileSync(join(root, fresh), "export {};\n");
      expect(buildIndex({ root, manifest: [["notebook", "new-source", fresh]] }).files[0]).toMatchObject({ dirty: true, url: null });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("publishes only the explicit manifest with hashes", () => {
    const index = buildIndex();
    expect(index.files).toHaveLength(MANIFEST.length);
    for (const file of index.files) {
      const actual = readFileSync(join(ROOT, file.path), "utf8");
      expect(file.content).toBe(actual);
      expect(file.sha256).toBe(createHash("sha256").update(actual).digest("hex"));
      expect(file.path.startsWith("src/") || file.path === "scripts/generate-workstation-code.mjs").toBe(true);
    }
  });
  it("rejects escapes, absolute paths, unexpected roots/extensions and secrets", () => {
    for (const path of ["../package.json", "/etc/passwd", "C:/Windows/win.ini", "src\\features\\x.ts", "src/../.env", ".env", "src/app/page.tsx", "src/features/x.json", "node_modules/three/index.ts"]) {
      expect(() => validatePath(path)).toThrow();
    }
    expect(() => scanSecrets("const key = \"AKIAABCDEFGHIJKLMNOP\";", "x.ts")).toThrow();
    expect(() => scanSecrets("password: \"correct-horse-battery\"", "x.ts")).toThrow();
    expect(() => scanSecrets("-----BEGIN RSA PRIVATE KEY-----", "x.ts")).toThrow();
    expect(() => scanSecrets("const label = 'password';", "x.ts")).not.toThrow();
  });
  it("refuses a symlinked file even inside an allowed root", () => {
    const root = mkdtempSync(join(tmpdir(), "ws-code-"));
    mkdirSync(join(root, "src/features"), { recursive: true }); writeFileSync(join(root, "outside.ts"), "export {}");
    try { symlinkSync(join(root, "outside.ts"), join(root, "src/features/link.ts")); } catch { return; /* no symlink permission on this host */ }
    expect(() => validatePath("src/features/link.ts", root)).toThrow();
  });
  it("every inspectable page component maps to a published file", () => {
    const ids = new Set(MANIFEST.map((entry) => entry[1]));
    for (const entry of INSPECT_REGISTRY) expect(ids.has(entry.file)).toBe(true);
  });
  it("inspect resolves the most specific registered component and ignores the notebook screen", () => {
    document.body.innerHTML = `<main><section id="work"><article class="project-card"><h3>x</h3></article></section></main><div data-workstation><div data-workstation-screen><button>y</button></div></div>`;
    expect(resolveInspectTarget(document.querySelector("h3"))?.file).toBe("project-card");
    expect(resolveInspectTarget(document.querySelector("[data-workstation-screen] button"))).toBeNull();
    expect(resolveInspectTarget(document.querySelector("[data-workstation]"))?.file).toBe("laptop-model");
  });
});

describe("read-only highlighter", () => {
  it("tokenizes keywords, strings, comments, JSX tags and numbers across lines", () => {
    const lines = highlight("const a = \"x\"; // note\n/* block\nstill */ <Canvas zoom={1} />", "tsx");
    expect(lines[0]).toEqual(expect.arrayContaining([{ kind: "keyword", text: "const" }, { kind: "string", text: "\"x\"" }, { kind: "comment", text: "// note" }]));
    expect(lines[1]![0]).toEqual({ kind: "comment", text: "/* block" });
    expect(lines[2]!.some((token) => token.kind === "tag" && token.text === "<Canvas")).toBe(true);
    expect(lines[2]!.some((token) => token.kind === "number" && token.text === "1")).toBe(true);
    expect(lines.flat().map((token) => token.text).join("")).toBe("const a = \"x\"; // note/* blockstill */ <Canvas zoom={1} />");
  });
  it("marks CSS properties", () => {
    expect(highlight(".a{color:red}", "css")[0]).toEqual(expect.arrayContaining([{ kind: "property", text: "color" }]));
  });
});

describe("workstation apps", () => {
  it("opens the terminal and code files by manifest id only", () => {
    expect(workstationReducer(initialWorkstationState, { type: "OPEN_TERMINAL" }).app).toEqual({ kind: "TERMINAL" });
    expect(workstationReducer(initialWorkstationState, { type: "OPEN_CODE", file: "rigid-body" }).app).toEqual({ kind: "CODE", file: "rigid-body" });
    for (const file of ["../secret", "Rigid", "a b", 42, null, { toString: () => "x" }, "x".repeat(200)]) {
      expect(workstationReducer(initialWorkstationState, { type: "OPEN_CODE", file })).toBe(initialWorkstationState);
    }
  });
  it("resets the pose without closing the open app", () => {
    const open = workstationReducer(workstationReducer(initialWorkstationState, { type: "OPEN_NOTES" }), { type: "ROTATE", axis: 1, delta: .5 });
    const reset = workstationReducer(workstationReducer(open, { type: "SET_LID", angle: 40 }), { type: "RESET_POSE" });
    expect(reset).toMatchObject({ app: { kind: "NOTES" }, rotation: [0, 0, 0], lidAngle: 108 });
  });
});
