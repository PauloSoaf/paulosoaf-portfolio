import { describe, expect, it } from "vitest";
import { needsProjectClearance } from "@/features/workstation/orchestrator/content-clearance";
import { planTrajectory } from "@/features/workstation/orchestrator/trajectory";

const area = { left: 24, top: 1000, width: 342, height: 800 };
const hull = [{ x: 50, y: 200 }, { x: 340, y: 200 }, { x: 340, y: 500 }, { x: 50, y: 500 }];
describe("stacked project reading space", () => {
  it.each([390, 754, 1024])("fits the real Work silhouette inside its own station at %ipx", width => {
    const slot = { id: "work", left: 24, top: 2000, width: width - 48, height: (width - 48) * .775 };
    const viewport = { width, height: 900, top: 72 }, extent = { width: 1.08, height: 1.15 };
    const target = planTrajectory([slot], slot.top + slot.height / 2 - (viewport.top + viewport.height) / 2, viewport, extent);
    expect(target.width * extent.height).toBeLessThanOrEqual(slot.height);
    expect(target.width * extent.width).toBeLessThanOrEqual(slot.width);
  });
  it("protects the full-width card and heading while the automatic notebook crosses them", () => {
    expect(needsProjectClearance(390, true, false, hull, area, 900)).toBe(true);
    expect(needsProjectClearance(768, true, false, hull, area, 900)).toBe(true);
  });
  it("keeps a side-by-side notebook, a held/thrown notebook and intentional presentations visible", () => {
    expect(needsProjectClearance(1024, true, false, hull, area, 900)).toBe(false);
    expect(needsProjectClearance(390, false, false, hull, area, 900)).toBe(false);
    expect(needsProjectClearance(390, true, true, hull, area, 900)).toBe(false);
  });
  it("restores the same scene when it reaches the reserved station after the carousel", () => {
    expect(needsProjectClearance(390, true, false, hull, area, 1800)).toBe(false);
    expect(needsProjectClearance(390, true, false, hull, area, 0)).toBe(false);
    expect(needsProjectClearance(390, true, false, [], area, 900)).toBe(false);
    expect(needsProjectClearance(390, true, false, hull, null, 900)).toBe(false);
  });
});
