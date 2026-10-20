"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture, CircleGeometry, Color, CylinderGeometry, ExtrudeGeometry, Group, InstancedMesh,
  Matrix4, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, NoBlending, Object3D,
  PlaneGeometry, Shape, ShapeGeometry, TorusGeometry, type Material,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { LaptopHitTarget } from "./hit-targets";
import { NOTEBOOK_KEYS as KEYS } from "../input/keyboard-layout";
import type { NotebookInputController } from "../input/NotebookInputController";
import { createKeyLegends, createKeyMaterial } from "./key-legends";

const target = (hitTarget: LaptopHitTarget) => ({ hitTarget });
const CHASSIS = target("chassis"), LID = target("lid"), SCREEN = target("screen"), TRACKPAD = target("trackpad");
const KEYBOARD = { hitTarget: "keyboard", keys: KEYS.map(({ label }) => label) };

/** Physical dimensions in scene units. The DOM screen projects onto DISPLAY (800×458.54 px). */
export const BASE = { width: 3.6, depth: 2.4, thickness: .15, top: .075 } as const;
export const HINGE = { y: .15, z: -1.13 } as const;
export const DISPLAY = { width: 3.28, height: 1.88, y: 1.2, z: .029 } as const;
/** Rest-pose centre of the open notebook; the stage rotates around it. */
export const PIVOT: [number, number, number] = [0, -1.1, .32];
const KEY_Y = BASE.top + .016;

function roundedRect(width: number, height: number, radius: number) {
  const x = -width / 2, y = -height / 2, r = Math.min(radius, width / 2, height / 2), shape = new Shape();
  shape.moveTo(x + r, y); shape.lineTo(x + width - r, y); shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r); shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}
/** Rounded slab with a fine bevel: generous plan radius, crisp machined edge. */
function slab(width: number, depth: number, thickness: number, radius: number, bevel: number, horizontal: boolean) {
  const geometry = new ExtrudeGeometry(roundedRect(width - bevel * 2, depth - bevel * 2, radius), {
    depth: thickness - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 14,
  });
  geometry.translate(0, 0, -(thickness - bevel * 2) / 2);
  if (horizontal) geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}
function flat(width: number, height: number, radius: number) {
  const geometry = new ShapeGeometry(roundedRect(width, height, radius), 14);
  return geometry;
}
function ring(width: number, height: number, radius: number, line: number) {
  const outer = roundedRect(width, height, radius), inner = roundedRect(width - line * 2, height - line * 2, Math.max(0, radius - line));
  outer.holes.push(inner); return new ShapeGeometry(outer, 14);
}
function shadowTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!, gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,.9)"); gradient.addColorStop(.55, "rgba(0,0,0,.45)"); gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

