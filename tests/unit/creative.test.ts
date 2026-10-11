import { afterEach, describe, expect, it, vi } from "vitest";
import { createRibbon } from "@/graphics/hero/RecoverySculpture.client";
import { heroExitProgress } from "@/features/creative/experience";
import { installSpatialStory } from "@/features/creative/CreativeRuntime.client";

afterEach(() => { document.body.innerHTML = ""; vi.unstubAllGlobals(); });

describe("spatial signature", () => {
  it("uses actual distance, clamps deep links and scales the exit to the viewport", () => {
    expect(heroExitProgress(100, 1400, 900)).toBe(0);
    expect(heroExitProgress(-382.5, 1400, 900)).toBe(.5);
    expect(heroExitProgress(-2000, 1400, 900)).toBe(1);
    expect(heroExitProgress(-200, 400, 900)).toBe(.5);
  });

  it.each([40, 56, 72])("%s quality: finite, deterministic, open ribbons within the rendering budget", (segments) => {
    for (let layer = 0; layer < 3; layer++) {
      const geometry = createRibbon(segments * 2, layer), repeat = createRibbon(segments * 2, layer);
      expect(geometry.attributes.position!.array).toEqual(repeat.attributes.position!.array);
      expect([...geometry.attributes.normal!.array].every(Number.isFinite)).toBe(true);
      const positions = geometry.attributes.position!;
      for (let i = 0; i < positions.count; i++) expect(Math.hypot(positions.getX(i), positions.getY(i))).toBeGreaterThan(.65);
      expect(Math.max(...geometry.index!.array)).toBeLessThan(positions.count);
      expect(geometry.index!.count / 3 * 3 + 16).toBeLessThanOrEqual(3500);
      // Ends are separate: the silhouette has a physical opening, not a closed torus/sphere.
      expect(Math.hypot(positions.getX(0) - positions.getX(positions.count - 5), positions.getY(0) - positions.getY(positions.count - 5))).toBeGreaterThan(.4);
      geometry.dispose(); repeat.dispose();
    }
  });

  it("coalesces scrolls, cancels pending work and removes signatures on cleanup", () => {
    document.body.innerHTML = '<section data-hero></section><section id="work"></section>';
    const callbacks = new Map<number, FrameRequestCallback>(); let id = 0;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { callbacks.set(++id, callback); return id; }));
    const cancel = vi.fn((next: number) => callbacks.delete(next)); vi.stubGlobal("cancelAnimationFrame", cancel);
    const hero = document.querySelector<HTMLElement>("[data-hero]")!;
    vi.spyOn(hero, "getBoundingClientRect").mockReturnValue({ top: -300, height: 900 } as DOMRect);
    const cleanup = installSpatialStory();
    window.dispatchEvent(new Event("scroll")); window.dispatchEvent(new Event("scroll"));
    expect(callbacks.size).toBe(1);
    callbacks.get(1)!(0); callbacks.delete(1);
    expect(Number(hero.style.getPropertyValue("--hero-progress"))).toBeGreaterThan(0);
    window.dispatchEvent(new Event("scroll")); cleanup();
    expect(cancel).toHaveBeenCalledWith(2); expect(callbacks.size).toBe(0);
    expect(hero.style.getPropertyValue("--hero-progress")).toBe("");
    window.dispatchEvent(new Event("scroll")); expect(callbacks.size).toBe(0);
  });
});
