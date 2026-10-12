"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { getDocumentTheme, subscribeToTheme } from "@/theme/theme-client";
import { heroQuality, constrainedDevice, type HeroQuality } from "@/graphics/hero/quality";
import { useCreativeExperience } from "@/features/creative/experience";
import { installCompanion } from "@/features/creative/companion";
const subscribeBody = () => () => {};

const HeroScene = dynamic(() => import("@/graphics/hero/HeroScene.client"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: Error) {
    if (new URLSearchParams(window.location.search).has("heroDebug")) console.error("Hero scene boundary:", error);
    this.props.onFailure();
  }
  override render() { return this.state.failed ? null : this.props.children; }
}

interface Props {
  children: ReactNode;
  className?: string;
  labels: { pause: string; resume: string; staticArt: string; enable: string; reduced: string; exploreLeft: string; exploreRight: string; hint: string };
}

/** Only this decorative island owns state; editorial content and SVG arrive in server HTML. */
export function HeroArtBoundary({ children, className, labels }: Props) {
  const creative = useCreativeExperience();
  const body = useSyncExternalStore(subscribeBody, () => document.body, () => null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [docked, setDocked] = useState(false);
  const bindPortal = useCallback((node: HTMLDivElement | null) => setPortal(node), []);
  const host = useRef<HTMLDivElement>(null);
  const degraded = useRef(false);
  const theme = useSyncExternalStore(subscribeToTheme, getDocumentTheme, () => "dark" as const);
  const [environment, setEnvironment] = useState({ visible: false, loadable: false, reduced: false, hidden: false, coarse: false, constrained: false, quality: heroQuality(360) });
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [staticArt, setStaticArt] = useState(false);
  const [paused, setPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const active = environment.visible && !environment.hidden && !environment.reduced && !paused;
  const canvasMounted = armed && !failed && !staticArt;
  const fail = useCallback(() => { setFailed(true); setReady(false); }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onSlow = useCallback(() => {
    degraded.current = true;
    setEnvironment((previous) => ({ ...previous, quality: heroQuality(360) }));
  }, []);
  useEffect(() => {
    if (!creative || !portal || !host.current) return;
    return installCompanion(portal, host.current, setDocked);
  }, [creative, portal]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const limited = constrainedDevice({ saveData: device.connection?.saveData, memory: device.deviceMemory, cores: device.hardwareConcurrency });
    let visible = false;
    let heroVisible = false;
    let ratio = 0;
    const update = () => setEnvironment({
      visible, loadable: heroVisible && (!coarse.matches || window.innerWidth >= 640 || ratio >= (creative ? .18 : .9)),
      reduced: reduced.matches, hidden: document.hidden, coarse: coarse.matches,
      constrained: limited, quality: heroQuality(window.innerWidth, limited || degraded.current),
    });
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = !!entry?.isIntersecting; ratio = entry?.intersectionRatio || 0;
      if (!creative || !portal) visible = heroVisible;
      update();
    }, { threshold: [0, 0.01, 0.18, 0.9] });
    observer.observe(element.querySelector(".hero-view") ?? element);
    const companionObserver = creative && portal ? new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; update(); }, { threshold: 0 }) : null;
    if (companionObserver && portal) companionObserver.observe(portal);
    reduced.addEventListener("change", update);
    coarse.addEventListener("change", update);
    window.addEventListener("resize", update, { passive: true });
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect(); companionObserver?.disconnect(); reduced.removeEventListener("change", update); coarse.removeEventListener("change", update);
      window.removeEventListener("resize", update); document.removeEventListener("visibilitychange", update);
    };
  }, [creative, portal]);

  useEffect(() => {
    if (armed || !environment.loadable || environment.reduced || environment.constrained || environment.hidden) return;
    // Finish the opening before mobile's larger lazy module competes for the main thread.
    // An idle slot is opportunistic, with a bounded timeout; explicit opt-in remains immediate.
    let idle: number | undefined;
    const timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(() => setArmed(true), { timeout: 1000 });
      else setArmed(true);
    }, creative && environment.quality.name === "mobile" ? 1200 : 350);
    return () => { clearTimeout(timer); if (idle !== undefined) window.cancelIdleCallback(idle); };
  }, [armed, creative, environment]);

  function toggleArt() {
    if (failed || !armed || staticArt) {
      setFailed(false); setStaticArt(false); setArmed(true); setReady(false); setAttempt((value) => value + 1);
    } else { setStaticArt(true); setReady(false); }
  }

  const scene = canvasMounted ? (
          <div data-hero-surface className={cx("hero-surface hero-art-fade absolute inset-0", ready ? "opacity-100" : "opacity-0")}>
            <SceneBoundary key={attempt} onFailure={fail}>
              <HeroScene theme={theme} active={active} creative={creative} coarse={environment.coarse} quality={environment.quality}
                host={host} onReady={onReady} onFailure={fail} onSlow={onSlow} />
            </SceneBoundary>
          </div>
        ) : null;
  const controls = <div className={cx("hero-controls js-only absolute inset-x-5 bottom-3 z-20 flex flex-wrap justify-center gap-2 sm:bottom-14 lg:bottom-3", docked && "companion-controls")}>
        {ready && !environment.reduced ? (
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}
            aria-label={paused ? labels.resume : labels.pause} title={paused ? labels.resume : labels.pause}
            className="ui-control min-h-11 min-w-11 rounded-sm border border-line-strong bg-base px-3 text-xs text-fg-muted hover:border-accent">
            <span className={docked ? "sr-only" : "hidden sm:inline"}>{paused ? labels.resume : labels.pause}</span>
            <span className={docked ? "inline" : "sm:hidden"} aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
          </button>
        ) : null}
        {ready && !environment.reduced && !docked ? <>
          <button type="button" disabled={!active} aria-label={labels.exploreLeft} title={labels.exploreLeft}
            onClick={() => host.current?.dispatchEvent(new CustomEvent("portfolio:hero-explore", { detail: -.18 }))}
            className="ui-control size-11 rounded-sm border border-line-strong bg-base text-fg-muted hover:border-accent">←</button>
          <button type="button" disabled={!active} aria-label={labels.exploreRight} title={labels.exploreRight}
            onClick={() => host.current?.dispatchEvent(new CustomEvent("portfolio:hero-explore", { detail: .18 }))}
            className="ui-control size-11 rounded-sm border border-line-strong bg-base text-fg-muted hover:border-accent">→</button>
        </> : null}
        <button type="button" onClick={toggleArt}
          aria-label={canvasMounted ? labels.staticArt : labels.enable} title={canvasMounted ? labels.staticArt : labels.enable}
          className="ui-control min-h-11 rounded-sm border border-line-strong bg-base px-3 text-xs text-fg-muted hover:border-accent">
          {docked ? <span aria-hidden="true">◈</span> : canvasMounted ? labels.staticArt : labels.enable}
        </button>
        {environment.reduced ? <span className="self-center text-xs text-fg-muted">{labels.reduced}</span> : null}
        {ready && active && !docked ? <span className="basis-full text-center text-xs text-fg-subtle">{labels.hint}</span> : null}
      </div>;
  return (
    <div ref={host} data-hero-art data-hero-state={failed ? "error" : staticArt || !armed ? "fallback" : ready ? active ? "ready" : "paused" : "loading"}
      data-hero-quality={environment.quality.name} className={cx("select-none", className)}>
      <div aria-hidden="true" className="hero-view relative aspect-[820/760] pointer-events-none sm:opacity-55 lg:opacity-100">
        <div className={cx("absolute inset-0", ready && canvasMounted && "opacity-0")}>{children}</div>
        {!creative ? scene : null}
      </div>
      {!creative ? controls : body ? createPortal(<div ref={bindPortal} data-spatial-companion data-paused={!active} className="spatial-companion">
        <div className="companion-art absolute inset-0" aria-hidden="true">{scene}</div>
        {docked && !canvasMounted ? <svg className="companion-placeholder" viewBox="0 0 180 170" fill="none" aria-hidden="true">
          <ellipse cx="90" cy="85" rx="65" ry="32" transform="rotate(-25 90 85)" /><ellipse cx="90" cy="85" rx="55" ry="32" transform="rotate(50 90 85)" /><path d="m90 73 10 12-10 12-10-12z" />
        </svg> : null}
        {controls}
      </div>, body) : null}
    </div>
  );
}

export type { HeroQuality };
