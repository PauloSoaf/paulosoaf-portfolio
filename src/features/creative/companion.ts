const clamp = (n: number) => Math.min(1, Math.max(0, n));
const mix = (a: number, b: number, progress: number) => a + (b - a) * progress;
const sizes = [170, 250, 195, 270, 185, 130];
export function companionDiameter(chapter: number, mobile: boolean): number {
  const index = Math.min(sizes.length - 1, Math.max(0, Math.floor(chapter)));
  const progress = clamp(chapter - index), smooth = progress * progress * (3 - 2 * progress);
  const diameter = mix(sizes[index]!, sizes[Math.min(index + 1, sizes.length - 1)]!, smooth);
  return mobile ? Math.max(104, diameter * .52) : diameter;
}

/** A single fixed canvas follows actual sections. Its CSS dimensions resize the render buffer. */
export function installCompanion(portal: HTMLElement, hero: HTMLElement, onDock: (value: boolean) => void) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let pending = 0, lastDock = false;
  const paint = () => {
    pending = 0;
    if (document.hidden) return;
    const section = hero.closest("[data-hero]")!, rect = section.getBoundingClientRect();
    const art = hero.querySelector<HTMLElement>(".hero-view")!.getBoundingClientRect();
    const mobile = innerWidth < 1280;
    const sections = [...document.querySelectorAll<HTMLElement>("#work,#about,#expertise,#services,#contact,footer")];
    const arrival = innerHeight * .4;
    let index = 0;
    for (let i = 0; i < sections.length; i++) if (sections[i]!.getBoundingClientRect().top < arrival) index = i;
    const current = sections[index]!, next = sections[index + 1];
    const start = current.getBoundingClientRect().top;
    const local = next ? clamp((arrival - start) / Math.max(1, next.getBoundingClientRect().top - start)) : 0;
    const chapter = index + local;
    const exit = reduced.matches ? 0 : mobile ? clamp((80 - art.top) / Math.max(1, art.height * .9)) : clamp((-rect.top - innerHeight * .12) / (innerHeight * .55));
    const eased = exit * exit * (3 - 2 * exit);
    const diameter = companionDiameter(chapter, mobile);
    const width = mix(art.width, diameter, eased), height = width * 760 / 820;
    const x = mix(art.left, innerWidth - diameter - (mobile ? 12 : 26), eased);
    const y = mix(art.top, mobile ? innerHeight - height - 112 : (innerHeight - height) * .42, eased);
    portal.style.width = `${width.toFixed(2)}px`; portal.style.height = `${height.toFixed(2)}px`;
    portal.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    portal.dataset.spatialChapter = chapter.toFixed(3);
    portal.dataset.spatialSection = current.id || "footer";
    const docked = exit > .7;
    portal.dataset.docked = String(docked); portal.dataset.positioned = "true";
    if (lastDock !== docked) { lastDock = docked; onDock(docked); }
  };
  const schedule = () => { if (!pending && !document.hidden) pending = requestAnimationFrame(paint); };
  window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule); reduced.addEventListener("change", schedule);
  paint();
  return () => {
    cancelAnimationFrame(pending); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    document.removeEventListener("visibilitychange", schedule); reduced.removeEventListener("change", schedule);
  };
}
