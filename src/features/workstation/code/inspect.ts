/**
 * Page component → Code app file id. Most specific first; only registered components are
 * selectable, and each maps to a fixed manifest id (never a path from the page).
 */
export const INSPECT_REGISTRY: readonly { selector: string; file: string }[] = [
  { selector: "[data-workstation]", file: "laptop-model" },
  { selector: ".theme-toggle", file: "theme-toggle" },
  { selector: "#top", file: "site-header" },
  { selector: ".carousel-countdown", file: "carousel-countdown" },
  { selector: ".project-card", file: "project-card" },
  { selector: ".project-carousel", file: "project-carousel" },
  { selector: ".journey-timeline", file: "journey-timeline" },
  { selector: "[data-hero]", file: "hero-editorial" },
  { selector: "#expertise", file: "expertise-section" },
  { selector: "#services", file: "services-section" },
  { selector: "#contact", file: "contact-section" },
  { selector: "footer", file: "site-footer" },
  { selector: "main section", file: "section-shell" },
];

export function resolveInspectTarget(node: Element | null) {
  // The notebook's own screen keeps working while inspecting (that is where the code shows up).
  if (!node || node.closest("dialog, .workstation-menu, .workstation-inspect, [data-workstation-screen]")) return null;
  for (const entry of INSPECT_REGISTRY) {
    const element = node.closest<HTMLElement>(entry.selector);
    if (element) return { element, file: entry.file };
  }
  return null;
}

/** Hover outline + click capture while the Code app inspects the page. Escape leaves the mode. */
export function startInspect({ onPick, onExit, label }: { onPick: (file: string, element: HTMLElement) => void; onExit: () => void; label: (file: string) => string }) {
  const outline = document.createElement("div");
  outline.className = "workstation-inspect"; outline.setAttribute("aria-hidden", "true");
  const tag = document.createElement("span"); outline.append(tag);
  document.body.append(outline);
  let current: HTMLElement | null = null;
  const paint = () => {
    if (!current) { outline.dataset.visible = "false"; return; }
    const rect = current.getBoundingClientRect();
    Object.assign(outline.style, { transform: `translate3d(${rect.left}px,${rect.top}px,0)`, width: `${rect.width}px`, height: `${rect.height}px` });
    outline.dataset.visible = "true";
  };
  const move = (event: PointerEvent) => {
    const target = resolveInspectTarget(event.target as Element);
    current = target?.element ?? null; tag.textContent = target ? label(target.file) : ""; paint();
  };
  const click = (event: MouseEvent) => {
    const target = resolveInspectTarget(event.target as Element);
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    onPick(target.file, target.element);
  };
  const block = (event: PointerEvent) => { if (resolveInspectTarget(event.target as Element)) { event.stopImmediatePropagation(); } };
  const key = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onExit(); } };
  document.addEventListener("pointermove", move, true); document.addEventListener("click", click, true);
  document.addEventListener("pointerdown", block, true); document.addEventListener("keydown", key, true);
  window.addEventListener("scroll", paint, { passive: true });
  document.documentElement.dataset.inspecting = "true";
  return () => {
    document.removeEventListener("pointermove", move, true); document.removeEventListener("click", click, true);
    document.removeEventListener("pointerdown", block, true); document.removeEventListener("keydown", key, true);
    window.removeEventListener("scroll", paint); outline.remove();
    delete document.documentElement.dataset.inspecting;
  };
}
