import { describe, expect, it } from "vitest";
import { presentationTarget } from "@/features/workstation/orchestrator/presentation";
import { MotionRig } from "@/features/workstation/orchestrator/position";
import { siteFrame } from "@/features/workstation/screen/site-framing";
import { workstationSites } from "@/features/workstation/sites";

const base = { x: 1000, y: 480, width: 520, pitch: .1, yaw: -.2, roll: 0, chapter: "work" };
const viewport = { width: 1440, height: 900, top: 74 };
describe("contextual presentation", () => {
  it("keeps context exact at zero and gives the real display a front-facing reading pose", () => {
    expect(presentationTarget(base, viewport, "preview", 0)).toBe(base);
    const target = presentationTarget(base, viewport, "preview", 1);
    expect(target.width).toBeGreaterThan(base.width); expect(target.yaw).toBe(0);
    expect(.5 + target.pitch + (90 - 108) * Math.PI / 180).toBeCloseTo(0, 8);
    expect(target.chapter).toBe("work");
    expect(presentationTarget(base, viewport, "code", 1).pitch).toBeGreaterThan(target.pitch + .2);
  });
  it.each([390, 768, 1440])("fits reading inside %spx without changing the page layout", (width) => {
    const view = { ...viewport, width }, target = presentationTarget({ ...base, x: width * .75 }, view, "preview", 1);
    expect(target.x - target.width * 1.08 / 2).toBeGreaterThanOrEqual(0);
    expect(target.x + target.width * 1.08 / 2).toBeLessThanOrEqual(width);
    expect(target.y - target.width * 1.02 / 2).toBeGreaterThanOrEqual(view.top);
    expect(target.y + target.width * 1.02 / 2).toBeLessThanOrEqual(view.height);
  });
  it("enters and exits continuously, preserves the section target, and eventually needs no frames", () => {
    const rig = new MotionRig(); rig.viewport = viewport; rig.setTarget(base, false, true); rig.present("preview");
    let time = 16, previous = { ...rig.body }, maxStep = 0;
    for (; time < 2400; time += 16) { rig.step(time, 0); maxStep = Math.max(maxStep, Math.hypot(rig.body.x - previous.x, rig.body.y - previous.y)); previous = { ...rig.body }; }
    expect(rig.presentationAmount).toBe(1); expect(rig.current.width).toBeGreaterThan(580); expect(rig.target).toBe(base);
    rig.present("context"); let moving = true;
    for (; time < 8000 && moving; time += 16) { moving = rig.step(time, 0); maxStep = Math.max(maxStep, Math.hypot(rig.body.x - previous.x, rig.body.y - previous.y)); previous = { ...rig.body }; }
    expect(moving).toBe(false); expect(rig.presentationAmount).toBe(0); expect(rig.current.width).toBeCloseTo(base.width, 0);
    expect(maxStep).toBeLessThan(40);
  });
  it("lets a new grab override framing and has an immediate reduced-motion version", () => {
    const rig = new MotionRig(); rig.viewport = viewport; rig.setTarget(base, false, true); rig.reduced = true;
    rig.present("preview"); expect(rig.step(16, 0)).toBe(false); expect(rig.presentationAmount).toBe(1);
    const position = { x: rig.body.x, y: rig.body.y }; rig.grab(position.x + 20, position.y, 32);
    expect(rig.presentationSuppressed).toBe(true); expect(rig.body.x).toBe(position.x); expect(rig.body.y).toBe(position.y);
    rig.step(48, 0); expect(rig.presentationAmount).toBe(0); expect(rig.spinIntent.active).toBe(false);
  });
});

describe("real-site logical framing", () => {
  it.each(["nutriopus", "deborah"] as const)("uniformly fits %s without offsets, clipping or coordinate proxies", (id) => {
    const site = workstationSites[id], frame = siteFrame(800, 458.5366, site.preferredWidth, true);
    expect(frame.width).toBe(site.preferredWidth); expect(frame.width * frame.scale).toBeCloseTo(800, 8);
    expect(frame.height * frame.scale).toBeCloseTo(458.5366, 8);
    expect(frame.width / frame.height).toBeCloseTo(800 / 458.5366, 8);
  });
  it("uses native responsive layout in the explicit 2D fallback", () => {
    expect(siteFrame(374, 700, 1200, false)).toEqual({ width: 374, height: 700, scale: 1 });
    expect(siteFrame(1400, 800, 1024, true)).toEqual({ width: 1400, height: 800, scale: 1 });
  });
});
