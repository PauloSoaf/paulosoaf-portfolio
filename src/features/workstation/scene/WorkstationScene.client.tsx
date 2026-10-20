"use client";
/* eslint-disable react-hooks/immutability -- R3F camera/mesh/DOM transforms are mutable render resources. */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type Dispatch, type RefObject } from "react";
import { Group, Mesh, Raycaster, Shape, ShapeGeometry, MeshBasicMaterial, Vector2, Vector3, type DataTexture, type Material } from "three";
import { loadStudioPixels, studioTexture } from "./studio-environment";
import { DISPLAY, LaptopModel, PIVOT } from "../models/LaptopModel.client";
import { identifyHitTarget, type LaptopHitTarget } from "../models/hit-targets";
import { CHASSIS_UNITS, type MotionRig } from "../orchestrator/position";
import { NOTEBOOK_KEYS } from "../input/keyboard-layout";
import type { NotebookInputController } from "../input/NotebookInputController";
import type { NotebookPointerController } from "../input/NotebookPointerController";
import type { NotebookSound } from "../audio/notebook-sound";
import { isScreenInteractive, type WorkstationEvent, type WorkstationState } from "../state/workstation-machine";
import { convexHull, expandHull } from "./hull";
import { setData } from "../orchestrator/dataset";

export type HoverPart = LaptopHitTarget | "";
interface Props {
  state: WorkstationState; dispatch: Dispatch<WorkstationEvent>; theme: "dark" | "light";
  active: boolean; reduced: boolean;
  host: RefObject<HTMLDivElement | null>;
  hit: RefObject<HTMLDivElement | null>;
  badge: RefObject<HTMLDivElement | null>;
  screenElement: RefObject<HTMLDivElement | null>;
  rig: MotionRig; input: NotebookInputController; pointer: NotebookPointerController; sound: NotebookSound;
  badgeText: (part: HoverPart) => string;
  onReady: () => void; onFailure: () => void; onMenu: (x: number, y: number) => void;
}

/** Elevation of the classic three-quarter view; the rig adds pitch/yaw on top. */
const VIEW_TILT = .5;
const DOM_WIDTH = 800, DOM_HEIGHT = 458.5366;
const corners = [[-DISPLAY.width / 2, DISPLAY.height / 2], [DISPLAY.width / 2, DISPLAY.height / 2], [-DISPLAY.width / 2, -DISPLAY.height / 2]] as const;
const keyLabel: Record<string, string> = { Backspace: "⌫", Enter: "enter", " ": "space", Shift: "shift", CapsLock: "caps", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", Tab: "tab", Escape: "esc" };

type Gesture = {
  id: number; part: LaptopHitTarget; touch: boolean; x0: number; y0: number; x: number; y: number;
  started: boolean; rotate: boolean; lid: number; capture: boolean; armed: boolean; timers: number[];
};

function starGeometry() {
  const shape = new Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? .055 : .13, a = Math.PI / 2 + i * Math.PI / 5; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) shape.lineTo(x, y); else shape.moveTo(x, y); }
  shape.closePath(); return new ShapeGeometry(shape);
}

