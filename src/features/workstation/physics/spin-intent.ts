import { AIR, wrapAngle, type Vec } from "./body";

type Sample = Vec & { time: number };
/** Pointer curvature distinguishes a circular wind-up from an ordinary off-centre drag.
 * Coordinates and clocks are native viewport pixels/ms. No timer or frame loop is owned here.
 */
export class SpinIntent {
  active = false;
  turn = 0;
  private velocity = 0;
  private distance = 0;
  private coherentSamples = 0;
  private last: Sample | null = null;
  private direction: Vec | null = null;
  private centre: Vec = { x: 0, y: 0 };

  begin(centre: Vec, pointer: Sample) { this.clear(); this.centre = { ...centre }; this.last = pointer; }
  clear() { this.active = false; this.turn = this.velocity = this.distance = this.coherentSamples = 0; this.last = this.direction = null; }
  sample(point: Sample) {
    const last = this.last;
    if (!Number.isFinite(point.x + point.y + point.time) || !last || point.time <= last.time) return;
    const dt = (point.time - last.time) / 1000;
    if (dt > .75) { this.direction = null; this.velocity = this.turn = this.coherentSamples = 0; this.last = point; return; }
    const delta = { x: point.x - last.x, y: point.y - last.y }, length = Math.hypot(delta.x, delta.y);
    if (length < 2) return;
    const radius = { x: last.x - this.centre.x, y: last.y - this.centre.y }, r = Math.hypot(radius.x, radius.y);
    const tangent = Math.abs(radius.x * delta.y - radius.y * delta.x) / Math.max(1, r * length);
    const previous = this.direction;
    const curve = previous ? Math.atan2(previous.x * delta.y - previous.y * delta.x, previous.x * delta.x + previous.y * delta.y) : 0;
    const nextRadius = Math.hypot(point.x - this.centre.x, point.y - this.centre.y);
    const radial = wrapAngle(Math.atan2(point.y - this.centre.y, point.x - this.centre.x) - Math.atan2(radius.y, radius.x));
    // Reject a corner/zigzag, tiny jitter, linear pulls and an implausibly large single sample.
    // Coalesced/sparse samples can turn more than .8rad. Require several consistent arcs,
    // agreement with the radial turn and a reasonably stable radius instead of a tiny angle cap.
    const coherent = Math.abs(curve) < 1.5 && Math.abs(curve) > .008 && r >= 14 && tangent > .45
      && Math.sign(curve) === Math.sign(radial) && Math.abs(wrapAngle(curve - radial)) < .6
      && Math.abs(nextRadius - r) < Math.max(20, r * .45);
    if (coherent) {
      if (this.turn && Math.sign(curve) !== Math.sign(this.turn)) { this.turn = 0; this.coherentSamples = 0; }
      this.coherentSamples++; this.turn = this.turn * Math.exp(-dt / 2) + curve;
      this.distance += length;
      if (this.coherentSamples >= 3 && Math.abs(this.turn) > .7 && this.distance > 45) this.active = true;
      const target = Math.max(-AIR.maxSpin, Math.min(AIR.maxSpin, (curve * .7 + radial * .3) / dt * 1.15));
      this.velocity += (target - this.velocity) * (1 - Math.exp(-dt / .065));
    } else { this.coherentSamples = 0; this.turn *= Math.exp(-dt / .12); this.velocity *= Math.exp(-dt / .12); }
    this.direction = delta; this.last = point;
  }
  /** Pausing the pointer before release removes the wind-up, instead of replaying stale energy. */
  velocityAt(time: number) { return this.active && this.last ? this.velocity * Math.exp(-Math.max(0, time - this.last.time - 40) / 150) : 0; }
}
