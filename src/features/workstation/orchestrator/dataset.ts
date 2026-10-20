/** Write data-* only on change: CSS attribute selectors would otherwise restyle every frame. */
export function setData(node: HTMLElement, values: Record<string, string>) {
  const data = node.dataset;
  for (const key in values) if (data[key] !== values[key]) data[key] = values[key];
}
