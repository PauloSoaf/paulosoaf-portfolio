/**
 * Planar rigid body for the notebook silhouette, in viewport pixels (y down, clockwise angle).
 * One convex body against the four viewport walls needs no WASM engine: impulses with
 * restitution/friction, a fixed substep and explicit sleeping keep it deterministic and testable.
 */
export type Vec = { x: number; y: number };
export type Body = { x: number; y: number; angle: number; vx: number; vy: number; spin: number };
export type Bounds = { left: number; right: number; top: number; bottom: number };
export type Wall = "floor" | "ceiling" | "left" | "right";
export type Contact = { wall: Wall; speed: number; x: number; y: number };

export const AIR = {
  gravity: 2800, restitution: .38, wallRestitution: .5, friction: .45,
  linearDrag: .16, angularDrag: .55, maxSpin: 14, maxSpeed: 4200,
} as const;
const STEP = 1 / 240;
const normals: Record<Wall, Vec> = { floor: { x: 0, y: -1 }, ceiling: { x: 0, y: 1 }, left: { x: 1, y: 0 }, right: { x: -1, y: 0 } };

export const createBody = (x = 0, y = 0): Body => ({ x, y, angle: 0, vx: 0, vy: 0, spin: 0 });
export const rotate = (point: Vec, angle: number): Vec => {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
};
/** Wrap to (-π, π] so a body that tumbled several turns stands up the short way. */
export const wrapAngle = (angle: number) => angle - 2 * Math.PI * Math.round(angle / (2 * Math.PI));
const finite = (body: Body) => [body.x, body.y, body.angle, body.vx, body.vy, body.spin].every(Number.isFinite);

/** Unit-mass inertia of the shape's bounding rectangle: conservative and stable for any hull. */
export function inertiaOf(shape: readonly Vec[]) {
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (const p of shape) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  const width = maxX - minX, height = maxY - minY;
  return Math.max(1, (width * width + height * height) / 12);
}

function wallDepth(wall: Wall, point: Vec, bounds: Bounds) {
  if (wall === "floor") return point.y - bounds.bottom;
  if (wall === "ceiling") return bounds.top - point.y;
  if (wall === "left") return bounds.left - point.x;
  return point.x - bounds.right;
}

/**
 * Resolve every approaching hull vertex sequentially (Gauss-Seidel). Position is corrected only
 * for approaching contacts and at most a few pixels per substep, so a silhouette that starts
 * partly outside the viewport glides back in instead of teleporting.
 */
function collide(body: Body, shape: readonly Vec[], bounds: Bounds, inertia: number, contacts: Contact[]) {
  for (const wall of ["floor", "ceiling", "left", "right"] as const) {
    const n = normals[wall], restitution = wall === "floor" || wall === "ceiling" ? AIR.restitution : AIR.wallRestitution;
    let push = 0, fastest = 0, at: Vec | null = null;
    for (const local of shape) {
      const r = rotate(local, body.angle), point = { x: body.x + r.x, y: body.y + r.y };
      const depth = wallDepth(wall, point, bounds);
      if (depth <= 0) continue;
      const vx = body.vx - body.spin * r.y, vy = body.vy + body.spin * r.x;
      const vn = vx * n.x + vy * n.y;
      if (vn >= 0) continue;
      push = Math.max(push, depth);
      // Slow contacts stop instead of micro-bouncing forever.
      const e = -vn < 60 ? 0 : restitution;
      const rn = r.x * n.y - r.y * n.x;
      const j = -(1 + e) * vn / (1 + rn * rn / inertia);
      body.vx += j * n.x; body.vy += j * n.y; body.spin += rn * j / inertia;
      const t = { x: -n.y, y: n.x };
      const vx2 = body.vx - body.spin * r.y, vy2 = body.vy + body.spin * r.x;
      const vt = vx2 * t.x + vy2 * t.y, rt = r.x * t.y - r.y * t.x;
      const jt = Math.max(-AIR.friction * j, Math.min(AIR.friction * j, -vt / (1 + rt * rt / inertia)));
      body.vx += jt * t.x; body.vy += jt * t.y; body.spin += rt * jt / inertia;
      if (-vn > fastest) { fastest = -vn; at = point; }
    }
    if (push > 0) { const step = Math.min(push, 6); body.x += n.x * step; body.y += n.y * step; }
    if (at && fastest > 1) contacts.push({ wall, speed: fastest, x: at.x, y: at.y });
  }
}

