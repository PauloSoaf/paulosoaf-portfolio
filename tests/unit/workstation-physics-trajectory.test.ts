import { describe, expect, it } from "vitest";
import { createBody, releaseVelocity, restingOnFloor, rotate, stepAirborne, stepHeld, wrapAngle, type Bounds } from "@/features/workstation/physics/body";
import { ScrollInertia, SCROLL_FAST } from "@/features/workstation/physics/scroll-inertia";
import { createHinge, LID_MAX, stepHinge } from "@/features/workstation/physics/hinge";
import { clampX, fitWidth, planTrajectory, viewportMargin, type Station, type Viewport } from "@/features/workstation/orchestrator/trajectory";
import { MotionRig } from "@/features/workstation/orchestrator/position";
import { convexHull, expandHull } from "@/features/workstation/scene/hull";

const box = (w: number, h: number) => [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }];
const bounds: Bounds = { left: 0, right: 1440, top: 80, bottom: 900 };
const desktop: Viewport = { width: 1440, height: 900, top: 72 };

describe("throw velocity from real pointer timestamps", () => {
  it("uses the last 150ms of motion even when release arrives a frame later", () => {
    expect(releaseVelocity([{ x: 0, y: 0, time: 10 }, { x: 20, y: -10, time: 100 }, { x: 40, y: -20, time: 180 }], 255)).toEqual({ x: 250, y: -125 });
  });
  it("caps extreme throws, ignores invalid samples and stops after a deliberate pause", () => {
    const samples = [{ x: 0, y: 0, time: 0 }, { x: NaN, y: 0, time: 30 }, { x: 900, y: 900, time: 40 }];
    expect(Math.hypot(...Object.values(releaseVelocity(samples, 50)) as [number, number])).toBeCloseTo(2600);
    expect(releaseVelocity(samples, 210)).toEqual({ x: 0, y: 0 });
    expect(releaseVelocity([{ x: 1, y: 2, time: 10 }], 11)).toEqual({ x: 0, y: 0 });
    expect(releaseVelocity([], 0)).toEqual({ x: 0, y: 0 });
  });
});

describe("planar rigid body against the viewport", () => {
  it("bounces off walls, stays inside, loses energy and comes to rest on the floor", () => {
    const body = createBody(700, 400), shape = box(500, 420);
    body.vx = 2200; body.vy = -900;
    let floorHits = 0, previousPeak = Infinity, rested = false;
    for (let frame = 0; frame < 60 * 8; frame++) {
      const contacts = stepAirborne(body, shape, bounds, 1 / 60);
      for (const contact of contacts) {
        if (contact.wall === "floor" && contact.speed > 140) { floorHits++; expect(contact.speed).toBeLessThanOrEqual(previousPeak + 1); previousPeak = contact.speed; }
      }
      for (const local of shape) {
        const r = rotate(local, body.angle);
        expect(body.x + r.x).toBeGreaterThan(bounds.left - 12); expect(body.x + r.x).toBeLessThan(bounds.right + 12);
        expect(body.y + r.y).toBeLessThan(bounds.bottom + 12);
      }
      if (restingOnFloor(body, shape, bounds)) { rested = true; break; }
    }
    expect(floorHits).toBeGreaterThan(0); expect(rested).toBe(true);
  });
  it("tips over when it lands on a corner", () => {
    const body = createBody(700, 300); body.angle = .45; const shape = box(500, 300);
    for (let frame = 0; frame < 40; frame++) stepAirborne(body, shape, bounds, 1 / 60);
    expect(Math.abs(body.spin) + Math.abs(body.angle - .45)).toBeGreaterThan(.05);
  });
  it("produces the same flight at 30/60/120Hz", () => {
    const results = [30, 60, 120].map((hz) => {
      const body = createBody(400, 300); body.vx = 600;
      for (let i = 0; i < hz / 2; i++) stepAirborne(body, box(200, 160), { left: -1e5, right: 1e5, top: -1e5, bottom: 1e5 }, 1 / hz);
      return body;
    });
    expect(results[0]!.x).toBeCloseTo(results[2]!.x, 0); expect(results[1]!.y).toBeCloseTo(results[2]!.y, 0);
  });
  it("recovers from non-finite input without throwing", () => {
    const body = createBody(700, 300); body.vx = NaN;
    stepAirborne(body, box(100, 100), bounds, 1 / 60);
    expect(Object.values(body).every(Number.isFinite)).toBe(true);
  });
  it("wraps tumbles so the notebook stands up the short way", () => {
    expect(wrapAngle(Math.PI * 4 + .2)).toBeCloseTo(.2); expect(wrapAngle(-Math.PI * 3 + .1)).toBeCloseTo(-Math.PI + .1);
  });
});

