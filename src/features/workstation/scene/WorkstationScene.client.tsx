"use client";
/* eslint-disable react-hooks/immutability -- R3F camera/mesh/DOM transforms are mutable render resources. */
import { Canvas, events, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type Dispatch, type ReactNode, type RefObject } from "react";
import { Box3, Group, Mesh, OrthographicCamera, Raycaster, Vector2, Vector3, type DataTexture } from "three";
import { loadStudioPixels, studioTexture } from "./studio-environment";
import { LaptopModel } from "../models/LaptopModel.client";
import { canRotateFromHit, identifyHitTarget } from "../models/hit-targets";
import { SCENE_WIDTH, type MotionRig } from "../orchestrator/position";
import { NOTEBOOK_KEYS } from "../input/keyboard-layout";
import type { NotebookInputController } from "../input/NotebookInputController";
import type { NotebookPointerController } from "../input/NotebookPointerController";
import { isScreenInteractive, type WorkstationEvent, type WorkstationState } from "../state/workstation-machine";

interface Props {
  state: WorkstationState; dispatch: Dispatch<WorkstationEvent>; theme: "dark" | "light";
  active: boolean; reduced: boolean; screen: ReactNode;
  host: RefObject<HTMLDivElement | null>;
  screenElement: RefObject<HTMLDivElement | null>;
  sceneElement: RefObject<HTMLDivElement | null>;
  onReady: () => void; onFailure: () => void;
  rig: MotionRig; input: NotebookInputController; pointer: NotebookPointerController; inputMode: boolean;
  tool: "move" | "rotate" | "lid"; touchManipulation: boolean; keyboardView: boolean;
}

