"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { sectionIds, type SectionId } from "@/i18n/paths";

let current: SectionId | null = null;
let stop: (() => void) | undefined;
let route: string | null = null;
const listeners = new Set<() => void>();
const snapshot = () => current;
const serverSnapshot = () => null;

function start() {
  let frame = 0;
  const measure = () => {
    frame = 0;
    const marker = (document.getElementById("top")?.getBoundingClientRect().bottom ?? 0) + 24;
    let next: SectionId | null = null;
    for (const id of sectionIds) {
      const bounds = document.getElementById(id)?.getBoundingClientRect();
      if (bounds && bounds.top <= marker && bounds.bottom > marker) { next = id; break; }
    }
    if (current !== next) { current = next; listeners.forEach(listener => listener()); }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  schedule();
  return () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener("scroll", schedule); removeEventListener("resize", schedule); current = null; };
}

/** Shared passive measurement, including restored scroll and layout changes after hydration. */
export function useVisibleSection() {
  const pathname = usePathname();
  const subscribe = useCallback((listener: () => void) => {
    listeners.add(listener);
    if (!stop || route !== pathname) { stop?.(); route = pathname; stop = start(); }
    return () => { listeners.delete(listener); if (!listeners.size) { stop?.(); stop = undefined; route = null; } };
  // A persistent layout must resubscribe when a case study replaces the landing DOM.
  }, [pathname]);
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
