"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import {
  BoxGeometry, CanvasTexture, CircleGeometry, CylinderGeometry, Group, InstancedMesh,
  Matrix4, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace,
  TorusGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { LaptopHitTarget } from "./hit-targets";

type Key = { label: string; x: number; z: number; width: number };
type KeyUnit = readonly [label: string, width: number];
const KEY_ROWS: readonly (readonly KeyUnit[])[] = [
  [["esc", 1], ..."1234567890".split("").map((label): KeyUnit => [label, 1]), ["⌫", 2]],
  [["tab", 1.5], ..."QWERTYUIOP".split("").map((label): KeyUnit => [label, 1]), ["\\", 1.5]],
  [["caps", 1.75], ..."ASDFGHJKL".split("").map((label): KeyUnit => [label, 1]), ["enter", 2.25]],
  [["shift", 1.75], ..."ZXCVBNM,.".split("").map((label): KeyUnit => [label, 1]), ["shift", 2.25]],
  [["ctrl", 1.25], ["fn", 1], ["alt", 1.25], ["space", 5], ["alt", 1.25], ["←", 1], ["↓", 1], ["→", 1.25]],
];
const KEYS: readonly Key[] = KEY_ROWS.flatMap((row, rowIndex) => {
  let offset = -1.495;
  return row.map(([label, units]) => {
    const width = units * .23;
    const key = { label, x: offset + width / 2, z: -.76 + rowIndex * .24, width: width - .035 };
    offset += width;
    return key;
  });
});
const target = (hitTarget: LaptopHitTarget) => ({ hitTarget });
const CHASSIS = target("chassis"), LID = target("lid"), SCREEN = target("screen"), TRACKPAD = target("trackpad");
const KEYBOARD = { hitTarget: "keyboard", keys: KEYS.map(({ label }) => label) };

