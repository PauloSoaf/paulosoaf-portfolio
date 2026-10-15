export const HIT_TARGETS = ["chassis", "lid", "keyboard", "trackpad", "screen"] as const;
export type LaptopHitTarget = (typeof HIT_TARGETS)[number];

function isTarget(value: unknown): value is LaptopHitTarget {
  return typeof value === "string" && HIT_TARGETS.some((target) => target === value);
}

/** Classify the actual raycast object. Never inherit a chassis target from its parents. */
export function identifyHitTarget(hit: unknown): LaptopHitTarget | null {
  if (isTarget(hit)) return hit;
  if (typeof hit !== "object" || hit === null) return null;

  // Both Three intersections and R3F events expose the nearest mesh as `object`.
  // Limit traversal so cyclic/untrusted event-shaped values fail closed.
  let object: unknown = hit;
  const visited = new Set<object>();
  for (let depth = 0; depth < 3; depth++) {
    if (typeof object !== "object" || object === null || visited.has(object)) return null;
    visited.add(object);
    const record = object as Record<string, unknown>;
    if ("object" in record) {
      object = record.object;
      continue;
    }
    const data = record.userData;
    if (typeof data !== "object" || data === null) return null;
    const target = (data as Record<string, unknown>).hitTarget;
    return isTarget(target) ? target : null;
  }
  return null;
}

/** Screen and input surfaces must never start a chassis rotation gesture. */
export function canRotateFromHit(hit: unknown): boolean {
  const target = identifyHitTarget(hit);
  return target === "chassis" || target === "lid";
}
