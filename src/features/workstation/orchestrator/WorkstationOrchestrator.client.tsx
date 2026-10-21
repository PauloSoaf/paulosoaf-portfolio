"use client";
// @refresh reset
// Imperative class instances must be recreated together after a development hot update.
// Preserving useState here can pair a new scene with an old MotionRig lacking new fields.
/* eslint-disable react-hooks/immutability -- Stable imperative input/render controllers, not React view state. */
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Component, lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/paths";
import { applyTheme, getDocumentTheme, subscribeToTheme } from "@/theme/theme-client";
import { constrainedDevice } from "@/graphics/hero/quality";
import { workstationLabels } from "../labels";
import { PROJECT_REQUEST, siteForProject, workstationSites } from "../sites";
import { initialWorkstationState, workstationReducer, type WorkstationEvent } from "../state/workstation-machine";
import { createMotionRig, installWorkstationPosition, type Impact } from "./position";
import { NotebookInputController } from "../input/NotebookInputController";
import { NotebookPointerController } from "../input/NotebookPointerController";
import { NOTEBOOK_KEYS } from "../input/keyboard-layout";
import { NotebookSound } from "../audio/notebook-sound";
import { TerminalSession } from "../terminal/session";
import type { TerminalEffect } from "../terminal/commands";
import { knock, tremor } from "../page/page-reactions";
import { startInspect } from "../code/inspect";
import type { HoverPart } from "../scene/WorkstationScene.client";
import type { Presentation } from "./presentation";
const Scene = dynamic(() => import("../scene/WorkstationScene.client"), { ssr: false });
// The OS is needed only with a ready 3D screen or an explicitly opened 2D dialog.
// Keep it off the editorial/low-data bootstrap without changing the notebook's interface.
const loadScreen = () => import("../screen/WorkbenchScreen.client");
const WorkbenchScreen = lazy(() => loadScreen().then((module) => ({ default: module.WorkbenchScreen })));
const noopSubscribe = () => () => {};
const chapterPaths: Record<Locale, Record<string, string>> = {
  pt: { work: "projetos", about: "sobre", expertise: "especialidades", services: "servicos", contact: "contato" },
  en: { work: "projects", about: "about", expertise: "expertise", services: "services", contact: "contact" },
  es: { work: "proyectos", about: "acerca", expertise: "especialidades", services: "servicios", contact: "contacto" },
};
class SceneBoundary extends Component<{ children: ReactNode; fail: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.fail(); }
  override render() { return this.state.failed ? null : this.props.children; }
}
class ScreenBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onFailure(); }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function WorkstationOrchestrator({ locale, discovery }: { locale: Locale; discovery?: ReactNode }) {
  const text = workstationLabels[locale], router = useRouter();
  const body = useSyncExternalStore(noopSubscribe, () => document.body, () => null);
  const theme = useSyncExternalStore(subscribeToTheme, getDocumentTheme, () => "dark" as const);
  const [state, dispatch] = useReducer(workstationReducer, initialWorkstationState);
  const [rig] = useState(createMotionRig), [input] = useState(() => new NotebookInputController()), [pointer] = useState(() => new NotebookPointerController());
  const [sound] = useState(() => new NotebookSound()), [session] = useState(() => new TerminalSession());
  const [armed, setArmed] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [screenReady, setScreenReady] = useState(false);
  const onScreenReady = useCallback(() => setScreenReady(true), []);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null), [inspecting, setInspecting] = useState(false), [chapter, setChapter] = useState("hero");
  const [environment, setEnvironment] = useState({ hidden: false, reduced: false, mobile: false, limited: false, loadable: false });
  const anchor = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), hit = useRef<HTMLDivElement>(null), badge = useRef<HTMLDivElement>(null);
  const screenElement = useRef<HTMLDivElement>(null), dust = useRef<HTMLDivElement>(null), announcer = useRef<HTMLParagraphElement>(null);
  const menuElement = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), returnFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState<HTMLDivElement | null>(null);
  const bindHost = useCallback((node: HTMLDivElement | null) => { host.current = node; setMounted(node); }, []);
  const bindScreen = useCallback((node: HTMLDivElement | null) => {
    screenElement.current = node;
    if (node && host.current?.dataset.displayMatrix) node.style.transform = host.current.dataset.displayMatrix;
    rig.wake();
  }, [rig]);
  const fail = useCallback(() => { setFailed(true); setReady(false); }, []), onReady = useCallback(() => setReady(true), []);
  const onMenu = useCallback((x: number, y: number) => setMenu({ x, y }), []);
  const focused = state.mode === "FOCUS_SCREEN";
  const prepareReading = useCallback((kind: Exclude<Presentation, "context">) => {
    rig.present(kind); rig.keyboardView = false; dispatch({ type: "SET_LID", angle: 108 }); rig.refresh();
  }, [rig]);
  const previewSite = state.app.kind === "PREVIEW" ? state.app.siteId : null;
  useEffect(() => {
    const kind = previewSite && previewSite !== "fixture" ? "preview" : state.app.kind === "CODE" ? "code" : "context";
    rig.present(kind);
    if (kind !== "context") { rig.keyboardView = false; dispatch({ type: "SET_LID", angle: 108 }); rig.refresh(); }
  }, [rig, state.app.kind, previewSite]);
  useEffect(() => { if (armed || focused) void loadScreen().catch(() => {}); }, [armed, focused]);
  const announce = useCallback((message: string) => { if (announcer.current) announcer.current.textContent = message; }, []);

  useEffect(() => mounted && anchor.current ? installWorkstationPosition(mounted, anchor.current, rig) : undefined, [mounted, rig]);
  useEffect(() => { rig.paused = focused; if (focused) rig.cancel(); rig.wake(); }, [rig, focused]);
  useEffect(() => () => sound.dispose(), [sound]);
  // Physical comedy: every impact has a sound, a small reaction and, on hard landings, a page tremor.
  useEffect(() => {
    let lastAnnounce = 0;
    const puff = (x: number, y: number, speed: number) => {
      const layer = dust.current; if (!layer || rig.reduced) return;
      for (const side of [-1, 1]) {
        const cloud = document.createElement("span");
        cloud.style.left = `${x}px`; cloud.style.top = `${y}px`; cloud.style.setProperty("--side", String(side)); cloud.style.setProperty("--size", `${Math.min(70, 24 + speed / 60)}px`);
        layer.append(cloud); window.setTimeout(() => cloud.remove(), 750);
      }
    };
    rig.onImpact = (impact: Impact) => {
      const { kind, speed, x, y } = impact;
      if (kind === "floor") {
        sound.thud(speed);
        if (speed > 650) { tremor({ x, y }, Math.min(1.2, speed / 2400)); input.jolt(NOTEBOOK_KEYS.length, Math.min(speed, 3000) * .00055); puff(x, y, speed); }
      } else if (kind === "ceiling") { sound.bonk(speed); input.jolt(NOTEBOOK_KEYS.length, Math.min(speed, 2400) * .0003); }
      else if (kind === "wall") sound.wall(speed);
      else if (kind === "throw") sound.whoosh(speed);
      else if (kind === "lid") sound.lid(speed);
      else if (kind === "getup") {
        sound.hop();
        if (performance.now() - lastAnnounce > 8000) { lastAnnounce = performance.now(); announce(text.announceLanded); }
      }
    };
    rig.onTravel = (box, velocity, time) => { if (knock(box, velocity, time)) sound.tock(); };
    rig.onChapter = setChapter;
    input.wake = () => rig.wake(); input.onKey = () => sound.key();
    input.onEscape = () => dispatch({ type: "CLOSE_X" });
    return () => { rig.onImpact = () => {}; rig.onTravel = () => {}; rig.onChapter = () => {}; };
  }, [rig, input, sound, announce, text.announceLanded]);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const limited = constrainedDevice({ saveData: device.connection?.saveData, memory: device.deviceMemory, cores: device.hardwareConcurrency });
    // WebGL loads once a notebook slot is on screen; phones wait until most of one is visible (LCP).
    const ratios = new Map<Element, number>();
    const sync = () => {
      const mobile = innerWidth < 768, best = Math.max(0, ...ratios.values());
      setEnvironment({ hidden: document.hidden, reduced: reduced.matches, mobile, limited, loadable: mobile ? best >= .55 : best > 0 });
    };
    const observer = new IntersectionObserver((entries) => { for (const entry of entries) ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0); sync(); }, { threshold: [0, .01, .55] });
    document.querySelectorAll("[data-workstation-anchor], [data-workstation-section-anchor]").forEach((node) => observer.observe(node));
    reduced.addEventListener("change", sync); document.addEventListener("visibilitychange", sync); window.addEventListener("resize", sync, { passive: true }); sync();
    return () => { observer.disconnect(); reduced.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); window.removeEventListener("resize", sync); };
  }, []);
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
      prepareReading("preview"); dispatch({ type: "OPEN_SITE", siteId });
      if (failed || (!armed && (environment.reduced || environment.limited))) dispatch({ type: "FOCUS_SCREEN" });
      else { setArmed(true); rig.inertia.suppress(performance.now(), 2400); document.querySelector("[data-workstation-work-anchor]")?.scrollIntoView({ block: "center", behavior: environment.reduced ? "instant" : "smooth" }); }
    };
    window.addEventListener(PROJECT_REQUEST, select); return () => window.removeEventListener(PROJECT_REQUEST, select);
  }, [armed, failed, environment.reduced, environment.limited, rig, prepareReading]);
  useEffect(() => {
    const modal = dialog.current; if (!modal) return;
    if (focused && !modal.open) { returnFocus.current = document.activeElement as HTMLElement; modal.showModal(); }
    if (!focused) {
      // Chrome may close the dialog natively on Escape (non-cancelable close request), so restore
      // focus whenever focus mode ends. The projected screen that opened it remounts as a new
      // node: fall back to the options trigger, after the dialog's own restoration and this commit.
      if (modal.open) modal.close();
      const previous = returnFocus.current; returnFocus.current = null;
      // The opener inside the projected screen unmounts in the same commit, so activeElement may already be <body>.
      if (previous) requestAnimationFrame(() => (previous.isConnected && previous !== document.body ? previous : trigger.current ?? hit.current)?.focus({ preventScroll: true }));
    }
  }, [focused]);
  const lidOpen = state.lidAngle >= 15, lastLid = useRef(lidOpen);
  useEffect(() => {
    if (lastLid.current === lidOpen) return;
    lastLid.current = lidOpen; announce(lidOpen ? text.announceOpened : text.announceClosed);
  }, [lidOpen, announce, text.announceOpened, text.announceClosed]);

  const screenDispatch = useCallback((event: WorkstationEvent) => {
    if (event.type === "OPEN_CODE") prepareReading("code");
    else if (event.type === "OPEN_SITE" && (event.siteId === "nutriopus" || event.siteId === "deborah")) prepareReading("preview");
    dispatch(event);
    if (environment.mobile && (event.type === "OPEN_CODE" || (event.type === "OPEN_SITE" && event.siteId === "fixture"))) dispatch({ type: "FOCUS_SCREEN" });
  }, [environment.mobile, prepareReading]);
  const notebookAction = useCallback((action: "hop" | "drop" | "spin" | "close-lid" | "open-lid" | "reset" | "keyboard" | "left" | "right") => {
    sound.unlock();
    if (action === "hop") rig.hop(); else if (action === "drop") rig.drop(); else if (action === "spin") rig.spin();
    else if (action === "close-lid" || action === "open-lid") { dispatch({ type: "SET_LID", angle: action === "open-lid" ? 108 : 0 }); if (action === "open-lid") sound.boot(); }
    else if (action === "reset") { rig.reset(); dispatch({ type: "RESET_POSE" }); rig.refresh(); }
    else if (action === "keyboard") { rig.suppressPresentation(); rig.keyboardView = !rig.keyboardView; rig.refresh(); }
    else { rig.suppressPresentation(); dispatch({ type: "ROTATE", axis: 1, delta: action === "left" ? -.3 : .3 }); }
    rig.wake();
  }, [rig, sound]);
  useEffect(() => {
    session.onEffect = (effect: TerminalEffect) => {
      const behavior: ScrollBehavior = environment.reduced ? "instant" : "smooth";
      if (effect.type === "scroll") {
        rig.inertia.suppress(performance.now(), 2600);
        if (effect.section === "top") window.scrollTo({ top: 0, behavior }); else document.getElementById(effect.section)?.scrollIntoView({ behavior, block: "start" });
      } else if (effect.type === "theme") applyTheme(getDocumentTheme() === "dark" ? "light" : "dark");
      else if (effect.type === "locale") router.push(`${switchLocalePath(window.location.pathname, effect.locale)}${window.location.search}`);
      else if (effect.type === "open") {
        if (effect.app === "desktop") dispatch({ type: "CLOSE_X" });
        else if (effect.app === "notes") dispatch({ type: "OPEN_NOTES" });
        else screenDispatch({ type: "OPEN_SITE", siteId: effect.app === "browser" ? "fixture" : effect.app });
      } else if (effect.type === "code") screenDispatch({ type: "OPEN_CODE", ...(effect.file ? { file: effect.file } : {}) });
      else if (effect.type === "inspect") { dispatch({ type: "OPEN_CODE" }); setInspecting(true); }
      else if (effect.type === "mute") sound.toggle();
      else if (effect.type === "focus") dispatch({ type: "FOCUS_SCREEN" });
      else if (effect.type === "notebook") notebookAction(effect.action);
    };
    return () => { session.onEffect = () => {}; };
  }, [session, rig, sound, router, environment.reduced, screenDispatch, notebookAction]);
  const inspectActive = inspecting && state.app.kind === "CODE" && !focused;
  useEffect(() => {
    if (!inspectActive) return;
    return startInspect({
      label: (file) => `${text.inspectPrefix} · ${file}`,
      onExit: () => setInspecting(false),
      onPick: (file, element) => {
        dispatch({ type: "OPEN_CODE", file }); sound.tock();
        const rect = element.getBoundingClientRect();
        rig.attention = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; rig.wake();
        window.setTimeout(() => { rig.attention = null; rig.wake(); }, 1400);
      },
    });
  }, [inspectActive, rig, sound, text.inspectPrefix]);
  // Hidden options: right-click / long-press / Shift+F10 on the notebook, or the keyboard-only trigger.
  useEffect(() => {
    if (!menu) return;
    menuElement.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!menuElement.current?.contains(event.target as Node)) setMenu(null); };
    const close = () => setMenu(null);
    document.addEventListener("pointerdown", outside, true); window.addEventListener("scroll", close, { passive: true }); window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", outside, true); window.removeEventListener("scroll", close); window.removeEventListener("resize", close); };
  }, [menu]);

  const prompt = `paulo@obsidian:~${chapterPaths[locale][chapter] ? `/${chapterPaths[locale][chapter]}` : ""}$`;
  const toggleInspect = useCallback(() => setInspecting((value) => !value), []);
  const screen = <ScreenBoundary onFailure={onScreenReady} fallback={<div className="workbench-screen workbench-code" data-screen-error role="status"><p>{text.screenUnavailable}</p><button type="button" onClick={() => window.location.reload()}>{text.reload}</button></div>}>
    <Suspense fallback={<div className="workbench-screen workbench-code" role="status" aria-busy="true"><p>{text.loading}</p></div>}><WorkbenchScreen state={state} dispatch={screenDispatch} locale={locale} theme={theme} input={input} pointer={pointer} sound={sound} session={session} prompt={prompt} inspecting={inspectActive} onInspect={toggleInspect} onReady={onScreenReady} /></Suspense>
  </ScreenBoundary>;
  const sceneScreen = environment.mobile && state.app.kind === "PREVIEW" && state.app.siteId === "fixture" ? <div className="workbench-screen workbench-code" data-workstation-screen><p>{text.focus}</p><button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.focus} ⤢</button></div> : screen;
  const active = !environment.hidden && !focused;
  const live = armed && ready && !failed;
  const badgeText = useCallback((part: HoverPart) => part === "chassis" ? text.badgeChassis : part === "lid" ? (state.lidAngle < 15 ? text.badgeLidOpen : text.badgeLidClose) : part === "keyboard" ? text.badgeKeys : part === "trackpad" ? text.badgeTrackpad : "", [text, state.lidAngle]);
  const menuItems: { label: string; run: () => void }[] = [
    { label: lidOpen ? text.closeLid : text.openLid, run: () => notebookAction(lidOpen ? "close-lid" : "open-lid") },
    { label: text.focus, run: () => dispatch({ type: "FOCUS_SCREEN" }) },
    { label: text.left, run: () => notebookAction("left") }, { label: text.right, run: () => notebookAction("right") },
    ...(state.app.kind === "CODE" || previewSite && previewSite !== "fixture" ? [{ label: text.present, run: () => prepareReading(state.app.kind === "CODE" ? "code" : "preview") }] : []),
    { label: rig.keyboardView ? text.wholeView : text.keyboardView, run: () => notebookAction("keyboard") },
    ...(environment.reduced ? [] : [{ label: text.hop, run: () => notebookAction("hop") }, { label: text.drop, run: () => notebookAction("drop") }, { label: text.spin, run: () => notebookAction("spin") }]),
    { label: text.reset, run: () => notebookAction("reset") },
    { label: sound.muted ? text.soundOn : text.soundOff, run: () => sound.toggle() },
  ];
  const closeMenu = (refocus: boolean) => { setMenu(null); if (refocus) (hit.current ?? trigger.current)?.focus({ preventScroll: true }); };
  const menuWidth = 232, menuHeight = menuItems.length * 40 + 16;
  return <>
    <div ref={anchor} className="workstation-hero-anchor" data-workstation-anchor data-scene-ready={ready && !failed}>
      <div className="workstation-still" aria-hidden="true"><svg viewBox="0 0 600 430" fill="none"><path d="m124 280 335 20 49-220-309-36-75 236Z" /><path d="m124 280-64 56 330 61 69-97" /><path d="m142 266 300 19 39-189-271-31-68 201Z" /><path d="m161 307 187 24m-200-13 181 24m-122 4 71 13" /><circle cx="321" cy="170" r="40" /></svg></div>
      {!live ? <div className="workstation-fallback js-only">
        <button type="button" onClick={() => dispatch({ type: "FOCUS_SCREEN" })}>{text.focus} ⤢</button>
        {!armed || failed ? <button type="button" onClick={() => { setArmed(true); setFailed(false); }}>{text.enable}</button> : null}
      </div> : null}
      <noscript><p>{text.fallback}</p>{Object.values(workstationSites).map((site) => <p key={site.url}><a href={site.url} target="_blank" rel="noopener noreferrer">{site.title} · {text.external} ↗</a></p>)}</noscript>
      {discovery}
    </div>
    {body ? createPortal(<>
      <div ref={bindHost} className="workstation-companion" data-workstation data-state={state.mode} data-lid={state.lidAngle} data-scene={failed ? "error" : ready && screenReady ? "ready" : armed ? "loading" : "fallback"} data-screen-strategy="projected" data-inspecting={inspectActive}>
        <div ref={hit} className="workstation-hit" tabIndex={-1} aria-hidden="true" />
        <div className="workstation-dom-layer">
          {ready && !failed && !focused ? <div ref={bindScreen} className="workstation-projected-screen">{sceneScreen}</div> : null}
        </div>
        {armed && !failed ? <SceneBoundary fail={fail}><Scene state={state} dispatch={dispatch} theme={theme} active={active} reduced={environment.reduced} host={host} hit={hit} badge={badge} screenElement={screenElement} rig={rig} input={input} pointer={pointer} sound={sound} badgeText={badgeText} onReady={onReady} onFailure={fail} onMenu={onMenu} /></SceneBoundary> : null}
        <div ref={dust} className="workstation-dust" aria-hidden="true" />
        <div ref={badge} className="workstation-badge" aria-hidden="true" data-visible="false" />
      </div>
      {live ? <button ref={trigger} type="button" className="workstation-options-trigger" aria-haspopup="menu" aria-expanded={!!menu} aria-describedby="workstation-hint"
        onClick={() => setMenu({ x: rig.current.x, y: rig.current.y })}>{text.options}</button> : null}
      <p id="workstation-hint" className="sr-only">{text.hint}</p>
      {menu ? <div ref={menuElement} role="menu" tabIndex={-1} aria-label={text.options} className="workstation-menu"
        style={{ left: Math.max(8, Math.min(innerWidth - menuWidth - 8, menu.x)), top: Math.max(8, Math.min(innerHeight - menuHeight - 8, menu.y)) }}
        onKeyDown={(event) => {
          const items = [...(menuElement.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])], index = items.indexOf(document.activeElement as HTMLButtonElement);
          if (event.key === "Escape") { event.preventDefault(); closeMenu(true); }
          else if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus(); }
          else if (event.key === "Home" || event.key === "End") { event.preventDefault(); (event.key === "Home" ? items[0] : items.at(-1))?.focus(); }
          else if (event.key === "Tab") closeMenu(false);
        }}>
        {menuItems.map((item) => <button key={item.label} type="button" role="menuitem" tabIndex={-1} onClick={() => { item.run(); closeMenu(true); }}>{item.label}</button>)}
      </div> : null}
      <p ref={announcer} className="sr-only" role="status" aria-live="polite" />
      <dialog ref={dialog} className="workstation-focus" aria-label={text.title} data-workstation-focus onCancel={(event) => { event.preventDefault(); dispatch({ type: "EXIT_FOCUS" }); }} onClose={() => dispatch({ type: "EXIT_FOCUS" })}>
        <div className="workstation-focus-heading"><span>{text.title}</span><button type="button" onClick={() => dispatch({ type: "EXIT_FOCUS" })}>{text.exitFocus} <span aria-hidden="true">×</span></button></div>
        {focused ? screen : null}
      </dialog>
    </>, body) : null}
  </>;
}
