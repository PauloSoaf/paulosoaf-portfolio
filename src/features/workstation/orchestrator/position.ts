const clamp = (n: number) => Math.max(0, Math.min(1, n));
/** Samples actual reserved anchors, never changes scrollTop or intercepts wheel events. */
export function installWorkstationPosition(portal: HTMLElement, anchor: HTMLElement) {
  let pending = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const paint = () => {
    pending = 0; if (document.hidden) return;
    const first = anchor.getBoundingClientRect(), work = document.querySelector<HTMLElement>("[data-workstation-work-anchor]")?.getBoundingClientRect();
    const mobile = innerWidth < 1280;
    // Narrow layouts use the reserved in-flow scene; no floating frame over editorial text.
    const progress = !mobile && !reduced.matches && work ? clamp((innerHeight * .85 - work.top) / (innerHeight * .45)) : 0;
    const amount = progress * progress * (3 - 2 * progress);
    const last = work ?? first;
    const mix = (a: number, b: number) => a + (b - a) * amount;
    portal.style.width = `${mix(first.width, last.width)}px`; portal.style.height = `${mix(first.height, last.height)}px`;
    portal.style.transform = `translate3d(${mix(first.left, last.left)}px,${mix(first.top, last.top)}px,0)`;
    portal.dataset.positioned = "true"; portal.dataset.chapter = amount > .5 ? "work" : "hero";
    const controls = portal.querySelector<HTMLElement>(".workstation-controls")?.getBoundingClientRect();
    portal.dataset.controlsVisible = String(!!controls && controls.top >= 76 && controls.bottom <= innerHeight);
  };
  const schedule = () => { if (!pending && !document.hidden) pending = requestAnimationFrame(paint); };
  window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule); reduced.addEventListener("change", schedule);
  const resize = new ResizeObserver(schedule); resize.observe(anchor);
  const controls = portal.querySelector<HTMLElement>(".workstation-controls"); if (controls) resize.observe(controls);
  const work = document.querySelector<HTMLElement>("[data-workstation-work-anchor]"); if (work) resize.observe(work);
  paint();
  return () => { cancelAnimationFrame(pending); resize.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", schedule); reduced.removeEventListener("change", schedule); };
}
