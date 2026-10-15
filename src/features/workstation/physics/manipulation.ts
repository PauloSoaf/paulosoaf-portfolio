import type { Pose } from "../orchestrator/position";
import type { ViewportPhysics } from "./viewport-physics";
type Sample = { x: number; y: number; time: number };
export function releaseVelocity(samples: readonly Sample[], now: number) {
  const valid = samples.filter((point) => point.time <= now && Number.isFinite(point.x + point.y + point.time));
  const last = valid.at(-1), first = last && valid.find((point) => point.time >= last.time - 150);
  if (!first || !last || last.time <= first.time || now - last.time > 150) return { x: 0, y: 0 };
  const dt = (last.time - first.time) / 1000, x = (last.x - first.x) / dt, y = (last.y - first.y) / dt;
  const scale = Math.min(1, 2200 / (Math.hypot(x, y) || 1)); return { x: x * scale, y: y * scale };
}

export class NotebookManipulation {
  mode: "FOLLOW" | "DRAG" | "FLYING" | "FREE" = "FOLLOW";
  pose: Pose | null = null;
  collisions = 0; speed = 0; unavailable = false;
  physics: ViewportPhysics | null = null;
  wake = () => {};
  private samples: Sample[] = [];
  private offset = { x: 0, y: 0 };
  private generation = 0;
  private released = { x: 0, y: 0 };
  private loading: Promise<void> | null = null;
  begin(x: number, y: number, pose: Pose, time: number, reduced = false) {
    this.pose = { ...pose }; this.mode = "DRAG"; this.offset = { x: x - pose.x, y: y - pose.y };
    this.samples = [{ x, y, time }]; this.speed = 0;
    this.physics?.hold(pose.x + pose.width / 2, pose.y + pose.width * .3875);
    if (!reduced) this.prepare(); this.wake();
  }
  private prepare() {
    if (this.physics || this.loading || this.unavailable) return;
    const generation = this.generation;
    this.loading = import("./viewport-physics").then(async (module) => {
      await module.initializePhysics(); if (generation !== this.generation || !this.pose) return;
      this.physics = module.createViewportPhysics(innerWidth, innerHeight, this.pose.width, this.pose.x + this.pose.width / 2, this.pose.y + this.pose.width * .3875);
      if (this.mode === "FLYING") this.physics.release(this.released.x, this.released.y);
      this.wake();
    }).catch(() => { this.unavailable = true; if (this.mode === "FLYING") this.mode = "FREE"; this.wake(); }).finally(() => { this.loading = null; if (this.mode !== "FOLLOW" && !this.physics && !this.unavailable) this.prepare(); });
  }
  move(x: number, y: number, time: number) {
    if (this.mode !== "DRAG" || !this.pose) return;
    const marginX = this.pose.width * .405, marginY = this.pose.width * .335;
    const cx = Math.max(marginX, Math.min(innerWidth - marginX, x - this.offset.x + this.pose.width / 2));
    const cy = Math.max(70 + marginY, Math.min(innerHeight - 70 - marginY, y - this.offset.y + this.pose.width * .3875));
    this.pose.x = cx - this.pose.width / 2; this.pose.y = cy - this.pose.width * .3875;
    this.physics?.hold(cx, cy);
    this.samples.push({ x, y, time }); this.samples = this.samples.filter((point) => time - point.time <= 180);
    this.wake();
  }
  release(time: number, reduced: boolean) {
    if (this.mode !== "DRAG") return;
    this.released = reduced ? { x: 0, y: 0 } : releaseVelocity(this.samples, time);
    this.speed = Math.hypot(this.released.x, this.released.y);
    this.mode = this.speed > 100 && !this.unavailable ? "FLYING" : "FREE";
    if (this.mode === "FLYING") this.physics?.release(this.released.x, this.released.y);
    this.wake();
  }
  step(dt: number) {
    if (this.mode !== "FLYING" || !this.pose) return false;
    if (!this.physics) return !this.unavailable;
    const next = this.physics.step(dt);
    this.pose.x = next.x - this.pose.width / 2; this.pose.y = next.y - this.pose.width * .3875;
    this.speed = Math.hypot(next.vx, next.vy); this.collisions = next.collisions;
    if (next.sleeping) this.mode = "FREE";
    return this.mode === "FLYING";
  }
  cancel() { if (this.mode === "DRAG" || this.mode === "FLYING") this.mode = "FREE"; this.speed = 0; this.wake(); }
  follow() { this.generation++; this.physics?.dispose(); this.physics = null; this.mode = "FOLLOW"; this.pose = null; this.speed = 0; this.collisions = 0; this.wake(); }
  dispose() { this.generation++; this.physics?.dispose(); this.physics = null; this.mode = "FOLLOW"; this.pose = null; this.wake = () => {}; }
}