describe("carried notebook swings like a pendulum", () => {
  it("hangs level from a centred grip and sways when shaken sideways", () => {
    const body = createBody(500, 400), shape = box(500, 420), grip = { anchor: { x: 0, y: 0 }, hang: 120 };
    for (let i = 0; i < 60; i++) stepHeld(body, { x: 500, y: 400 }, { x: 0, y: 0 }, grip, shape, 1 / 60);
    expect(Math.abs(body.angle)).toBeLessThan(1e-6);
    const angles: number[] = [];
    for (let i = 0; i < 120; i++) { stepHeld(body, { x: 500, y: 400 }, { x: i < 10 ? 15000 : 0, y: 0 }, grip, shape, 1 / 60); angles.push(body.angle); }
    expect(Math.max(...angles)).toBeGreaterThan(.05); expect(Math.min(...angles)).toBeLessThan(0);
    expect(angles.every((angle) => Math.abs(angle) <= 1.2)).toBe(true);
  });
  it("an off-centre grip tilts it, and the body follows the pivot", () => {
    const body = createBody(500, 400), shape = box(500, 420), grip = { anchor: { x: 200, y: -100 }, hang: 120 };
    for (let i = 0; i < 240; i++) stepHeld(body, { x: 700, y: 300 }, { x: 0, y: 0 }, grip, shape, 1 / 60);
    expect(Math.abs(body.angle)).toBeGreaterThan(.2);
    const r = rotate(grip.anchor, body.angle);
    expect(body.x + r.x).toBeCloseTo(700, 6); expect(body.y + r.y).toBeCloseTo(300, 6);
  });
});

describe("scroll brake detector", () => {
  const run = (inertia: ScrollInertia, velocities: [number, number][]) => {
    let y = 0, time = 0, brakes = 0;
    inertia.sample(y, time);
    for (const [ms, velocity] of velocities) for (let t = 0; t < ms; t += 16) { time += 16; y += velocity * .016; if (inertia.sample(y, time)) brakes++; }
    return brakes;
  };
  it("knocks over on a sustained fast scroll that stops abruptly — once", () => {
    const inertia = new ScrollInertia();
    expect(run(inertia, [[300, 4800], [400, 0]])).toBe(1);
    expect(run(inertia, [[300, 4800], [400, 0]])).toBe(0); // cooldown
  });
  it("reports the direction of the brake", () => {
    const inertia = new ScrollInertia(); let brake = null as ReturnType<ScrollInertia["sample"]>;
    let y = 10000, time = 0; inertia.sample(y, time);
    for (let t = 0; t < 300; t += 16) { time += 16; y -= 4800 * .016; inertia.sample(y, time); }
    for (let t = 0; t < 300 && !brake; t += 16) { time += 16; brake = inertia.sample(y, time); }
    expect(brake?.direction).toBe(-1); expect(brake!.speed).toBeGreaterThan(SCROLL_FAST);
  });
  it("ignores reading, keyboard paging, momentum decay and teleports", () => {
    expect(run(new ScrollInertia(), [[2000, 900], [300, 0]])).toBe(0);
    expect(run(new ScrollInertia(), [[64, 5200], [400, 0]])).toBe(0);
    const decay: [number, number][] = Array.from({ length: 60 }, (_, i) => [16, 4800 * Math.exp(-i * .05)]);
    expect(run(new ScrollInertia(), [[300, 4800], ...decay])).toBe(0);
    const inertia = new ScrollInertia(); inertia.sample(0, 0); expect(inertia.sample(9000, 16, 900)).toBeNull(); expect(inertia.velocity).toBe(0);
  });
  it("is suppressed during programmatic navigation", () => {
    const inertia = new ScrollInertia(); inertia.suppress(0, 2000);
    expect(run(inertia, [[300, 4800], [400, 0]])).toBe(0);
  });
});

