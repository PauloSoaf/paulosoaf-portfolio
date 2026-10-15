import type { Pose } from "./position";
export type Station = { id: string; left: number; top: number; width: number; height: number };
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const orientations = [[.08, -.14, .012], [.10, .12, -.012], [.12, 0, .008], [.10, -.14, -.012], [.10, .08, .012], [.08, -.1, 0]] as const;

/** Continuous section path. No nearest-anchor switch or discontinuous viewport y clamp. */
export function planTrajectory(stations: readonly Station[], scroll: number, width: number, height: number): Pose & { chapter: string } {
  const center = scroll + height * .5;
  const pose = (station: Station, index: number): Pose & { chapter: string } => ({ x: station.left, y: station.top - scroll, width: station.width,
    pitch: (orientations[index] ?? orientations[0])[0], yaw: (orientations[index] ?? orientations[0])[1], roll: (orientations[index] ?? orientations[0])[2], chapter: station.id });
  if (center <= stations[0]!.top + stations[0]!.height / 2) return pose(stations[0]!, 0);
  for (let index = 0; index < stations.length - 1; index++) {
    const first = stations[index]!, last = stations[index + 1]!;
    const from = first.top + first.height / 2, to = last.top + last.height / 2;
    if (center > to) continue;
    const t = Math.max(0, Math.min(1, (center - from) / (to - from))), amount = smooth(t);
    const a = pose(first, index), b = pose(last, index + 1), result = { ...a };
    for (const key of ["x", "width", "pitch", "yaw", "roll"] as const) result[key] = a[key] + (b[key] - a[key]) * amount;
    // Keep the vertical transport coherent with native scroll. Sweep along the outer lane
    // only across full-width editorial chapters; Hero/Work share the right-hand composition.
    result.y = height * .5 - (first.height + (last.height - first.height) * amount) / 2;
    if (index > 0 || width < 1280) {
      const outboard = width + result.width * .35;
      result.x += Math.sin(Math.PI * t) ** 2 * Math.max(0, outboard - result.x);
    }
    result.chapter = t < .5 ? first.id : last.id;
    return result;
  }
  return pose(stations.at(-1)!, stations.length - 1);
}
