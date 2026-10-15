import { describe, expect, it } from "vitest";
import { canRotateFromHit, identifyHitTarget } from "@/features/workstation/models/hit-targets";

describe("notebook gesture boundaries", () => {
  it.each(["chassis", "lid"])("allows rotation from the %s", (hitTarget) => {
    const object = { userData: { hitTarget } };
    expect(identifyHitTarget({ object, distance: .2 })).toBe(hitTarget);
    expect(canRotateFromHit(object)).toBe(true);
  });

  it.each(["keyboard", "trackpad", "screen"])("preserves %s input even when the event handler belongs to the chassis", (hitTarget) => {
    const hit = {
      object: { userData: { hitTarget }, parent: { userData: { hitTarget: "chassis" } } },
      eventObject: { userData: { hitTarget: "chassis" } },
      userData: { hitTarget: "chassis" },
    };
    expect(identifyHitTarget(hit)).toBe(hitTarget);
    expect(canRotateFromHit(hit)).toBe(false);
  });

  it("does not turn unclassified child meshes into drag handles by walking their parents", () => {
    expect(canRotateFromHit({ userData: {}, parent: { userData: { hitTarget: "lid" } } })).toBe(false);
    expect(canRotateFromHit({ object: null, userData: { hitTarget: "chassis" } })).toBe(false);
  });

  it.each([undefined, null, 1, true, "unknown", {}, { userData: null }, { userData: { hitTarget: "LID" } }])("rejects malformed targets: %j", (hit) => {
    expect(identifyHitTarget(hit)).toBeNull();
    expect(canRotateFromHit(hit)).toBe(false);
  });

  it("fails closed for event cycles and unknown mesh names", () => {
    const cyclic: { object?: unknown } = {};
    cyclic.object = cyclic;
    expect(canRotateFromHit(cyclic)).toBe(false);
    expect(canRotateFromHit({ name: "chassis", userData: {} })).toBe(false);
  });

  it("accepts the same exact identifiers for explicit HTML manipulation controls", () => {
    expect(canRotateFromHit("chassis")).toBe(true);
    expect(canRotateFromHit("lid")).toBe(true);
    expect(canRotateFromHit("screen")).toBe(false);
  });
});
