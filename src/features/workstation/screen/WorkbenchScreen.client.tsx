"use client";
import type { Dispatch } from "react";
import type { Locale } from "@/i18n/config";
import type { Theme } from "@/theme/theme";
import { workstationLabels } from "../labels";
import { workstationSites } from "../sites";
import type { WorkstationEvent, WorkstationState } from "../state/workstation-machine";

export function WorkbenchScreen({ state, dispatch, locale, theme }: {
  state: WorkstationState; dispatch: Dispatch<WorkstationEvent>; locale: Locale; theme: Theme;
}) {
  const text = workstationLabels[locale], app = state.app;
  const site = app.kind === "PREVIEW" && app.siteId !== "fixture" ? workstationSites[app.siteId] : null;
  const title = app.kind === "DESKTOP" ? text.desktop : app.kind === "CODE" ? text.code : site?.title ?? text.fixture;
  const src = app.kind === "PREVIEW" ? site?.url ?? `/workstation/embed-fixture?locale=${locale}&theme=${theme}` : null;
  return <div className="workbench-screen" data-workstation-screen data-app={app.kind}>
    <div className="workbench-toolbar">
      <span className="workbench-mark" aria-hidden="true">◈</span><span>{title}</span>
      <span className="workbench-toolbar-end">
        {state.mode !== "FOCUS_SCREEN" ? <button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })} aria-label={text.focus} title={text.focus}>⤢</button> : null}
        {app.kind !== "DESKTOP" ? <button type="button" onClick={() => dispatch({ type: "CLOSE_X" })} aria-label={text.close} title={text.close}>×</button> : null}
      </span>
    </div>
    {app.kind === "DESKTOP" ? <div className="workbench-desktop">
      <div className="workbench-orbit" aria-hidden="true"><span>◈</span></div>
      <p className="workbench-kicker">OBSIDIAN / WORKBENCH</p><h2>{text.greeting}</h2><p>{text.subtitle}</p>
      <div className="workbench-apps">
        <button type="button" onClick={() => dispatch({ type: "OPEN_SITE", siteId: "fixture" })}><span aria-hidden="true">↗</span>{text.browser}<small>{text.fixture}</small></button>
        <button type="button" onClick={() => dispatch({ type: "OPEN_CODE" })}><span aria-hidden="true">⌘</span>{text.code}<small>P03</small></button>
      </div>
      <div className="workbench-projects">{Object.entries(workstationSites).map(([id, item]) => <button type="button" key={id} onClick={() => dispatch({ type: "OPEN_SITE", siteId: id })}>{item.title} <span aria-hidden="true">↗</span></button>)}</div>
    </div> : app.kind === "CODE" ? <div className="workbench-code"><span aria-hidden="true">&lt;/&gt;</span><h2>{text.code}</h2><p>{text.codeNote}</p><button type="button" onClick={() => dispatch({ type: "CLOSE_X" })}>{text.close}</button></div>
      : <div className="workbench-browser" data-workstation-browser>
        <div className="workbench-address"><span aria-hidden="true">●</span><span>{site ? new URL(site.url).hostname : text.fixture}</span>
          {site ? <a href={site.url} target="_blank" rel="noopener noreferrer" aria-label={text.external} title={text.external}>↗</a> : null}</div>
        {site && site.status !== "verified-local" ? <div className="workbench-code"><p>{text.unavailable}</p><a href={site.url} target="_blank" rel="noopener noreferrer">{text.external} ↗</a></div>
          : src ? <iframe key={src} src={src} title={title} data-project-site={app.siteId}
            sandbox={site ? "allow-scripts allow-same-origin" : "allow-scripts"}
            referrerPolicy="strict-origin-when-cross-origin" loading="lazy" allow="camera 'none'; microphone 'none'; geolocation 'none'" /> : null}
        <p className="workbench-browser-note">{site ? text.localProof : text.fixtureNote}</p>
      </div>}
  </div>;
}
