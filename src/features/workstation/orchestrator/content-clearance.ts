type Point = { x: number; y: number };
export type ReadingArea = { left: number; top: number; width: number; height: number };

/** A full-width project cannot share its reading area with an automatic floating notebook.
 * Keep the same scene alive; manual gestures and intentional screen presentations take priority.
 * Area coordinates are in the document; the rendered silhouette is in the viewport.
 */
export function needsProjectClearance(viewportWidth: number, following: boolean, presenting: boolean, points: readonly Point[], area: ReadingArea | null, scroll: number): boolean {
  if (viewportWidth >= 1024 || !following || presenting || !area || !points.length) return false;
  const left = Math.min(...points.map(point => point.x)), right = Math.max(...points.map(point => point.x));
  const top = Math.min(...points.map(point => point.y)) + scroll, bottom = Math.max(...points.map(point => point.y)) + scroll;
  return right > area.left && left < area.left + area.width && bottom > area.top && top < area.top + area.height;
}
