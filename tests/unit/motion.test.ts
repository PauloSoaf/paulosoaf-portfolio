import { beforeEach, describe, expect, it, vi } from "vitest";
import { installMotion, revealElement } from "@/features/motion/motion-engine";

let callback: IntersectionObserverCallback;
let observer: { observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };
const cancel = vi.fn(), pause = vi.fn(), play = vi.fn();
const animate = vi.fn<typeof HTMLElement.prototype.animate>(() => ({ cancel, pause, play, finished: new Promise(() => {}) } as unknown as Animation));
let change: () => void, reduced = false;
beforeEach(() => {
  document.body.innerHTML = ""; reduced = false; animate.mockClear(); cancel.mockClear(); pause.mockClear(); play.mockClear();
  vi.stubGlobal("IntersectionObserver", class {
    observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn();
    constructor(cb: IntersectionObserverCallback) { callback = cb; observer = { observe: this.observe, unobserve: this.unobserve, disconnect: this.disconnect }; }
  });
  vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; }, addEventListener: (_: string, cb: () => void) => { change = cb; }, removeEventListener: vi.fn() }));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 2000, bottom: 2200 } as DOMRect);
  vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: (name: string) => name.includes("ease") ? "ease-out" : "280ms" }));
});
const enter = (element: HTMLElement, intersecting = true) => callback([{ target: element, isIntersecting: intersecting } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
function setup() {
  const root = document.createElement("main"), target = document.createElement("div");
  target.dataset.motion = "rise"; target.animate = animate; root.append(target); document.body.append(root);
  return { root, target, cleanup: installMotion(root) };
}

describe("motion lifecycle and visible fallback", () => {
  it("plays once, caps stagger and cancels when offscreen without hiding the resting content", () => {
    const { target, cleanup } = setup(); target.dataset.motionDelay = "999";
    enter(target); expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0]?.[1]).toMatchObject({ delay: 240, duration: 850, fill: "none" });
    enter(target, false); expect(cancel).toHaveBeenCalled();
    enter(target); expect(animate).toHaveBeenCalledTimes(1); expect(target.style.opacity).toBe("");
    cleanup(); expect(observer.disconnect).toHaveBeenCalled();
  });
  it("supports missing or throwing WAAPI without invisible content", () => {
    const node = document.createElement("div");
    expect(revealElement(node, "rise")).toBeNull();
    node.animate = () => { throw new Error("unsupported"); };
    expect(revealElement(node, "rise")).toBeNull(); expect(node.style.opacity).toBe("");
  });
  it("converts computed CSS seconds into WAAPI milliseconds", () => {
    vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: (name: string) => name.includes("ease") ? "ease-out" : "1.4s" }));
    const node = document.createElement("div"); node.animate = animate;
    revealElement(node, "rise"); expect(animate.mock.calls[0]?.[1]).toMatchObject({ duration: 1400 });
  });
  it("cancels current effects and skips future effects when reduced motion changes", () => {
    const { target, cleanup } = setup(); enter(target);
    reduced = true; change(); expect(cancel).toHaveBeenCalled(); expect(target.dataset.motionState).toBe("reduced");
    enter(target); expect(animate).toHaveBeenCalledTimes(1); cleanup();
  });
  it("observes dynamically added elements and cancels detached animations", async () => {
    const { root, target, cleanup } = setup(); enter(target);
    const added = document.createElement("div"); added.dataset.motion = "horizontal"; added.animate = animate;
    root.append(added); await Promise.resolve(); expect(observer.observe).toHaveBeenCalledWith(added);
    target.remove(); await Promise.resolve(); expect(observer.unobserve).toHaveBeenCalledWith(target); expect(cancel).toHaveBeenCalled(); cleanup();
  });
  it("immediately cancels an effect when a descendant receives focus", () => {
    const { target, cleanup } = setup(); const link = document.createElement("a"); link.href = "#contact"; target.append(link);
    enter(target); link.focus(); expect(cancel).toHaveBeenCalled(); cleanup();
  });
  it("pauses in hidden tabs and resumes only when the document becomes visible", () => {
    const { target, cleanup } = setup(); enter(target);
    const hidden = vi.spyOn(document, "hidden", "get");
    hidden.mockReturnValue(true); document.dispatchEvent(new Event("visibilitychange")); expect(pause).toHaveBeenCalled();
    hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange")); expect(play).toHaveBeenCalled(); cleanup();
  });
  it("does not hide or mutate content when visibility observers are unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const root = document.createElement("main"); root.innerHTML = '<h2 data-motion="rise">Visible heading</h2>';
    installMotion(root)(); expect(root.textContent).toBe("Visible heading"); expect(root.querySelector("h2")?.style.opacity).toBe("");
  });
});
