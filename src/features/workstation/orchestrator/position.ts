import { DEFAULT_EXTENT, fitWidth, planTrajectory, type Extent, type FollowTarget, type Station, type Viewport } from "./trajectory";
import {
  createBody, releaseVelocity, restingOnFloor, rotate, stepAirborne, stepHeld, wrapAngle,
  type Body, type Bounds, type Contact, type Grip, type Vec,
} from "../physics/body";
import { ScrollInertia } from "../physics/scroll-inertia";
import { createHinge, hingeSettled, stepHinge, type Hinge } from "../physics/hinge";
import { setData } from "./dataset";
import { ImpactReaction } from "../physics/impact-reaction";

/** Model chassis width in scene units; pose widths are on-screen chassis pixels. */
export const CHASSIS_UNITS = 3.6;
export type Pose = { x: number; y: number; width: number; angle: number; pitch: number; yaw: number; roll: number };
export type BodyMode = "FOLLOW" | "HELD" | "AIRBORNE" | "STUNNED";
/** Last rendered silhouette in viewport pixels, with the pose it was rendered from. */
export type Hull = { points: Vec[]; x: number; y: number; angle: number; width: number };
export type ImpactKind = "floor" | "ceiling" | "wall" | "slam" | "throw" | "getup" | "lid" | "dizzy";
export type Impact = { kind: ImpactKind; speed: number; x: number; y: number };

/** Exact critically damped spring, stable across refresh rates and direction reversals. */
export function spring(current: number, target: number, velocity: number, dt: number, omega = 14) {
  const displacement = current - target, decay = Math.exp(-omega * dt);
  const coefficient = velocity + omega * displacement;
  return { value: target + (displacement + coefficient * dt) * decay, velocity: (velocity - omega * coefficient * dt) * decay };
}

/** Damped (possibly underdamped) spring step in place; returns true while still moving. */
function damp(state: { value: number; velocity: number }, target: number, dt: number, omega: number, zeta: number, external = 0, epsilon = .01) {
  let remaining = Math.min(dt, .05);
  while (remaining > 1e-6) {
    const h = Math.min(1 / 240, remaining); remaining -= h;
    state.velocity += (omega * omega * (target - state.value) - 2 * zeta * omega * state.velocity + external) * h;
    state.value += state.velocity * h;
  }
  if (Math.abs(state.value - target) < epsilon && Math.abs(state.velocity) < epsilon * 4 && Math.abs(external) < 1) { state.value = target; state.velocity = 0; return false; }
  return true;
}

/**
 * Single owner of the notebook's spatial state. The page path is followed exactly (no lag),
 * while disturbances — scroll inertia, impacts, getting up — live in a springy offset on top.
 */
export class MotionRig {
  body: Body = createBody();
  mode: BodyMode = "FOLLOW";
  hinge: Hinge = createHinge();
  target: FollowTarget = { x: 0, y: 0, width: 480, pitch: .1, yaw: 0, roll: 0, chapter: "hero" };
  current: Pose = { x: 0, y: 0, width: 480, angle: 0, pitch: .1, yaw: 0, roll: 0 };
  chapter = "hero";
  hull: Hull | null = null;
  extent: Extent = { ...DEFAULT_EXTENT };
  look: Vec | null = null;
  attention: Vec | null = null;
  keyboardView = false;
  paused = false;
  reduced = false;
  lidOverride: number | null = null;
  lidDragging = false;
  /** Next path update animates instead of carrying (keyboard view, explicit reset). */
  forceSpring = false;
  impacts = 0; slams = 0;
  stunnedUntil = 0;
  readonly reaction = new ImpactReaction();
  contactAt = 0;
  contactSpeed = 0;
  contactWall = "";
  /** All physical walls in the latest contacting frame; a corner must not hide its first wall. */
  contactPacket = "[]";
  /** Actual monotonic callback clock, separate from the RAF's physics timestamp. */
  contactDetectedAt = 0;
  reactionStartedAt = 0;
  reactionContactDetectedAt = 0;
  private lastContact = new Map<string, number>();
  viewport: Viewport = { width: 1440, height: 900, top: 0 };
  render?: (seconds: number) => boolean;
  onImpact: (impact: Impact) => void = () => {};
  /** Flying or carried: silhouette box and screen velocity, for page knocks. */
  onTravel: (box: { left: number; top: number; right: number; bottom: number }, velocity: Vec, time: number) => void = () => {};
  onChapter: (chapter: string) => void = () => {};
  wake: () => void = () => {};
  /** Recompute the page path without carrying (layout-like change, e.g. keyboard view). */
  refresh: () => void = () => {};
  readonly inertia = new ScrollInertia();

