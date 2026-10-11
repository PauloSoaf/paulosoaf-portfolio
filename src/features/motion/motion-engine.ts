export type MotionPreset = "rise" | "editorial" | "horizontal" | "depth" | "rule" | "settle";

const starts: Record<MotionPreset, string> = {
  rise: "translate3d(0,16px,0)", editorial: "translate3d(0,24px,0)", horizontal: "translate3d(-12px,0,0)",
  depth: "scale(.97)", rule: "scaleX(.9)", settle: "translate3d(0,8px,0) scale(.995)",
};

/** Never changes the resting styles: cancel, missing WAAPI or a rejected animation leaves HTML visible. */
export function revealElement(element: HTMLElement, preset: MotionPreset, delay = 0): Animation | null {
  if (typeof element.animate !== "function") return null;
  const tokens = getComputedStyle(document.documentElement);
  const durationToken = tokens.getPropertyValue(preset === "depth" || preset === "editorial" ? "--oo-motion-slow" : "--oo-motion-normal").trim();
  const duration = (parseFloat(durationToken) * (durationToken.endsWith("ms") ? 1 : 1000)) || 280;
  try {
    return element.animate([
      { opacity: .35, transform: starts[preset] }, { opacity: 1, transform: "none" },
    ], { duration, delay: Math.min(140, Math.max(0, delay)), easing: tokens.getPropertyValue("--oo-ease-standard").trim() || "ease-out", fill: "none" });
  } catch { return null; }
}

/** One visibility observer and one event-driven scroll frame for the server-rendered landing. */
export function installMotion(root: HTMLElement): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const targets = new Set<HTMLElement>(), seen = new WeakSet<HTMLElement>();
  const animations = new Map<HTMLElement, Animation>(), decorations = new Set<HTMLElement>();
  let frame = 0, disposed = false;
  const cancel = (element: HTMLElement, state = "cancelled") => {
    animations.get(element)?.cancel(); animations.delete(element); element.dataset.motionState = state;
  };
  const updateDecorations = () => {
    frame = 0;
    if (disposed || reduced.matches || document.hidden) return;
    for (const element of decorations) {
      const rect = (element.closest("section") ?? element).getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
      element.style.setProperty("--scroll-drift", `${(progress - .5) * 28}px`);
      element.style.setProperty("--scroll-intensity", `${.35 + progress * .25}`);
    }
  };
  const schedule = () => {
    if (!frame && !document.hidden && !reduced.matches && decorations.size) frame = requestAnimationFrame(updateDecorations);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (element.hasAttribute("data-scroll-decor")) {
        if (entry.isIntersecting) decorations.add(element); else decorations.delete(element);
        schedule(); continue;
      }
      if (!entry.isIntersecting) { if (animations.has(element)) cancel(element); continue; }
      if (seen.has(element)) continue;
      seen.add(element);
      if (reduced.matches || document.hidden || element.contains(document.activeElement)) { element.dataset.motionState = "skipped"; continue; }
      const preset = element.dataset.motion as MotionPreset;
      const animation = revealElement(element, preset in starts ? preset : "rise", Number(element.dataset.motionDelay ?? 0));
      if (!animation) { element.dataset.motionState = "fallback"; continue; }
      animations.set(element, animation); element.dataset.motionState = "running";
      element.dataset.motionRuns = String(Number(element.dataset.motionRuns ?? 0) + 1);
      void animation.finished.then(() => {
        if (!disposed && animations.get(element) === animation) { animations.delete(element); element.dataset.motionState = "finished"; }
      }, () => {});
    }
  }, { threshold: .08 });
  const discover = () => {
    for (const element of targets) if (!root.contains(element)) {
      observer.unobserve(element); cancel(element); targets.delete(element); decorations.delete(element);
    }
    for (const element of root.querySelectorAll<HTMLElement>("[data-motion], [data-scroll-decor]")) if (!targets.has(element)) {
      targets.add(element);
      if (element.hasAttribute("data-motion")) {
        const rect = element.getBoundingClientRect();
        // First paint, anchor arrival and reload midway stay stable. Animate only later arrivals.
        if (reduced.matches || (rect.top < innerHeight && rect.bottom > 0)) {
          seen.add(element); element.dataset.motionState = reduced.matches ? "reduced" : "initial";
        } else element.dataset.motionState = "ready";
      }
      observer.observe(element);
    }
  };
  const syncMotion = () => {
    if (reduced.matches) {
      cancelAnimationFrame(frame); frame = 0;
      for (const element of targets) {
        if (element.hasAttribute("data-motion")) { seen.add(element); cancel(element, "reduced"); }
        element.style.removeProperty("--scroll-drift"); element.style.removeProperty("--scroll-intensity");
      }
    } else schedule();
  };
  const syncTab = () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; for (const animation of animations.values()) animation.pause(); }
    else { for (const animation of animations.values()) animation.play(); schedule(); }
  };
  const focus = (event: FocusEvent) => {
    for (const element of animations.keys()) if (element.contains(event.target as Node)) cancel(element);
  };
  const mutations = new MutationObserver(discover);
  discover(); mutations.observe(root, { childList: true, subtree: true });
  reduced.addEventListener("change", syncMotion); document.addEventListener("visibilitychange", syncTab);
  root.addEventListener("focusin", focus); window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
  return () => {
    disposed = true; observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame);
    for (const element of animations.keys()) cancel(element);
    for (const element of targets) { element.style.removeProperty("--scroll-drift"); element.style.removeProperty("--scroll-intensity"); }
    reduced.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", syncTab);
    root.removeEventListener("focusin", focus); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
  };
}