function Assembly(props: Props) {
  const { state, dispatch, theme, active, reduced, screenElement, host, hit, badge, rig, input, pointer, sound, badgeText, onReady, onFailure, onMenu } = props;
  const stage = useRef<Group>(null), tilt = useRef<Group>(null), spin = useRef<Group>(null), root = useRef<Group>(null), hinge = useRef<Group>(null), stars = useRef<Group>(null);
  const displayMaterials = useRef<{ hole: Material; glass: Material } | null>(null);
  const gesture = useRef<Gesture | null>(null), lastChassisClick = useRef(0);
  const frames = useRef(0), started = useRef(false), studioReady = useRef(false), sceneMoving = useRef(false);
  const rotation = useRef([0, 0, 0]);
  const scratch = useMemo(() => ({ point: new Vector3(), ndc: new Vector2(), raycaster: new Raycaster() }), []);
  const star = useMemo(() => ({ geometry: starGeometry(), material: new MeshBasicMaterial({ color: "#ffd27a", toneMapped: false, transparent: true, depthTest: false }) }), []);
  const { camera, size, gl, advance, scene } = useThree();
  const latest = useRef({ state, active, reduced, badgeText });
  useEffect(() => { latest.current = { state, active, reduced, badgeText }; }, [state, active, reduced, badgeText]);

  useEffect(() => () => { star.geometry.dispose(); star.material.dispose(); }, [star]);
  useEffect(() => {
    let disposed = false, texture: DataTexture | undefined;
    loadStudioPixels().then(async (buffer) => {
      if (disposed) return;
      texture = studioTexture(buffer); scene.environment = texture; scene.environmentIntensity = .95;
      await gl.compileAsync(scene, camera);
      if (host.current) host.current.dataset.studio = "baked";
    }).catch(() => { if (!disposed && host.current) host.current.dataset.studio = "fallback"; }).finally(() => {
      if (!disposed) { studioReady.current = true; rig.wake(); }
    });
    return () => { disposed = true; studioReady.current = false; scene.environment = null; texture?.dispose(); };
  }, [gl, scene, camera, rig, host]);
  useEffect(() => {
    const render = (seconds: number) => {
      if (rig.paused || document.hidden || !studioReady.current) return false;
      advance(seconds, false);
      return sceneMoving.current || input.animating;
    };
    rig.render = render; rig.wake();
    return () => { if (rig.render === render) rig.render = undefined; };
  }, [advance, rig, input]);
  useEffect(() => { rig.hinge.target = state.lidAngle; rig.wake(); }, [rig, state.lidAngle]);
  useEffect(() => { if (active) rig.wake(); }, [state, theme, active, rig]);

  useEffect(() => {
    const surface = hit.current; if (!surface) return;
    /** Native picking: the clipped hit layer receives only events on the notebook silhouette. */
    const pick = (clientX: number, clientY: number) => {
      if (!root.current) return null;
      const rect = gl.domElement.getBoundingClientRect();
      scratch.ndc.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
      scratch.raycaster.setFromCamera(scratch.ndc, camera);
      const intersection = scratch.raycaster.intersectObject(root.current, true)[0];
      if (!intersection) return null;
      const part = identifyHitTarget(intersection);
      return part ? { part, instanceId: intersection.instanceId } : null;
    };
    const chassisPx = () => rig.current.width;
    const clear = (current: Gesture) => { current.timers.forEach(clearTimeout); current.timers = []; };
    const end = (event: PointerEvent) => {
      const current = gesture.current; if (!current || current.id !== event.pointerId) return;
      gesture.current = null; clear(current); rig.lidDragging = false;
      const up = event.type === "pointerup";
      if (current.part === "trackpad") { if (up) pointer.end(); else pointer.cancel(); }
      else if (current.part === "lid" && !current.started && up) {
        const open = latest.current.state.lidAngle < 15;
        dispatch({ type: "SET_LID", angle: open ? 108 : 0 });
        if (open) sound.boot();
      } else if (current.part === "chassis" || current.part === "screen") {
        if (current.started && current.rotate) dispatch({ type: "END_ROTATE" });
        else if (current.started) { if (up) rig.release(event.timeStamp); else rig.cancel(); }
        else if (up && !current.touch) {
          if (event.timeStamp - lastChassisClick.current < 330) { rig.reset(); dispatch({ type: "RESET_POSE" }); lastChassisClick.current = 0; }
          else lastChassisClick.current = event.timeStamp;
        }
      }
      host.current?.removeAttribute("data-dragging");
      try { surface.releasePointerCapture(event.pointerId); } catch { /* already released */ }
      rig.wake();
    };
    const down = (event: PointerEvent) => {
      const { state: now, active: live } = latest.current;
      if (!live || now.mode === "FOCUS_SCREEN" || event.button > 0 || gesture.current) return;
      const picked = pick(event.clientX, event.clientY); if (!picked) return;
      sound.unlock();
      const touch = event.pointerType !== "mouse";
      const current: Gesture = { id: event.pointerId, part: picked.part, touch, x0: event.clientX, y0: event.clientY, x: event.clientX, y: event.clientY,
        started: false, rotate: event.shiftKey || event.altKey, lid: now.lidAngle, capture: !touch, armed: false, timers: [] };
      gesture.current = current;
      surface.focus({ preventScroll: true });
      if (picked.part === "keyboard") {
        const key = NOTEBOOK_KEYS[picked.instanceId ?? -1];
        if (key) input.key(key.label);
        current.capture = true;
      } else if (picked.part === "trackpad") { pointer.start(); current.capture = true; }
      else if (picked.part === "lid") current.capture = !touch;
      else if (touch) {
        // Touch: a vertical swipe still scrolls the page; hold or swipe sideways to pick it up.
        current.timers.push(window.setTimeout(() => { if (gesture.current === current && !current.started) { current.armed = true; current.capture = true; navigator.vibrate?.(8); } }, 360));
        current.timers.push(window.setTimeout(() => { if (gesture.current === current && !current.started) { gesture.current = null; clear(current); onMenu(current.x, current.y); } }, 760));
      }
      if (!touch) { try { surface.setPointerCapture(event.pointerId); } catch { /* inactive pointer */ } }
      if (!touch) event.preventDefault();
      rig.wake();
    };
    const move = (event: PointerEvent) => {
      const current = gesture.current; if (!current || current.id !== event.pointerId) return;
      const dx = event.clientX - current.x0, dy = event.clientY - current.y0, distance = Math.hypot(dx, dy);
      const stepX = event.clientX - current.x, stepY = event.clientY - current.y;
      current.x = event.clientX; current.y = event.clientY;
      if (current.part === "trackpad") {
        const pad = chassisPx() * 1.46 / CHASSIS_UNITS;
        pointer.move(stepX / (pad * 1.05), stepY / (pad * .6)); rig.wake(); return;
      }
      if (current.part === "keyboard") return;
      if (current.part === "lid") {
        if (!current.started && distance > 6) { current.started = true; current.capture = true; rig.lidDragging = true; }
        if (current.started) dispatch({ type: "SET_LID", angle: current.lid - dy * .55 * 520 / Math.max(200, chassisPx()) });
        return;
      }
      if (!current.started) {
        if (current.touch && !current.armed) {
          if (distance < 9) return;
          if (Math.abs(dy) > Math.abs(dx)) { gesture.current = null; clear(current); return; }
        } else if (distance <= 5) return;
        current.started = true; current.capture = true; clear(current);
        host.current?.setAttribute("data-dragging", "true");
        if (current.rotate) dispatch({ type: "BEGIN_ROTATE" });
        else { rig.grab(current.x0, current.y0, event.timeStamp); sound.unlock(); }
      }
      if (current.rotate) {
        dispatch({ type: "ROTATE", axis: 1, delta: stepX / Math.max(240, size.width) * 3 });
        dispatch({ type: "ROTATE", axis: 0, delta: stepY / Math.max(240, size.height) * 1.6 });
      } else rig.drag(event.clientX, event.clientY, event.timeStamp);
    };
    const touchMove = (event: TouchEvent) => { if (gesture.current?.capture && event.cancelable) event.preventDefault(); };
    const menu = (event: MouseEvent) => {
      event.preventDefault();
      const current = gesture.current; if (current) { gesture.current = null; clear(current); }
      onMenu(event.clientX, event.clientY);
    };
    const wheel = (event: WheelEvent) => {
      if (!latest.current.active || pick(event.clientX, event.clientY)?.part !== "trackpad") return;
      event.preventDefault(); pointer.scroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 458 : 1));
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !host.current) return;
      const part: HoverPart = gesture.current?.part ?? pick(event.clientX, event.clientY)?.part ?? "";
      host.current.dataset.part = part;
      const label = badge.current;
      if (label) {
        const text = latest.current.badgeText(part);
        if (label.textContent !== text) label.textContent = text;
        label.style.transform = `translate3d(${event.clientX + 18}px,${event.clientY + 20}px,0)`;
        label.dataset.visible = String(!!text && !gesture.current?.started);
      }
    };
    const leave = () => { if (host.current) host.current.dataset.part = ""; if (badge.current) badge.current.dataset.visible = "false"; };
    const keyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        if (document.activeElement === surface) { event.preventDefault(); onMenu(rig.current.x, rig.current.y); }
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement) || !host.current?.contains(target)) return;
      const label = keyLabel[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : "");
      if (!label) return;
      input.pressed.set(label, performance.now() + 160); rig.wake();
      // Native fields in the owned screen keep native editing; a focused notebook routes to the model.
      if (target === surface && event.key !== "Shift" && event.key !== "CapsLock") {
        if (event.key === "Escape") { surface.blur(); return; }
        event.preventDefault(); input.key(label);
      } else sound.key();
    };
    const cancel = () => {
      const current = gesture.current; if (current) { gesture.current = null; clear(current); }
      pointer.cancel(); rig.cancel(); host.current?.removeAttribute("data-dragging");
      if (latest.current.state.mode === "MANIPULATE") dispatch({ type: "END_ROTATE" });
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && gesture.current) cancel(); };
    surface.addEventListener("pointerdown", down); surface.addEventListener("pointermove", hover); surface.addEventListener("pointerleave", leave);
    surface.addEventListener("contextmenu", menu); surface.addEventListener("wheel", wheel, { passive: false });
    surface.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("pointermove", move, true); window.addEventListener("pointerup", end, true); window.addEventListener("pointercancel", end, true);
    window.addEventListener("keydown", keyboard); window.addEventListener("keydown", escape);
    window.addEventListener("blur", cancel); document.addEventListener("visibilitychange", cancel);
    return () => {
      surface.removeEventListener("pointerdown", down); surface.removeEventListener("pointermove", hover); surface.removeEventListener("pointerleave", leave);
      surface.removeEventListener("contextmenu", menu); surface.removeEventListener("wheel", wheel); surface.removeEventListener("touchmove", touchMove);
      window.removeEventListener("pointermove", move, true); window.removeEventListener("pointerup", end, true); window.removeEventListener("pointercancel", end, true);
      window.removeEventListener("keydown", keyboard); window.removeEventListener("keydown", escape);
      window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", cancel);
    };
  }, [hit, host, badge, rig, input, pointer, sound, dispatch, onMenu, size.width, size.height, gl, camera, scratch]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);

  // Pose: the rig owns position/angle/size; R3F only maps it into the pixel-space orthographic view.
  useFrame((_, rawDelta) => {
    if (!stage.current || !tilt.current || !spin.current || !hinge.current) return;
    const delta = Math.min(rawDelta, .05), pose = rig.current;
    const blend = reduced ? 1 : 1 - Math.exp(-delta * 12);
    let moving = false;
    rotation.current = rotation.current.map((value, index) => {
      const desired = state.rotation[index]!, next = Math.abs(desired - value) < .0002 ? desired : value + (desired - value) * blend;
      moving ||= next !== desired; return next;
    });
    stage.current.position.set(pose.x - size.width / 2, size.height / 2 - pose.y, 0);
    stage.current.rotation.z = -pose.angle;
    stage.current.scale.setScalar(pose.width / CHASSIS_UNITS);
    tilt.current.rotation.x = VIEW_TILT + pose.pitch + rotation.current[0]!;
    spin.current.rotation.set(0, pose.yaw + rotation.current[1]!, pose.roll + rotation.current[2]!);
    hinge.current.rotation.x = (90 - rig.hinge.angle) * Math.PI / 180;
    if (stars.current) {
      // Dizzy stars orbit just above the real silhouette, wherever and however it landed.
      const dizzy = rig.mode === "STUNNED" && rig.stunnedUntil - performance.now() > 250 && !!rig.hull;
      stars.current.visible = dizzy;
      if (dizzy && rig.hull) {
        const top = Math.min(...rig.hull.points.map((p) => p.y)), scale = pose.width / CHASSIS_UNITS;
        stars.current.position.set(pose.x - size.width / 2, size.height / 2 - top + 18, 400);
        stars.current.scale.setScalar(scale);
        const phase = performance.now() / 1000 * 5.5;
        stars.current.children.forEach((child, index) => {
          const a = phase + index * Math.PI * 2 / 3;
          child.position.set(Math.cos(a) * .85, Math.sin(a) * .14, Math.sin(a) * .5); child.rotation.z = a * 1.5;
        });
        moving = true;
      }
    }
    sceneMoving.current = moving;
    stage.current.updateWorldMatrix(true, true);
    camera.updateMatrixWorld();
  }, -3);

  // DOM screen: three projected display corners define the exact affine plane of an orthographic view.
  useFrame(() => {
    const display = root.current?.getObjectByName("displayPlane") as Mesh | undefined;
    const element = screenElement.current, materials = displayMaterials.current;
    if (!display) return;
    const points = corners.map(([x, y]) => {
      const p = scratch.point.set(x, y, 0).applyMatrix4(display.matrixWorld).project(camera);
      return { x: (p.x + 1) * size.width / 2, y: (1 - p.y) * size.height / 2 };
    });
    const [a, b, c] = points as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
    const frontFacing = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
    const lid = rig.hinge.angle, open = lid > 22;
    let uncovered = frontFacing && open;
    if (uncovered && root.current) {
      for (const [x, y] of [[-1.58, .88], [1.58, .88], [-1.58, -.88], [1.58, -.88], [0, 0]] as const) {
        const p = scratch.point.set(x, y, 0).applyMatrix4(display.matrixWorld).project(camera);
        scratch.raycaster.setFromCamera(scratch.ndc.set(p.x, p.y), camera);
        if (scratch.raycaster.intersectObject(root.current, true)[0]?.object.name !== "displayPlane") { uncovered = false; break; }
      }
    }
    const showing = !!element && frontFacing && open;
    if (materials) display.material = showing ? materials.hole : materials.glass;
    if (element) {
      element.style.transform = `matrix(${(b.x - a.x) / DOM_WIDTH},${(b.y - a.y) / DOM_WIDTH},${(c.x - a.x) / DOM_HEIGHT},${(c.y - a.y) / DOM_HEIGHT},${a.x},${a.y})`;
      element.style.visibility = showing ? "visible" : "hidden";
      element.style.opacity = String(Math.min(1, Math.max(0, (lid - 22) / 38)));
      const accepts = isScreenInteractive(state) && rig.mode === "FOLLOW" && lid > 60 && uncovered;
      element.style.pointerEvents = accepts ? "auto" : "none";
      element.inert = !accepts;
    }
    if (host.current) setData(host.current, {
      displayCorners: points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(";"), displayMatrix: element?.style.transform ?? "",
      displayFront: String(frontFacing), displayUncovered: String(uncovered),
    });
  }, -1);

  useFrame(({ gl: renderer, scene: world, camera: view }) => {
    renderer.render(world, view);
    if (!root.current || !host.current) return;
    // Silhouette: hull of both shells' boxes. It clips the hit layer and is the rigid-body shape.
    const projected: { x: number; y: number }[] = [];
    for (const name of ["chassis", "lid"]) {
      const shell = root.current.getObjectByName(name) as Mesh | undefined; if (!shell) continue;
      if (!shell.geometry.boundingBox) shell.geometry.computeBoundingBox();
      const box = shell.geometry.boundingBox!;
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const p = scratch.point.set(x, y, z).applyMatrix4(shell.matrixWorld).project(view);
        projected.push({ x: (p.x + 1) * size.width / 2, y: (1 - p.y) * size.height / 2 });
      }
    }
    const display = root.current.getObjectByName("displayPlane");
    if (display) {
      // Physical display corners read after render, independent of the DOM projection formula.
      setData(host.current, { physicalDisplayCorners: corners.map(([x, y]) => {
        const p = scratch.point.set(x, y, 0).applyMatrix4(display.matrixWorld).project(view);
        return `${((p.x + 1) * size.width / 2).toFixed(2)},${((1 - p.y) * size.height / 2).toFixed(2)}`;
      }).join(";") });
    }
    const hull = convexHull(projected), pose = rig.current;
    if (hull.length >= 3) {
      rig.hull = { points: hull, x: pose.x, y: pose.y, angle: pose.angle, width: pose.width };
      if (hit.current) hit.current.style.clipPath = `polygon(${expandHull(hull, 6).map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(",")})`;
      if (rig.mode === "FOLLOW" && Math.abs(pose.angle) < .03 && !rig.keyboardView && pose.width > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of hull) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
        const w = Math.min(1.5, Math.max(.8, (maxX - minX) / pose.width)), h = Math.min(1.5, Math.max(.7, (maxY - minY) / pose.width));
        rig.extent = { width: rig.extent.width + (w - rig.extent.width) * .1, height: rig.extent.height + (h - rig.extent.height) * .1 };
      }
      setData(host.current, { hull: hull.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(";") });
    }
    setData(host.current, {
      frames: String(++frames.current), lidRendered: rig.hinge.angle.toFixed(2),
      pose: [pose.angle, pose.pitch, pose.yaw].map((n) => n.toFixed(4)).join(","),
      drawCalls: String(renderer.info.render.calls), triangles: String(renderer.info.render.triangles),
      pressedKeys: [...input.pressed.keys()].join(","),
      keysAnimating: String(input.animating),
      inputIntent: gesture.current ? gesture.current.part.toUpperCase() : state.mode === "MANIPULATE" ? "MANIPULATE" : "SCREEN",
      chassisWidth: pose.width.toFixed(1), logicalViewport: `${size.width},${size.height}`,
    });
    const data = host.current.dataset;
    if (frames.current % 6 === 0 || !sceneMoving.current) {
      const project = (x: number, y: number, z: number) => {
        const base = root.current!.getObjectByName("chassis")!;
        const p = scratch.point.set(x, y, z).applyMatrix4(base.matrixWorld).project(view);
        return { x: +((p.x + 1) * size.width / 2).toFixed(1), y: +((1 - p.y) * size.height / 2).toFixed(1) };
      };
      data.keyPoints = JSON.stringify(NOTEBOOK_KEYS.map((key, index) => ({ index, label: key.label, ...project(key.x, .1, key.z) })));
      const pad = project(0, .08, .74), grip = project(1.25, .08, .55);
      data.trackpadPoint = `${pad.x},${pad.y}`; data.dragPoint = `${grip.x},${grip.y}`;
      const lid = root.current.getObjectByName("lid");
      if (lid) { const p = scratch.point.set(0, 1.06, .03).applyMatrix4(lid.matrixWorld).project(view); data.lidPoint = `${((p.x + 1) * size.width / 2).toFixed(1)},${((1 - p.y) * size.height / 2).toFixed(1)}`; }
    }
    if (!started.current) { started.current = true; performance.mark("portfolio:workstation-first-frame"); onReady(); }
  }, 1);

  return <>
    <ambientLight intensity={.5} />
    <directionalLight position={[300, 900, 900]} intensity={2.4} color="#eef3f7" />
    <directionalLight position={[-900, 300, -500]} intensity={.6} color={theme === "dark" ? "#a7c9c1" : "#b9c6cf"} />
    <group ref={stars} visible={false}>
      {[0, 1, 2].map((index) => <mesh key={index} geometry={star.geometry} material={star.material} renderOrder={200} />)}
    </group>
    <group ref={stage}>
      <group ref={tilt}>
        <group ref={spin}>
          <group ref={root} position={PIVOT}>
            <LaptopModel theme={theme} hingeRef={hinge} displayRef={displayMaterials} input={input} />
          </group>
        </group>
      </group>
    </group>
  </>;
}

export default function WorkstationScene(props: Props) {
  return <Canvas orthographic frameloop="never" style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }} resize={{ offsetSize: true }} dpr={[1, 1.75]}
    camera={{ position: [0, 0, 2400], near: 1, far: 8000, zoom: 1 }}
    gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} onCreated={({ gl }) => {
      gl.setClearColor(0, 0);
      const render = gl.render.bind(gl); let count = 0, total = 0;
      gl.render = (...args) => {
        const start = performance.now(); render(...args); total += performance.now() - start; count++;
        if (props.host.current) props.host.current.dataset.renderCpuMs = (total / count).toFixed(4);
      };
    }}>
    <Assembly {...props} />
  </Canvas>;
}