describe("lid hinge", () => {
  it("opening overshoots a little but never past the stop; closing thunks at zero", () => {
    const hinge = createHinge(0); hinge.target = 108; let peak = 0;
    for (let i = 0; i < 120; i++) { stepHinge(hinge, 1 / 60); peak = Math.max(peak, hinge.angle); }
    expect(peak).toBeGreaterThan(108); expect(peak).toBeLessThanOrEqual(LID_MAX); expect(hinge.angle).toBeCloseTo(108, 1);
    hinge.target = 0; let impact = 0, low = Infinity;
    for (let i = 0; i < 120; i++) { impact = Math.max(impact, stepHinge(hinge, 1 / 60)); low = Math.min(low, hinge.angle); }
    expect(impact).toBeGreaterThan(100); expect(low).toBeGreaterThanOrEqual(0);
  });
  it("tracks a dragged lid tightly without overshoot", () => {
    const hinge = createHinge(108); hinge.target = 60; let low = Infinity;
    for (let i = 0; i < 60; i++) { stepHinge(hinge, 1 / 60, { stiff: true }); low = Math.min(low, hinge.angle); }
    expect(low).toBeGreaterThan(59); expect(hinge.angle).toBeCloseTo(60, 1);
  });
});

describe("motion rig", () => {
  const rig = () => {
    const value = new MotionRig(); value.viewport = desktop;
    value.setTarget({ x: 900, y: 480, width: 520, pitch: .1, yaw: 0, roll: 0, chapter: "hero" }, false, true);
    return value;
  };
  it("stays attached to scrolled content: path deltas are carried, not chased", () => {
    const value = rig();
    value.setTarget({ x: 900, y: 380, width: 520, pitch: .1, yaw: 0, roll: 0, chapter: "hero" }, true, false);
    expect(value.body.y).toBe(380);
  });
  it("a fast scroll brake knocks it over, it lands, gets dizzy and goes home", () => {
    const value = rig(), kinds: string[] = [];
    value.onImpact = (impact) => kinds.push(impact.kind);
    let time = 0, scroll = 0; value.step(time, scroll);
    for (let t = 0; t < 300; t += 16) { time += 16; scroll += 5000 * .016; value.setTarget({ ...value.target }, true, false); value.step(time, scroll); }
    for (let i = 0; i < 60 * 8 && value.mode !== "STUNNED"; i++) { time += 16; value.step(time, scroll); }
    expect(value.slams).toBe(1); expect(kinds).toContain("slam"); expect(kinds).toContain("floor"); expect(value.mode).toBe("STUNNED");
    for (let i = 0; i < 60 * 3 && value.mode !== "FOLLOW"; i++) { time += 16; value.step(time, scroll); }
    expect(value.mode).toBe("FOLLOW"); expect(kinds).toContain("getup");
  });
  it("settles to zero frames after reading-speed scroll (no endless RAF)", () => {
    const value = rig(); let time = 0, scroll = 0; value.step(time, scroll);
    for (let t = 0; t < 600; t += 16) { time += 16; scroll += 900 * .016; value.setTarget({ ...value.target, y: 480 - scroll * .2 }, true, false); value.step(time, scroll); }
    let frames = 0;
    while (frames < 60 * 6) { time += 16; frames++; if (!value.step(time, scroll)) break; }
    expect(frames).toBeLessThan(60 * 6); expect(value.inertia.velocity).toBe(0); expect(value.inertia.acceleration).toBe(0);
  });
  it("reduced motion follows directly and never falls", () => {
    const value = rig(); value.reduced = true;
    let time = 0, scroll = 0; value.step(time, scroll);
    for (let t = 0; t < 300; t += 16) { time += 16; scroll += 5000 * .016; value.step(time, scroll); }
    for (let i = 0; i < 30; i++) { time += 16; value.step(time, scroll); }
    value.drop(); value.hop();
    expect(value.slams).toBe(0); expect(value.mode).toBe("FOLLOW");
    value.grab(900, 480, time); value.drag(1000, 500, time + 16); value.release(time + 32);
    expect(value.mode).toBe("FOLLOW");
  });
  it("a throw flies with gravity and returns to the page by itself", () => {
    const value = rig(); let time = 0; value.step(time, 0);
    value.grab(1000, 500, time);
    for (let i = 1; i <= 8; i++) { time += 16; value.drag(1000 - i * 40, 500 - i * 20, time); value.step(time, 0); }
    value.release(time); expect(value.mode).toBe("AIRBORNE");
    for (let i = 0; i < 60 * 12 && value.mode !== "FOLLOW"; i++) { time += 16; value.step(time, 0); }
    expect(value.mode).toBe("FOLLOW");
  });
});

