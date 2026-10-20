/** Lid hinge in degrees: an underdamped spring with hard stops, so opening overshoots and closing thunks. */
export type Hinge = { angle: number; velocity: number; target: number };
export const LID_OPEN = 108, LID_MAX = 132;
const STEP = 1 / 240;

export const createHinge = (angle = LID_OPEN): Hinge => ({ angle, velocity: 0, target: angle });

/**
 * `external` is an angular acceleration (deg/s²) from the body's own motion: impacts and
 * shaking make the lid flap. Returns the speed of a closing impact against the base, if any.
 */
export function stepHinge(hinge: Hinge, dt: number, { external = 0, stiff = false } = {}): number {
  if (!(dt > 0)) return 0;
  const omega = stiff ? 22 : 12, zeta = stiff ? .9 : .48;
  let remaining = Math.min(dt, .05), impact = 0;
  while (remaining > 1e-6) {
    const h = Math.min(STEP, remaining); remaining -= h;
    hinge.velocity += (omega * omega * (hinge.target - hinge.angle) - 2 * zeta * omega * hinge.velocity + external) * h;
    hinge.angle += hinge.velocity * h;
    if (hinge.angle < 0) { impact = Math.max(impact, -hinge.velocity); hinge.angle = 0; hinge.velocity = -hinge.velocity * .28; }
    if (hinge.angle > LID_MAX) { hinge.angle = LID_MAX; hinge.velocity = -hinge.velocity * .3; }
  }
  if (!Number.isFinite(hinge.angle + hinge.velocity)) { hinge.angle = hinge.target; hinge.velocity = 0; }
  return impact;
}

export const hingeSettled = (hinge: Hinge) => Math.abs(hinge.angle - hinge.target) < .05 && Math.abs(hinge.velocity) < .5;
