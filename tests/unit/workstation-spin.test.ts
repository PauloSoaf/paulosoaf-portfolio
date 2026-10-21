import { describe, expect, it } from "vitest";
import { SpinIntent } from "@/features/workstation/physics/spin-intent";
import { AIR, createBody, stepAirborne, stepHeld } from "@/features/workstation/physics/body";
import { MotionRig } from "@/features/workstation/orchestrator/position";

describe("circular pointer momentum", () => {
  it.each([1, -1])("recognises a consistent circle in direction %s", (sign) => {
    const intent = new SpinIntent(); intent.begin({ x: 500, y: 400 }, { x: 620, y: 400, time: 0 });
    for (let i = 1; i <= 60; i++) { const a = sign * i / 60 * Math.PI * 3; intent.sample({ x: 500 + 120 * Math.cos(a), y: 400 + 120 * Math.sin(a), time: i * 16 }); }
    expect(intent.active).toBe(true); expect(intent.velocityAt(960) * sign).toBeGreaterThan(5);
    expect(Math.abs(intent.velocityAt(960))).toBeLessThanOrEqual(AIR.maxSpin);
    expect(Math.abs(intent.velocityAt(1500))).toBeLessThan(.5);
  });
  it("rejects a linear pull, corners, jitter and invalid or stale samples", () => {
    const intent = new SpinIntent(); intent.begin({ x: 0, y: 0 }, { x: 50, y: 80, time: 0 });
    for (let i = 1; i < 40; i++) intent.sample({ x: 50 + i * 8, y: 80 + i * 2, time: i * 16 });
    expect(intent.active).toBe(false);
    intent.sample({ x: NaN, y: 0, time: 700 }); intent.sample({ x: 0, y: 0, time: -1 });
    expect(intent.velocityAt(700)).toBe(0);
    intent.begin({ x: 0, y: 0 }, { x: 1, y: 0, time: 0 });
    for (let i = 1; i < 100; i++) intent.sample({ x: Math.sin(i), y: Math.cos(i), time: i * 16 });
    expect(intent.active).toBe(false);
  });
  it("uses existing free-flight drag to dissipate rotation, without positional discontinuities", () => {
    const body = createBody(1000, 1000); body.spin = 11;
    const shape = [{ x: -50, y: -30 }, { x: 50, y: -30 }, { x: 50, y: 30 }, { x: -50, y: 30 }];
    let previous = body.spin;
    for (let i = 0; i < 120; i++) {
      stepAirborne(body, shape, { left: -10000, right: 10000, top: -10000, bottom: 10000 }, 1 / 60, 0);
      expect(body.spin).toBeLessThan(previous); previous = body.spin;
      expect(body.x).toBe(1000); expect(body.y).toBe(1000);
    }
    expect(body.angle).toBeGreaterThan(Math.PI * 2); expect(body.spin).toBeLessThan(4);
  });
  it("recognises coalesced circular samples but does not classify a single sharp corner as spin", () => {
    const intent = new SpinIntent(); intent.begin({ x: 0, y: 0 }, { x: 120, y: 0, time: 0 });
    for (let i = 1; i <= 16; i++) { const a = i * .9; intent.sample({ x: 120 * Math.cos(a), y: 120 * Math.sin(a), time: i * 125 }); }
    expect(intent.active).toBe(true); expect(intent.velocityAt(2000)).toBeGreaterThan(5);
    intent.begin({ x: 0, y: 0 }, { x: 80, y: 80, time: 0 });
    for (let i = 1; i <= 10; i++) intent.sample({ x: 80 + i * 10, y: 80, time: i * 16 });
    for (let i = 1; i <= 10; i++) intent.sample({ x: 180, y: 80 + i * 10, time: 160 + i * 16 });
    expect(intent.active).toBe(false);
  });
  it("keeps driven rotation in real elapsed time at 60Hz and at sparse 8Hz frames", () => {
    const angles = [60, 8].map((hz) => {
      const body = createBody();
      for (let i = 0; i < hz * 2; i++) stepHeld(body, { x: 0, y: 0 }, { x: 0, y: 0 }, { anchor: { x: 0, y: 0 }, hang: 0, spinDrive: 8 }, [{ x: -50, y: -30 }, { x: 50, y: 30 }], 1 / hz);
      return body.angle;
    });
    expect(angles[0]).toBeGreaterThan(14); expect(angles[1]).toBeCloseTo(angles[0]!, 6);
  });
});

describe("spin through the actual motion rig", () => {
  function rig() {
    const rig = new MotionRig(); rig.viewport = { width: 1600, height: 1000, top: 80 };
    rig.setTarget({ x: 800, y: 470, width: 320, pitch: .1, yaw: 0, roll: 0, chapter: "hero" }, false, true);
    return rig;
  }
  it("winds past a full turn, releases with angular momentum and is caught again without snapping", () => {
    const value = rig(); value.grab(920, 470, 100); let previous = value.body.angle;
    for (let i = 1; i <= 100; i++) {
      const a = i / 100 * Math.PI * 4, time = 100 + i * 16;
      value.drag(800 + 120 * Math.cos(a), 470 + 120 * Math.sin(a), time); value.step(time, 0);
      expect(Math.abs(value.body.angle - previous)).toBeLessThan(.25); previous = value.body.angle;
    }
    expect(value.spinIntent.active).toBe(true); expect(value.spinGestures).toBe(1);
    expect(Math.abs(value.body.angle)).toBeGreaterThan(Math.PI * 2);
    value.release(1700); expect(Math.abs(value.body.spin)).toBeGreaterThan(4); expect(value.mode).toBe("AIRBORNE");
    const angle = value.body.angle, x = value.body.x, y = value.body.y;
    value.grab(x + 20, y, 1720);
    expect(Math.atan2(Math.sin(value.body.angle - angle), Math.cos(value.body.angle - angle))).toBeCloseTo(0, 8);
    expect(value.body.x).toBe(x); expect(value.body.y).toBe(y); expect(value.body.spin).toBe(0);
    expect(value.spinIntent.active).toBe(false);
  });
  it("preserves a linear drag and the reduced-motion opt out", () => {
    for (const reduced of [false, true]) {
      const value = rig(); value.reduced = reduced; value.grab(850, 500, 100);
      for (let i = 1; i <= 30; i++) { value.drag(850 + i * 5, 500 - i * 2, 100 + i * 16); value.step(100 + i * 16, 0); }
      expect(value.spinIntent.active).toBe(false); expect(value.spinGestures).toBe(0);
      expect(value.body.x).toBeGreaterThan(880); value.release(580);
      expect(value.mode).toBe(reduced ? "FOLLOW" : "AIRBORNE");
    }
  });
});
