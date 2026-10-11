"use client";

import { useEffect } from "react";
import { clampProgress, heroExitProgress, useCreativeExperience } from "./experience";

/** Passive scroll sampling, one pending frame, no timers or changes to document geometry. */
export function installSpatialStory(root: Document = document) {
  const hero = root.querySelector<HTMLElement>("[data-hero]");
  const work = root.querySelector<HTMLElement>("#work");
  const journey = root.querySelector<HTMLElement>(".journey-timeline");
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  let pending = 0;
  const paint = () => {
    pending = 0;
    if (media.matches || root.hidden) return;
    if (hero) {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--hero-progress", heroExitProgress(rect.top, rect.height, innerHeight).toFixed(4));
    }
    if (work) {
      const rect = work.getBoundingClientRect();
      work.style.setProperty("--work-progress", clampProgress((innerHeight - rect.top) / innerHeight).toFixed(4));
    }
    if (journey) {
      const rect = journey.getBoundingClientRect();
      const progress = clampProgress((innerHeight * .8 - rect.top) / (innerHeight * .6 + rect.height));
      journey.style.setProperty("--chapter-scroll", progress.toFixed(4));
      // Each mobile chapter has its own arrival/departure, without transforming the flow list.
      journey.querySelectorAll<HTMLElement>(".journey-panel").forEach((panel) => {
        const item = panel.parentElement!.getBoundingClientRect();
        panel.style.setProperty("--chapter-scroll", clampProgress((innerHeight * .85 - item.top) / (innerHeight * .7 + item.height)).toFixed(4));
      });
    }
  };
  const schedule = () => { if (!pending && !media.matches && !root.hidden) pending = requestAnimationFrame(paint); };
  const reset = () => {
    if (pending) cancelAnimationFrame(pending);
    pending = 0;
    for (const [element, property] of [[hero, "--hero-progress"], [work, "--work-progress"], [journey, "--chapter-scroll"]] as const) element?.style.removeProperty(property);
    journey?.querySelectorAll<HTMLElement>(".journey-panel").forEach((panel) => panel.style.removeProperty("--chapter-scroll"));
  };
  const preference = () => { reset(); schedule(); };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  root.addEventListener("visibilitychange", preference);
  media.addEventListener("change", preference);
  schedule();
  return () => {
    window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    root.removeEventListener("visibilitychange", preference); media.removeEventListener("change", preference);
    reset();
  };
}

export function CreativeRuntime() {
  const creative = useCreativeExperience();
  useEffect(() => creative ? installSpatialStory() : undefined, [creative]);
  return null;
}
