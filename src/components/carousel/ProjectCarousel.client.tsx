"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import { DRAG_THRESHOLD, carouselReducer, initialCarouselState, selectedIndex, shouldAutoAdvance, slideOffset, wrapIndex } from "@/features/projects/carousel-controller";
import { createCarouselClock } from "@/features/projects/carousel-clock";
import { CarouselCountdown } from "./CarouselCountdown.client";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/get-dictionary";
import { CarouselMediaContext } from "./CarouselMediaContext.client";
import { useProjectPlayback } from "@/features/projects/ProjectPlaybackProvider.client";

interface Slide { slug: string; title: string; content: ReactNode }
interface Props { slides: readonly Slide[]; labels: Dictionary["carousel"] }
const subscribeHydration = () => () => {};
const hydrated = () => true;
const serverHydrated = () => false;

/** HTML/server cards are progressively enhanced; no Three import or copy of the project catalog. */
export function ProjectCarousel({ slides, labels }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [hostNode, setHostNode] = useState<HTMLDivElement | null>(null);
  const bindHost = useCallback((node: HTMLDivElement | null) => { host.current = node; setHostNode(node); }, []);
  const stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; horizontal: boolean; delta: number } | null>(null);
  const suppressClick = useRef(false);
  const playIntent = useRef<boolean | null>(null);
  const enhanced = useSyncExternalStore(subscribeHydration, hydrated, serverHydrated);
  const [state, dispatch] = useReducer(carouselReducer, initialCarouselState);
  const playback = useProjectPlayback();
  const store = playback?.store;
  const [companionEngaged, setCompanionEngaged] = useState(false);
  const [companionVisible, setCompanionVisible] = useState(false);
  const companionVisibility = useRef(false);
  const slugs = useMemo(() => slides.map((slide) => slide.slug), [slides]);
  const clock = useMemo(() => createCarouselClock(() => dispatch({ type: "step", delta: 1, slugs })), [slugs]);
  const index = selectedIndex(state, slugs);
  const auto = enhanced && !companionEngaged && shouldAutoAdvance({ ...state, visible: state.visible || companionVisible }, slides.length);
  const media = useMemo(() => enhanced && slugs.length > 0 ? {
    allowedSlugs: new Set(slugs.filter((_, i) => Math.abs(slideOffset(i, index, slugs.length)) <= 1)),
    activeSlug: slugs[index]!, visible: state.visible,
  } : null, [enhanced, slugs, index, state.visible]);

  useEffect(() => {
    if (!enhanced || !hostNode) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => { if (media.matches) clock.pause(); dispatch({ type: "reduced", value: media.matches }); };
    const syncTab = () => { if (document.hidden) clock.pause(); dispatch({ type: "tab", value: !document.hidden }); };
    media.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncTab);
    // A delayed callback can contain several transitions for this same node. Apply the newest.
    const observer = new IntersectionObserver((entries) => {
      const visible = !!entries.at(-1)?.isIntersecting;
      // An offscreen page card must not stop a still-visible notebook's shared clock.
      if (!visible && !companionVisibility.current) clock.pause(); dispatch({ type: "visible", value: visible });
    }, { threshold: 0.1 });
    // Track the actual committed node. A one-shot nullable ref read can miss a hydration commit.
    observer.observe(hostNode);
    syncMotion(); syncTab();
    return () => { observer.disconnect(); media.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", syncTab); };
  }, [enhanced, hostNode, clock]);

  useEffect(() => {
    if (auto) clock.start(); else clock.pause();
    return () => clock.pause();
  }, [auto, index, clock]);
  useEffect(() => () => clock.dispose(), [clock]);

  useEffect(() => {
    // A catalog update can remove the dragged slide. Drop its capture/session before new input.
    const current = gesture.current;
    if (current) {
      gesture.current = null;
      stage.current?.style.setProperty("--drag-x", "0px");
      if (stage.current?.hasPointerCapture(current.id)) stage.current.releasePointerCapture(current.id);
      dispatch({ type: "drag", value: false });
    }
  }, [slugs]);

  useEffect(() => {
    // Optional contract for a future shared scene; no subscriber or GPU dependency in S02.
    if (enhanced && slides[index]) host.current?.dispatchEvent(new CustomEvent("portfolio:project-change", {
      bubbles: true, detail: { slug: slides[index].slug, selectedIndex: index },
    }));
  }, [enhanced, index, slides]);

  function step(delta: number) {
    clock.reset();
    const next = wrapIndex(index + delta, slides.length);
    dispatch({ type: "step", delta, slugs, announcement: slides[next] ? `${format(labels.position, { index: next + 1, total: slides.length })}: ${slides[next].title}` : "" });
  }

  useEffect(() => {
    if (!enhanced || !store) return;
    store.publish({ index, playing: state.isPlaying, running: auto, reduced: state.reducedMotion, clock }, event => {
      if (event.type === "engaged") {
        if (event.value) clock.pause();
        setCompanionEngaged(event.value);
      } else if (event.type === "visible") { companionVisibility.current = event.value; setCompanionVisible(event.value); }
      else if (event.type === "toggle") dispatch({ type: "playing", value: !state.isPlaying });
      else {
        clock.reset();
        const delta = event.type === "next" ? 1 : -1, next = wrapIndex(index + delta, slides.length);
        dispatch({ type: "step", delta, slugs, announcement: slides[next] ? `${format(labels.position, { index: next + 1, total: slides.length })}: ${slides[next].title}` : "" });
      }
    });
  }, [enhanced, store, index, auto, state.isPlaying, state.reducedMotion, clock, slugs, slides, labels.position]);

  function finishGesture(cancelled = false) {
    const current = gesture.current;
    if (!current) return;
    if (!cancelled && current.horizontal && Math.abs(current.delta) >= DRAG_THRESHOLD) step(current.delta < 0 ? 1 : -1);
    // A dragged link must not navigate when the synthetic click follows pointerup.
    suppressClick.current = current.horizontal;
    gesture.current = null;
    stage.current?.style.setProperty("--drag-x", "0px");
    dispatch({ type: "drag", value: false });
    if (stage.current?.hasPointerCapture(current.id)) stage.current.releasePointerCapture(current.id);
  }

  if (slides.length === 0) return null;
  const status = slides.length === 1 ? labels.single : state.reducedMotion ? labels.reduced :
    !state.isPlaying ? labels.paused : auto ? labels.playing : labels.suspended;

  return (
    <CarouselMediaContext value={media}>
    <div ref={bindHost} className="project-carousel" data-carousel data-enhanced={enhanced} data-selected-index={index}
      data-playing={state.isPlaying} data-auto={auto} data-hovered={state.isHovered} data-focus={state.hasFocus}
      data-dragging={state.isDragging} data-visible={state.visible} data-reduced={state.reducedMotion}
      role={enhanced ? "group" : undefined} aria-roledescription={enhanced ? labels.role : undefined} aria-labelledby="work-title"
      onMouseEnter={() => { clock.pause(); dispatch({ type: "hover", value: true }); }} onMouseLeave={() => dispatch({ type: "hover", value: false })}
      onPointerDownCapture={() => { suppressClick.current = false; }}
      onFocusCapture={() => { clock.pause(); dispatch({ type: "focus", value: true }); }}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) dispatch({ type: "focus", value: false }); }}
      onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      {/* Rotation control first in DOM/tab order; visual order remains under the stage like POC. */}
      {slides.length > 1 && (
        <div className="carousel-controls">
          <button type="button" className="carousel-button ui-control carousel-play" disabled={!enhanced || state.reducedMotion}
            onPointerDown={() => { playIntent.current = !state.isPlaying; }}
            onClick={() => { dispatch({ type: "playing", value: playIntent.current ?? !state.isPlaying }); playIntent.current = null; }}>
            {state.isPlaying ? labels.pause : labels.play}<span aria-hidden="true">{state.isPlaying ? "Ⅱ" : "▷"}</span>
          </button>
          <button type="button" className="carousel-button ui-control carousel-prev" disabled={!enhanced} aria-label={labels.previous} onClick={() => step(-1)}>←</button>
          <button type="button" className="carousel-button ui-control carousel-next" disabled={!enhanced} aria-label={labels.next} onClick={() => step(1)}>→</button>
          <span className="carousel-position">{format(labels.position, { index: index + 1, total: slides.length })}</span>
          <CarouselCountdown clock={clock} running={auto} reduced={state.reducedMotion} labels={labels} />
          <span className="carousel-range" aria-hidden="true"><span style={{ transform: `scaleX(${(index + 1) / slides.length})` }} /></span>
          <span className="carousel-hint">{labels.hint}</span>
        </div>
      )}
      {slides.length > 1 && <div className="carousel-filmstrip" role="group" aria-label={labels.role}>
        {slides.map((slide, targetIndex) => <button type="button" key={slide.slug} className="ui-control filmstrip-button"
          disabled={!enhanced} aria-label={format(labels.selectProject, { title: slide.title })} aria-pressed={targetIndex === index}
          onClick={() => step(targetIndex - index)}><span aria-hidden="true">{String(targetIndex + 1).padStart(2, "0")}</span><span className="filmstrip-title">{slide.title}</span></button>)}
      </div>}
      {/* WAI basic carousel group with optional arrow-key navigation; it is not a button. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div ref={stage} className="carousel-stage" role="group" tabIndex={slides.length > 1 ? 0 : undefined}
        aria-label={labels.hint}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); step(event.key === "ArrowRight" ? 1 : -1); }
        }}
        onPointerDown={(event) => {
          if (!enhanced || slides.length < 2 || gesture.current || !event.isPrimary || event.button !== 0 || (event.target as Element).closest("button")) return;
          gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false, delta: 0 };
          clock.pause();
          dispatch({ type: "drag", value: true });
        }}
        onPointerMove={(event) => {
          const current = gesture.current;
          if (!current || current.id !== event.pointerId) return;
          const dx = event.clientX - current.x, dy = event.clientY - current.y;
          if (!current.horizontal && Math.abs(dy) > Math.max(8, Math.abs(dx))) { finishGesture(true); return; }
          if (!current.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
            current.horizontal = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (current.horizontal) { current.delta = dx; event.currentTarget.style.setProperty("--drag-x", `${Math.max(-100, Math.min(100, dx))}px`); }
        }}
        onPointerUp={() => finishGesture()} onPointerCancel={() => finishGesture(true)}
        onLostPointerCapture={(event) => {
          // Touch implicitly captures on the child first. Its bubbling loss while capture moves
          // to the stage must not cancel the same gesture.
          if (event.target === event.currentTarget) finishGesture(true);
        }} onDragStart={(event) => event.preventDefault()}>
        {slides.map((slide, itemIndex) => {
          const offset = slideOffset(itemIndex, index, slides.length);
          const inactive = enhanced && itemIndex !== index;
          return <div key={slide.slug} className="carousel-slide" data-project={slide.slug} data-active={!inactive} data-neighbor={Math.abs(offset) === 1}
            style={{ "--offset": offset, "--layer": itemIndex === index ? 3 : Math.abs(offset) === 1 ? 2 : 1 } as CSSProperties}
            role={enhanced ? "group" : undefined} aria-roledescription={enhanced ? labels.slide : undefined}
            aria-label={enhanced ? `${format(labels.position, { index: itemIndex + 1, total: slides.length })}: ${slide.title}` : undefined}
            aria-hidden={inactive || undefined} inert={inactive || undefined}>
            {slide.content}
          </div>;
        })}
      </div>
      <p className="carousel-status">{status}</p>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{state.announcement}</span>
    </div>
    </CarouselMediaContext>
  );
}
