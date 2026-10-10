"use client";

/* eslint-disable react-hooks/immutability -- Three/R3F intentionally mutate cameras, renderer objects and refs outside React rendering. No React props/state are changed. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { BufferAttribute, BufferGeometry, Color, Euler, Group, OrthographicCamera, SphereGeometry, Vector3 } from "three";
import type { Theme } from "@/theme/theme";
import { pointerRotation, relief, seededRandom, type HeroQuality } from "./quality";
import { orbFragment, orbVertex } from "./shaders";

interface Props {
  theme: Theme; active: boolean; coarse: boolean; quality: HeroQuality;
  host: RefObject<HTMLDivElement | null>;
  onReady: () => void; onFailure: () => void; onSlow: () => void;
}

export function createOrbGeometry(segments: number): SphereGeometry {
  const geometry = new SphereGeometry(1.26, segments, Math.round(segments * 0.75));
  const position = geometry.attributes.position!;
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index), y = position.getY(index), z = position.getZ(index);
    const scale = 1 + relief(x / 1.26, y / 1.26, z / 1.26);
    position.setXYZ(index, x * scale, y * scale, z * scale);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createOrbits(segments: number): BufferGeometry {
  const vertices: number[] = [];
  const orientations = [new Euler(1.15, 0.4, -0.42), new Euler(0.85, -0.65, 0.8), new Euler(0.24, 1.08, -0.5)];
  for (const orientation of orientations) {
    for (let index = 0; index < segments; index++) {
      for (const endpoint of [index, index + 1]) {
        const theta = endpoint / segments * Math.PI * 2;
        const point = new Vector3(Math.cos(theta) * 1.9, Math.sin(theta) * 1.9, 0).applyEuler(orientation);
        vertices.push(point.x, point.y, point.z);
      }
    }
  }
  return new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
}

function createStars(count: number): BufferGeometry {
  const random = seededRandom(260610);
  const vertices = Array.from({ length: count }, () => [(random() - 0.5) * 4.5, (random() - 0.5) * 4.2, -1.8]).flat();
  return new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
}

function ProceduralOrb({ theme, quality }: Pick<Props, "theme" | "quality">) {
  const orb = useMemo(() => createOrbGeometry(quality.segments), [quality.segments]);
  const orbits = useMemo(() => createOrbits(quality.orbitSegments), [quality.orbitSegments]);
  const stars = useMemo(() => createStars(quality.stars), [quality.stars]);
  const uniforms = useMemo(() => ({
    uBase: { value: new Color(theme === "dark" ? "#060C16" : "#141D25") },
    uLight: { value: new Color(theme === "dark" ? "#243542" : "#526772") },
    uAccent: { value: new Color(theme === "dark" ? "#65E6C3" : "#176B63") },
    uLightTheme: { value: theme === "light" ? 1 : 0 },
  }), [theme]);
  useEffect(() => () => { orb.dispose(); orbits.dispose(); stars.dispose(); }, [orb, orbits, stars]);
  return <>
    <points geometry={stars}><pointsMaterial color={theme === "dark" ? "#A9B6B9" : "#53616B"} size={1.1} transparent opacity={0.35} sizeAttenuation={false} /></points>
    <mesh geometry={orb}><shaderMaterial uniforms={uniforms} vertexShader={orbVertex} fragmentShader={orbFragment} /></mesh>
    <lineSegments geometry={orbits}><lineBasicMaterial color={theme === "dark" ? "#65E6C3" : "#53616B"} transparent opacity={theme === "dark" ? 0.32 : 0.4} /></lineSegments>
    <mesh position={[1.5, 0.78, 0.5]}><sphereGeometry args={[0.023, 10, 8]} /><meshBasicMaterial color={theme === "dark" ? "#A7F8DF" : "#176B63"} /></mesh>
    <mesh position={[-1.5, -0.8, 0.25]}><sphereGeometry args={[0.015, 8, 6]} /><meshBasicMaterial color={theme === "dark" ? "#65E6C3" : "#53616B"} /></mesh>
  </>;
}

function SceneController(props: Props) {
  const { theme, quality, active, coarse, host, onReady, onFailure, onSlow } = props;
  const group = useRef<Group>(null);
  const target = useRef<[number, number]>([0, 0]);
  const initialized = useRef(false);
  const samples = useRef({ count: 0, sum: 0, slow: false, frames: 0 });
  const { gl, scene, camera, size, invalidate, advance } = useThree();
  const debug = useRef(false);
  const gpu = useRef<{ context: WebGL2RenderingContext; timer: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }; pending: WebGLQuery | null; sum: number; count: number } | null>(null);
  useEffect(() => {
    const orthographic = camera as OrthographicCamera;
    orthographic.zoom = Math.min(size.width / 4.5, size.height / 4.17);
    orthographic.updateProjectionMatrix(); invalidate();
  }, [camera, size, invalidate]);
  useEffect(() => {
    if (active) { invalidate(); return; }
    const frame = requestAnimationFrame(() => advance(performance.now() / 1000));
    return () => cancelAnimationFrame(frame);
  }, [active, theme, quality, size, advance, invalidate]);
  useEffect(() => {
    const section = host.current?.closest("[data-hero]");
    debug.current = new URLSearchParams(window.location.search).has("heroDebug");
    if (debug.current) {
      const context = gl.getContext() as WebGL2RenderingContext;
      const timer = context.getExtension("EXT_disjoint_timer_query_webgl2");
      if (timer) gpu.current = { context, timer, pending: null, sum: 0, count: 0 };
      const renderer = context.getExtension("WEBGL_debug_renderer_info");
      if (host.current) {
        host.current.dataset.heroRenderer = renderer ? String(context.getParameter(renderer.UNMASKED_RENDERER_WEBGL)) : "not exposed";
        host.current.dataset.heroGpuTimer = timer ? "available" : "unavailable";
      }
    }
    const move = (event: Event) => {
      const pointer = event as PointerEvent;
      if (!active || coarse || pointer.pointerType === "touch" || !section) return;
      const rect = section.getBoundingClientRect();
      target.current = pointerRotation((pointer.clientX - rect.left) / rect.width * 2 - 1, (pointer.clientY - rect.top) / rect.height * 2 - 1);
      invalidate();
    };
    const leave = () => { target.current = [0, 0]; if (active) invalidate(); };
    section?.addEventListener("pointermove", move, { passive: true });
    section?.addEventListener("pointerleave", leave, { passive: true });
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    gl.debug.onShaderError = (context, program, vertex, fragment) => {
      if (debug.current) console.error("Hero shader:", context.getProgramInfoLog(program), context.getShaderInfoLog(vertex), context.getShaderInfoLog(fragment));
      queueMicrotask(onFailure);
    };
    if (active) invalidate();
    return () => {
      section?.removeEventListener("pointermove", move); section?.removeEventListener("pointerleave", leave);
      gl.domElement.removeEventListener("webglcontextlost", lost);
      if (gpu.current?.pending) gpu.current.context.deleteQuery(gpu.current.pending);
      gpu.current = null;
    };
  }, [active, coarse, host, invalidate, gl, onFailure]);
  useFrame((_, delta) => {
    const object = group.current;
    if (!object) return;
    if (active) {
      const amount = 1 - Math.exp(-Math.min(delta, 0.05) * 7);
      object.rotation.x += (target.current[0] - object.rotation.x) * amount;
      object.rotation.y += (target.current[1] - object.rotation.y) * amount;
      if (Math.abs(target.current[0] - object.rotation.x) + Math.abs(target.current[1] - object.rotation.y) > 0.00015) invalidate();
    }
    const probe = gpu.current;
    if (probe?.pending && probe.context.getQueryParameter(probe.pending, probe.context.QUERY_RESULT_AVAILABLE)) {
      if (!probe.context.getParameter(probe.timer.GPU_DISJOINT_EXT)) {
        probe.sum += Number(probe.context.getQueryParameter(probe.pending, probe.context.QUERY_RESULT)) / 1e6;
        probe.count++;
      }
      probe.context.deleteQuery(probe.pending); probe.pending = null;
    }
    const query = probe && !probe.pending ? probe.context.createQuery() : null;
    if (probe && query) probe.context.beginQuery(probe.timer.TIME_ELAPSED_EXT, query);
    const start = performance.now(); gl.render(scene, camera);
    const cpu = performance.now() - start;
    if (probe && query) { probe.context.endQuery(probe.timer.TIME_ELAPSED_EXT); probe.pending = query; }
    const stats = samples.current; stats.frames++;
    if (stats.frames > 5) { stats.count++; stats.sum += cpu; }
    if (!stats.slow && stats.count >= 30 && stats.sum / stats.count > 18 && quality.name !== "mobile") {
      stats.slow = true; queueMicrotask(onSlow);
    }
    if (debug.current && host.current) {
      host.current.dataset.heroFrames = String(stats.frames);
      host.current.dataset.heroRotation = `${object.rotation.x.toFixed(5)},${object.rotation.y.toFixed(5)}`;
      host.current.dataset.heroDrawCalls = String(gl.info.render.calls);
      host.current.dataset.heroTriangles = String(gl.info.render.triangles);
      host.current.dataset.heroGeometries = String(gl.info.memory.geometries);
      host.current.dataset.heroCpuMs = (stats.sum / Math.max(stats.count, 1)).toFixed(3);
      host.current.dataset.heroDpr = String(gl.getPixelRatio());
      if (probe?.count) host.current.dataset.heroGpuMs = (probe.sum / probe.count).toFixed(3);
    }
    if (!initialized.current) {
      initialized.current = true; performance.mark("portfolio:hero-first-frame"); queueMicrotask(onReady);
    }
  }, 1);
  return <group ref={group} position={[0.06, 0.12, 0]} rotation={[-0.045, -0.075, 0]}><ProceduralOrb theme={theme} quality={quality} /></group>;
}

export default function HeroScene(props: Props) {
  return <Canvas orthographic camera={{ position: [0, 0, 7], near: 0.1, far: 30 }}
    dpr={[1, Math.min(window.devicePixelRatio || 1, props.quality.dpr)]} frameloop={props.active ? "demand" : "never"}
    gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} fallback={null}
    onCreated={({ gl, advance }) => {
      gl.setClearColor(0x000000, 0);
      if (!props.active) requestAnimationFrame(() => advance(performance.now() / 1000));
    }}>
    <SceneController {...props} />
  </Canvas>;
}
