"use client";
/* eslint-disable react-hooks/immutability -- Bind imperative device controllers to the mounted owned screen. */
import { useEffect, useRef, useState, useSyncExternalStore, type Dispatch } from "react";
import type { Locale } from "@/i18n/config";
import type { Theme } from "@/theme/theme";
import { workstationLabels } from "../labels";
import { workstationSites, type WorkstationAccess } from "../sites";
import type { WorkstationEvent, WorkstationState } from "../state/workstation-machine";
import type { NotebookInputController } from "../input/NotebookInputController";
import type { NotebookPointerController } from "../input/NotebookPointerController";
import type { NotebookSound } from "../audio/notebook-sound";
import type { TerminalSession } from "../terminal/session";
import { NotesApp } from "./NotesApp.client";
import { CodeApp } from "./CodeApp.client";
import { TerminalApp, TerminalPrompt } from "./TerminalApp.client";
import { siteFrame } from "./site-framing";
import { ProjectsApp } from "./ProjectsApp.client";
import { useProjectPlayback } from "@/features/projects/ProjectPlaybackProvider.client";

const unmuted = () => false;

/** The parent cannot inspect a cross-origin document. A load event is not proof of usability. */
function CommercialPreview({ siteId, text, dispatch, projected }: {
  siteId: keyof typeof workstationSites; text: (typeof workstationLabels)[Locale]; dispatch: Dispatch<WorkstationEvent>; projected: boolean;
}) {
  const site = workstationSites[siteId];
  const [attempt, setAttempt] = useState(0), [help, setHelp] = useState(false), [failed, setFailed] = useState(false);
  const loaded = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 458.5366 });
  useEffect(() => {
    const node = viewport.current; if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      if (width > 0 && height > 0) setSize((previous) => Math.abs(previous.width - width) < .05 && Math.abs(previous.height - height) < .05 ? previous : { width, height });
    });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  const frame = siteFrame(size.width, size.height, site.preferredWidth, projected);
  useEffect(() => {
    loaded.current = false;
    const timer = setTimeout(() => { if (!loaded.current) setFailed(true); }, 15000);
    return () => clearTimeout(timer);
  }, [attempt]);
  return <div ref={viewport} className="workbench-site" data-workstation-browser data-immersive-site={siteId} data-site-fit={projected ? "fitted" : "native"} data-site-scale={frame.scale}>
    <iframe key={attempt} src={site.url} title={site.title} data-project-site={siteId}
      style={projected ? { width: frame.width, height: frame.height, transform: `scale(${frame.scale})`, transformOrigin: "0 0" } : undefined}
      sandbox="allow-scripts allow-same-origin" referrerPolicy="strict-origin-when-cross-origin"
      allow="camera 'none'; microphone 'none'; geolocation 'none'"
      onLoad={() => { loaded.current = true; }} onError={() => setFailed(true)} />
    <div className="workbench-site-controls">
      <button type="button" className="workbench-site-exit" data-input-action="close" aria-label={text.close} title={text.close} onClick={() => dispatch({ type: "CLOSE_X" })}>×</button>
      <button type="button" className="workbench-site-help" aria-label={text.siteOptions} title={text.siteOptions} aria-expanded={help || failed} onClick={() => setHelp(!help)}>⋯</button>
    </div>
    {help || failed || site.status !== "verified-local" ? <div className="workbench-site-fallback" role="region" aria-label={text.siteOptions}>
      <p role={failed ? "status" : undefined}>{failed ? text.siteFailed : text.siteHelp}</p>
      <a href={site.url} target="_blank" rel="noopener noreferrer">{text.external} ↗</a>
      <button type="button" onClick={() => { setFailed(false); setHelp(false); setAttempt(attempt + 1); }}>{text.siteRetry}</button>
      <button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.focus} ⤢</button>
      <button type="button" onClick={() => { setFailed(false); setHelp(false); }}>{text.siteResume}</button>
    </div> : null}
  </div>;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke="none" />
    {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></>}
  </svg>;
}