/** Free flight with gravity. Returns the strongest contacts of this frame (one per wall). */
export function stepAirborne(body: Body, shape: readonly Vec[], bounds: Bounds, dt: number, gravity: number = AIR.gravity): Contact[] {
  const contacts: Contact[] = [];
  if (!shape.length || !(dt > 0)) return contacts;
  const inertia = inertiaOf(shape);
  let remaining = Math.min(dt, .05);
  while (remaining > 1e-6) {
    const h = Math.min(STEP, remaining); remaining -= h;
    body.vy += gravity * h;
    const drag = Math.exp(-AIR.linearDrag * h), angular = Math.exp(-AIR.angularDrag * h);
    body.vx *= drag; body.vy *= drag; body.spin *= angular;
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > AIR.maxSpeed) { body.vx *= AIR.maxSpeed / speed; body.vy *= AIR.maxSpeed / speed; }
    body.spin = Math.max(-AIR.maxSpin, Math.min(AIR.maxSpin, body.spin));
    body.x += body.vx * h; body.y += body.vy * h; body.angle += body.spin * h;
    collide(body, shape, bounds, inertia, contacts);
  }
  if (!finite(body)) Object.assign(body, createBody((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2));
  const strongest = new Map<Wall, Contact>();
  for (const contact of contacts) if ((strongest.get(contact.wall)?.speed ?? 0) < contact.speed) strongest.set(contact.wall, contact);
  return [...strongest.values()];
}

/** True when the body is in contact with the floor and practically still. */
export function restingOnFloor(body: Body, shape: readonly Vec[], bounds: Bounds) {
  if (Math.hypot(body.vx, body.vy) > 70 || Math.abs(body.spin) > .9) return false;
  return shape.some((local) => { const r = rotate(local, body.angle); return body.y + r.y >= bounds.bottom - 1.5; });
}

export type Grip = { anchor: Vec; hang: number };
/**
 * Carried by the pointer: a damped pendulum about the grab point. `hang` lowers the virtual
 * centre of mass so even a centred grip sways when shaken; off-centre grips tilt naturally.
 */
export function stepHeld(body: Body, pivot: Vec, pivotAcceleration: Vec, grip: Grip, shape: readonly Vec[], dt: number, gravity = 6000) {
  if (!(dt > 0)) return;
  const inertia = inertiaOf(shape);
  let remaining = Math.min(dt, .05);
  while (remaining > 1e-6) {
    const h = Math.min(STEP, remaining); remaining -= h;
    const d = rotate({ x: -grip.anchor.x, y: -grip.anchor.y + grip.hang }, body.angle);
    const torque = d.x * (gravity - pivotAcceleration.y) + d.y * pivotAcceleration.x;
    body.spin += (torque / (inertia + d.x * d.x + d.y * d.y) - 2.2 * body.spin) * h;
    body.spin = Math.max(-AIR.maxSpin, Math.min(AIR.maxSpin, body.spin));
    body.angle = Math.max(-1.2, Math.min(1.2, body.angle + body.spin * h));
    if (Math.abs(body.angle) === 1.2) body.spin = 0;
  }
  const r = rotate({ x: -grip.anchor.x, y: -grip.anchor.y }, body.angle);
  body.x = pivot.x + r.x; body.y = pivot.y + r.y;
  if (!finite(body)) { body.angle = 0; body.spin = 0; body.x = pivot.x; body.y = pivot.y; }
}

type Sample = { x: number; y: number; time: number };
/** Release velocity from real pointer timestamps of the last 150ms; a pause before release stops the throw. */
export function releaseVelocity(samples: readonly Sample[], now: number) {
  const valid = samples.filter((point) => point.time <= now && Number.isFinite(point.x + point.y + point.time));
  const last = valid.at(-1), first = last && valid.find((point) => point.time >= last.time - 150);
  if (!first || !last || last.time <= first.time || now - last.time > 150) return { x: 0, y: 0 };
  const dt = (last.time - first.time) / 1000, x = (last.x - first.x) / dt, y = (last.y - first.y) / dt;
  const scale = Math.min(1, 2600 / (Math.hypot(x, y) || 1)); return { x: x * scale, y: y * scale };
}
