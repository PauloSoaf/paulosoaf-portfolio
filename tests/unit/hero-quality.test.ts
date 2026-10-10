import { describe, expect, it } from "vitest";
import { constrainedDevice, heroQuality, PARALLAX_LIMIT, pointerRotation, relief, seededRandom } from "@/graphics/hero/quality";

describe("procedural hero budgets and safe interaction", () => {
  it.each([360, 390, 768, 1024, 1440, 1920])("caps DPR and geometry at width %s", (width) => {
    const quality = heroQuality(width);
    expect(quality.dpr).toBeLessThanOrEqual(1.5);
    expect(quality.segments).toBeLessThanOrEqual(72);
    expect(quality.orbitSegments).toBeLessThanOrEqual(160);
  });
  it("reduces geometry and DPR for limited devices regardless of viewport", () => {
    expect(heroQuality(1920, true)).toEqual(heroQuality(360));
    expect(constrainedDevice({ saveData: true })).toBe(true);
    expect(constrainedDevice({ cores: 2 })).toBe(true);
    expect(constrainedDevice({ memory: 2 })).toBe(true);
    expect(constrainedDevice({ cores: 8, memory: 8 })).toBe(false);
  });
  it("clamps even out-of-bounds pointer positions", () => {
    expect(pointerRotation(5, -8)).toEqual([-PARALLAX_LIMIT, PARALLAX_LIMIT]);
    expect(pointerRotation(0, 0)).toEqual([0, 0]);
  });
  it("produces identical terrain and stars for a fixed seed", () => {
    const first = seededRandom(260610), second = seededRandom(260610);
    expect(Array.from({ length: 90 }, first)).toEqual(Array.from({ length: 90 }, second));
    expect(relief(1, 0, 0)).not.toBe(relief(0, 1, 0));
    for (const point of [[1, 0, 0], [0, -1, 0], [0.5, 0.5, 0.5]]) expect(Math.abs(relief(point[0]!, point[1]!, point[2]!))).toBeLessThanOrEqual(0.024);
  });
});
