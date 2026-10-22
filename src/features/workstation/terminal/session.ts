import type { Locale } from "@/i18n/config";
import { runCommand, type TerminalEffect } from "./commands";
import type { WorkstationAccess } from "../sites";

export type TerminalLine = { id: number; kind: "input" | "output" | "error" | "joke"; text: string };
const MAX_LINES = 80;

/** One terminal history shared by the desktop prompt and the Terminal app; effects run outside. */
export class TerminalSession {
  constructor(private readonly access?: WorkstationAccess) {}
  lines: TerminalLine[] = [];
  history: string[] = [];
  onEffect: (effect: TerminalEffect) => void = () => {};
  private id = 0;
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getLines = () => this.lines;

  submit(raw: string, locale: Locale, prompt: string) {
    const line = raw.replace(/[\r\n]+/g, " ").trim();
    if (!line) return;
    this.history = [...this.history.filter((item) => item !== line), line].slice(-30);
    const result = runCommand(line, locale, this.access);
    const clear = result.effects.some((effect) => effect.type === "clear");
    const next: TerminalLine[] = clear ? [] : [...this.lines, { id: ++this.id, kind: "input", text: `${prompt} ${line}` }];
    for (const output of result.output) next.push({ id: ++this.id, kind: result.tone ?? "output", text: output });
    this.lines = next.slice(-MAX_LINES);
    this.listeners.forEach((listener) => listener());
    for (const effect of result.effects) if (effect.type !== "clear") this.onEffect(effect);
  }
}
