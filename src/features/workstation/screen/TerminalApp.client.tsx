"use client";
/* eslint-disable react-hooks/immutability -- The input controller owns the active text port. */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { NotebookInputController, TextSelection } from "../input/NotebookInputController";
import type { TerminalSession } from "../terminal/session";

const noLines = () => [];

/**
 * A real <input> wired as the notebook's text port: 3D keys and the physical keyboard type into
 * it, Enter submits to the curated command map. `compact` is the one-line desktop prompt.
 */
export function TerminalPrompt({ session, input, locale, prompt, placeholder, compact = false, onSubmitted }: {
  session: TerminalSession; input: NotebookInputController; locale: Locale; prompt: string; placeholder: string; compact?: boolean; onSubmitted?: () => void;
}) {
  const [value, setValue] = useState("");
  const field = useRef<HTMLInputElement>(null), recall = useRef(-1);
  // Opening the Terminal (or submitting from the desktop prompt, which unmounts) hands it the focus,
  // unless the visitor is already somewhere else on the page.
  useEffect(() => {
    const active = document.activeElement;
    if (!compact && (!active || active === document.body || active.closest("[data-workstation], dialog"))) field.current?.focus({ preventScroll: true });
  }, [compact]);
  useEffect(() => {
    const submit = (line: string) => { onSubmitted?.(); session.submit(line, locale, prompt); setValue(""); recall.current = -1; };
    const read = (): TextSelection => ({ value: field.current?.value ?? "", start: field.current?.selectionStart ?? 0, end: field.current?.selectionEnd ?? 0 });
    const write = (next: TextSelection) => {
      if (next.value.includes("\n")) { submit(next.value.split("\n")[0]!); return; }
      // Write the DOM synchronously: physical typing may follow before React re-renders.
      const element = field.current;
      if (element) { element.value = next.value; element.setSelectionRange(next.start, next.end); }
      setValue(next.value);
    };
    const port = { read, write, focus: () => field.current?.focus({ preventScroll: true }) };
    input.port = port;
    return () => { if (input.port === port) input.port = null; };
  }, [input, session, locale, prompt, onSubmitted]);
  return <form className={compact ? "workbench-prompt workbench-prompt-compact" : "workbench-prompt"} onSubmit={(event) => {
    // Show the terminal first, so a command that opens another app wins.
    event.preventDefault(); onSubmitted?.(); session.submit(value, locale, prompt); setValue(""); recall.current = -1;
  }}>
    <label htmlFor={compact ? "workbench-desktop-prompt" : "workbench-terminal-prompt"}><span aria-hidden="true">{prompt}</span><span className="sr-only">{placeholder}</span></label>
    <input ref={field} id={compact ? "workbench-desktop-prompt" : "workbench-terminal-prompt"} data-input-action={compact ? "desktop-prompt" : "terminal-prompt"} value={value}
      autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder={placeholder} maxLength={160}
      onChange={(event) => setValue(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        const history = session.history; if (!history.length) return;
        event.preventDefault();
        recall.current = event.key === "ArrowUp" ? Math.min(history.length - 1, recall.current + 1) : Math.max(-1, recall.current - 1);
        setValue(recall.current < 0 ? "" : history[history.length - 1 - recall.current]!);
      }} />
  </form>;
}

export function TerminalApp({ session, input, locale, prompt, placeholder, intro }: {
  session: TerminalSession; input: NotebookInputController; locale: Locale; prompt: string; placeholder: string; intro: string;
}) {
  const lines = useSyncExternalStore(session.subscribe, session.getLines, noLines);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [lines]);
  return <div className="workbench-terminal">
    <div ref={log} className="workbench-terminal-log" data-input-scroll aria-live="polite">
      <p className="workbench-terminal-intro">{intro}</p>
      {lines.map((line) => <p key={line.id} data-kind={line.kind}>{line.text}</p>)}
    </div>
    <TerminalPrompt session={session} input={input} locale={locale} prompt={prompt} placeholder={placeholder} />
  </div>;
}
