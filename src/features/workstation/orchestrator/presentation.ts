import { clampX, fitWidth, viewportMargin, type FollowTarget, type Viewport } from "./trajectory";

export type Presentation = "context" | "preview" | "code";
/** The contextual section path remains the source of position. Reading adds a bounded pose,
 * never a scroll lock, camera cut or a second Canvas. A scalar is animated by the existing rig.
 */
export function presentationTarget(base: FollowTarget, viewport: Viewport, kind: "preview" | "code", amount: number): FollowTarget {
  if (amount <= 0) return base;
  const mix = Math.min(1, amount), extent = { width: 1.08, height: 1.02 }, margin = viewportMargin(viewport);
  const width = fitWidth(base.width * (kind === "preview" ? 1.17 : 1.1), viewport, extent);
  const half = width * extent.height / 2;
  const top = viewport.top + margin + half, bottom = viewport.height - margin - half;
  const y = top > bottom ? (viewport.top + viewport.height) / 2 : Math.max(top, Math.min(bottom, base.y));
  const lerp = (a: number, b: number) => a + (b - a) * mix;
  return { ...base, x: lerp(base.x, clampX(base.x, width, viewport, extent)), y: lerp(base.y, y), width: lerp(base.width, width),
    // With the 108° lid and the scene's .5rad view tilt, this faces the actual display at the camera.
    pitch: lerp(base.pitch, kind === "preview" ? 18 * Math.PI / 180 - .5 : .16),
    yaw: lerp(base.yaw, kind === "preview" ? 0 : -.1), roll: lerp(base.roll, 0) };
}