/** Orthographic alternative: the three projected corners define an exact affine plane. */
function ProjectedScreen({ element, assembly, interactive, rig }: { element: Props["screenElement"]; assembly: RefObject<Group | null>; interactive: boolean; rig: MotionRig }) {
  const anchor = useRef<Group>(null);
  const { camera, size } = useThree();
  const points = useMemo(() => [new Vector3(), new Vector3(), new Vector3()], []);
  const visibilityRay = useMemo(() => new Vector3(), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  useFrame(() => {
    if (!anchor.current || !element.current) return;
    anchor.current.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    const coordinates = [[-1.64, .94], [1.64, .94], [-1.64, -.94]];
    points.forEach((point, i) => {
      point.set(coordinates[i]![0]!, coordinates[i]![1]!, 0).applyMatrix4(anchor.current!.matrixWorld).project(camera);
      point.set((point.x + 1) * size.width / 2, (1 - point.y) * size.height / 2, point.z);
    });
    const [a, b, c] = points as [Vector3, Vector3, Vector3];
    element.current.style.transform = `matrix(${(b.x - a.x) / 800},${(b.y - a.y) / 800},${(c.x - a.x) / 458.5366},${(c.y - a.y) / 458.5366},${a.x},${a.y})`;
    const frontFacing = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
    let uncovered = frontFacing;
    if (frontFacing && assembly.current) {
      assembly.current.updateWorldMatrix(true, true);
      for (const [x, y] of [[-1.58, .88], [1.58, .88], [-1.58, -.88], [1.58, -.88], [0, 0]]) {
        visibilityRay.set(x!, y!, 0).applyMatrix4(anchor.current.matrixWorld).project(camera);
        raycaster.setFromCamera(new Vector2(visibilityRay.x, visibilityRay.y), camera);
        if (raycaster.intersectObject(assembly.current, true)[0]?.object.name !== "displayPlane") { uncovered = false; break; }
      }
    }
    element.current.style.visibility = frontFacing ? "visible" : "hidden";
    const acceptsInput = interactive && rig.manipulation.mode !== "FLYING";
    element.current.style.pointerEvents = frontFacing && uncovered && acceptsInput ? "auto" : "none";
    element.current.inert = !frontFacing || !uncovered || !acceptsInput;
    const host = element.current.closest<HTMLElement>("[data-workstation]");
    if (host) {
      host.dataset.displayCorners = points.map((p) => `${p.x},${p.y}`).join(";");
      host.dataset.displayMatrix = element.current.style.transform; host.dataset.displayFront = String(frontFacing);
      host.dataset.displayUncovered = String(uncovered);
    }
  }, -1);
  return <group ref={anchor} />;
}

function Assembly(props: Props) {
  const { state, dispatch, theme, active, reduced, screen, screenElement, host, onReady, onFailure, rig, input, pointer, inputMode, tool, touchManipulation, keyboardView } = props;
  const root = useRef<Group>(null), hinge = useRef<Group>(null);
  const gesture = useRef<{ id: number; x: number; y: number; originX: number; originY: number; time: number; started: boolean; tool: Props["tool"]; lid: number; target: string } | null>(null);
  const frames = useRef(0), started = useRef(false);
  const needsSceneFrames = useRef(false);
  const studioReady = useRef(false);
  const pad = useRef<{ id: number; x: number; y: number } | null>(null);
  const handlePoint = useMemo(() => new Vector3(), []);
  const framing = useMemo(() => ({ bounds: new Box3(), center: new Vector3(), point: new Vector3(), offset: new Vector3(0, keyboardView ? 7.8 : 4.7, keyboardView ? 5.5 : 7.5), previous: "" }), [keyboardView]);
  const { camera, size, gl, advance, raycaster, scene } = useThree();
  useEffect(() => {
    let disposed = false, texture: DataTexture | undefined;
    loadStudioPixels().then(async (buffer) => {
      if (disposed) return;
      texture = studioTexture(buffer); scene.environment = texture; scene.environmentIntensity = .9;
      await gl.compileAsync(scene, camera);
      if (host.current) host.current.dataset.studio = "baked";
    }).catch(() => { if (!disposed && host.current) host.current.dataset.studio = "fallback"; }).finally(() => {
      if (!disposed) { studioReady.current = true; rig.wake(); }
    });
    return () => { disposed = true; studioReady.current = false; scene.environment = null; texture?.dispose(); };
  }, [gl, scene, camera, rig, host]);
  useEffect(() => {
    const view = camera as OrthographicCamera;
    view.position.set(0, keyboardView ? 7.8 : 4.7, keyboardView ? 5.5 : 7.5); view.lookAt(0, .65, 0);
    view.zoom = Math.min(size.width / 4.35, size.height / 3.5) * (keyboardView ? 1.04 : 1);
    view.updateProjectionMatrix(); rig.wake();
  }, [camera, size, rig, keyboardView]);
  useEffect(() => {
    const render = (seconds: number) => {
      // The rig already checks the CURRENT painted viewport. IntersectionObserver can lag
      // one frame during transit; using its React state here would desynchronize the DOM.
      if (rig.paused || document.hidden || !studioReady.current) return false;
      advance(seconds, false);
      return needsSceneFrames.current || input.pressed.size > 0;
    };
    rig.render = render; rig.wake();
    return () => { if (rig.render === render) rig.render = undefined; };
  }, [advance, active, rig, input]);
  // The DOM layer is committed after the first GL frame; repaint its matrix when that view mounts.
  useEffect(() => { if (active) rig.wake(); }, [state, theme, active, screen, rig]);
  useEffect(() => {
    const canvas: HTMLElement = props.sceneElement.current ?? gl.domElement;
    canvas.style.touchAction = inputMode || touchManipulation ? "none" : "pan-y";
    let touchY: number | null = null;
    const overPad = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera(new Vector2((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1), camera);
      return identifyHitTarget(raycaster.intersectObject(root.current!, true)[0]) === "trackpad";
    };
    const wheel = (event: WheelEvent) => {
      if (!active || !root.current || !overPad(event.clientX, event.clientY)) return;
      event.preventDefault(); event.stopImmediatePropagation(); pointer.scroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 458 : 1));
    };
    const touchStart = (event: TouchEvent) => { if (inputMode && event.touches.length === 2) { pointer.cancel(); pad.current = null; touchY = (event.touches[0]!.clientY + event.touches[1]!.clientY) / 2; } };
    const touchMove = (event: TouchEvent) => {
      if (!inputMode || event.touches.length !== 2 || touchY === null) return;
      event.preventDefault(); const next = (event.touches[0]!.clientY + event.touches[1]!.clientY) / 2;
      pointer.scroll((touchY - next) * 3); touchY = next;
    };
    const touchEnd = () => { touchY = null; };
    canvas.addEventListener("wheel", wheel, { passive: false, capture: true });
    canvas.addEventListener("touchstart", touchStart, { passive: true }); canvas.addEventListener("touchmove", touchMove, { passive: false }); canvas.addEventListener("touchend", touchEnd);
    return () => { canvas.removeEventListener("wheel", wheel, true); canvas.removeEventListener("touchstart", touchStart); canvas.removeEventListener("touchmove", touchMove); canvas.removeEventListener("touchend", touchEnd); };
  }, [gl, raycaster, camera, active, pointer, inputMode, props.sceneElement, touchManipulation]);
  useEffect(() => {
    // Pick in 3D once; native capture owns the rest of the trackpad gesture.
    // Changing ray intersections or crossing the projected DOM cannot strand a press.
    const move = (event: PointerEvent) => {
      const current = pad.current; if (!current || current.id !== event.pointerId) return;
      const scale = gl.domElement.getBoundingClientRect().width / SCENE_WIDTH;
      pointer.move((event.clientX - current.x) / (220 * scale), (event.clientY - current.y) / (150 * scale));
      current.x = event.clientX; current.y = event.clientY; rig.wake();
    };
    const end = (event: PointerEvent) => {
      if (pad.current?.id !== event.pointerId) return;
      pad.current = null;
      if (event.type === "pointerup") pointer.end(); else pointer.cancel();
      rig.locked = false; rig.wake();
    };
    window.addEventListener("pointermove", move, true); window.addEventListener("pointerup", end, true);
    window.addEventListener("pointercancel", end, true); window.addEventListener("lostpointercapture", end, true);
    return () => { window.removeEventListener("pointermove", move, true); window.removeEventListener("pointerup", end, true); window.removeEventListener("pointercancel", end, true); window.removeEventListener("lostpointercapture", end, true); };
  }, [gl, pointer, rig]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (!active || !input.port || event.ctrlKey || event.altKey || event.metaKey) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || !host.current?.contains(target)) return;
      const labels: Record<string, string> = { Backspace: "⌫", Enter: "enter", " ": "space", Shift: "shift", CapsLock: "caps", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", Tab: "tab" };
      const label = labels[event.key] ?? event.key.toUpperCase();
      input.pressed.set(label, performance.now() + 160); rig.wake();
      // Native textarea editing remains native; only a focused canvas needs model routing.
      if (target === gl.domElement && event.key !== "Shift" && event.key !== "CapsLock") { event.preventDefault(); input.key(label); }
    };
    window.addEventListener("keydown", keyboard); return () => window.removeEventListener("keydown", keyboard);
  }, [active, input, rig, gl, host]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useEffect(() => {
    const cancel = () => { gesture.current = null; pad.current = null; pointer.cancel(); rig.manipulation.cancel(); rig.locked = false; rig.wake(); dispatch({ type: "END_ROTATE" }); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    window.addEventListener("blur", cancel); window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", cancel); window.addEventListener("keydown", keyboard);
    return () => { window.removeEventListener("blur", cancel); window.removeEventListener("resize", cancel); document.removeEventListener("visibilitychange", cancel); window.removeEventListener("keydown", keyboard); };
  }, [dispatch, pointer, rig]);
  useFrame((_, rawDelta) => {
    if (!root.current || !hinge.current) return;
    const delta = Math.min(rawDelta, .05), amount = reduced ? 1 : 1 - Math.exp(-delta * 12);
    const target = [rig.current.pitch + state.rotation[0], rig.current.yaw + state.rotation[1], rig.current.roll + state.rotation[2]];
    let moving = false;
    for (const [i, axis] of ["x", "y", "z"].entries()) {
      const key = axis as "x" | "y" | "z", current = root.current.rotation[key], desired = target[i]!;
      root.current.rotation[key] = Math.abs(desired - current) < .0002 ? desired : current + (desired - current) * amount;
      if (Math.abs(desired - root.current.rotation[key]) < .0002) root.current.rotation[key] = desired;
      moving ||= root.current.rotation[key] !== desired;
    }
    const angle = (90 - state.lidAngle) * Math.PI / 180;
    hinge.current.rotation.x = Math.abs(angle - hinge.current.rotation.x) < .0002 ? angle : hinge.current.rotation.x + (angle - hinge.current.rotation.x) * amount;
    if (Math.abs(angle - hinge.current.rotation.x) < .0002) hinge.current.rotation.x = angle;
    moving ||= hinge.current.rotation.x !== angle;
    root.current.updateWorldMatrix(true, true);
    const fitKey = `${root.current.rotation.toArray()}|${hinge.current.rotation.x}|${size.width},${size.height}`;
    if (framing.previous !== fitKey) {
      framing.previous = fitKey;
      framing.bounds.setFromObject(root.current); framing.bounds.getCenter(framing.center);
      const view = camera as OrthographicCamera;
      view.position.copy(framing.center).add(framing.offset); view.lookAt(framing.center); view.updateMatrixWorld();
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      // Project the two physical hulls, rather than the much larger world AABB.
      // This fits grazing angles without shrinking the ordinary view needlessly.
      for (const name of ["chassis", "lid"]) {
        const hull = root.current.getObjectByName(name) as Mesh;
        if (!hull) continue;
        if (!hull.geometry.boundingBox) hull.geometry.computeBoundingBox();
        const bounds = hull.geometry.boundingBox!;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          framing.point.set(x, y, z).applyMatrix4(hull.matrixWorld).project(view);
          minX = Math.min(minX, framing.point.x); maxX = Math.max(maxX, framing.point.x);
          minY = Math.min(minY, framing.point.y); maxY = Math.max(maxY, framing.point.y);
        }
      }
      const nominal = Math.min(size.width / 4.35, size.height / 3.5) * (keyboardView ? 1.04 : 1);
      view.translateX((minX + maxX) * size.width / (4 * view.zoom));
      view.translateY((minY + maxY) * size.height / (4 * view.zoom));
      view.updateMatrixWorld();
      view.zoom = Math.min(nominal, view.zoom * 1.92 / (maxX - minX), view.zoom * 1.92 / (maxY - minY));
      view.updateProjectionMatrix();
    }
    props.rig.locked = state.mode === "MANIPULATE" || !!pad.current;
    // The orchestrator schedules the next frame for all outstanding scene work.
    needsSceneFrames.current = moving;
    if (host.current) {
      host.current.dataset.frames = String(++frames.current);
      host.current.dataset.lidRendered = (90 - hinge.current.rotation.x * 180 / Math.PI).toFixed(2);
      host.current.dataset.pose = [root.current.rotation.x, root.current.rotation.y, root.current.rotation.z].map((n) => n.toFixed(4)).join(",");
      host.current.dataset.drawCalls = String(gl.info.render.calls);
      host.current.dataset.triangles = String(gl.info.render.triangles);
      host.current.dataset.pressedKeys = [...input.pressed.keys()].join(",");
      host.current.dataset.inputIntent = pad.current ? "INPUT" : state.mode === "MANIPULATE" ? "MANIPULATE" : "SCREEN";
      root.current.updateWorldMatrix(true, false);
      handlePoint.set(1.4, .11, .75).applyMatrix4(root.current.matrixWorld).project(camera);
      host.current.dataset.dragPoint = `${(handlePoint.x + 1) * size.width / 2},${(1 - handlePoint.y) * size.height / 2}`;
      for (const [name, z] of [["keyboardPoint", -.27], ["trackpadPoint", .75]] as const) {
        handlePoint.set(0, .15, z).applyMatrix4(root.current.matrixWorld).project(camera);
        host.current.dataset[name] = `${(handlePoint.x + 1) * size.width / 2},${(1 - handlePoint.y) * size.height / 2}`;
      }
      host.current.dataset.keyPoints = JSON.stringify(NOTEBOOK_KEYS.map((key, index) => {
        handlePoint.set(key.x, .15, key.z).applyMatrix4(root.current!.matrixWorld).project(camera);
        return { index, label: key.label, x: (handlePoint.x + 1) * size.width / 2, y: (1 - handlePoint.y) * size.height / 2 };
      }));
      const edges = [-1.8, 1.8].map((x) => { handlePoint.set(x, 0, 0).applyMatrix4(root.current!.matrixWorld).project(camera); return (handlePoint.x + 1) * size.width / 2; });
      host.current.dataset.chassisWidth = String(Math.abs(edges[1]! - edges[0]!) * (host.current.getBoundingClientRect().width / SCENE_WIDTH));
    }
    if (!started.current) { started.current = true; performance.mark("portfolio:workstation-first-frame"); onReady(); }
  }, -3);
  useFrame(({ gl, scene, camera, size }) => {
    gl.render(scene, camera);
    const display = root.current?.getObjectByName("displayPlane");
    if (display && host.current) {
      const corners = [[-1.64, .94], [1.64, .94], [-1.64, -.94]].map(([x, y]) => {
        handlePoint.set(x!, y!, 0).applyMatrix4(display.matrixWorld).project(camera);
        return `${(handlePoint.x + 1) * size.width / 2},${(1 - handlePoint.y) * size.height / 2}`;
      });
      host.current.dataset.physicalDisplayCorners = corners.join(";");
      host.current.dataset.logicalViewport = `${size.width},${size.height},${gl.domElement.clientWidth},${gl.domElement.clientHeight}`;
    }
  }, 1);
  const finish = (event: ThreeEvent<PointerEvent>) => {
    if (gesture.current?.id !== event.pointerId) return;
    const current = gesture.current;
    if (current.started && current.tool === "move") {
      if (event.type === "pointerup") rig.manipulation.release(event.timeStamp, reduced); else rig.manipulation.cancel();
    }
    if (!current.started && current.target === "lid" && event.type === "pointerup") dispatch({ type: "SET_LID", angle: state.lidAngle < 15 ? 108 : 0 });
    gesture.current = null; dispatch({ type: "END_ROTATE" });
    rig.locked = false; rig.wake();
    (event.target as Element).releasePointerCapture?.(event.pointerId);
  };
  return <>
    <ambientLight intensity={.65} />
    <directionalLight position={[2, 5, 5]} intensity={2.6} color="#e6edf4" />
    <directionalLight position={[-4, 2, -2]} intensity={1.6} color="#a9b9c3" />
    <group ref={root} position={[0, -.45, 0]} rotation={[-.08, -.28, .025]}
      onPointerDown={(event) => {
        if (!active || state.mode === "FOCUS_SCREEN" || (event.button !== 0 && event.button !== 2)) return;
        // Stop the ray here even for input surfaces: otherwise a second chassis intersection
        // beneath a key/trackpad could incorrectly start the same gesture.
        event.stopPropagation();
        if (!canRotateFromHit(event)) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: event.clientX, originY: event.clientY, time: event.timeStamp, started: false,
          tool: event.object.name === "lidGrip" ? "lid" : event.altKey || event.button === 2 ? "rotate" : tool, lid: state.lidAngle, target: identifyHitTarget(event) ?? "chassis" };
      }}
      onPointerMove={(event) => {
        const current = gesture.current; if (!current || current.id !== event.pointerId) return;
        const dx = event.clientX - current.x, dy = event.clientY - current.y;
        if (event.pointerType === "touch" && !touchManipulation) { if (Math.hypot(event.clientX - current.originX, event.clientY - current.originY) > 8) gesture.current = null; return; }
        if (!current.started && Math.hypot(dx, dy) <= 5) return;
        if (!current.started) {
          current.started = true; (event.target as Element).setPointerCapture?.(event.pointerId); dispatch({ type: "BEGIN_ROTATE" });
          if (current.tool === "move") rig.manipulation.begin(current.originX, current.originY, rig.current, current.time, reduced);
        }
        event.stopPropagation();
        if (current.tool === "move") rig.manipulation.move(event.clientX, event.clientY, event.timeStamp);
        else if (current.tool === "lid") dispatch({ type: "SET_LID", angle: current.lid - (event.clientY - current.originY) * .55 });
        else {
          dispatch({ type: "ROTATE", axis: 1, delta: (event.clientX - current.x) / Math.max(240, size.width) * 2.8 });
          dispatch({ type: "ROTATE", axis: 0, delta: (event.clientY - current.y) / Math.max(240, size.height) * 1.5 });
        }
        current.x = event.clientX; current.y = event.clientY;
      }} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
      <LaptopModel theme={theme} hingeRef={hinge} input={input} trackpad={{
        onPointerDown: (event) => {
          event.stopPropagation(); if (!active || event.button !== 0 || pad.current) return;
          pad.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          rig.locked = true; pointer.start();
          rig.wake();
          (event.target as Element).setPointerCapture?.(event.pointerId);
        },
        onPointerMove: (event) => {
          event.stopPropagation();
        },
        onPointerUp: (event) => {
          event.stopPropagation();
          (event.target as Element).releasePointerCapture?.(event.pointerId);
        },
        onPointerCancel: (event) => { event.stopPropagation(); },
      }}>
        {state.lidAngle >= 15 && state.mode !== "FOCUS_SCREEN" ? <ProjectedScreen element={screenElement} assembly={root} rig={rig} interactive={isScreenInteractive(state)} /> : null}
      </LaptopModel>
    </group>
  </>;
}

export default function WorkstationScene(props: Props) {
  return <Canvas orthographic frameloop="never" eventSource={props.sceneElement} style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }} resize={{ offsetSize: true }} dpr={[1, 1.5]} camera={{ position: [0, 3.6, 7.5], near: .1, far: 100, zoom: 100 }}
    events={(store) => ({ ...events(store), compute: (event, state) => {
      if ((event.target as Element)?.closest?.(".workstation-projected-screen")) { state.raycaster.layers.disableAll(); return; }
      state.raycaster.layers.set(0);
      const rect = state.gl.domElement.getBoundingClientRect();
      state.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, state.camera);
    } })}
    gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} onCreated={({ gl }) => {
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
