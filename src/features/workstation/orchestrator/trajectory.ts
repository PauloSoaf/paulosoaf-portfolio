/** Section stations in document pixels. The notebook is fitted to the viewport, never the reverse. */
export type Station = { id: string; left: number; top: number; width: number; height: number };
/** `top` is the first pixel below the sticky header; everything above it is off limits. */
export type Viewport = { width: number; height: number; top: number };
/** Projected silhouette per pixel of chassis width (measured from the rendered hull). */
export type Extent = { width: number; height: number };
export type FollowTarget = { x: number; y: number; width: number; pitch: number; yaw: number; roll: number; chapter: string };

export const DEFAULT_EXTENT: Extent = { width: 1.08, height: 1 };
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const viewportMargin = (viewport: Viewport) => viewport.width < 768 ? 12 : viewport.width < 1280 ? 20 : 28;

/** Largest chassis width whose whole silhouette fits the free viewport area. */
export function fitWidth(desired: number, viewport: Viewport, extent: Extent = DEFAULT_EXTENT) {
  const margin = viewportMargin(viewport);
  const byWidth = (viewport.width - margin * 2) / extent.width;
  const byHeight = (viewport.height - viewport.top - margin * 2) / extent.height;
  const max = Math.max(60, Math.min(byWidth, byHeight));
  return clamp(desired, Math.min(150, max), max);
}

/** Horizontal centre that keeps the full silhouette inside the viewport. */
export function clampX(x: number, width: number, viewport: Viewport, extent: Extent = DEFAULT_EXTENT) {
  const margin = viewportMargin(viewport), half = width * extent.width / 2;
  const min = margin + half, max = viewport.width - margin - half;
  return min > max ? viewport.width / 2 : clamp(x, min, max);
}

function stationPose(station: Station, scroll: number, viewport: Viewport, extent: Extent, pinBottom = false) {
  const fill = viewport.width < 768 ? .92 : .74;
  // Work shares space with a full card/controls. Fit the rendered silhouette to that
  // station as well as the viewport, including narrow hosts with a desktop scrollbar.
  const desired = station.id === "work" ? Math.min(station.width * fill, station.width * .98 / extent.width, station.height * .98 / extent.height) : station.width * fill;
  const width = fitWidth(desired, viewport, extent);
  const x = clampX(station.left + station.width / 2, width, viewport, extent);
  // Face the editorial content: a notebook on the right turns its screen toward the left.
  const yaw = clamp((.5 - x / viewport.width) * .5, -.22, .22);
  let y = station.top + station.height / 2 - scroll;
  // A side slot (beside the copy) may hold the notebook above the fold on short screens;
  // an in-flow slot (below the copy on tablet/mobile) must keep entering from the page edge.
  if (pinBottom && station.width < viewport.width * .7) y = Math.min(y, viewport.height - viewportMargin(viewport) - width * extent.height / 2);
  return { x, y, width, pitch: .1, yaw, roll: 0, chapter: station.id };
}

/**
 * Continuous section path. Between station centres the notebook eases from one reserved slot to
 * the next in document space: it stays with its slot (beside the content it belongs to) near
 * arrivals and departures and flies across mid-transit, never leaving more than a sliver of its
 * silhouette outside the free viewport. Before the first and after the last station it travels
 * with its anchor, so it may enter and leave through the page edge naturally.
 */
export function planTrajectory(stations: readonly Station[], scroll: number, viewport: Viewport, extent: Extent = DEFAULT_EXTENT): FollowTarget {
  if (!stations.length) return { x: viewport.width / 2, y: viewport.top + (viewport.height - viewport.top) / 2, width: fitWidth(480, viewport, extent), pitch: .1, yaw: 0, roll: 0, chapter: "hero" };
  const middle = viewport.top + (viewport.height - viewport.top) / 2;
  const line = scroll + middle;
  const centre = (station: Station) => station.top + station.height / 2;
  const first = stations[0]!, last = stations.at(-1)!;
  if (line <= centre(first)) return stationPose(first, scroll, viewport, extent, true);
  for (let index = 0; index < stations.length - 1; index++) {
    const from = stations[index]!, to = stations[index + 1]!;
    if (line > centre(to)) continue;
    const t = clamp((line - centre(from)) / Math.max(1, centre(to) - centre(from)), 0, 1), amount = smooth(t);
    const a = stationPose(from, scroll, viewport, extent), b = stationPose(to, scroll, viewport, extent);
    // Travel slightly smaller, then grow into the next composition.
    const width = (a.width + (b.width - a.width) * amount) * (1 - .1 * Math.sin(Math.PI * t));
    const x = clampX(a.x + (b.x - a.x) * amount, width, viewport, extent);
    const half = width * extent.height / 2, slack = half * .45, margin = viewportMargin(viewport);
    const low = viewport.top + margin + half - slack, high = viewport.height - margin - half + slack;
    const travel = centre(from) + (centre(to) - centre(from)) * amount - scroll;
    return {
      x, y: low > high ? middle : clamp(travel, low, high), width,
      pitch: a.pitch + (b.pitch - a.pitch) * amount, yaw: a.yaw + (b.yaw - a.yaw) * amount, roll: 0,
      chapter: t < .5 ? from.id : to.id,
    };
  }
  return stationPose(last, scroll, viewport, extent);
}