/** Original procedural assembly. The scene owns the root pose, the hinge angle and the display material. */
export function LaptopModel({ theme, hingeRef, displayRef, children, input }: {
  theme: "dark" | "light";
  hingeRef: RefObject<Group | null>;
  displayRef: RefObject<{ hole: Material; glass: Material } | null>;
  children?: ReactNode;
  input: NotebookInputController;
}) {
  const keycaps = useRef<InstancedMesh>(null), keyLabels = useRef<InstancedMesh>(null);
  const feet = useRef<InstancedMesh>(null), grille = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => ({
    base: slab(BASE.width, BASE.depth, BASE.thickness, .2, .028, true),
    lid: slab(BASE.width, 2.36, .05, .2, .016, false),
    well: flat(3.12, 1.3, .06),
    key: new RoundedBoxGeometry(1, .026, .18, 2, .011),
    trackpad: flat(1.46, .7, .07),
    trackpadEdge: ring(1.46, .7, .07, .012),
    bezel: flat(3.5, 2.22, .14),
    display: new PlaneGeometry(DISPLAY.width, DISPLAY.height),
    camera: new CircleGeometry(.016, 16),
    hinge: new CylinderGeometry(.068, .068, 2.7, 24),
    logo: new TorusGeometry(.17, .012, 8, 48),
    logoDot: new CircleGeometry(.05, 24),
    foot: new CylinderGeometry(.12, .12, .014, 24),
    hole: new CircleGeometry(.0085, 6),
    notch: flat(.56, .06, .03),
    led: new CircleGeometry(.012, 12),
    shadow: new PlaneGeometry(4.5, 3.3),
  }), []);
  const legends = useMemo(() => createKeyLegends(), []);
  const shadow = useMemo(() => shadowTexture(), []);
  const frame = useMemo(() => ({ matrix: new Matrix4(), label: new Object3D(), normal: new Color("#ffffff"), pressed: new Color("#65e6c3") }), []);
  const dark = theme === "dark";
  const material = useMemo(() => {
    const metal = { metalness: .78, roughness: .38, clearcoat: .14, clearcoatRoughness: .5 };
    return {
      chassis: new MeshPhysicalMaterial({ ...metal, color: dark ? "#2b3036" : "#c4c9cf" }),
      lidBack: new MeshPhysicalMaterial({ ...metal, roughness: .3, color: dark ? "#2d3238" : "#c8cdd3" }),
      hinge: new MeshStandardMaterial({ color: dark ? "#1d2126" : "#9aa1a8", metalness: .8, roughness: .38 }),
      well: new MeshStandardMaterial({ color: "#090b0e", metalness: .2, roughness: .8 }),
      keys: new MeshStandardMaterial({ color: "#0f1215", metalness: .12, roughness: .62 }),
      trackpad: new MeshPhysicalMaterial({ color: dark ? "#23272c" : "#b4b9bf", metalness: .55, roughness: .2, clearcoat: .7, clearcoatRoughness: .2 }),
      trackpadEdge: new MeshBasicMaterial({ color: dark ? "#5b646d" : "#e9ecef", transparent: true, opacity: .55, toneMapped: false }),
      bezel: new MeshPhysicalMaterial({ color: "#040608", metalness: .1, roughness: .12, clearcoat: 1, clearcoatRoughness: .08 }),
      // Clear the canvas alpha at the display depth, so the DOM screen below shows through and
      // physical foreground parts still occlude it at grazing angles.
      hole: new MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0, blending: NoBlending, premultipliedAlpha: true, depthWrite: true, toneMapped: false }),
      glass: new MeshPhysicalMaterial({ color: "#05080b", metalness: 0, roughness: .06, clearcoat: 1, clearcoatRoughness: .04 }),
      dark: new MeshBasicMaterial({ color: "#07090c", toneMapped: false }),
      accent: new MeshBasicMaterial({ color: dark ? "#65e6c3" : "#1d8a7d", toneMapped: false }),
      logo: new MeshPhysicalMaterial({ color: dark ? "#9aa5ae" : "#eef1f3", metalness: 1, roughness: .12, clearcoat: 1 }),
      foot: new MeshStandardMaterial({ color: "#0b0d10", roughness: .9 }),
      shadow: new MeshBasicMaterial({ color: "#000000", alphaMap: shadow, transparent: true, opacity: dark ? .55 : .3, depthWrite: false, toneMapped: false }),
      legends: createKeyMaterial(legends.texture),
    };
  }, [dark, legends, shadow]);
  useLayoutEffect(() => { displayRef.current = { hole: material.hole, glass: material.glass }; }, [displayRef, material]);

  useFrame((_, delta) => {
    const mesh = keycaps.current; if (!mesh) return;
    const now = performance.now(), dt = Math.min(delta, .05), jolts = input.jolts;
    KEYS.forEach((key, index) => {
      const until = input.pressed.get(key.label) ?? 0;
      if (until && until < now) input.pressed.delete(key.label);
      const down = until >= now || (key.label === "shift" && input.shift) || (key.label === "caps" && input.caps);
      const jolt = jolts[index];
      if (jolt && (jolt.offset || jolt.velocity)) {
        jolt.velocity += (-260 * jolt.offset - 14 * jolt.velocity) * dt; jolt.offset += jolt.velocity * dt;
        if (Math.abs(jolt.offset) < .0004 && Math.abs(jolt.velocity) < .004) { jolt.offset = 0; jolt.velocity = 0; }
      }
      const lift = Math.max(0, jolt?.offset ?? 0) - (until >= now ? .018 * Math.sin(Math.PI * Math.min(1, (until - now) / 160)) : 0);
      mesh.setMatrixAt(index, frame.matrix.makeScale(key.width, 1, 1).setPosition(key.x, KEY_Y + lift, key.z));
      mesh.setColorAt(index, down ? frame.pressed : frame.normal);
      const label = frame.label;
      label.position.set(key.x, KEY_Y + .0135 + lift, key.z); label.rotation.x = -Math.PI / 2; label.scale.set(key.width, .18, 1); label.updateMatrix();
      keyLabels.current?.setMatrixAt(index, label.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (keyLabels.current) keyLabels.current.instanceMatrix.needsUpdate = true;
  }, -2);

  useLayoutEffect(() => {
    if (keycaps.current) {
      const matrix = new Matrix4(), color = new Color("#ffffff");
      KEYS.forEach((key, index) => { keycaps.current!.setMatrixAt(index, matrix.makeScale(key.width, 1, 1).setPosition(key.x, KEY_Y, key.z)); keycaps.current!.setColorAt(index, color); });
      keycaps.current.instanceMatrix.needsUpdate = true; keycaps.current.computeBoundingSphere();
    }
    if (feet.current) {
      const matrix = new Matrix4();
      [-1.4, 1.4].flatMap((x) => [-.9, .9].map((z) => [x, z] as const)).forEach(([x, z], index) => feet.current!.setMatrixAt(index, matrix.makeTranslation(x, -BASE.thickness / 2 - .007, z)));
      feet.current.instanceMatrix.needsUpdate = true; feet.current.computeBoundingSphere();
    }
    if (grille.current) {
      const matrix = new Matrix4(), rotation = new Matrix4().makeRotationX(-Math.PI / 2);
      let index = 0;
      for (const side of [-1, 1]) for (let col = 0; col < 3; col++) for (let row = 0; row < 22; row++) {
        grille.current.setMatrixAt(index++, matrix.makeTranslation(side * (1.585 + col * .045), BASE.top + .0012, -.88 + row * .05).multiply(rotation));
      }
      grille.current.instanceMatrix.needsUpdate = true; grille.current.computeBoundingSphere();
    }
    const meshes = [keycaps.current, keyLabels.current, feet.current, grille.current];
    return () => { meshes.forEach((mesh) => mesh?.dispose()); };
  }, []);
  useEffect(() => () => { Object.values(geometry).forEach((item) => item.dispose()); legends.texture.dispose(); legends.geometry.dispose(); shadow.dispose(); }, [geometry, legends, shadow]);
  useEffect(() => () => { Object.values(material).forEach((item) => item.dispose()); }, [material]);

  const flatX = -Math.PI / 2;
  return <group name="notebookAssembly" dispose={null}>
    <mesh name="contactShadow" geometry={geometry.shadow} material={material.shadow} rotation={[flatX, 0, 0]} position={[0, -BASE.thickness / 2 - .02, .05]} renderOrder={-1} raycast={() => {}} />
    <group name="base" userData={CHASSIS}>
      <mesh name="chassis" geometry={geometry.base} material={material.chassis} userData={CHASSIS} />
      <mesh name="keyboardRecess" geometry={geometry.well} material={material.well} rotation={[flatX, 0, 0]} position={[0, BASE.top + .0008, -.28]} userData={KEYBOARD} />
      <instancedMesh ref={keycaps} name="keyboardLayout" args={[geometry.key, material.keys, KEYS.length]} userData={KEYBOARD} />
      <instancedMesh ref={keyLabels} name="keyboardLegends" args={[legends.geometry, material.legends, KEYS.length]} userData={KEYBOARD} raycast={() => {}} frustumCulled={false} />
      <instancedMesh ref={grille} name="speakerGrille" args={[geometry.hole, material.dark, 132]} userData={CHASSIS} raycast={() => {}} />
      <mesh name="trackpadPlane" geometry={geometry.trackpad} material={material.trackpad} rotation={[flatX, 0, 0]} position={[0, BASE.top + .0012, .74]} userData={TRACKPAD} />
      <mesh name="trackpadEdge" geometry={geometry.trackpadEdge} material={material.trackpadEdge} rotation={[flatX, 0, 0]} position={[0, BASE.top + .0016, .74]} userData={TRACKPAD} raycast={() => {}} />
      <mesh name="frontNotch" geometry={geometry.notch} material={material.dark} rotation={[flatX, 0, 0]} position={[0, BASE.top + .0008, BASE.depth / 2 - .06]} userData={CHASSIS} raycast={() => {}} />
      <mesh name="statusLed" geometry={geometry.led} material={material.accent} rotation={[flatX, 0, 0]} position={[1.42, BASE.top + .0012, BASE.depth / 2 - .08]} userData={CHASSIS} raycast={() => {}} />
      <instancedMesh ref={feet} name="rubberFeet" args={[geometry.foot, material.foot, 4]} userData={CHASSIS} raycast={() => {}} />
      <mesh name="hingeBarrel" geometry={geometry.hinge} material={material.hinge} position={[0, HINGE.y - .04, HINGE.z]} rotation={[0, 0, Math.PI / 2]} userData={CHASSIS} />
    </group>
    <group ref={hingeRef} name="lidHinge" position={[0, HINGE.y, HINGE.z]} rotation={[(90 - 108) * Math.PI / 180, 0, 0]} userData={LID}>
      <mesh name="lid" geometry={geometry.lid} material={material.lidBack} position={[0, 1.15, 0]} userData={LID} />
      <mesh name="displayBezel" geometry={geometry.bezel} material={material.bezel} position={[0, 1.18, .0262]} userData={LID} />
      <mesh name="displayPlane" geometry={geometry.display} material={material.hole} renderOrder={100} position={[0, DISPLAY.y, DISPLAY.z]} userData={SCREEN} />
      <mesh name="cameraLens" geometry={geometry.camera} material={material.dark} position={[0, 2.215, .0275]} userData={LID} raycast={() => {}} />
      <group name="lidBackMark" position={[0, 1.18, -.0262]} rotation={[0, Math.PI, 0]}>
        <mesh name="lidOrbitMark" geometry={geometry.logo} material={material.logo} userData={LID} raycast={() => {}} />
        <mesh name="lidOrbitDot" geometry={geometry.logoDot} material={material.accent} userData={LID} raycast={() => {}} />
      </group>
      <group name="domScreenAnchor" position={[0, DISPLAY.y, DISPLAY.z + .001]} userData={SCREEN}>{children}</group>
    </group>
  </group>;
}
