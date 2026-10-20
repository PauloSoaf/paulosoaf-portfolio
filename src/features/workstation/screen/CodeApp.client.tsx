"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkstationLabels } from "../labels";
import type { NotebookPointerController } from "../input/NotebookPointerController";
import { highlight } from "../code/highlight";

type CodeFile = { id: string; group: string; path: string; language: string; lines: number; bytes: number; sha256: string; dirty: boolean; url: string | null; content: string };
type CodeIndex = { version: number; sha: string; files: CodeFile[] };
let cached: Promise<CodeIndex> | null = null;
/** The index is a separate chunk, fetched only when the Code app opens. */
const loadIndex = () => cached ??= import("../code/generated/code-index.json").then((module) => (module.default ?? module) as CodeIndex).catch((error) => { cached = null; throw error; });

export function CodeApp({ file, text, inspecting, onInspect, onSelect, pointer }: {
  file?: string; text: WorkstationLabels; inspecting: boolean; onInspect: () => void; onSelect: (file: string) => void; pointer: NotebookPointerController;
}) {
  const [index, setIndex] = useState<CodeIndex | null>(null), [failed, setFailed] = useState(false);
  const view = useRef<HTMLDivElement>(null);
  useEffect(() => { let live = true; loadIndex().then((value) => { if (live) setIndex(value); }, () => { if (live) setFailed(true); }); return () => { live = false; }; }, []);
  const selected = index?.files.find((item) => item.id === file) ?? index?.files[0] ?? null;
  const lines = useMemo(() => selected ? highlight(selected.content, selected.language) : [], [selected]);
  useEffect(() => { view.current?.scrollTo({ top: 0 }); }, [selected?.id]);
  useEffect(() => {
    if (!index) return;
    const unregister = [pointer.register("code-inspect", { click: onInspect }), ...index.files.map((item) => pointer.register(`code-file-${item.id}`, { click: () => onSelect(item.id) }))];
    return () => unregister.forEach((fn) => fn());
  }, [index, pointer, onInspect, onSelect]);
  const groups = useMemo(() => {
    const map = new Map<string, CodeFile[]>();
    for (const item of index?.files ?? []) map.set(item.group, [...(map.get(item.group) ?? []), item]);
    return [...map.entries()];
  }, [index]);
  if (failed) return <div className="workbench-code"><span aria-hidden="true">&lt;/&gt;</span><p>{text.codeMissing}</p></div>;
  if (!index || !selected) return <div className="workbench-code"><p>{text.loading}</p></div>;
  const groupName = (group: string) => ({ notebook: text.codeGroupNotebook, page: text.codeGroupPage, motion: text.codeGroupMotion, styles: text.codeGroupStyles })[group] ?? group;
  return <div className="workbench-ide" data-code-app>
    <nav className="workbench-ide-files" aria-label={text.codeFiles} data-input-scroll>
      <button type="button" className="workbench-ide-inspect" data-input-action="code-inspect" aria-pressed={inspecting} onClick={onInspect}>
        <span aria-hidden="true">◎</span> {inspecting ? text.inspectOn : text.inspect}
      </button>
      {groups.map(([group, files]) => <div key={group}>
        <p>{groupName(group)}</p>
        {files.map((item) => <button key={item.id} type="button" data-input-action={`code-file-${item.id}`} aria-current={item.id === selected.id ? "true" : undefined} onClick={() => onSelect(item.id)}>{item.path.split("/").at(-1)}</button>)}
      </div>)}
    </nav>
    <div className="workbench-ide-main">
      <div className="workbench-ide-path">
        <span>{selected.path}</span>
        <span className="workbench-ide-meta">{index.sha.slice(0, 7)}{selected.dirty ? ` · ${text.codeDirty}` : ""} · {selected.lines} {text.codeLines}</span>
        {selected.url ? <a href={selected.url} target="_blank" rel="noopener noreferrer" aria-label={text.codeGithub} title={text.codeGithub}>↗</a> : null}
      </div>
      {/* Scrollable code must be reachable by keyboard (WCAG 2.1.1, axe scrollable-region-focusable). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div ref={view} className="workbench-ide-view" data-input-scroll tabIndex={0} role="region" aria-label={selected.path}>
        <pre><code>{lines.map((tokens, line) => <span key={line} className="workbench-ide-line"><span className="workbench-ide-number" aria-hidden="true">{line + 1}</span>{tokens.map((token, index) => token.kind === "plain" ? token.text : <span key={index} className={`tok-${token.kind}`}>{token.text}</span>)}{"\n"}</span>)}</code></pre>
      </div>
    </div>
  </div>;
}
