import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { NotebookManipulation, releaseVelocity } from "@/features/workstation/physics/manipulation";
import { createViewportPhysics, initializePhysics } from "@/features/workstation/physics/viewport-physics";
import { planTrajectory, type Station } from "@/features/workstation/orchestrator/trajectory";

beforeAll(async () => { await initializePhysics(); });
afterEach(() => vi.unstubAllGlobals());
const pose = { x: 100, y: 100, width: 500, pitch: .08, yaw: -.14, roll: 0 };
describe("throw velocity from real pointer timestamps", () => {
  it("uses the last 150ms of motion even when release arrives a frame later", () => {
    expect(releaseVelocity([{ x: 0, y: 0, time: 10 }, { x: 20, y: -10, time: 100 }, { x: 40, y: -20, time: 180 }], 255)).toEqual({ x: 250, y: -125 });
  });
  it("caps extreme throws, ignores invalid samples and stops after a deliberate pause", () => {
    const samples = [{ x: 0, y: 0, time: 0 }, { x: NaN, y: 0, time: 30 }, { x: 900, y: 900, time: 40 }];
    const velocity = releaseVelocity(samples, 50);
    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(2200);
    expect(releaseVelocity(samples, 210)).toEqual({ x: 0, y: 0 });
    expect(releaseVelocity([{ x: 1, y: 2, time: 10 }], 11)).toEqual({ x: 0, y: 0 });
    expect(releaseVelocity([], 0)).toEqual({ x: 0, y: 0 });
  });
});
describe("real Rapier viewport world", () => {
  it("rebounds at virtual walls, stays bounded and eventually sleeps", () => {
    const physics = createViewportPhysics(1440, 900, 600, 900, 400);
    try {
      physics.release(1800, -400);
      let next = physics.step(1 / 60), bounced = false;
      for (let frame = 0; frame < 1800; frame++) {
        next = physics.step(1 / 60);
        expect(next.x).toBeGreaterThan(230); expect(next.x).toBeLessThan(1210);
        expect(next.y).toBeGreaterThan(260); expect(next.y).toBeLessThan(640);
        bounced ||= next.vx < -10;
        if (next.sleeping) break;
      }
      expect(bounced).toBe(true); expect(next.collisions).toBeGreaterThan(1); expect(next.sleeping).toBe(true);
      physics.hold(650, 400); const held = physics.step(1 / 60);
      expect(held.x).toBeCloseTo(650, 3); expect(held.y).toBeCloseTo(400, 3);
    } finally { physics.dispose(); }
  });
  it("respects elapsed time across 30/60/120Hz updates", () => {
    const results = [30, 60, 120].map((hz) => {
      const physics = createViewportPhysics(1440, 1000, 300, 500, 450);
      try { physics.release(200, 0); let next = physics.step(0); for (let i = 0; i < hz; i++) next = physics.step(1 / hz); return next; }
      finally { physics.dispose(); }
    });
    expect(results[0]!.x).toBeCloseTo(results[1]!.x, 3); expect(results[1]!.y).toBeCloseTo(results[2]!.y, 3);
  });
});
describe("manipulation lifetime", () => {
  it("cancels a pending lazy world on disposal without recreating it", async () => {
    vi.stubGlobal("innerWidth", 1440); vi.stubGlobal("innerHeight", 900);
    const control = new NotebookManipulation(); control.begin(250, 250, pose, 0); control.dispose();
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(control.physics).toBeNull(); expect(control.pose).toBeNull(); expect(control.mode).toBe("FOLLOW");
  });
  it("reduced motion releases without flight and following frees a prepared world", async () => {
    vi.stubGlobal("innerWidth", 1440); vi.stubGlobal("innerHeight", 900);
    const control = new NotebookManipulation(); control.begin(250, 250, pose, 0);
    try {
      await vi.waitFor(() => expect(control.physics).not.toBeNull());
      control.move(400, 220, 60); control.release(65, true);
      expect(control.mode).toBe("FREE"); expect(control.speed).toBe(0); expect(control.step(1 / 60)).toBe(false);
      control.follow(); expect(control.mode).toBe("FOLLOW"); expect(control.physics).toBeNull();
    } finally { control.dispose(); }
  });
});
describe("continuous page path", () => {
  const stations: Station[] = [
    { id: "hero", left: 700, top: 100, width: 700, height: 550 },
    { id: "work", left: 650, top: 1300, width: 750, height: 580 },
    { id: "about", left: 400, top: 2500, width: 800, height: 620 },
  ];
  it("has no target jump at station centers or chapter changes, in either direction", () => {
    const centers = stations.map((station) => station.top + station.height / 2 - 450);
    for (const boundary of [...centers, (centers[0]! + centers[1]!) / 2, (centers[1]! + centers[2]!) / 2]) {
      const a = planTrajectory(stations, boundary - .01, 1440, 900), b = planTrajectory(stations, boundary + .01, 1440, 900);
      for (const key of ["x", "y", "width", "pitch", "yaw", "roll"] as const) expect(Math.abs(a[key] - b[key])).toBeLessThan(.05);
    }
    for (let scroll = 0; scroll < 3300; scroll += 2) {
      const a = planTrajectory(stations, scroll, 1440, 900), b = planTrajectory(stations, scroll + 2, 1440, 900);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(8);
    }
  });
  it("arrives at actual anchors and does not mutate native scroll", () => {
    for (const station of stations) {
      const scroll = station.top + station.height / 2 - 450;
      const result = planTrajectory(stations, scroll, 1440, 900);
      expect(result.x).toBeCloseTo(station.left); expect(result.y).toBeCloseTo(station.top - scroll);
      expect(result.width).toBe(station.width); expect(result.chapter).toBe(station.id);
    }
  });
});
