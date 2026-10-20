export type Point = { x: number; y: number };

/** Andrew's monotone chain; returns the convex hull in clockwise screen order without collinear points. */
export function convexHull(points: readonly Point[]): Point[] {
  const sorted = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Point[] = [], upper: Point[] = [];
  for (const p of sorted) { while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0) lower.pop(); lower.push(p); }
  for (const p of [...sorted].reverse()) { while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0) upper.pop(); upper.push(p); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Push every vertex away from the centroid: a forgiving hit outline for fingers and fast cursors. */
export function expandHull(hull: readonly Point[], amount: number): Point[] {
  if (!hull.length) return [];
  const cx = hull.reduce((sum, p) => sum + p.x, 0) / hull.length, cy = hull.reduce((sum, p) => sum + p.y, 0) / hull.length;
  return hull.map((p) => { const dx = p.x - cx, dy = p.y - cy, length = Math.hypot(dx, dy) || 1; return { x: p.x + dx / length * amount, y: p.y + dy / length * amount }; });
}
