/** One logical viewport: CSS scales WebGL and DOM together, without camera resize races. */
export const SCENE_WIDTH = 800;
export const SCENE_HEIGHT = 620;
export type Pose = { x: number; y: number; width: number; pitch: number; yaw: number; roll: number };
export type MotionRig = {
  current: Pose; target: Pose; velocity: Pose; chapter: string;
  wake: () => void; render?: (seconds: number) => boolean;
  paused: boolean; locked: boolean;
};
const zero = (): Pose => ({ x: 0, y: 0, width: 0, pitch: 0, yaw: 0, roll: 0 });
export const createMotionRig = (): MotionRig => ({ current: zero(), target: zero(), velocity: zero(), chapter: "hero", wake: () => {}, paused: false, locked: false });

/** Exact critically damped spring, stable across refresh rates and direction reversals. */
export function spring(current: number, target: number, velocity: number, dt: number, omega = 14) {
  const displacement = current - target, decay = Math.exp(-omega * dt);
  const coefficient = velocity + omega * displacement;
  return { value: target + (displacement + coefficient * dt) * decay, velocity: (velocity - omega * coefficient * dt) * decay };
}
const clamp = (value: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, value));
const orientations = [[-.06, -.16, .015], [-.04, .12, -.02], [-.02, 0, .01], [-.04, -.14, -.025], [-.03, .08, .025], [-.04, -.1, 0]] as const;

/** Section-owned stages and an outboard transit lane protect the editorial content.
 * No scroll mutation, wheel interception, React frame state, or independent R3F RAF. */
export function installWorkstationPosition(portal: HTMLElement, anchor: HTMLElement, rig: MotionRig) {
  let pending = 0, previous = 0, dirty = true, initialized = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const stages = [anchor, ...document.querySelectorAll<HTMLElement>("[data-workstation-section-anchor]")];
  const scene = portal.querySelector<HTMLElement>(".workstation-scene")!;
  function sample() {
    dirty = false;
    const rectangles = stages.map((node) => ({ node, rect: node.getBoundingClientRect() })).filter(({ rect }) => rect.width > 0);
    const middle = innerHeight * .5;
    const nearest = rectangles.reduce((best, item) => Math.abs(item.rect.top + item.rect.height / 2 - middle) < Math.abs(best.rect.top + best.rect.height / 2 - middle) ? item : best);
    const { rect, node } = nearest;
    const index = stages.indexOf(node);
    rig.chapter = node.dataset.workstationSectionAnchor ?? "hero";
    const orientation = orientations[index] ?? orientations[0];
    const distance = Math.abs(rect.top + rect.height / 2 - middle);
    const beyond = clamp((distance - (innerHeight + rect.height) * .3) / 150, 0, 1);
    const lane = beyond * beyond * (3 - 2 * beyond);
    rig.target = { x: rect.left + (innerWidth + 40 - rect.left) * lane, y: clamp(rect.top, -rect.width * SCENE_HEIGHT / SCENE_WIDTH - 140, innerHeight + 40),
      width: rect.width, pitch: orientation[0], yaw: orientation[1], roll: orientation[2] };
    if (index === 0) rig.target.x = rect.left;
  }
  function paint(time: number) {
    pending = 0;
    if (document.hidden || rig.paused) { previous = 0; return; }
    if (dirty && !rig.locked) sample();
    const dt = previous ? Math.min((time - previous) / 1000, .05) : 1 / 60;
    previous = time;
    let moving = false;
    const before = { ...rig.current };
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
    initialized = true;
    const pose = rig.current, height = pose.width * SCENE_HEIGHT / SCENE_WIDTH;
    portal.style.width = `${pose.width}px`; portal.style.height = `${height}px`;
    portal.style.transform = `translate3d(${pose.x}px,${pose.y}px,0)`;
    scene.style.transform = `scale(${pose.width / SCENE_WIDTH})`;
    portal.dataset.positioned = "true"; portal.dataset.chapter = rig.chapter;
    portal.dataset.trajectory = [time, pose.x, pose.y, pose.width, pose.pitch, pose.yaw, pose.roll].join(",");
    const visible = pose.x < innerWidth && pose.y + height > 0 && pose.y < innerHeight;
    const needsRender = visible && rig.render?.(time / 1000);
    portal.dataset.motion = moving || needsRender ? "moving" : "settled";
    const controls = portal.querySelector<HTMLElement>(".workstation-controls")?.getBoundingClientRect();
    portal.dataset.controlsVisible = String(!!controls && visible && controls.top >= 76 && controls.bottom <= innerHeight);
    if (moving || needsRender) pending = requestAnimationFrame(paint);
    else previous = 0;
  }
  const wake = () => { if (!pending && !document.hidden) pending = requestAnimationFrame(paint); };
  const schedule = () => { dirty = true; wake(); };
  rig.wake = wake;
  const resize = new ResizeObserver(schedule); stages.forEach((node) => resize.observe(node));
  const story = document.querySelector("[data-workstation-story]"); if (story) resize.observe(story);
  window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule); reduced.addEventListener("change", schedule);
  schedule();
  return () => { rig.wake = () => {}; cancelAnimationFrame(pending); resize.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", schedule); reduced.removeEventListener("change", schedule); };
}
