export type PointerAction = { click?: () => void; doubleClick?: () => void; drag?: (x: number, y: number) => void };
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Normalized cursor, routed exclusively to registered controls of our own mini system. */
export class NotebookPointerController {
  x = .5; y = .5;
  root: HTMLElement | null = null;
  actions = new Map<string, PointerAction>();
  private hover: HTMLElement | null = null;
  private down: { action?: PointerAction; moved: number; time: number } | null = null;
  private lastClick = { id: "", time: 0 };
  external = false;
  onExternal = () => {};
  bind(root: HTMLElement | null) { this.root = root; this.paint(); }
  register(id: string, action: PointerAction) { this.actions.set(id, action); return () => { this.actions.delete(id); }; }
  private hit(): HTMLElement | null {
    if (!this.root) return null;
    const projected = this.root.closest<HTMLElement>(".workstation-projected-screen");
    let x: number, y: number;
    if (projected) {
      const matrix = new DOMMatrix(getComputedStyle(projected).transform);
      const scene = projected.closest<HTMLElement>(".workstation-scene")!, rect = scene.getBoundingClientRect();
      const scale = rect.width / scene.offsetWidth;
      const point = matrix.transformPoint(new DOMPoint(this.x * this.root.clientWidth, this.y * this.root.clientHeight));
      x = rect.left + point.x * scale; y = rect.top + point.y * scale;
    } else { const rect = this.root.getBoundingClientRect(); x = rect.left + this.x * rect.width; y = rect.top + this.y * rect.height; }
    const element = document.elementsFromPoint(x, y).find((node) => node instanceof HTMLElement && node.closest("[data-input-action]") && this.root!.contains(node));
    return element?.closest<HTMLElement>("[data-input-action]") ?? null;
  }
  private paint() {
    const cursor = this.root?.querySelector<HTMLElement>("[data-notebook-cursor]");
    if (cursor) { cursor.style.left = `${this.x * 100}%`; cursor.style.top = `${this.y * 100}%`; cursor.dataset.pressed = String(!!this.down); }
    this.hover?.removeAttribute("data-virtual-hover"); this.hover = this.hit();
    this.hover?.setAttribute("data-virtual-hover", "true");
  }
  move(dx: number, dy: number) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    this.x = clamp(this.x + dx); this.y = clamp(this.y + dy);
    if (this.down) { this.down.moved += Math.hypot(dx, dy); this.down.action?.drag?.(dx, dy); }
    this.paint();
  }
  start() {
    const element = this.hit();
    this.down = { action: this.actions.get(element?.dataset.inputAction ?? ""), moved: 0, time: performance.now() }; this.paint();
  }
  end() {
    const down = this.down; this.down = null;
    if (!down) return;
    if (this.external) { this.onExternal(); this.paint(); return; }
    if (down.moved < .025) {
      const id = this.hit()?.dataset.inputAction ?? "", action = this.actions.get(id), now = performance.now();
      if (id === this.lastClick.id && now - this.lastClick.time < 350 && action?.doubleClick) action.doubleClick();
      else action?.click?.();
      this.lastClick = { id, time: now };
    }
    this.paint();
  }
  cancel() { this.down = null; this.paint(); }
  scroll(delta: number) {
    if (this.external) { this.onExternal(); return; }
    const element = this.hit();
    const scroller = element?.closest<HTMLElement>("[data-input-scroll]") ?? this.root?.querySelector<HTMLElement>("[data-input-scroll]");
    scroller?.scrollBy({ top: delta, behavior: "instant" });
  }
}
