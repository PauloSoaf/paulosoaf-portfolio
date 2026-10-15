import { planTrajectory, type Station } from "./trajectory";
import { NotebookManipulation } from "../physics/manipulation";
/** One logical viewport: CSS scales WebGL and DOM together, without camera resize races. */
export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 620;
export type Pose = { x: number; y: number; width: number; pitch: number; yaw: number; roll: number };
export type MotionRig = {
  current: Pose; target: Pose; velocity: Pose; chapter: string;
  wake: () => void; render?: (seconds: number) => boolean;
  paused: boolean; locked: boolean;
  manipulation: NotebookManipulation;
};
const zero = (): Pose => ({ x: 0, y: 0, width: 0, pitch: 0, yaw: 0, roll: 0 });
export const createMotionRig = (): MotionRig => ({ current: zero(), target: zero(), velocity: zero(), chapter: "hero", wake: () => {}, paused: false, locked: false, manipulation: new NotebookManipulation() });

/** Exact critically damped spring, stable across refresh rates and direction reversals. */
export function spring(current: number, target: number, velocity: number, dt: number, omega = 14) {
  const displacement = current - target, decay = Math.exp(-omega * dt);
  const coefficient = velocity + omega * displacement;
  return { value: target + (displacement + coefficient * dt) * decay, velocity: (velocity - omega * coefficient * dt) * decay };
}

/** Section-owned stages and an outboard transit lane protect the editorial content.
 * No scroll mutation, wheel interception, React frame state, or independent R3F RAF. */
export function installWorkstationPosition(portal: HTMLElement, anchor: HTMLElement, rig: MotionRig) {
  let pending = 0, previous = 0, dirty = true, layoutDirty = true, initialized = false;
  let stations: Station[] = [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const stages = [anchor, ...document.querySelectorAll<HTMLElement>("[data-workstation-section-anchor]")];
  const scene = portal.querySelector<HTMLElement>(".workstation-scene")!;
  function sample() {
    dirty = false;
    if (layoutDirty) {
      layoutDirty = false;
      stations = stages.map((node) => { const rect = node.getBoundingClientRect(); return { id: node.dataset.workstationSectionAnchor ?? "hero", left: rect.left, top: rect.top + scrollY, width: rect.width, height: rect.height }; }).filter((rect) => rect.width > 0);
    }
    const planned = planTrajectory(stations, scrollY, innerWidth, innerHeight);
    rig.chapter = planned.chapter;
    rig.target = { x: planned.x, y: planned.y, width: planned.width, pitch: planned.pitch, yaw: planned.yaw, roll: planned.roll };
  }
  function paint(time: number) {
    pending = 0;
    if (document.hidden || rig.paused) { previous = 0; return; }
    if (dirty) sample();
    const dt = previous ? Math.min((time - previous) / 1000, .05) : 1 / 60;
    previous = time;
    let moving = false;
    const before = { ...rig.current };
    const manual = rig.manipulation;
    const simulating = manual.step(dt);
    const userOwned = manual.mode !== "FOLLOW" && !!manual.pose;
    if (userOwned) { Object.assign(rig.current, manual.pose); rig.velocity = zero(); }
    else if (!rig.locked) {
    for (const key of Object.keys(rig.current) as (keyof Pose)[]) {
      const next = spring(rig.current[key], rig.target[key], rig.velocity[key], dt);
      const epsilon = key === "pitch" || key === "yaw" || key === "roll" ? .0001 : .02;
      const settled = Math.abs(next.value - rig.target[key]) < epsilon && Math.abs(next.velocity) < epsilon;
      rig.current[key] = !initialized || reduced.matches || settled ? rig.target[key] : next.value;
      rig.velocity[key] = !initialized || reduced.matches || settled ? 0 : next.velocity;
      moving ||= rig.velocity[key] !== 0;
    }
    if (initialized && !reduced.matches) {
      const distance = Math.hypot(rig.current.x - before.x, rig.current.y - before.y), limit = 2400 * dt;
      if (distance > limit) for (const key of ["x", "y"] as const) {
        rig.current[key] = before[key] + (rig.current[key] - before[key]) * limit / distance;
        rig.velocity[key] *= limit / distance;
      }
      const deltaWidth = rig.current.width - before.width, widthLimit = 700 * dt;
      if (Math.abs(deltaWidth) > widthLimit) { rig.current.width = before.width + Math.sign(deltaWidth) * widthLimit; rig.velocity.width = Math.sign(deltaWidth) * 700; }
    }
    }
    initialized = true;
    const pose = rig.current, height = pose.width * SCENE_HEIGHT / SCENE_WIDTH;
    portal.style.width = `${pose.width}px`; portal.style.height = `${height}px`;
    portal.style.transform = `translate3d(${pose.x}px,${pose.y}px,0)`;
    scene.style.transform = `scale(${pose.width / SCENE_WIDTH})`;
    portal.dataset.positioned = "true"; portal.dataset.chapter = rig.chapter;
    portal.dataset.manipulation = manual.mode; portal.dataset.collisions = String(manual.collisions); portal.dataset.throwSpeed = String(manual.speed);
    portal.dataset.physics = manual.unavailable ? "unavailable" : manual.physics ? "ready" : "deferred";
    portal.dataset.trajectory = [time, pose.x, pose.y, pose.width, pose.pitch, pose.yaw, pose.roll].join(",");
    const visible = pose.x < innerWidth && pose.y + height > 0 && pose.y < innerHeight;
    const needsRender = visible && rig.render?.(time / 1000);
    portal.dataset.motion = moving || needsRender || simulating ? "moving" : "settled";
    const controlElement = portal.querySelector<HTMLElement>(".workstation-controls");
    if (controlElement) {
      if (userOwned) {
        const dockWidth = Math.min(innerWidth - 24, 1000);
        controlElement.style.width = `${dockWidth}px`; controlElement.style.left = `${(innerWidth - dockWidth) / 2 - pose.x}px`;
        controlElement.style.right = "auto"; controlElement.style.top = `${innerHeight - controlElement.offsetHeight - 12 - pose.y}px`;
      } else controlElement.removeAttribute("style");
    }
    const controls = controlElement?.getBoundingClientRect();
    portal.dataset.controlsVisible = String(!!controls && (visible || userOwned) && controls.top >= 76 && controls.bottom <= innerHeight + 1);
    if (moving || needsRender || simulating) pending = requestAnimationFrame(paint);
    else previous = 0;
  }
  const wake = () => { if (!pending && !document.hidden) pending = requestAnimationFrame(paint); };
  const schedule = () => { dirty = true; wake(); };
  rig.wake = wake;
  manualWake();
  function manualWake() { rig.manipulation.wake = wake; }
  const resizeLayout = () => { layoutDirty = true; rig.manipulation.follow(); schedule(); };
  const motionPreference = () => { if (reduced.matches) rig.manipulation.cancel(); schedule(); };
  const resize = new ResizeObserver(() => { layoutDirty = true; schedule(); }); stages.forEach((node) => resize.observe(node));
  const story = document.querySelector("[data-workstation-story]"); if (story) resize.observe(story);
  window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", resizeLayout, { passive: true });
  document.addEventListener("visibilitychange", schedule); reduced.addEventListener("change", motionPreference);
  schedule();
  return () => { rig.wake = () => {}; rig.manipulation.dispose(); cancelAnimationFrame(pending); resize.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", resizeLayout); document.removeEventListener("visibilitychange", schedule); reduced.removeEventListener("change", motionPreference); };
}
