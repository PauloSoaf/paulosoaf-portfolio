"use client";
/* eslint-disable react-hooks/immutability -- Bind imperative device controllers to the mounted owned screen. */
import { useEffect, useRef, type Dispatch } from "react";
import type { Locale } from "@/i18n/config";
import type { Theme } from "@/theme/theme";
import { workstationLabels } from "../labels";
import { workstationSites } from "../sites";
import type { WorkstationEvent, WorkstationState } from "../state/workstation-machine";
import type { NotebookInputController } from "../input/NotebookInputController";
import type { NotebookPointerController } from "../input/NotebookPointerController";
import { NotesApp } from "./NotesApp.client";

export function WorkbenchScreen({ state, dispatch, locale, theme, input, pointer }: {
  state: WorkstationState; dispatch: Dispatch<WorkstationEvent>; locale: Locale; theme: Theme;
  input: NotebookInputController; pointer: NotebookPointerController;
}) {
  const root = useRef<HTMLDivElement>(null);
  const text = workstationLabels[locale], app = state.app;
  const site = app.kind === "PREVIEW" && app.siteId !== "fixture" ? workstationSites[app.siteId] : null;
  const title = app.kind === "DESKTOP" ? text.desktop : app.kind === "CODE" ? text.code : app.kind === "NOTES" ? text.notes : site?.title ?? text.fixture;
  const src = app.kind === "PREVIEW" ? site?.url ?? `/workstation/embed-fixture?locale=${locale}&theme=${theme}` : null;
  useEffect(() => {
    pointer.bind(root.current);
    input.external = pointer.external = app.kind === "PREVIEW";
    const actions: Record<string, WorkstationEvent> = { focus: { type: "FOCUS_SCREEN" }, close: { type: "CLOSE_X" }, browser: { type: "OPEN_SITE", siteId: "fixture" }, code: { type: "OPEN_CODE" }, notes: { type: "OPEN_NOTES" }, nutriopus: { type: "OPEN_SITE", siteId: "nutriopus" }, deborah: { type: "OPEN_SITE", siteId: "deborah" } };
    const unregister = Object.entries(actions).map(([id, event]) => pointer.register(id, { click: () => dispatch(event) }));
    return () => { pointer.bind(null); unregister.forEach((fn) => fn()); };
  }, [pointer, input, app.kind, dispatch]);
  return <div ref={root} className="workbench-screen" data-workstation-screen data-app={app.kind}>
    <div className="workbench-toolbar">
      <span className="workbench-mark" aria-hidden="true">◈</span><span>{title}</span>
      <span className="workbench-toolbar-end">
        {state.mode !== "FOCUS_SCREEN" ? <button data-input-action="focus" type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })} aria-label={text.focus} title={text.focus}>⤢</button> : null}
        {app.kind !== "DESKTOP" ? <button data-input-action="close" type="button" onClick={() => dispatch({ type: "CLOSE_X" })} aria-label={text.close} title={text.close}>×</button> : null}
      </span>
    </div>
    {app.kind === "DESKTOP" ? <div className="workbench-desktop">
      <div className="workbench-orbit" aria-hidden="true"><span>◈</span></div>
      <p className="workbench-kicker">OBSIDIAN / WORKBENCH</p><h2>{text.greeting}</h2><p>{text.subtitle}</p>
      <div className="workbench-apps">
        <button data-input-action="browser" type="button" onClick={() => dispatch({ type: "OPEN_SITE", siteId: "fixture" })}><span aria-hidden="true">↗</span>{text.browser}<small>{text.fixture}</small></button>
        <button data-input-action="code" type="button" onClick={() => dispatch({ type: "OPEN_CODE" })}><span aria-hidden="true">⌘</span>{text.code}<small>P03</small></button>
        <button data-input-action="notes" type="button" onClick={() => dispatch({ type: "OPEN_NOTES" })}><span aria-hidden="true">✎</span>{text.notes}<small>{text.notesLocal}</small></button>
      </div>
      <div className="workbench-projects">{Object.entries(workstationSites).map(([id, item]) => <button data-input-action={id} type="button" key={id} onClick={() => dispatch({ type: "OPEN_SITE", siteId: id })}>{item.title} <span aria-hidden="true">↗</span></button>)}</div>
    </div> : app.kind === "NOTES" ? <NotesApp input={input} pointer={pointer} text={text} /> : app.kind === "CODE" ? <div className="workbench-code"><span aria-hidden="true">&lt;/&gt;</span><h2>{text.code}</h2><p>{text.codeNote}</p><button type="button" data-input-action="close" onClick={() => dispatch({ type: "CLOSE_X" })}>{text.close}</button></div>
      : <div className="workbench-browser" data-workstation-browser>
        <div className="workbench-address"><span aria-hidden="true">●</span><span>{site ? new URL(site.url).hostname : text.fixture}</span>
          {site ? <a href={site.url} target="_blank" rel="noopener noreferrer" aria-label={text.external} title={text.external}>↗</a> : null}</div>
        {site && site.status !== "verified-local" ? <div className="workbench-code"><p>{text.unavailable}</p><a href={site.url} target="_blank" rel="noopener noreferrer">{text.external} ↗</a></div>
          : src ? <iframe key={src} src={src} title={title} data-project-site={app.siteId}
            sandbox={site ? "allow-scripts allow-same-origin" : "allow-scripts"}
            referrerPolicy="strict-origin-when-cross-origin" loading="lazy" allow="camera 'none'; microphone 'none'; geolocation 'none'" /> : null}
        <p className="workbench-browser-note">{site ? text.localProof : text.fixtureNote}</p>
      </div>}
    <svg data-notebook-cursor className="workbench-cursor" viewBox="0 0 24 32" aria-hidden="true"><path d="M2 2v25l6-6 5 10 5-3-5-9 9-1Z" /></svg>
  </div>;
}
