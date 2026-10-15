"use client";
/* eslint-disable react-hooks/immutability -- R3F camera/mesh/DOM transforms are mutable render resources. */
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type Dispatch, type ReactNode, type RefObject } from "react";
import { Group, OrthographicCamera, Vector3 } from "three";
import { LaptopModel } from "../models/LaptopModel.client";
import { canRotateFromHit } from "../models/hit-targets";
import { isScreenInteractive, type WorkstationEvent, type WorkstationState } from "../state/workstation-machine";

interface Props {
  state: WorkstationState; dispatch: Dispatch<WorkstationEvent>; theme: "dark" | "light";
  active: boolean; reduced: boolean; screen: ReactNode;
  host: RefObject<HTMLDivElement | null>;
  screenElement: RefObject<HTMLDivElement | null>;
  onReady: () => void; onFailure: () => void;
}

/** Orthographic alternative: the three projected corners define an exact affine plane. */
function ProjectedScreen({ element }: { element: Props["screenElement"] }) {
  const anchor = useRef<Group>(null);
  const { camera, size } = useThree();
  const points = useMemo(() => [new Vector3(), new Vector3(), new Vector3()], []);
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
    element.current.style.visibility = frontFacing ? "visible" : "hidden";
    element.current.inert = !frontFacing;
  });
  return <group ref={anchor} />;
}

function Assembly(props: Props) {
  const { state, dispatch, theme, active, reduced, screen, screenElement, host, onReady, onFailure } = props;
  const root = useRef<Group>(null), hinge = useRef<Group>(null);
  const gesture = useRef<{ id: number; x: number; y: number; started: boolean } | null>(null);
  const frames = useRef(0), started = useRef(false);
  const handlePoint = useMemo(() => new Vector3(), []);
  const { camera, size, gl, invalidate } = useThree();
  useEffect(() => {
    const view = camera as OrthographicCamera;
    view.position.set(0, 3.6, 7.5); view.lookAt(0, .7, 0);
    view.zoom = Math.min(size.width / 5.3, size.height / 4.2);
    view.updateProjectionMatrix(); invalidate();
  }, [camera, size, invalidate]);
  // The DOM layer is committed after the first GL frame; repaint its matrix when that view mounts.
  useEffect(() => { if (active) invalidate(); }, [state, theme, active, screen, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useEffect(() => {
    const cancel = () => { gesture.current = null; dispatch({ type: "END_ROTATE" }); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    window.addEventListener("blur", cancel); window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", cancel); window.addEventListener("keydown", keyboard);
    return () => { window.removeEventListener("blur", cancel); window.removeEventListener("resize", cancel); document.removeEventListener("visibilitychange", cancel); window.removeEventListener("keydown", keyboard); };
  }, [dispatch]);
  useFrame((_, rawDelta) => {
    if (!root.current || !hinge.current) return;
    const delta = Math.min(rawDelta, .05), amount = reduced ? 1 : 1 - Math.exp(-delta * 12);
    const target = [-.08 + state.rotation[0], -.28 + state.rotation[1], .025 + state.rotation[2]];
    let moving = false;
    for (const [i, axis] of ["x", "y", "z"].entries()) {
      const key = axis as "x" | "y" | "z", current = root.current.rotation[key], desired = target[i]!;
      root.current.rotation[key] = Math.abs(desired - current) < .0002 ? desired : current + (desired - current) * amount;
      moving ||= Math.abs(desired - root.current.rotation[key]) >= .0002;
    }
    const angle = (90 - state.lidAngle) * Math.PI / 180;
    hinge.current.rotation.x = Math.abs(angle - hinge.current.rotation.x) < .0002 ? angle : hinge.current.rotation.x + (angle - hinge.current.rotation.x) * amount;
    moving ||= Math.abs(angle - hinge.current.rotation.x) >= .0002;
    if (active && moving) invalidate();
    if (host.current) {
      host.current.dataset.frames = String(++frames.current);
      host.current.dataset.lidRendered = (90 - hinge.current.rotation.x * 180 / Math.PI).toFixed(2);
      host.current.dataset.pose = [root.current.rotation.x, root.current.rotation.y, root.current.rotation.z].map((n) => n.toFixed(4)).join(",");
      host.current.dataset.drawCalls = String(gl.info.render.calls);
      host.current.dataset.triangles = String(gl.info.render.triangles);
      root.current.updateWorldMatrix(true, false);
      handlePoint.set(1.4, .11, .75).applyMatrix4(root.current.matrixWorld).project(camera);
      host.current.dataset.dragPoint = `${(handlePoint.x + 1) * size.width / 2},${(1 - handlePoint.y) * size.height / 2}`;
      for (const [name, z] of [["keyboardPoint", -.27], ["trackpadPoint", .75]] as const) {
        handlePoint.set(0, .15, z).applyMatrix4(root.current.matrixWorld).project(camera);
        host.current.dataset[name] = `${(handlePoint.x + 1) * size.width / 2},${(1 - handlePoint.y) * size.height / 2}`;
      }
    }
    if (!started.current) { started.current = true; performance.mark("portfolio:workstation-first-frame"); onReady(); }
  });
  const finish = (event: ThreeEvent<PointerEvent>) => {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null; dispatch({ type: "END_ROTATE" });
    (event.target as Element).releasePointerCapture?.(event.pointerId);
  };
  return <>
    <ambientLight intensity={1.5} />
    <directionalLight position={[2, 5, 5]} intensity={3.5} color="#d8e6f0" />
    <directionalLight position={[-4, 2, -2]} intensity={2.2} color="#82b4ae" />
    <group ref={root} position={[0, -.45, 0]} rotation={[-.08, -.28, .025]}
      onPointerDown={(event) => {
        if (!active || state.mode === "FOCUS_SCREEN" || event.button !== 0) return;
        // Stop the ray here even for input surfaces: otherwise a second chassis intersection
        // beneath a key/trackpad could incorrectly start the same gesture.
        event.stopPropagation();
        if (!canRotateFromHit(event)) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, started: false };
      }}
      onPointerMove={(event) => {
        const current = gesture.current; if (!current || current.id !== event.pointerId) return;
        const dx = event.clientX - current.x, dy = event.clientY - current.y;
        if (!current.started && Math.abs(dy) > Math.max(8, Math.abs(dx))) { gesture.current = null; return; }
        if (!current.started && Math.abs(dx) <= 8) return;
        if (!current.started) { current.started = true; (event.target as Element).setPointerCapture?.(event.pointerId); dispatch({ type: "BEGIN_ROTATE" }); }
        event.stopPropagation();
        dispatch({ type: "ROTATE", axis: 1, delta: (event.clientX - current.x) / Math.max(240, size.width) * 2.8 });
        dispatch({ type: "ROTATE", axis: 0, delta: (event.clientY - current.y) / Math.max(240, size.height) * 1.5 });
        current.x = event.clientX; current.y = event.clientY;
      }} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
      <LaptopModel theme={theme} hingeRef={hinge}>
        {isScreenInteractive(state) && state.mode !== "FOCUS_SCREEN" ? <ProjectedScreen element={screenElement} /> : null}
      </LaptopModel>
    </group>
  </>;
}

export default function WorkstationScene(props: Props) {
  return <Canvas orthographic frameloop={props.active ? "demand" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 3.6, 7.5], near: .1, far: 100, zoom: 100 }}
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