export function WorkbenchScreen({ state, dispatch, access, locale, theme, input, pointer, sound, session, prompt, inspecting, onInspect, onReady }: {
  state: WorkstationState; dispatch: Dispatch<WorkstationEvent>; locale: Locale; theme: Theme;
  access: WorkstationAccess;
  input: NotebookInputController; pointer: NotebookPointerController; sound: NotebookSound; session: TerminalSession;
  prompt: string; inspecting: boolean; onInspect: () => void; onReady: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const muted = useSyncExternalStore(sound.subscribe, sound.getMuted, unmuted);
  const text = workstationLabels[locale], app = state.app;
  const playback = useProjectPlayback();
  const site = app.kind === "PREVIEW" && app.siteId !== "fixture" ? workstationSites[app.siteId] : null;
  const title = app.kind === "DESKTOP" ? text.desktop : app.kind === "PROJECTS" ? text.projects : app.kind === "CODE" ? text.code : app.kind === "NOTES" ? text.notes : app.kind === "TERMINAL" ? text.terminal : site?.title ?? text.fixture;
  const src = app.kind === "PREVIEW" ? site?.url ?? `/workstation/embed-fixture?locale=${locale}&theme=${theme}` : null;
  useEffect(() => {
    pointer.bind(root.current);
    input.external = pointer.external = app.kind === "PREVIEW";
    const actions: Record<string, WorkstationEvent> = { focus: { type: "FOCUS_SCREEN" }, close: { type: "CLOSE_X" }, projects: { type: "OPEN_PROJECTS" }, browser: { type: "OPEN_SITE", siteId: "fixture" }, code: { type: "OPEN_CODE" }, notes: { type: "OPEN_NOTES" }, terminal: { type: "OPEN_TERMINAL" }, nutriopus: { type: "OPEN_SITE", siteId: "nutriopus" }, deborah: { type: "OPEN_SITE", siteId: "deborah" } };
    const unregister = [...Object.entries(actions).map(([id, event]) => pointer.register(id, { click: () => dispatch(event) })),
      pointer.register("mute", { click: sound.toggle }),
      pointer.register("desktop-prompt", { click: () => input.port?.focus() }), pointer.register("terminal-prompt", { click: () => input.port?.focus() })];
    return () => { pointer.bind(null); unregister.forEach((fn) => fn()); };
  }, [pointer, input, sound, app.kind, dispatch]);
  // "Ready" includes the native text port and trackpad bindings, not just the first 3D frame.
  useEffect(onReady, [onReady]);
  return <div ref={root} className="workbench-screen" data-workstation-screen data-app={app.kind} data-immersive={!!site}>
    {!site ? <div className="workbench-toolbar" onDoubleClick={(event) => { if (!(event.target as Element).closest("button") && state.mode !== "FOCUS_SCREEN") dispatch({ type: "FOCUS_SCREEN" }); }}>
      <span className="workbench-mark" aria-hidden="true">◈</span><span className="workbench-title">{title}</span>
      <span className="workbench-toolbar-end">
        {app.kind !== "DESKTOP" ? <button data-input-action="close" type="button" onClick={() => dispatch({ type: "CLOSE_X" })} aria-label={text.close} title={text.close}>×</button> : null}
        {state.mode !== "FOCUS_SCREEN" ? <button data-input-action="focus" type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })} aria-label={text.focus} title={text.focus}>⤢</button> : null}
        <button data-input-action="mute" data-workstation-mute type="button" onClick={sound.toggle} aria-pressed={muted} aria-label={muted ? text.soundOn : text.soundOff} title={muted ? text.soundOn : text.soundOff}><SpeakerIcon muted={muted} /></button>
      </span>
    </div> : null}
    {app.kind === "DESKTOP" ? <div className="workbench-desktop">
      <div className="workbench-orbit" aria-hidden="true"><span>◈</span></div>
      <p className="workbench-kicker">OBSIDIAN / WORKBENCH</p><h2>{text.greeting}</h2><p>{text.subtitle}</p>
      <div className="workbench-apps">
        {playback?.projects.length ? <button data-input-action="projects" type="button" onClick={() => dispatch({ type: "OPEN_PROJECTS" })}><span aria-hidden="true">▤</span>{text.projects}</button> : null}
        <button data-input-action="terminal" type="button" onClick={() => dispatch({ type: "OPEN_TERMINAL" })}><span aria-hidden="true">›_</span>{text.terminal}<small>{text.terminalHint}</small></button>
        {access.fixture ? <button data-input-action="browser" type="button" onClick={() => dispatch({ type: "OPEN_SITE", siteId: "fixture" })}><span aria-hidden="true">↗</span>{text.browser}<small>{text.fixture}</small></button> : null}
        <button data-input-action="code" type="button" onClick={() => dispatch({ type: "OPEN_CODE" })}><span aria-hidden="true">&lt;/&gt;</span>{text.code}<small>{text.codeHint}</small></button>
        <button data-input-action="notes" type="button" onClick={() => dispatch({ type: "OPEN_NOTES" })}><span aria-hidden="true">✎</span>{text.notes}<small>{text.notesLocal}</small></button>
      </div>
      <div className="workbench-projects">{access.sites.map(id => <button data-input-action={id} type="button" key={id} onClick={() => dispatch({ type: "OPEN_SITE", siteId: id })}>{workstationSites[id].title} <span aria-hidden="true">↗</span></button>)}</div>
      <TerminalPrompt session={session} input={input} locale={locale} prompt={prompt} placeholder={text.promptPlaceholder} compact onSubmitted={() => dispatch({ type: "OPEN_TERMINAL" })} />
    </div> : app.kind === "PROJECTS" ? <ProjectsApp locale={locale} pointer={pointer} dispatch={dispatch} access={access} />
      : app.kind === "NOTES" ? <NotesApp input={input} pointer={pointer} text={text} />
      : app.kind === "TERMINAL" ? <TerminalApp session={session} input={input} locale={locale} prompt={prompt} placeholder={text.promptPlaceholder} intro={text.terminalIntro} />
      : app.kind === "CODE" ? <CodeApp file={app.file} text={text} pointer={pointer} inspecting={inspecting} onInspect={onInspect} onSelect={(file) => dispatch({ type: "OPEN_CODE", file })} />
      : app.kind === "PREVIEW" && app.siteId !== "fixture" ? <CommercialPreview key={app.siteId} siteId={app.siteId} text={text} dispatch={dispatch} projected={state.mode !== "FOCUS_SCREEN"} />
      : <div className="workbench-browser" data-workstation-browser>
        <div className="workbench-address"><span aria-hidden="true">●</span><span>{site ? new URL(site.url).hostname : text.fixture}</span>
          {site ? <a href={site.url} target="_blank" rel="noopener noreferrer" aria-label={text.external} title={text.external}>↗</a> : null}</div>
        {site && site.status !== "verified-local" ? <div className="workbench-code"><p>{text.unavailable}</p><a href={site.url} target="_blank" rel="noopener noreferrer">{text.external} ↗</a></div>
          : src ? <iframe key={src} src={src} title={title} data-project-site={app.siteId}
            sandbox={site ? "allow-scripts allow-same-origin" : "allow-scripts"}
            referrerPolicy="strict-origin-when-cross-origin" loading="lazy" allow="camera 'none'; microphone 'none'; geolocation 'none'" /> : null}
        <p className="workbench-browser-note">{site ? text.localProof : text.fixtureNote}</p>
      </div>}
    <div className="workbench-reaction" aria-hidden="true"><span>x_x</span></div>
    <svg data-notebook-cursor className="workbench-cursor" viewBox="0 0 24 32" aria-hidden="true"><path d="M2 2v25l6-6 5 10 5-3-5-9 9-1Z" /></svg>
  </div>;
}
