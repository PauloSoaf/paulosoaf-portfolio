"use client";
/* eslint-disable react-hooks/immutability -- The input controller owns the session document and text port. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { WorkstationLabels } from "../labels";
import type { NotebookInputController, TextSelection } from "../input/NotebookInputController";
import type { NotebookPointerController } from "../input/NotebookPointerController";

/** A small owned application makes real model input testable without crossing iframe boundaries. */
export function NotesApp({ input, pointer, text }: { input: NotebookInputController; pointer: NotebookPointerController; text: WorkstationLabels }) {
  const [document, setDocument] = useState(input.document);
  const [saved, setSaved] = useState("");
  const area = useRef<HTMLTextAreaElement>(null), paper = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  useLayoutEffect(() => { area.current?.setSelectionRange(document.start, document.end); }, [document]);
  useEffect(() => {
    const read = () => ({ value: area.current?.value ?? "", start: area.current?.selectionStart ?? 0, end: area.current?.selectionEnd ?? 0 });
    const write = (next: TextSelection) => { input.document = next; setDocument(next); };
    const port = { read, write, focus: () => area.current?.focus({ preventScroll: true }) };
    input.port = port; port.focus();
    const unregister = [
      pointer.register("notes-text", { click: port.focus, doubleClick: () => { const next = { ...read(), start: 0, end: read().value.length }; write(next); port.focus(); } }),
      pointer.register("notes-save", { click: () => setSaved(read().value) }),
      pointer.register("notes-handle", { drag: (dx, dy) => {
        offset.current.x = Math.max(-80, Math.min(80, offset.current.x + dx * 800));
        offset.current.y = Math.max(-20, Math.min(60, offset.current.y + dy * 458));
        if (paper.current) paper.current.style.transform = `translate(${offset.current.x}px,${offset.current.y}px)`;
      } }),
    ];
    return () => { if (input.port === port) input.port = null; unregister.forEach((fn) => fn()); };
  }, [input, pointer]);
  return <div className="workbench-notes" data-input-scroll>
    <div ref={paper} className="workbench-notes-paper">
      <div className="workbench-notes-handle" data-input-action="notes-handle"><span aria-hidden="true">⠿</span> {text.notes}</div>
      <label htmlFor="workbench-notes-text">{text.notesLabel}</label>
      <textarea ref={area} id="workbench-notes-text" data-input-action="notes-text" value={document.value} spellCheck={false}
        onChange={(event) => { const el = event.currentTarget; const next = { value: el.value, start: el.selectionStart, end: el.selectionEnd }; input.document = next; setDocument(next); }} />
      <button type="button" data-input-action="notes-save" onClick={() => setSaved(document.value)}>{text.notesSave}</button>
      <output aria-live="polite" data-notes-saved>{saved ? `${text.notesSaved}: ${saved}` : text.notesLocal}</output>
      <p>{text.inputHint}</p>
      <div className="workbench-notes-guide"><h3>{text.notesGuide}</h3><p>{text.notesKeys}</p><p>{text.notesPointer}</p><p>{text.notesExternal}</p></div>
    </div>
  </div>;
}