  width = { value: 480, velocity: 0 };
  readonly orientation = { pitch: { value: .1, velocity: 0 }, yaw: { value: 0, velocity: 0 }, roll: { value: 0, velocity: 0 } };
  private grip: Grip | null = null;
  private pivot: Vec = { x: 0, y: 0 };
  private pivotVelocity: Vec = { x: 0, y: 0 };
  private pivotAcceleration: Vec = { x: 0, y: 0 };
  private samples: { x: number; y: number; time: number }[] = [];
  private restSince = 0;
  private lastFrame = 0;

  get bounds(): Bounds {
    const { width, height, top } = this.viewport;
    return { left: 2, right: width - 2, top: top + 2, bottom: height - 6 };
  }

  /** Local silhouette (relative to the body centre at zero angle). */
  shape(): Vec[] {
    const hull = this.hull;
    if (hull && hull.points.length >= 3 && hull.width > 0) {
      const scale = this.width.value / hull.width;
      return hull.points.map((p) => { const local = rotate({ x: p.x - hull.x, y: p.y - hull.y }, -hull.angle); return { x: local.x * scale, y: local.y * scale }; });
    }
    const w = this.width.value * this.extent.width / 2, h = this.width.value * this.extent.height / 2;
    return [{ x: -w, y: -h }, { x: w, y: -h }, { x: w, y: h }, { x: -w, y: h }];
  }

  // ——— Gestures ———
  grab(x: number, y: number, time: number) {
    this.stunnedUntil = 0; this.reaction.clear(); this.lidOverride = null;
    // Equivalent pose, without carrying whole airborne turns into the grip constraint.
    this.body.angle = wrapAngle(this.body.angle);
    const local = rotate({ x: x - this.body.x, y: y - this.body.y }, -this.body.angle);
    const shape = this.shape(), height = Math.max(...shape.map((p) => p.y)) - Math.min(...shape.map((p) => p.y));
    this.grip = { anchor: local, hang: this.reduced ? 0 : height * .28 };
    this.mode = "HELD"; this.pivot = { x, y }; this.lastPivot = { x, y }; this.pivotVelocity = { x: 0, y: 0 }; this.pivotAcceleration = { x: 0, y: 0 };
    this.samples = [{ x, y, time }]; this.body.vx = this.body.vy = 0;
    this.wake();
  }
  drag(x: number, y: number, time: number) {
    if (this.mode !== "HELD") return;
    const bounds = this.bounds;
    this.pivot = { x: Math.max(bounds.left, Math.min(bounds.right, x)), y: Math.max(bounds.top, Math.min(bounds.bottom, y)) };
    this.samples.push({ x: this.pivot.x, y: this.pivot.y, time }); this.samples = this.samples.filter((point) => time - point.time <= 200);
    this.wake();
  }
  release(time: number) {
    if (this.mode !== "HELD") return;
    this.grip = null;
    if (this.reduced) { this.returnHome(false); return; }
    const velocity = releaseVelocity(this.samples, time);
    this.body.vx = velocity.x; this.body.vy = velocity.y;
    this.launch();
    if (Math.hypot(velocity.x, velocity.y) > 600) this.onImpact({ kind: "throw", speed: Math.hypot(velocity.x, velocity.y), x: this.body.x, y: this.body.y });
  }
  cancel() { if (this.mode === "HELD") { this.grip = null; this.returnHome(false); } }
  /** Let go in place: gravity does the rest. */
  drop() { if (this.reduced) return; this.grip = null; this.body.vx = 0; this.body.vy = 60; this.launch(); }
  hop() {
    if (this.reduced) return;
    if (this.mode === "FOLLOW") this.body.vy -= 1100; else { this.body.vy = -1300; this.launch(); }
    this.wake();
  }
  spin() { if (this.reduced) return; this.body.vy = -1500; this.body.spin = 9 * (Math.random() < .5 ? -1 : 1); this.launch(); }
  reset() { this.grip = null; this.keyboardView = false; this.lidOverride = null; this.reaction.clear(); this.returnHome(false); }
  kickLid(degreesPerSecond: number) { if (!this.reduced) { this.hinge.velocity += degreesPerSecond; this.wake(); } }

