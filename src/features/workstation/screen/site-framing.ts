/** Native iframe layout, uniformly fitted into the owned display. Browser hit testing applies
 * both this transform and the existing projected display transform; no click proxy is involved.
 */
export function siteFrame(width: number, height: number, preferredWidth: number, projected: boolean) {
  const w = Number.isFinite(width) && width > 0 ? width : 800;
  const h = Number.isFinite(height) && height > 0 ? height : 458.5366;
  const logicalWidth = projected ? Math.max(w, preferredWidth) : w;
  const scale = w / logicalWidth;
  return { width: logicalWidth, height: h / scale, scale };
}
