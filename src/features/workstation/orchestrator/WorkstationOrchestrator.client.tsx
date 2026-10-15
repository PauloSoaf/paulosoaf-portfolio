"use client";
/* eslint-disable react-hooks/immutability -- Stable imperative input/render controllers, not React view state. */
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Component, useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { getDocumentTheme, subscribeToTheme } from "@/theme/theme-client";
import { constrainedDevice } from "@/graphics/hero/quality";
import { workstationLabels } from "../labels";
import { PROJECT_REQUEST, siteForProject, workstationSites } from "../sites";
import { initialWorkstationState, workstationReducer, type WorkstationEvent } from "../state/workstation-machine";
import { WorkbenchScreen } from "../screen/WorkbenchScreen.client";
import { createMotionRig, installWorkstationPosition } from "./position";
import { NotebookInputController } from "../input/NotebookInputController";
import { NotebookPointerController } from "../input/NotebookPointerController";
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
  const [rig] = useState(createMotionRig), [input] = useState(() => new NotebookInputController()), [pointer] = useState(() => new NotebookPointerController());
  const [inputMode, setInputMode] = useState(false), [feedback, setFeedback] = useState<"local" | "external" | "ready">("ready");
  const [tool, setTool] = useState<"move" | "rotate" | "lid">("move"), [touchManipulation, setTouchManipulation] = useState(false), [keyboardView, setKeyboardView] = useState(false);
  const [armed, setArmed] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [environment, setEnvironment] = useState({ visible: false, loadable: false, hidden: false, reduced: false, mobile: false, limited: false });
  const anchor = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null);
  const screenElement = useRef<HTMLDivElement>(null);
  const sceneElement = useRef<HTMLDivElement>(null);
  const bindScreen = useCallback((node: HTMLDivElement | null) => {
    screenElement.current = node;
    if (node && host.current?.dataset.displayMatrix) {
      node.style.transform = host.current.dataset.displayMatrix;
      node.style.visibility = host.current.dataset.displayFront === "true" ? "visible" : "hidden";
    }
    rig.wake();
  }, [rig]);
  const dialog = useRef<HTMLDialogElement>(null), returnFocus = useRef<HTMLElement | null>(null);
  const bind = useCallback((node: HTMLDivElement | null) => { host.current = node; setSurface(node); }, []);
  const fail = useCallback(() => { setFailed(true); setReady(false); }, []), onReady = useCallback(() => setReady(true), []);
  const focused = state.mode === "FOCUS_SCREEN";
  useEffect(() => surface && anchor.current ? installWorkstationPosition(surface, anchor.current, rig) : undefined, [surface, rig]);
  useEffect(() => {
    rig.paused = focused; rig.locked = state.mode === "MANIPULATE"; rig.wake();
    if (focused) rig.manipulation.cancel();
    input.wake = () => rig.wake(); input.onFeedback = setFeedback;
    pointer.onExternal = () => setFeedback("external"); input.onEscape = () => dispatch({ type: "CLOSE_X" });
  }, [rig, input, pointer, focused, state.mode]);
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
  const screenDispatch = useCallback((event: WorkstationEvent) => {
    dispatch(event);
    if (environment.mobile && (event.type === "OPEN_SITE" || event.type === "OPEN_CODE")) dispatch({ type: "FOCUS_SCREEN" });
  }, [environment.mobile]);
  const screen = <WorkbenchScreen state={state} dispatch={screenDispatch} locale={locale} theme={theme} input={input} pointer={pointer} />;
  const sceneScreen = environment.mobile && state.app.kind === "PREVIEW" ? <div className="workbench-screen workbench-code"><p>{text.focus}</p><button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.focus} ⤢</button></div> : screen;
  const active = environment.visible && !environment.hidden && !focused;
  return <>
    <div ref={anchor} className="workstation-hero-anchor" data-workstation-anchor data-scene-ready={ready && !failed}>
      <div className="workstation-still" aria-hidden="true"><svg viewBox="0 0 600 430" fill="none"><path d="m124 280 335 20 49-220-309-36-75 236Z" /><path d="m124 280-64 56 330 61 69-97" /><path d="m142 266 300 19 39-189-271-31-68 201Z" /><path d="m161 307 187 24m-200-13 181 24m-122 4 71 13" /><circle cx="321" cy="170" r="40" /></svg></div>
      <div className="workstation-entry"><p className="text-kicker">{text.caption}</p><button type="button" className="carousel-button js-only" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.explore} ↗</button></div>
      <noscript><p>{text.fallback}</p>{Object.values(workstationSites).map((site) => <p key={site.url}><a href={site.url} target="_blank" rel="noopener noreferrer">{site.title} · {text.external} ↗</a></p>)}</noscript>
    </div>
    {body ? createPortal(<>
      <div ref={bind} className="workstation-companion" data-workstation data-input-mode={inputMode} data-state={state.mode} data-lid={state.lidAngle} data-scene={failed ? "error" : ready ? "ready" : armed ? "loading" : "fallback"} data-screen-strategy="projected">
        <div ref={sceneElement} className="workstation-scene"><div className="workstation-dom-layer">
          {ready && !failed && state.lidAngle >= 15 && !focused ? <div ref={bindScreen} className="workstation-projected-screen">{sceneScreen}</div> : null}
        </div>
          {armed && !failed ? <SceneBoundary fail={fail}><Scene state={state} dispatch={dispatch} theme={theme} active={active} reduced={environment.reduced} screen={sceneScreen} screenElement={screenElement} sceneElement={sceneElement} host={host} rig={rig} input={input} pointer={pointer} inputMode={inputMode} tool={tool} touchManipulation={touchManipulation} keyboardView={keyboardView} onReady={onReady} onFailure={fail} /></SceneBoundary> : null}
        </div>
        <div className="workstation-controls">
          <button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.focus} ⤢</button>
          {armed && !failed ? <>
            <button type="button" onClick={() => dispatch({ type: "SET_LID", angle: state.lidAngle < 15 ? 108 : 0 })}>{state.lidAngle < 15 ? text.openLid : text.closeLid}</button>
            <button type="button" aria-label={text.left} title={text.left} onClick={() => dispatch({ type: "ROTATE", axis: 1, delta: -.25 })}>←</button>
            <button type="button" aria-label={text.right} title={text.right} onClick={() => dispatch({ type: "ROTATE", axis: 1, delta: .25 })}>→</button>
            <button type="button" aria-label={text.tilt} title={text.tilt} onClick={() => dispatch({ type: "ROTATE", axis: 2, delta: state.rotation[2] > 0 ? -.2 : .2 })}>↶</button>
            <button type="button" aria-label={text.reset} title={text.reset} onClick={() => { rig.manipulation.follow(); dispatch({ type: "RESET" }); setKeyboardView(false); setTouchManipulation(false); setTool("move"); }}>↺</button>
            <button type="button" aria-pressed={inputMode} onClick={() => { setInputMode(!inputMode); setTouchManipulation(false); }}>{inputMode ? text.inputExit : text.inputMode}</button>
            <details className="workstation-tools"><summary>{text.tools}</summary><div>
              <button type="button" data-notebook-tool="move" aria-pressed={tool === "move"} onClick={(event) => { setTool("move"); setTouchManipulation(true); setInputMode(false); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{text.move}</button>
              <button type="button" data-notebook-tool="rotate" aria-pressed={tool === "rotate"} onClick={(event) => { setTool("rotate"); setTouchManipulation(true); setInputMode(false); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{text.rotate}</button>
              <button type="button" data-notebook-tool="lid" aria-pressed={tool === "lid"} onClick={(event) => { setTool("lid"); setTouchManipulation(true); setInputMode(false); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{text.adjustLid}</button>
              <button type="button" data-keyboard-view aria-pressed={keyboardView} onClick={(event) => { setKeyboardView(!keyboardView); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{keyboardView ? text.wholeView : text.keyboardView}</button>
            </div></details>
            <button type="button" className="workstation-rejoin" onClick={() => { rig.manipulation.follow(); setTouchManipulation(false); }}>{text.followPage}</button>
          </> : <button type="button" onClick={() => { setArmed(true); setFailed(false); }}>{text.enable}</button>}
        </div>
        <p className="workstation-hint" role="status">{ready ? feedback === "external" ? environment.mobile ? text.inputExternalCompact : text.inputExternal : feedback === "local" ? text.inputLocal : environment.mobile ? text.inputReadyCompact : text.inputReady : text.fallback}</p>
      </div>
      <dialog ref={dialog} className="workstation-focus" aria-label={text.title} data-workstation-focus onCancel={(event) => { event.preventDefault(); dispatch({ type: "EXIT_FOCUS" }); }}>
        <div className="workstation-focus-heading"><span>{text.title}</span><button type="button" onClick={() => dispatch({ type: "EXIT_FOCUS" })}>{text.exitFocus} <span aria-hidden="true">×</span></button></div>
        {focused ? screen : null}
      </dialog>
    </>, body) : null}
  </>;
}
