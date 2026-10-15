"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  BoxGeometry, CircleGeometry, CylinderGeometry, Group, InstancedMesh, Object3D,
  Matrix4, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry,
  TorusGeometry, Color, NoBlending,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { LaptopHitTarget } from "./hit-targets";
import { NOTEBOOK_KEYS as KEYS } from "../input/keyboard-layout";
import type { NotebookInputController } from "../input/NotebookInputController";
import { createKeyLegends, createKeyMaterial } from "./key-legends";

const target = (hitTarget: LaptopHitTarget) => ({ hitTarget });
const CHASSIS = target("chassis"), LID = target("lid"), SCREEN = target("screen"), TRACKPAD = target("trackpad");
const KEYBOARD = { hitTarget: "keyboard", keys: KEYS.map(({ label }) => label) };

/** Original procedural assembly. The scene owns the root pose, camera and hinge animation. */
export function LaptopModel({ theme, hingeRef, children, input, trackpad }: {
  theme: "dark" | "light";
  hingeRef: RefObject<Group | null>;
  children?: ReactNode;
  input: NotebookInputController;
  trackpad: { onPointerDown: (event: ThreeEvent<PointerEvent>) => void; onPointerMove: (event: ThreeEvent<PointerEvent>) => void; onPointerUp: (event: ThreeEvent<PointerEvent>) => void; onPointerCancel: (event: ThreeEvent<PointerEvent>) => void };
}) {
  const keycaps = useRef<InstancedMesh>(null);
  const keyLabels = useRef<InstancedMesh>(null);
  const ports = useRef<InstancedMesh>(null);
  const feet = useRef<InstancedMesh>(null), vents = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => ({
    base: new RoundedBoxGeometry(3.6, .18, 2.35, 3, .045),
    deck: new RoundedBoxGeometry(3.52, .028, 2.27, 2, .012),
    well: new RoundedBoxGeometry(3.18, .014, 1.24, 1, .006),
    key: new RoundedBoxGeometry(1, .034, .17, 1, .012),
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
    foot: new CylinderGeometry(.11, .11, .018, 24),
    vent: new BoxGeometry(.65, .006, .018),
    lidGrip: new RoundedBoxGeometry(.5, .055, .02, 2, .008),
  }), []);
  const legends = useMemo(() => createKeyLegends(), []);
  const frameResources = useMemo(() => ({ matrix: new Matrix4(), label: new Object3D(), normal: new Color("#ffffff"), pressed: new Color("#65e6c3") }), []);
  useFrame(() => {
    const mesh = keycaps.current; if (!mesh) return;
    const now = performance.now();
    KEYS.forEach((key, index) => {
      const until = input.pressed.get(key.label) ?? 0;
      if (until && until < now) input.pressed.delete(key.label);
      const down = until >= now || (key.label === "shift" && input.shift) || (key.label === "caps" && input.caps);
      const depth = until >= now ? .024 * Math.sin(Math.PI * Math.min(1, (until - now) / 160)) : 0;
      mesh.setMatrixAt(index, frameResources.matrix.makeScale(key.width, 1, 1).setPosition(key.x, .126 - depth, key.z));
      mesh.setColorAt(index, down ? frameResources.pressed : frameResources.normal);
      const label = frameResources.label;
      label.position.set(key.x, .149 - depth, key.z); label.rotation.x = -Math.PI / 2; label.scale.set(key.width, .17, 1); label.updateMatrix();
      keyLabels.current?.setMatrixAt(index, label.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (keyLabels.current) keyLabels.current.instanceMatrix.needsUpdate = true;
  }, -2);
  const material = useMemo(() => ({
    chassis: new MeshStandardMaterial({ color: theme === "dark" ? "#26333e" : "#3d4e5b", metalness: .8, roughness: .28 }),
    deck: new MeshStandardMaterial({ color: theme === "dark" ? "#32424e" : "#465a68", metalness: .72, roughness: .34 }),
    edge: new MeshStandardMaterial({ color: "#91a0a7", metalness: .82, roughness: .3 }),
    keys: new MeshStandardMaterial({ color: "#202934", metalness: .1, roughness: .46 }),
    black: new MeshStandardMaterial({ color: "#060b10", metalness: .1, roughness: .48 }),
    glass: new MeshBasicMaterial({ color: "#0a1119" }),
    // Clear the canvas alpha at the actual display depth. Physical foreground parts
    // then occlude the DOM below the canvas, including at grazing/underside angles.
    screenHole: new MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0, blending: NoBlending, premultipliedAlpha: true, depthWrite: true, toneMapped: false }),
    accent: new MeshBasicMaterial({ color: theme === "dark" ? "#65e6c3" : "#176b63" }),
    camera: new MeshStandardMaterial({ color: "#182d3a", metalness: .72, roughness: .18 }),
    legends: createKeyMaterial(legends.texture),
  }), [theme, legends]);

  useLayoutEffect(() => {
    if (keycaps.current) {
      const matrix = new Matrix4(), color = new Color("#ffffff");
      KEYS.forEach((key, index) => {
        matrix.makeScale(key.width, 1, 1).setPosition(key.x, .126, key.z);
        keycaps.current!.setMatrixAt(index, matrix);
        keycaps.current!.setColorAt(index, color);
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
    for (const [mesh, points] of [[feet.current, [-1.35, 1.35].flatMap((x) => [-.85, .85].map((z) => [x, -.101, z]))], [vents.current, Array.from({ length: 8 }, (_, i) => [0, -.094, -.6 + i * .1])]] as const) {
      if (!mesh) continue;
      const matrix = new Matrix4();
      points.forEach(([x, y, z], index) => mesh.setMatrixAt(index, matrix.makeTranslation(x!, y!, z!)));
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    }
    const meshes = [keycaps.current, keyLabels.current, ports.current, feet.current, vents.current];
    return () => { meshes.forEach((mesh) => mesh?.dispose()); };
  }, []);
  useEffect(() => () => { Object.values(geometry).forEach((item) => item.dispose()); legends.texture.dispose(); legends.geometry.dispose(); }, [geometry, legends]);
  useEffect(() => () => { Object.values(material).forEach((item) => item.dispose()); }, [material]);

  return <group name="notebookAssembly" dispose={null}>
    <group name="base" userData={CHASSIS}>
      <mesh name="chassis" geometry={geometry.base} material={material.chassis} userData={CHASSIS} />
      <mesh name="palmRest" geometry={geometry.deck} material={material.deck} position={[0, .09, 0]} userData={CHASSIS} />
      <mesh name="keyboardRecess" geometry={geometry.well} material={material.black} position={[0, .108, -.27]} userData={KEYBOARD} />
      <instancedMesh ref={keycaps} name="keyboardLayout" args={[geometry.key, material.keys, KEYS.length]} userData={KEYBOARD}
        onPointerDown={(event) => { event.stopPropagation(); const key = KEYS[event.instanceId ?? -1]; if (key && event.button === 0) input.key(key.label); }} />
      <instancedMesh ref={keyLabels} name="keyboardLegends" args={[legends.geometry, material.legends, KEYS.length]} userData={KEYBOARD} raycast={() => {}} frustumCulled={false} />
      <group {...trackpad}>
        <mesh name="trackpadRim" geometry={geometry.trackpadRim} material={material.edge} position={[0, .109, .75]} userData={TRACKPAD} />
        <mesh name="trackpadPlane" geometry={geometry.trackpad} material={material.chassis} position={[0, .112, .75]} userData={TRACKPAD} />
      </group>
      <instancedMesh ref={ports} name="ports" args={[geometry.port, material.black, 5]} userData={CHASSIS} />
      <mesh name="frontSeam" geometry={geometry.seam} material={material.black} position={[0, -.002, 1.175]} userData={CHASSIS} />
      <instancedMesh ref={feet} name="rubberFeet" args={[geometry.foot, material.black, 4]} userData={CHASSIS} />
      <instancedMesh ref={vents} name="coolingVents" args={[geometry.vent, material.black, 8]} userData={CHASSIS} />
      {[-1.2, 1.2].map((x) => <mesh key={x} name="hingeBarrel" geometry={geometry.hinge} material={material.edge} position={[x, .12, -1.1]} rotation={[0, 0, Math.PI / 2]} userData={CHASSIS} />)}
    </group>
    <group ref={hingeRef} name="lidHinge" position={[0, .12, -1.1]} rotation={[(90 - 108) * Math.PI / 180, 0, 0]} userData={LID}>
      <mesh name="lid" geometry={geometry.lid} material={material.chassis} position={[0, 1.125, 0]} userData={LID} />
      <mesh name="displayBezel" geometry={geometry.bezel} material={material.black} position={[0, 1.16, .045]} userData={LID} />
      <mesh name="displayPlane" geometry={geometry.display} material={material.screenHole} renderOrder={100} position={[0, 1.16, .054]} userData={SCREEN} />
      <mesh name="cameraLens" geometry={geometry.camera} material={material.camera} position={[0, 2.18, .054]} userData={LID} />
      <mesh name="lidGrip" geometry={geometry.lidGrip} material={material.edge} position={[0, 2.225, .05]} userData={LID} />
      <mesh name="lidIndicator" geometry={geometry.indicator} material={material.accent} position={[0, .1, .047]} userData={LID} />
      <mesh name="lidOrbitMark" geometry={geometry.logo} material={material.edge} position={[0, 1.125, -.049]} userData={LID} />
      <group name="domScreenAnchor" position={[0, 1.16, .055]} userData={SCREEN}>{children}</group>
    </group>
  </group>;
}