function createLegends() {
  // A single original atlas avoids one draw call per label or a remote font request.
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#c2cbce";
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const key of KEYS) {
      context.font = `${key.label.length > 1 ? 17 : 23}px Consolas, monospace`;
      context.fillText(key.label, (key.x + 1.59) / 3.18 * 1024, (key.z + .89) / 1.24 * 512);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Original procedural assembly. The scene owns the root pose, camera and hinge animation. */
export function LaptopModel({ theme, hingeRef, children }: {
  theme: "dark" | "light";
  hingeRef: RefObject<Group | null>;
  children?: ReactNode;
}) {
  const keycaps = useRef<InstancedMesh>(null);
  const ports = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => ({
    base: new RoundedBoxGeometry(3.6, .18, 2.35, 2, .065),
    deck: new RoundedBoxGeometry(3.52, .028, 2.27, 1, .012),
    well: new RoundedBoxGeometry(3.18, .014, 1.24, 1, .006),
    key: new RoundedBoxGeometry(1, .034, .17, 1, .012),
    labels: new PlaneGeometry(3.18, 1.24),
    trackpadRim: new RoundedBoxGeometry(1.35, .015, .56, 1, .007),
    trackpad: new RoundedBoxGeometry(1.31, .016, .52, 1, .007),
    lid: new RoundedBoxGeometry(3.6, 2.25, .085, 2, .038),
    bezel: new RoundedBoxGeometry(3.43, 2.075, .015, 1, .007),
    display: new PlaneGeometry(3.28, 1.88),
    camera: new CircleGeometry(.012, 12),
    indicator: new BoxGeometry(.17, .012, .004),
    hinge: new CylinderGeometry(.067, .067, .52, 16),
    port: new RoundedBoxGeometry(.008, .045, .16, 1, .003),
    logo: new TorusGeometry(.15, .009, 4, 40),
    seam: new BoxGeometry(2.8, .012, .006),
  }), []);
  const legends = useMemo(() => createLegends(), []);
  const material = useMemo(() => ({
    chassis: new MeshStandardMaterial({ color: theme === "dark" ? "#38434b" : "#53616b", metalness: .72, roughness: .36 }),
    deck: new MeshStandardMaterial({ color: theme === "dark" ? "#46515a" : "#69767d", metalness: .62, roughness: .4 }),
    edge: new MeshStandardMaterial({ color: "#91a0a7", metalness: .82, roughness: .3 }),
    keys: new MeshStandardMaterial({ color: "#151c23", metalness: .18, roughness: .63 }),
    black: new MeshStandardMaterial({ color: "#060b10", metalness: .1, roughness: .48 }),
    glass: new MeshBasicMaterial({ color: "#0a1119" }),
    accent: new MeshBasicMaterial({ color: theme === "dark" ? "#65e6c3" : "#176b63" }),
    camera: new MeshStandardMaterial({ color: "#182d3a", metalness: .72, roughness: .18 }),
    legends: new MeshBasicMaterial({ map: legends, transparent: true, opacity: .82, depthWrite: false, toneMapped: false }),
  }), [theme, legends]);

  useLayoutEffect(() => {
    if (keycaps.current) {
      const matrix = new Matrix4();
      KEYS.forEach((key, index) => {
        matrix.makeScale(key.width, 1, 1).setPosition(key.x, .126, key.z);
        keycaps.current!.setMatrixAt(index, matrix);
      });
      keycaps.current.instanceMatrix.needsUpdate = true;
      keycaps.current.computeBoundingSphere();
    }
    if (ports.current) {
      const matrix = new Matrix4();
      [[-1.801, -.008, -.68], [-1.801, -.008, -.38], [-1.801, -.008, -.08], [1.801, -.008, -.6], [1.801, -.008, -.3]].forEach((point, index) => {
        matrix.makeTranslation(point[0]!, point[1]!, point[2]!);
        ports.current!.setMatrixAt(index, matrix);
      });
      ports.current.instanceMatrix.needsUpdate = true;
      ports.current.computeBoundingSphere();
    }
    const keys = keycaps.current, connectors = ports.current;
    return () => { keys?.dispose(); connectors?.dispose(); };
  }, []);
  useEffect(() => () => { Object.values(geometry).forEach((item) => item.dispose()); legends.dispose(); }, [geometry, legends]);
  useEffect(() => () => { Object.values(material).forEach((item) => item.dispose()); }, [material]);

  return <group name="notebookAssembly" dispose={null}>
    <group name="base" userData={CHASSIS}>
      <mesh name="chassis" geometry={geometry.base} material={material.chassis} userData={CHASSIS} />
      <mesh name="palmRest" geometry={geometry.deck} material={material.deck} position={[0, .09, 0]} userData={CHASSIS} />
      <mesh name="keyboardRecess" geometry={geometry.well} material={material.black} position={[0, .108, -.27]} userData={KEYBOARD} />
      <instancedMesh ref={keycaps} name="keyboardLayout" args={[geometry.key, material.keys, KEYS.length]} userData={KEYBOARD} />
      <mesh name="keyboardLegends" geometry={geometry.labels} material={material.legends} position={[0, .144, -.27]} rotation={[-Math.PI / 2, 0, 0]} userData={KEYBOARD} />
      <mesh name="trackpadRim" geometry={geometry.trackpadRim} material={material.edge} position={[0, .109, .75]} userData={TRACKPAD} />
      <mesh name="trackpadPlane" geometry={geometry.trackpad} material={material.chassis} position={[0, .112, .75]} userData={TRACKPAD} />
      <instancedMesh ref={ports} name="ports" args={[geometry.port, material.black, 5]} userData={CHASSIS} />
      <mesh name="frontSeam" geometry={geometry.seam} material={material.black} position={[0, -.002, 1.175]} userData={CHASSIS} />
      {[-1.2, 1.2].map((x) => <mesh key={x} name="hingeBarrel" geometry={geometry.hinge} material={material.edge} position={[x, .12, -1.1]} rotation={[0, 0, Math.PI / 2]} userData={CHASSIS} />)}
    </group>
    <group ref={hingeRef} name="lidHinge" position={[0, .12, -1.1]} rotation={[(90 - 108) * Math.PI / 180, 0, 0]} userData={LID}>
      <mesh name="lid" geometry={geometry.lid} material={material.chassis} position={[0, 1.125, 0]} userData={LID} />
      <mesh name="displayBezel" geometry={geometry.bezel} material={material.black} position={[0, 1.16, .045]} userData={LID} />
      <mesh name="displayPlane" geometry={geometry.display} material={material.glass} position={[0, 1.16, .054]} userData={SCREEN} />
      <mesh name="cameraLens" geometry={geometry.camera} material={material.camera} position={[0, 2.18, .054]} userData={LID} />
      <mesh name="lidIndicator" geometry={geometry.indicator} material={material.accent} position={[0, .1, .047]} userData={LID} />
      <mesh name="lidOrbitMark" geometry={geometry.logo} material={material.edge} position={[0, 1.125, -.049]} userData={LID} />
      <group name="domScreenAnchor" position={[0, 1.16, .055]} userData={SCREEN}>{children}</group>
    </group>
  </group>;
}
