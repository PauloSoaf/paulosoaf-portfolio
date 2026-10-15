"use client";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Component, useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { getDocumentTheme, subscribeToTheme } from "@/theme/theme-client";
import { constrainedDevice } from "@/graphics/hero/quality";
import { workstationLabels } from "../labels";
import { PROJECT_REQUEST, siteForProject, workstationSites } from "../sites";
import { initialWorkstationState, isScreenInteractive, workstationReducer, type WorkstationEvent } from "../state/workstation-machine";
import { WorkbenchScreen } from "../screen/WorkbenchScreen.client";
import { installWorkstationPosition } from "./position";
const Scene = dynamic(() => import("../scene/WorkstationScene.client"), { ssr: false });
const noopSubscribe = () => () => {};
class SceneBoundary extends Component<{ children: ReactNode; fail: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.fail(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

export function WorkstationOrchestrator({ locale }: { locale: Locale }) {
  const text = workstationLabels[locale];
  const body = useSyncExternalStore(noopSubscribe, () => document.body, () => null);
  const theme = useSyncExternalStore(subscribeToTheme, getDocumentTheme, () => "dark" as const);
  const [state, dispatch] = useReducer(workstationReducer, initialWorkstationState);
  const [armed, setArmed] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [environment, setEnvironment] = useState({ visible: false, loadable: false, hidden: false, reduced: false, mobile: false, limited: false });
  const anchor = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null);
  const screenElement = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), returnFocus = useRef<HTMLElement | null>(null);
  const bind = useCallback((node: HTMLDivElement | null) => { host.current = node; setSurface(node); }, []);
  const fail = useCallback(() => { setFailed(true); setReady(false); }, []), onReady = useCallback(() => setReady(true), []);
  const focused = state.mode === "FOCUS_SCREEN";
  useEffect(() => surface && anchor.current ? installWorkstationPosition(surface, anchor.current) : undefined, [surface]);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const limited = constrainedDevice({ saveData: device.connection?.saveData, memory: device.deviceMemory, cores: device.hardwareConcurrency });
    let visible = false, ratio = 0;
    const sync = () => setEnvironment({ visible, loadable: visible && (innerWidth >= 768 || ratio >= .55), hidden: document.hidden, reduced: reduced.matches, mobile: innerWidth < 768, limited });
    const observer = new IntersectionObserver((entries) => { const entry = entries.at(-1); visible = !!entry?.isIntersecting; ratio = entry?.intersectionRatio ?? 0; sync(); }, { threshold: [0, .01, .55] });
    if (surface) observer.observe(surface);
    reduced.addEventListener("change", sync); document.addEventListener("visibilitychange", sync); window.addEventListener("resize", sync, { passive: true }); sync();
    return () => { observer.disconnect(); reduced.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); window.removeEventListener("resize", sync); };
  }, [surface]);
  useEffect(() => {
    if (armed || !environment.loadable || environment.hidden || environment.reduced || environment.limited) return;
    const timer = setTimeout(() => setArmed(true), environment.mobile ? 1300 : 500);
    return () => clearTimeout(timer);
  }, [armed, environment]);
  useEffect(() => {
    const select = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail;
      const siteId = detail && typeof detail === "object" ? siteForProject((detail as Record<string, unknown>).slug) : null;
      if (!siteId) return;
      dispatch({ type: "SET_LID", angle: 108 }); dispatch({ type: "OPEN_SITE", siteId });
      if (innerWidth < 1280 || !armed || failed) dispatch({ type: "FOCUS_SCREEN" });
      else { document.querySelector("[data-workstation-work-anchor]")?.scrollIntoView({ block: "center", behavior: environment.reduced ? "instant" : "smooth" }); }
    };
    window.addEventListener(PROJECT_REQUEST, select); return () => window.removeEventListener(PROJECT_REQUEST, select);
  }, [armed, failed, environment.reduced]);
  useEffect(() => {
    const modal = dialog.current; if (!modal) return;
    if (focused && !modal.open) { returnFocus.current = document.activeElement as HTMLElement; modal.showModal(); }
    if (!focused && modal.open) { modal.close(); returnFocus.current?.focus({ preventScroll: true }); }
  }, [focused]);
  const screenDispatch = (event: WorkstationEvent) => {
    dispatch(event);
    if (environment.mobile && (event.type === "OPEN_SITE" || event.type === "OPEN_CODE")) dispatch({ type: "FOCUS_SCREEN" });
  };
  const screen = <WorkbenchScreen state={state} dispatch={screenDispatch} locale={locale} theme={theme} />;
  const sceneScreen = environment.mobile && state.app.kind === "PREVIEW" ? <div className="workbench-screen workbench-code"><p>{text.focus}</p><button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.focus} ⤢</button></div> : screen;
  const active = environment.visible && !environment.hidden && !focused;
  return <>
    <div ref={anchor} className="workstation-hero-anchor" data-workstation-anchor data-scene-ready={ready && !failed}>
      <div className="workstation-still" aria-hidden="true"><svg viewBox="0 0 600 430" fill="none"><path d="m124 280 335 20 49-220-309-36-75 236Z" /><path d="m124 280-64 56 330 61 69-97" /><path d="m142 266 300 19 39-189-271-31-68 201Z" /><path d="m161 307 187 24m-200-13 181 24m-122 4 71 13" /><circle cx="321" cy="170" r="40" /></svg></div>
      <div className="workstation-entry"><p className="text-kicker">{text.caption}</p><button type="button" className="carousel-button js-only" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.explore} ↗</button></div>
      <noscript><p>{text.fallback}</p>{Object.values(workstationSites).map((site) => <p key={site.url}><a href={site.url} target="_blank" rel="noopener noreferrer">{site.title} · {text.external} ↗</a></p>)}</noscript>
    </div>
    {body ? createPortal(<>
      <div ref={bind} className="workstation-companion" data-workstation data-state={state.mode} data-lid={state.lidAngle} data-scene={failed ? "error" : ready ? "ready" : armed ? "loading" : "fallback"} data-screen-strategy="projected">
        <div className="workstation-scene"><div className="workstation-dom-layer">
          {ready && !failed && active && isScreenInteractive(state) && !focused ? <div ref={screenElement} className="workstation-projected-screen" style={{ visibility: "hidden" }}>{sceneScreen}</div> : null}
        </div>
          {armed && !failed ? <SceneBoundary fail={fail}><Scene state={state} dispatch={dispatch} theme={theme} active={active} reduced={environment.reduced} screen={sceneScreen} screenElement={screenElement} host={host} onReady={onReady} onFailure={fail} /></SceneBoundary> : null}
        </div>
        <div className="workstation-controls">
          <button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.focus} ⤢</button>
          {armed && !failed ? <>
            <button type="button" onClick={() => dispatch({ type: "SET_LID", angle: state.lidAngle < 15 ? 108 : 0 })}>{state.lidAngle < 15 ? text.openLid : text.closeLid}</button>
            <button type="button" aria-label={text.left} title={text.left} onClick={() => dispatch({ type: "ROTATE", axis: 1, delta: -.25 })}>←</button>
            <button type="button" aria-label={text.right} title={text.right} onClick={() => dispatch({ type: "ROTATE", axis: 1, delta: .25 })}>→</button>
            <button type="button" aria-label={text.tilt} title={text.tilt} onClick={() => dispatch({ type: "ROTATE", axis: 2, delta: state.rotation[2] > 0 ? -.2 : .2 })}>↶</button>
            <button type="button" aria-label={text.reset} title={text.reset} onClick={() => dispatch({ type: "RESET" })}>↺</button>
          </> : <button type="button" onClick={() => { setArmed(true); setFailed(false); }}>{text.enable}</button>}
        </div>
        <p className="workstation-hint">{ready ? text.hint : text.fallback}</p>
      </div>
      <dialog ref={dialog} className="workstation-focus" aria-label={text.title} data-workstation-focus onCancel={(event) => { event.preventDefault(); dispatch({ type: "EXIT_FOCUS" }); }}>
        <div className="workstation-focus-heading"><span>{text.title}</span><button type="button" onClick={() => dispatch({ type: "EXIT_FOCUS" })}>{text.exitFocus} <span aria-hidden="true">×</span></button></div>
        {focused ? screen : null}
      </dialog>
    </>, body) : null}
  </>;
}