describe("responsive page path", () => {
  const stations: Station[] = [
    { id: "hero", left: 760, top: 180, width: 780, height: 600 },
    { id: "work", left: 700, top: 1500, width: 800, height: 620 },
    { id: "about", left: 340, top: 2900, width: 760, height: 590 },
  ];
  it("has no target jump at station centres or chapter changes, in either direction", () => {
    const centre = (station: Station) => station.top + station.height / 2;
    const middle = desktop.top + (desktop.height - desktop.top) / 2;
    for (const boundary of stations.map((station) => centre(station) - middle)) {
      const a = planTrajectory(stations, boundary - .01, desktop), b = planTrajectory(stations, boundary + .01, desktop);
      for (const key of ["x", "y", "width", "pitch", "yaw"] as const) expect(Math.abs(a[key] - b[key])).toBeLessThan(.05);
    }
    for (let scroll = 0; scroll < 3300; scroll += 2) {
      const a = planTrajectory(stations, scroll, desktop), b = planTrajectory(stations, scroll + 2, desktop);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(14);
    }
  });
  it("arrives at its slots and fits horizontally inside every viewport", () => {
    for (const viewport of [desktop, { width: 1280, height: 720, top: 72 }, { width: 1024, height: 768, top: 64 }, { width: 768, height: 1024, top: 64 }, { width: 390, height: 844, top: 64 }, { width: 1366, height: 600, top: 72 }]) {
      for (let scroll = 0; scroll < 3600; scroll += 37) {
        const pose = planTrajectory(stations, scroll, viewport), half = pose.width * 1.08 / 2, margin = viewportMargin(viewport);
        expect(pose.x - half).toBeGreaterThanOrEqual(margin - .5); expect(pose.x + half).toBeLessThanOrEqual(viewport.width - margin + .5);
        expect(pose.width).toBeLessThanOrEqual((viewport.height - viewport.top - margin * 2) / 1 + .5);
      }
    }
    const middle = desktop.top + (desktop.height - desktop.top) / 2, work = stations[1]!;
    const arrived = planTrajectory(stations, work.top + work.height / 2 - middle, desktop);
    expect(arrived.chapter).toBe("work"); expect(arrived.y).toBeCloseTo(middle); expect(arrived.width).toBeCloseTo(work.width * .74);
  });
  it("holds a side-slot hero above the fold on short desktops, but not in-flow mobile slots", () => {
    const short = { width: 1366, height: 600, top: 72 }, pose = planTrajectory([{ ...stations[0]!, top: 300 }, stations[1]!], 0, short);
    expect(pose.y + pose.width / 2).toBeLessThanOrEqual(600);
    const mobile = { width: 390, height: 844, top: 64 }, inFlow = planTrajectory([{ id: "hero", left: 0, top: 780, width: 390, height: 340 }, stations[1]!], 0, mobile);
    expect(inFlow.y).toBeCloseTo(780 + 170);
  });
  it("fits and clamps degenerate sizes without NaN", () => {
    expect(fitWidth(2000, { width: 320, height: 300, top: 60 })).toBeGreaterThan(0);
    expect(clampX(-500, 300, desktop)).toBeGreaterThan(0);
    expect(Number.isFinite(planTrajectory([], 0, desktop).x)).toBe(true);
  });
});

describe("silhouette hull", () => {
  it("keeps only the outer points and pads them outward", () => {
    const hull = convexHull([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 5, y: 5 }, { x: NaN, y: 1 }]);
    expect(hull).toHaveLength(4);
    const padded = expandHull(hull, 2);
    expect(Math.min(...padded.map((p) => p.x))).toBeLessThan(0); expect(Math.max(...padded.map((p) => p.y))).toBeGreaterThan(10);
  });
});
