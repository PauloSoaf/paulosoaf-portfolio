"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group } from "three";
import type { Theme } from "@/theme/theme";
import { seededRandom, type HeroQuality } from "./quality";
import { orbVertex } from "./shaders";

/** Three open, warped ribbons. The negative centre and changing profiles replace the sphere. */
export function createRibbon(segments: number, layer: number): BufferGeometry {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [], across = 4;
  for (let i = 0; i <= segments; i++) for (let j = 0; j <= across; j++) {
    const u = .24 + i / segments * (Math.PI * 2 - .64), v = j / across - .5;
    const radius = 1.22 + layer * .15 + v * (.48 - layer * .09) + .14 * Math.sin(3 * u + layer);
    positions.push(Math.cos(u) * radius, Math.sin(u) * radius * .88, .32 * Math.sin(2 * u + layer) + v * .28 * Math.cos(3 * u));
    uv.push(i / segments, j / across);
    if (i < segments && j < across) {
      const a = i * (across + 1) + j, b = a + across + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function particles(count: number): BufferGeometry {
  const random = seededRandom(110026), points: number[] = [];
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2, radius = 1.6 + random() * .75;
    points.push(Math.cos(theta) * radius, Math.sin(theta) * radius * .8, (random() - .5) * 1.8);
  }
  return new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
}
const metalFragment = /* glsl */ `
  uniform vec3 uBase; uniform vec3 uLight; uniform vec3 uAccent;
  varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
  void main(){
    vec3 n=normalize(vNormal); if(!gl_FrontFacing)n=-n;
    vec3 l=normalize(vec3(-.7,.85,1.2)); vec3 eye=normalize(vView);
    float diffuse=max(0.,dot(n,l));
    float spec=pow(max(0.,dot(reflect(-l,n),eye)),22.);
    float edge=pow(1.-abs(dot(n,eye)),2.8);
    float field=vPosition.y*45.+sin(vPosition.x*8.+vPosition.z*4.)*2.;
    float line=1.-smoothstep(.035,.035+max(fwidth(field),.025),abs(fract(field)-.5));
    vec3 color=mix(uBase,uLight,.18+diffuse*.62)+uLight*(spec*.8+edge*.27+line*.10);
    color+=uAccent*edge*.035;
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
export function RecoverySculpture({ theme, quality, active }: { theme: Theme; quality: HeroQuality; active: boolean }) {
  const layers = useRef<Group>(null), field = useRef<Group>(null), time = useRef(0);
  const geometries = useMemo(() => [0, 1, 2].map(layer => createRibbon(quality.segments * 2, layer)), [quality.segments]);
  const stars = useMemo(() => particles(quality.stars * 3), [quality.stars]);
  const uniforms = useMemo(() => ({ uBase: { value: new Color(theme === "dark" ? "#141B20" : "#233038") }, uLight: { value: new Color(theme === "dark" ? "#A9B6B9" : "#879A9E") }, uAccent: { value: new Color(theme === "dark" ? "#65E6C3" : "#176B63") } }), [theme]);
  useEffect(() => () => { geometries.forEach(geometry => geometry.dispose()); stars.dispose(); }, [geometries, stars]);
  useFrame((_, delta) => {
    if (!active) return;
    time.current += Math.min(delta, .1);
    layers.current?.children.forEach((layer, index) => {
      layer.rotation.z = [-.3, .7, -1.1][index]! + time.current * [.075, -.055, .035][index]!;
      layer.rotation.y = [.05, .9, -.8][index]! + Math.sin(time.current * .28 + index) * .12;
    });
    if (field.current) field.current.rotation.z = time.current * -.025;
  });
  return <>
    <group ref={field}><points geometry={stars}><pointsMaterial color={theme === "dark" ? "#A9B6B9" : "#53616B"} size={1.8} sizeAttenuation={false} transparent opacity={.55} /></points></group>
    <group ref={layers}>
      {geometries.map((geometry, index) => <mesh key={index} geometry={geometry} rotation={[[.25, .05, -.3], [1.15, .9, .7], [.55, -.8, -1.1]][index] as [number, number, number]} scale={1 - index * .12}>
        <shaderMaterial uniforms={uniforms} vertexShader={orbVertex} fragmentShader={metalFragment} side={DoubleSide} />
      </mesh>)}
    </group>
    <mesh rotation={[.2, .5, .3]}><octahedronGeometry args={[.12, 0]} /><meshBasicMaterial color={theme === "dark" ? "#65E6C3" : "#176B63"} /></mesh>
    <mesh position={[1.8, .5, .2]}><octahedronGeometry args={[.035, 0]} /><meshBasicMaterial color={theme === "dark" ? "#F2F6F4" : "#53616B"} /></mesh>
  </>;
}