  private launch() { this.mode = "AIRBORNE"; this.reaction.launch(); this.lastContact.clear(); this.restSince = 0; this.wake(); }
  private returnHome(hop: boolean) {
    this.mode = "FOLLOW"; this.lidOverride = null; this.screenX = null; this.screenVelocity = 0;
    this.body.angle = wrapAngle(this.body.angle);
    if (hop) { this.body.vy = -320; this.onImpact({ kind: "getup", speed: 0, x: this.body.x, y: this.body.y }); }
    this.wake();
  }

  /** Abrupt scroll brake: the viewport stops, the notebook does not. */
  private slam(direction: 1 | -1, speed: number) {
    const bounds = this.bounds, { x, y } = this.body;
    // Only a notebook that is actually on screen can be knocked over.
    if (this.reduced || this.mode !== "FOLLOW" || x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return;
    this.body.vy = direction * Math.min(speed * (direction > 0 ? .5 : .45), 2600);
    this.body.spin = (Math.random() < .5 ? -1 : 1) * (2.2 + Math.min(speed, 6000) / 2400);
    this.slams++; this.launch();
    this.onImpact({ kind: "slam", speed, x: this.body.x, y: this.body.y });
  }

  // ——— Frame ———
  /** Advance one frame. Returns true while anything still needs frames. */
  step(time: number, scroll: number): boolean {
    const dt = this.lastFrame ? Math.min((time - this.lastFrame) / 1000, .05) : 1 / 60;
    this.lastFrame = time;
    const brake = this.inertia.sample(scroll, time, this.viewport.height);
    if (brake) this.slam(brake.direction, brake.speed);
    if (this.reduced && (this.mode === "AIRBORNE" || this.mode === "STUNNED")) this.returnHome(false);
    let moving = this.inertia.active;
    if (this.mode === "FOLLOW") moving = this.follow(dt) || moving;
    else if (this.mode === "HELD") moving = this.held(dt) || true;
    else if (this.mode === "AIRBORNE") moving = this.fly(dt, time) || true;
    else if (this.mode === "STUNNED") {
      // Keep resolving contacts during the brief physical settle, rather than freezing a pose.
      stepAirborne(this.body, this.shape(), this.bounds, dt);
      if (time >= this.stunnedUntil) { this.reaction.recover(time); this.returnHome(true); }
      moving = true;
    }
    if (this.reduced) this.reaction.clear();
    moving = this.reaction.step(time) || moving;
    moving = this.orient(dt, time) || moving;
    const target = this.lidOverride ?? this.hinge.target;
    const saved = this.hinge.target; this.hinge.target = target;
    const external = this.mode === "HELD" ? -this.pivotAcceleration.y * .05 : 0;
    const lidImpact = stepHinge(this.hinge, this.reduced ? 1 : dt, { external, stiff: this.lidDragging });
    if (this.reduced) { this.hinge.angle = target; this.hinge.velocity = 0; }
    this.hinge.target = saved;
    if (lidImpact > 45) this.onImpact({ kind: "lid", speed: lidImpact, x: this.body.x, y: this.body.y });
    moving ||= !hingeSettled({ ...this.hinge, target });
    Object.assign(this.current, { x: this.body.x, y: this.body.y, width: this.width.value, angle: this.body.angle,
      pitch: this.orientation.pitch.value, yaw: this.orientation.yaw.value, roll: this.orientation.roll.value });
    if (!moving) this.lastFrame = 0;
    return moving;
  }

  /**
   * Called when the page path changes. `carry` keeps the notebook attached to scrolled content:
   * only `next - reference` (the scroll-driven part) moves it directly; layout changes spring.
   */
  setTarget(next: FollowTarget, carry: boolean, initialize: boolean, reference: FollowTarget = this.target) {
    if (initialize) {
      Object.assign(this.body, createBody(next.x, next.y)); this.width = { value: next.width, velocity: 0 };
      this.orientation.pitch.value = next.pitch; this.orientation.yaw.value = next.yaw;
    } else if (carry && this.mode === "FOLLOW") {
      this.body.x += next.x - reference.x; this.body.y += next.y - reference.y;
      this.width.value += next.width - reference.width;
    }
    this.target = next;
    if (next.chapter !== this.chapter) { this.chapter = next.chapter; this.onChapter(next.chapter); }
  }

  private follow(dt: number) {
    const target = this.target, body = this.body;
    if (this.reduced) {
      Object.assign(body, { x: target.x, y: target.y, angle: 0, vx: 0, vy: 0, spin: 0 });
      this.width = { value: target.width, velocity: 0 };
      return false;
    }
    // Viewport acceleration acts as a gentle pseudo-force: it floats on take-off, settles on landing.
    const pseudo = Math.max(-4000, Math.min(4000, -this.inertia.acceleration * .09));
    const x = { value: body.x, velocity: body.vx }, y = { value: body.y, velocity: body.vy };
    const recovering = this.reaction.stage === "RECOVERING";
    let moving = damp(x, target.x, dt, recovering ? 12 : 9, recovering ? .88 : .62, 0, .2);
    moving = damp(y, target.y, dt, recovering ? 12 : 9, recovering ? .85 : .55, pseudo, .2) || moving;
    body.x = x.value; body.vx = x.velocity; body.y = y.value; body.vy = y.velocity;
    // Sideways acceleration on screen (path + offset) sways it like something carried.
    const screenVelocity = this.screenX === null ? 0 : (body.x - this.screenX) / Math.max(dt, 1e-3);
    const blend = 1 - Math.exp(-dt / .06), previous = this.screenVelocity;
    this.screenVelocity += (screenVelocity - this.screenVelocity) * blend; this.screenX = body.x;
    const sway = Math.max(-.2, Math.min(.2, -(this.screenVelocity - previous) / Math.max(dt, 1e-3) * .00011));
    moving ||= Math.abs(this.screenVelocity) > 3;
    const angle = { value: wrapAngle(body.angle), velocity: body.spin };
    moving = damp(angle, sway, dt, 7, .5, 0, .0005) || moving;
    body.angle = angle.value; body.spin = angle.velocity;
    moving = damp(this.width, target.width, dt, 10, 1, 0, .1) || moving;
    return moving;
  }

  private held(dt: number) {
    const grip = this.grip; if (!grip) return false;
    const previous = this.pivotVelocity;
    const instant = this.samples.length > 1 ? {
      x: (this.pivot.x - this.lastPivot.x) / Math.max(dt, 1e-3),
      y: (this.pivot.y - this.lastPivot.y) / Math.max(dt, 1e-3),
    } : { x: 0, y: 0 };
    const blend = 1 - Math.exp(-dt / .035);
    this.pivotVelocity = { x: previous.x + (instant.x - previous.x) * blend, y: previous.y + (instant.y - previous.y) * blend };
    const accel = { x: (this.pivotVelocity.x - previous.x) / Math.max(dt, 1e-3), y: (this.pivotVelocity.y - previous.y) / Math.max(dt, 1e-3) };
    this.pivotAcceleration = { x: Math.max(-25000, Math.min(25000, accel.x)), y: Math.max(-25000, Math.min(25000, accel.y)) };
    this.lastPivot = { ...this.pivot };
    if (this.reduced) { const r = rotate({ x: -grip.anchor.x, y: -grip.anchor.y }, this.body.angle); this.body.x = this.pivot.x + r.x; this.body.y = this.pivot.y + r.y; return false; }
    stepHeld(this.body, this.pivot, this.pivotAcceleration, grip, this.shape(), dt);
    return true;
  }
  private lastPivot: Vec = { x: 0, y: 0 };
  private screenX: number | null = null;
  private screenVelocity = 0;

  private fly(dt: number, time: number) {
    const contacts: Contact[] = stepAirborne(this.body, this.shape(), this.bounds, dt);
    if (contacts.length) this.contactPacket = JSON.stringify(contacts.map(({ wall, speed }) => ({ wall, speed: +speed.toFixed(2), time })));
    for (const contact of contacts) {
      if (contact.speed < 140) continue;
      // Multiple hull vertices/substeps and settling bounces are one audible/visual event.
      if (time - (this.lastContact.get(contact.wall) ?? -Infinity) < 120) continue;
      this.lastContact.set(contact.wall, time);
      this.impacts++; this.contactAt = time; this.contactSpeed = contact.speed; this.contactWall = contact.wall;
      this.contactDetectedAt = performance.now();
      const kind: ImpactKind = contact.wall === "floor" ? "floor" : contact.wall === "ceiling" ? "ceiling" : "wall";
      this.onImpact({ kind, speed: contact.speed, x: contact.x, y: contact.y });
      if (!this.reduced && this.reaction.contact(contact, time)) {
        this.reactionContactDetectedAt = this.contactDetectedAt;
        this.reactionStartedAt = performance.now();
        // A short physical torque; no instantaneous angle change and no artificial position kick.
        const direction = Math.sign(contact.x - this.body.x) || (contact.wall === "left" ? 1 : -1);
        this.body.spin += direction * (.35 + this.reaction.strength * .85);
        this.hinge.velocity -= 90 + this.reaction.strength * 190;
        this.onImpact({ kind: "dizzy", speed: contact.speed, x: contact.x, y: contact.y });
      }
      if (contact.wall === "floor" || contact.wall === "ceiling") {
        // Inertia flaps the lid. Its target remains the user's choice, even after a hard impact.
        this.hinge.velocity -= Math.min(contact.speed, 3000) * .1;
      }
    }
    if (restingOnFloor(this.body, this.shape(), this.bounds)) {
      if (!this.restSince) this.restSince = time;
      if (time - this.restSince > 90) {
        this.mode = "STUNNED";
        this.stunnedUntil = time + 80;
      }
    } else this.restSince = 0;
    return true;
  }

  private orient(dt: number, time: number) {
    const target = this.target, look = this.attention ?? this.look;
    const { width, height } = this.viewport;
    const following = this.mode === "FOLLOW" && !this.reduced;
    const lookYaw = following && look ? Math.max(-1, Math.min(1, (look.x - this.body.x) / (width * .5))) * (this.attention ? .32 : .18) : 0;
    const lookPitch = following && look ? Math.max(-1, Math.min(1, (look.y - this.body.y) / (height * .6))) * (this.attention ? .16 : .09) : 0;
    const pitch = target.pitch + lookPitch + (this.keyboardView ? .42 : 0), yaw = target.yaw + lookYaw;
    if (this.reduced) {
      this.orientation.pitch.value = pitch; this.orientation.yaw.value = yaw; this.orientation.roll.value = 0;
      return false;
    }
    let moving = damp(this.orientation.pitch, pitch, dt, 8, .8, 0, .0004);
    moving = damp(this.orientation.yaw, yaw, dt, 8, .8, 0, .0004) || moving;
    moving = damp(this.orientation.roll, target.roll + this.reaction.wobble(time), dt, 16, .7, 0, .0004) || moving;
    return moving;
  }
}

export const createMotionRig = () => new MotionRig();

/**
 * Scroll/resize feed and the one RAF for spring, physics, projection and render.
 * No scroll mutation, wheel interception, React frame state, or independent R3F RAF.
 */
export function installWorkstationPosition(host: HTMLElement, anchor: HTMLElement, rig: MotionRig) {
  let pending = 0, dirty = true, layoutDirty = true, carry = false, initialized = false, lastScroll = scrollY;
  let travel: { x: number; y: number; time: number } | null = null;
  let stations: Station[] = [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const stages = [anchor, ...document.querySelectorAll<HTMLElement>("[data-workstation-section-anchor]")];
  // Everything that must stay reachable above the notebook: the sticky header and, in the lab, its bar.
  const ceilings = [document.getElementById("top"), ...document.querySelectorAll<HTMLElement>("[data-workstation-ceiling]")];
  rig.reduced = reduced.matches;
  function viewport(): Viewport {
    const top = Math.max(0, ...ceilings.map((node) => node?.getBoundingClientRect().bottom ?? 0));
    return { width: host.clientWidth || innerWidth, height: host.clientHeight || innerHeight, top };
  }
  function sample() {
    dirty = false;
    const next = viewport(), resized = next.width !== rig.viewport.width || next.height !== rig.viewport.height;
    rig.viewport = next;
    if (layoutDirty || resized) {
      stations = stages.map((node) => { const rect = node.getBoundingClientRect(); return { id: node.dataset.workstationSectionAnchor ?? "hero", left: rect.left, top: rect.top + scrollY, width: rect.width, height: rect.height }; }).filter((rect) => rect.width > 0);
    }
    const jump = Math.abs(scrollY - lastScroll) > next.height * 2.5, relaid = layoutDirty || resized;
    const plan = (scroll: number) => {
      const planned = planTrajectory(stations, scroll, next, rig.extent);
      return rig.keyboardView ? { ...planned, width: fitWidth(planned.width * 1.12, next, rig.extent) } : planned;
    };
    // After a layout change, compare against the old scroll under the NEW layout: the scroll part
    // is carried with the content, the layout part springs.
    rig.setTarget(plan(scrollY), carry && !jump && !rig.forceSpring, !initialized, relaid ? plan(lastScroll) : rig.target);
    rig.forceSpring = false;
    layoutDirty = false; carry = true; initialized = true; lastScroll = scrollY;
  }
  function paint(time: number) {
    pending = 0;
    if (document.hidden || rig.paused) { rig.inertia.reset(); return; }
    if (dirty) sample();
    const moving = rig.step(time, scrollY);
    const pose = rig.current;
    const strength = rig.reaction.strength.toFixed(3);
    if (host.style.getPropertyValue("--impact-strength") !== strength) host.style.setProperty("--impact-strength", strength);
    if ((rig.mode === "AIRBORNE" || rig.mode === "HELD") && rig.hull) {
      const dt = travel ? Math.max(.001, (time - travel.time) / 1000) : 0;
      const velocity = travel && dt ? { x: (pose.x - travel.x) / dt, y: (pose.y - travel.y) / dt } : { x: 0, y: 0 };
      const xs = rig.hull.points.map((p) => p.x), ys = rig.hull.points.map((p) => p.y);
      rig.onTravel({ left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) }, velocity, time);
      travel = { x: pose.x, y: pose.y, time };
    } else travel = null;
    setData(host, {
      positioned: "true", chapter: rig.chapter, body: rig.mode, impacts: String(rig.impacts), slams: String(rig.slams),
      scrollVelocity: rig.inertia.velocity.toFixed(0),
      reaction: rig.reaction.stage === "IMPACT" || rig.reaction.stage === "DIZZY" ? "dizzy" : "",
      reactionStage: rig.reaction.stage, reactionCount: String(rig.reaction.count),
      contactAt: String(rig.contactAt), contactWall: rig.contactWall, contactSpeed: rig.contactSpeed.toFixed(2),
      contactPacket: rig.contactPacket, reactionWall: rig.reaction.wall,
      contactDetectedAt: rig.contactDetectedAt.toFixed(3), reactionStartedAt: rig.reactionStartedAt.toFixed(3),
      reactionContactAt: String(rig.reaction.contactAt), reactionAt: String(rig.reaction.startedAt),
      reactionContactDetectedAt: rig.reactionContactDetectedAt.toFixed(3),
      reactionStrength: rig.reaction.strength.toFixed(3),
      trajectory: [time, pose.x, pose.y, pose.width, pose.angle, pose.pitch, pose.yaw, scrollY].map((n) => +n.toFixed(3)).join(","),
    });
    const needsRender = rig.render?.(time / 1000) ?? false;
    setData(host, { motion: moving || needsRender ? "moving" : "settled", motionDriver: moving ? "rig" : needsRender ? "scene" : "idle" });
    if (moving || needsRender) pending = requestAnimationFrame(paint);
  }
  const wake = () => { if (!pending && !document.hidden) pending = requestAnimationFrame(paint); };
  const schedule = () => { dirty = true; wake(); };
  const relayout = () => { layoutDirty = true; schedule(); };
  rig.wake = wake; rig.refresh = () => { rig.forceSpring = true; relayout(); };
  const look = (event: PointerEvent) => { if (event.pointerType === "mouse") { rig.look = { x: event.clientX, y: event.clientY }; wake(); } };
  const away = () => { rig.look = null; wake(); };
  // Anchor navigation scrolls on purpose; arriving there is not a brake.
  const navigate = (event: MouseEvent) => { if ((event.target as Element | null)?.closest?.('a[href*="#"]')) rig.inertia.suppress(performance.now(), 2200); };
  const motionPreference = () => { rig.reduced = reduced.matches; if (rig.reduced) rig.reset(); schedule(); };
  const visibility = () => { if (document.hidden) rig.cancel(); schedule(); };
  const resize = new ResizeObserver(relayout); stages.forEach((node) => resize.observe(node)); resize.observe(host);
  const story = document.querySelector("[data-workstation-story]"); if (story) resize.observe(story);
  window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", relayout, { passive: true });
  window.addEventListener("pointermove", look, { passive: true }); document.documentElement.addEventListener("pointerleave", away);
  document.addEventListener("click", navigate, true);
  document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", motionPreference);
  schedule();
  return () => {
    rig.wake = () => {}; rig.refresh = () => {}; cancelAnimationFrame(pending); resize.disconnect();
    window.removeEventListener("scroll", schedule); window.removeEventListener("resize", relayout);
    window.removeEventListener("pointermove", look); document.documentElement.removeEventListener("pointerleave", away);
    document.removeEventListener("click", navigate, true);
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", motionPreference);
  };
}
