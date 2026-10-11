"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { revealElement } from "@/features/motion/motion-engine";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/get-dictionary";

interface Chapter { id: string; label: string; title: string; summary: string; content: ReactNode }
interface Props { chapters: readonly Chapter[]; labels: Dictionary["journey"] }
const emptySubscribe = () => () => {};
const hydrated = () => true, server = () => false;
const desktopSnapshot = () => matchMedia("(min-width: 64rem)").matches;
const reducedSnapshot = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeDesktop = (cb: () => void) => { const m = matchMedia("(min-width: 64rem)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const subscribeReduced = (cb: () => void) => { const m = matchMedia("(prefers-reduced-motion: reduce)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

export function JourneyTimeline({ chapters, labels }: Props) {
  const enhanced = useSyncExternalStore(emptySubscribe, hydrated, server);
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, server) && enhanced;
  const reduced = useSyncExternalStore(subscribeReduced, reducedSnapshot, server);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const bind = useCallback((node: HTMLDivElement | null) => setHost(node), []);
  const [selectedId, select] = useState<string | null>(null);
  const [follow, setFollow] = useState(false);
  const index = Math.max(0, chapters.findIndex((chapter) => chapter.id === selectedId));
  const id = chapters[index]?.id;
  const previous = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!host || !id) return;
    const changed = previous.current !== undefined && previous.current !== id;
    previous.current = id;
    if (!desktop || reduced || !changed) return;
    const content = host.querySelector<HTMLElement>(`[data-chapter="${id}"] .journey-content`);
    const animation = content ? revealElement(content, "settle") : null;
    if (animation) void animation.finished.catch(() => {});
    return () => animation?.cancel();
  }, [host, id, desktop, reduced]);

  useEffect(() => {
    if (!host || reduced || (desktop && !follow) || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<HTMLElement>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(target); else visible.delete(target);
      }
      if (host.contains(document.activeElement) && !(document.activeElement as Element)?.classList.contains("journey-follow")) return;
      const closest = [...visible].sort((a, b) => Math.abs(a.getBoundingClientRect().top - innerHeight * .4) - Math.abs(b.getBoundingClientRect().top - innerHeight * .4))[0];
      if (closest?.dataset.chapterId) select(closest.dataset.chapterId);
    }, { rootMargin: "-20% 0px -40% 0px", threshold: 0 });
    for (const node of host.querySelectorAll<HTMLElement>(desktop ? ".journey-tab" : ".journey-item")) observer.observe(node);
    return () => observer.disconnect();
  }, [host, desktop, reduced, follow, chapters]);

  function choose(next: number, moveFocus = false) {
    const chapter = chapters[next];
    if (!chapter) return;
    select(chapter.id); setFollow(false);
    if (moveFocus) host?.querySelector<HTMLButtonElement>(`[data-chapter-id="${chapter.id}"].journey-tab`)?.focus();
  }

  if (!chapters.length) return null;
  return <div ref={bind} className="journey-timeline" data-timeline data-desktop={desktop} data-selected-chapter={id} data-follow={follow && !reduced}
    style={{ "--journey-progress": (index + 1) / chapters.length } as CSSProperties}>
    <div className="journey-navigation" data-motion="horizontal" hidden={!desktop}>
      <div className="journey-rail" role="tablist" aria-label={labels.navigation} aria-orientation="vertical">
        <span className="journey-progress" aria-hidden="true" />
        {chapters.map((chapter, i) => <button key={chapter.id} type="button" className="journey-tab" id={`journey-tab-${chapter.id}`}
          role="tab" aria-selected={i === index} aria-controls={`journey-panel-${chapter.id}`} tabIndex={i === index ? 0 : -1}
          data-chapter-id={chapter.id} onClick={() => choose(i)} onFocus={() => choose(i)}
          onKeyDown={(event) => {
            const target = event.key === "ArrowDown" ? (i + 1) % chapters.length : event.key === "ArrowUp" ? (i - 1 + chapters.length) % chapters.length :
              event.key === "Home" ? 0 : event.key === "End" ? chapters.length - 1 : null;
            if (target !== null) { event.preventDefault(); choose(target, true); }
          }}>
          <span className="journey-dot" aria-hidden="true" />
          <span className="journey-tab-copy"><span className="text-kicker text-fg-subtle">{chapter.label}</span>
            <strong>{chapter.title}</strong><span className="text-sm text-fg-muted">{chapter.summary}</span></span>
        </button>)}
      </div>
      {chapters.length > 1 && <button type="button" className="journey-follow" aria-pressed={follow} disabled={reduced}
        onClick={() => setFollow((value) => !value)}>{labels.followScroll}</button>}
    </div>
    <ol className="journey-panels" role={desktop ? "presentation" : undefined}>
      {chapters.map((chapter, i) => <li key={chapter.id} className="journey-item" data-chapter-id={chapter.id} data-current={i === index}
        aria-hidden={desktop && i !== index || undefined} inert={desktop && i !== index || undefined} role={desktop ? "presentation" : undefined}>
        <article className="journey-panel" id={`journey-panel-${chapter.id}`} data-chapter={chapter.id}
          role={desktop ? "tabpanel" : undefined} tabIndex={desktop && i === index ? 0 : undefined}
          aria-labelledby={desktop ? `journey-tab-${chapter.id}` : `journey-heading-${chapter.id}`}>
          <div className="journey-content" data-motion="settle">{chapter.content}</div>
          <div className="journey-panel-footer"><span>{format(labels.position, { index: String(i + 1).padStart(2, "0"), total: String(chapters.length).padStart(2, "0") })}</span>
            <span aria-hidden="true" className="journey-mark">↗</span></div>
        </article>
      </li>)}
    </ol>
  </div>;
}
