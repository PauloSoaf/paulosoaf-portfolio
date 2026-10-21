import { describe, expect, it } from "vitest";
import { ImpactReaction } from "@/features/workstation/physics/impact-reaction";
import { MotionRig } from "@/features/workstation/orchestrator/position";
import type { Contact } from "@/features/workstation/physics/body";

const contact = (speed: number, wall: Contact["wall"] = "floor"): Contact => ({ wall, speed, x: 500, y: 890 });
function rig() {
  const rig = new MotionRig();
  rig.viewport = { width: 1440, height: 900, top: 80 };
  rig.setTarget({ x: 700, y: 430, width: 280, pitch: .1, yaw: 0, roll: 0, chapter: "hero" }, false, true);
  return rig;
}

describe("contact-driven impact choreography", () => {
  it("distinguishes light contact, proportionate dizzy and violent impact energy", () => {
    const light = new ImpactReaction(), medium = new ImpactReaction(), hard = new ImpactReaction();
    expect(light.contact(contact(450), 10)).toBe(false); expect(light.stage).toBe("IDLE");
    expect(medium.contact(contact(1100), 100)).toBe(true); expect(hard.contact(contact(3000), 100)).toBe(true);
    expect(medium.until - 100).toBeGreaterThanOrEqual(400);
    expect(hard.until - 100).toBeLessThanOrEqual(900);
    expect(hard.strength).toBeGreaterThan(medium.strength);
    expect(hard.until).toBeGreaterThan(medium.until);
  });
  it("does not restart after microcollisions, even once the visual envelope has ended", () => {
    const reaction = new ImpactReaction(); reaction.contact(contact(2200), 100);
    for (let time = 116; time < 2200; time += 16) { reaction.step(time); reaction.contact(contact(1200), time); }
    expect(reaction.count).toBe(1); expect(reaction.startedAt).toBe(100); expect(reaction.stage).toBe("IDLE");
    reaction.launch(); expect(reaction.contact(contact(1600), 2300)).toBe(true); expect(reaction.count).toBe(2);
  });
  it.each(["floor", "ceiling", "left", "right"] as const)("reacts on the actual %s contact while still airborne, in the same frame", (wall) => {
    const value = rig(); value.drop();
    value.body.x = wall === "left" ? 160 : wall === "right" ? 1280 : 700;
    value.body.y = wall === "ceiling" ? 245 : wall === "floor" ? 725 : 430;
    value.body.vx = wall === "left" ? -2000 : wall === "right" ? 2000 : 0;
    value.body.vy = wall === "ceiling" ? -2000 : wall === "floor" ? 2000 : 0;
    let observed = false;
    value.onImpact = (impact) => {
      if (impact.kind !== "dizzy") return;
      observed = true;
      expect(value.mode).toBe("AIRBORNE");
      expect(value.reaction.stage).toBe("IMPACT");
      expect(value.reaction.wall).toBe(wall);
      expect(value.reaction.startedAt).toBe(value.contactAt);
      expect(value.reactionStartedAt - value.reactionContactDetectedAt).toBeLessThan(100);
      expect(Math.hypot(value.body.vx, value.body.vy) + Math.abs(value.body.spin)).toBeGreaterThan(70);
    };
    for (let i = 1; i < 60 && !observed; i++) value.step(i * 16, 0);
    expect(observed).toBe(true);
  });
  it("recovers continuously, permits a new grab and honours an explicitly closed lid", () => {
    const value = rig(); value.hinge.target = 0; value.drop();
    let time = 16, previous = { ...value.body }, sawRecovery = false, maxRecoveryStep = 0;
    for (; time < 18000; time += 16) {
      value.step(time, 0);
      if (value.reaction.stage === "RECOVERING") {
        sawRecovery = true;
        maxRecoveryStep = Math.max(maxRecoveryStep, Math.hypot(value.body.x - previous.x, value.body.y - previous.y));
        expect(value.lidOverride).toBeNull();
        expect(value.hinge.target).toBe(0);
        if (time - value.reaction.recoveryAt > 150) break;
      }
      previous = { ...value.body };
    }
    expect(sawRecovery).toBe(true); expect(maxRecoveryStep).toBeLessThan(60);
    const before = { ...value.body }; value.grab(value.body.x + 20, value.body.y, time);
    expect(value.mode).toBe("HELD"); expect(value.reaction.stage).toBe("IDLE");
    expect(value.body.x).toBe(before.x); expect(value.body.y).toBe(before.y);
    value.release(time + 200);
    let moving = true;
    for (; time < 40000 && moving; time += 16) moving = value.step(time, 0);
    expect(moving).toBe(false); expect(value.reaction.stage).toBe("IDLE");
  });
  it("motion preference changed during flight clears effects and can return to idle", () => {
    const value = rig(); value.drop(); value.body.vy = 2000; value.body.y = 725;
    value.step(16, 0); expect(value.reaction.count).toBe(1);
    value.reduced = true; value.step(32, 0);
    expect(value.mode).toBe("FOLLOW");
    expect(value.step(48, 0)).toBe(false); expect(value.reaction.stage).toBe("IDLE");
  });
  it.each([2.8, Math.PI * 4 + .2])("grabbing a tumbled pose %s keeps angular continuity", (angle) => {
    const value = rig(); value.body.angle = angle;
    value.grab(value.body.x + 30, value.body.y + 15, 100);
    value.step(116, 0);
    const delta = Math.atan2(Math.sin(value.body.angle - angle), Math.cos(value.body.angle - angle));
    expect(Math.abs(delta)).toBeLessThanOrEqual(14 / 60 + .001);
  });
  it("records both physical walls and their timestamp when one frame hits a corner", () => {
    const value = rig(); value.drop(); Object.assign(value.body, { x: 100, y: 210, vx: -1800, vy: -1800 });
    value.step(16, 0);
    const packet = JSON.parse(value.contactPacket) as { wall: string; speed: number; time: number }[];
    expect(packet.map((event) => event.wall)).toEqual(expect.arrayContaining(["ceiling", "left"]));
    expect(packet.every((event) => event.time === 16 && event.speed > 0)).toBe(true);
  });
});
