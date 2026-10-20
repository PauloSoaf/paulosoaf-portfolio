/**
 * The notebook is a physical guest on the page: landings shake nearby editorial blocks and a
 * flying notebook knocks the ones it brushes. Purely additive WAAPI transforms — layout, focus
 * and reading order never change, and reduced motion disables all of it.
 */
const TARGETS = [
  "main h2", "main h3", ".project-card", ".spotlight-card", ".journey-tab", ".journey-content",
  "[data-hero] .hero-actions > *", "[data-hero] [data-hero-kicker]", ".section-heading p",
].join(",");

type Rect = { element: HTMLElement; left: number; top: number; right: number; bottom: number };
const knocked = new WeakMap<HTMLElement, number>();

function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

function visibleTargets(): Rect[] {
  const height = innerHeight, width = innerWidth, result: Rect[] = [];
  for (const element of document.querySelectorAll<HTMLElement>(TARGETS)) {
    if (element.closest("[data-workstation], dialog")) continue;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width || rect.width < 8) continue;
    result.push({ element, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
  }
  return result;
}

/** Floor impact: a short tremor that travels outward from the contact point. */
export function tremor(origin: { x: number; y: number }, strength: number) {
  if (reduced() || strength <= 0) return 0;
  let count = 0;
  for (const target of visibleTargets()) {
    const cx = (target.left + target.right) / 2, cy = (target.top + target.bottom) / 2;
    const distance = Math.hypot(cx - origin.x, cy - origin.y), falloff = Math.max(0, 1 - distance / 1100);
    const amplitude = Math.min(14, strength * falloff * 12);
    if (amplitude < 1.2) continue;
    const tilt = (Math.random() - .5) * amplitude * .25;
    target.element.animate([
      { transform: "translate3d(0,0,0)" },
      { transform: `translate3d(0,${-amplitude}px,0) rotate(${tilt}deg)`, offset: .3 },
      { transform: `translate3d(0,${amplitude * .25}px,0) rotate(${-tilt * .4}deg)`, offset: .65 },
      { transform: "translate3d(0,0,0)" },
    ], { duration: 420, delay: distance / 2.6, easing: "cubic-bezier(.2,.8,.3,1)", composite: "add" });
    count++;
  }
  return count;
}

let cache: { rects: Rect[]; time: number } = { rects: [], time: 0 };
/**
 * Flying or carried notebook brushing past content. Returns how many elements were knocked
 * this frame so the caller can play a sound.
 */
export function knock(box: { left: number; top: number; right: number; bottom: number }, velocity: { x: number; y: number }, now: number) {
  if (reduced()) return 0;
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < 380) return 0;
  if (now - cache.time > 250) cache = { rects: visibleTargets(), time: now };
  let count = 0;
  // Shrink the silhouette box a little: only a real overlap counts as a knock.
  const inset = Math.min(box.right - box.left, box.bottom - box.top) * .12;
  for (const target of cache.rects) {
    if (target.right < box.left + inset || target.left > box.right - inset || target.bottom < box.top + inset || target.top > box.bottom - inset) continue;
    if (now - (knocked.get(target.element) ?? -Infinity) < 700) continue;
    knocked.set(target.element, now);
    const push = Math.min(18, speed / 140), dx = velocity.x / speed * push, dy = velocity.y / speed * push;
    const spin = Math.max(-6, Math.min(6, velocity.x / 260));
    target.element.animate([
      { transform: "translate3d(0,0,0)" },
      { transform: `translate3d(${dx}px,${dy}px,0) rotate(${spin}deg)`, offset: .25 },
      { transform: `translate3d(${-dx * .3}px,${-dy * .3}px,0) rotate(${-spin * .45}deg)`, offset: .6 },
      { transform: "translate3d(0,0,0)" },
    ], { duration: 560, easing: "cubic-bezier(.2,.9,.25,1)", composite: "add" });
    count++;
  }
  return count;
}
