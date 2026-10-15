import RAPIER from "@dimforge/rapier3d-compat";
const METERS = 100;
let initialization: Promise<void> | undefined;
export const initializePhysics = () => initialization ??= RAPIER.init();

/** One planar constrained 3D rigid body and four virtual viewport walls. */
export function createViewportPhysics(width: number, height: number, sceneWidth: number, x: number, y: number) {
  const world = new RAPIER.World({ x: 0, y: 4.2, z: 0 }), events = new RAPIER.EventQueue(true);
  world.timestep = 1 / 120;
  const halfX = sceneWidth * .405 / METERS, halfY = sceneWidth * .335 / METERS;
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x / METERS, y / METERS, 0)
    .enabledTranslations(true, true, false).lockRotations().setLinearDamping(1.35).setCcdEnabled(true));
  world.createCollider(RAPIER.ColliderDesc.cuboid(halfX, halfY, .1).setMass(1.4).setRestitution(.58).setFriction(.5).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
  for (const [wallX, wallY, hx, hy] of [[-25, height / 2, 25, height], [width + 25, height / 2, 25, height], [width / 2, 45, width, 25], [width / 2, height - 44, width, 25]]) {
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx! / METERS, hy! / METERS, 2).setTranslation(wallX! / METERS, wallY! / METERS, 0).setRestitution(.58));
  }
  let remainder = 0, collisions = 0;
  return {
    hold(x: number, y: number) { body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true); body.setTranslation({ x: x / METERS, y: y / METERS, z: 0 }, true); },
    release(vx: number, vy: number) { body.setBodyType(RAPIER.RigidBodyType.Dynamic, true); body.setLinvel({ x: vx / METERS, y: vy / METERS, z: 0 }, true); },
    step(dt: number) {
      remainder = Math.min(remainder + dt, .05);
      while (remainder >= 1 / 120) { world.step(events); events.drainCollisionEvents((_a, _b, started) => { if (started) collisions++; }); remainder -= 1 / 120; }
      const p = body.translation(), v = body.linvel();
      return { x: p.x * METERS, y: p.y * METERS, vx: v.x * METERS, vy: v.y * METERS, sleeping: body.isSleeping(), collisions };
    },
    dispose() { events.free(); world.free(); },
  };
}
export type ViewportPhysics = ReturnType<typeof createViewportPhysics>;
