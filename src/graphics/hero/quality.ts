export interface HeroQuality {
  name: "mobile" | "tablet" | "desktop";
  dpr: number;
  segments: number;
  orbitSegments: number;
  stars: number;
}

export function heroQuality(width: number, constrained = false): HeroQuality {
  if (width < 640 || constrained) return { name: "mobile", dpr: 1, segments: 40, orbitSegments: 96, stars: 40 };
  if (width < 1024) return { name: "tablet", dpr: 1.25, segments: 56, orbitSegments: 128, stars: 64 };
  return { name: "desktop", dpr: 1.5, segments: 72, orbitSegments: 160, stars: 90 };
}

export function constrainedDevice({ saveData, cores, memory }: { saveData?: boolean; cores?: number; memory?: number }): boolean {
  return saveData === true || (cores !== undefined && cores <= 2) || (memory !== undefined && memory <= 2);
}

export const PARALLAX_LIMIT = 0.1;
export function pointerRotation(x: number, y: number): [number, number] {
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  return [clamp(y) * PARALLAX_LIMIT, clamp(x) * PARALLAX_LIMIT];
}

/** Continuous, deterministic field; evaluated once per vertex, never each frame. */
export function relief(x: number, y: number, z: number): number {
  return Math.sin(x * 4.1 + z * 2.7) * Math.cos(y * 5.3 - z * 1.8) * 0.018
    + Math.sin(x * 10.2 + y * 8.7 + z * 6.4) * 0.006;
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
