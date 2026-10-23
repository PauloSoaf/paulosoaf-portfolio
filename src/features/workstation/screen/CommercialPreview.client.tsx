"use client";
import { useEffect, useRef, useState, type Dispatch } from "react";
import type { Locale } from "@/i18n/config";
import { workstationLabels } from "../labels";
import { workstationSites } from "../sites";
import type { WorkstationEvent } from "../state/workstation-machine";
import { siteFrame } from "./site-framing";

/** The parent cannot inspect a cross-origin document. A load event is not proof of usability. */
export function CommercialPreview({ siteId, text, dispatch, projected, embedded = false }: {
  siteId: keyof typeof workstationSites; text: (typeof workstationLabels)[Locale]; dispatch: Dispatch<WorkstationEvent>; projected: boolean; embedded?: boolean;
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
      {!embedded ? <button type="button" className="workbench-site-exit" data-input-action="close" aria-label={text.close} title={text.close} onClick={() => dispatch({ type: "CLOSE_X" })}>×</button> : null}
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
