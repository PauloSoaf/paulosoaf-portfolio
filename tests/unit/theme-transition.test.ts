import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getDocumentTheme, subscribeToTheme } from "@/theme/theme-client";

let reduced = false;
beforeEach(() => {
  vi.useFakeTimers(); reduced = false;
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.removeAttribute("data-theme-switching");
  vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
});
afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); Reflect.deleteProperty(document, "getAnimations"); });

describe("user theme transition lifecycle", () => {
  it("finishes only native CSS colour tails after clearing the marker", () => {
    class NativeTransition {
      playState = "running";
      finish = vi.fn(() => expect(document.documentElement).not.toHaveAttribute("data-theme-switching"));
      constructor(public transitionProperty: string) {}
    }
    vi.stubGlobal("CSSTransition", NativeTransition);
    const colour = new NativeTransition("color"), border = new NativeTransition("border-top-color"), transform = new NativeTransition("transform");
    const reveal = { playState: "running", finish: vi.fn() };
    Object.defineProperty(document, "getAnimations", { configurable: true, value: () => [colour, border, transform, reveal] });
    applyTheme("light"); vi.advanceTimersByTime(400);
    expect(colour.finish).toHaveBeenCalledOnce(); expect(border.finish).toHaveBeenCalledOnce();
    expect(transform.finish).not.toHaveBeenCalled(); expect(reveal.finish).not.toHaveBeenCalled();
  });
  it("updates the source of truth and subscribers immediately, then clears the visual marker", () => {
    const listener = vi.fn(), unsubscribe = subscribeToTheme(listener);
    applyTheme("light");
    expect(getDocumentTheme()).toBe("light");
    expect(document.cookie).toContain("ps-theme=light");
    expect(listener).toHaveBeenCalledOnce();
    expect(document.documentElement).toHaveAttribute("data-theme-switching");
    vi.advanceTimersByTime(400);
    expect(document.documentElement).not.toHaveAttribute("data-theme-switching");
    unsubscribe();
  });
  it("replaces the cleanup deadline on repeated switches without stale callbacks", () => {
    applyTheme("light"); vi.advanceTimersByTime(250); applyTheme("dark");
    vi.advanceTimersByTime(151);
    expect(document.documentElement).toHaveAttribute("data-theme-switching");
    expect(getDocumentTheme()).toBe("dark");
    vi.advanceTimersByTime(249);
    expect(document.documentElement).not.toHaveAttribute("data-theme-switching");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("reduced motion cancels an ongoing transition and creates no new timer", () => {
    applyTheme("light"); reduced = true; applyTheme("dark");
    expect(document.documentElement).not.toHaveAttribute("data-theme-switching");
    expect(vi.getTimerCount()).toBe(0);
    expect(getDocumentTheme()).toBe("dark");
  });
  it("same-theme requests do not notify or restart a transition", () => {
    const listener = vi.fn(), unsubscribe = subscribeToTheme(listener);
    applyTheme("dark"); expect(listener).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0); unsubscribe();
  });
});
