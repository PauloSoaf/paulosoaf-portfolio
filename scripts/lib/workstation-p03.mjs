import { host, point, settle } from "./workstation-p02.mjs";

/** Locator auto-scroll can move the original position of a sticky header. Use its visible
 * native coordinates, as a person does, so changing theme does not become a page-scroll test. */
export async function togglePortfolioTheme(page) {
  const compact = page.viewportSize().width < 1024;
  const click = async (locator) => {
    const box = await locator.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > page.viewportSize().height) throw new Error("Theme control is outside the visible viewport");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  if (compact) await click(menu);
  const theme = page.locator("header .theme-toggle").filter({ visible: true }); await theme.waitFor();
  await click(theme);
  if (compact) await click(menu);
  await settle(page);
}

/** Real CDP mouse/touch events at native timestamps. Never writes rig state or changes time. */
export async function circularGesture(page, { touch = false, turns = 2, steps = 64, interval = 22, release = true } = {}) {
  await page.mouse.move(8, 420); await settle(page);
  const grip = await point(page, "drag-point"), pose = (await host(page).getAttribute("data-trajectory")).split(",").map(Number);
  const centre = { x: pose[1], y: pose[2] }, radius = Math.hypot(grip.x - centre.x, grip.y - centre.y), start = Math.atan2(grip.y - centre.y, grip.x - centre.x);
  const cdp = await page.context().newCDPSession(page), sent = [];
  await page.evaluate(() => {
    const node = document.querySelector("[data-workstation]");
    const trace = { held: null, observer: null };
    trace.observer = new MutationObserver(() => { if (node.dataset.body === "HELD") trace.held = { ...node.dataset }; });
    trace.observer.observe(node, { attributes: true }); window.p03HeldTrace = trace;
  });
  const event = async (kind, p) => {
    sent.push({ kind, ...p, at: Date.now() });
    if (touch) await cdp.send("Input.dispatchTouchEvent", { type: kind === "start" ? "touchStart" : kind === "end" ? "touchEnd" : "touchMove", touchPoints: kind === "end" ? [] : [{ ...p, id: 1 }] });
    else await cdp.send("Input.dispatchMouseEvent", { type: kind === "start" ? "mousePressed" : kind === "end" ? "mouseReleased" : "mouseMoved", ...p, button: "left", buttons: kind === "end" ? 0 : 1, clickCount: 1 });
  };
  await page.mouse.move(grip.x, grip.y); await event("start", grip);
  if (touch) await page.waitForTimeout(420);
  const pending = [];
  for (let i = 1; i <= steps; i++) {
    const angle = start + i / steps * Math.PI * 2 * turns;
    pending.push(event("move", { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) }));
    // Schedule native input at a real wall-clock cadence, independently of slow DevTools acks.
    // Serial Playwright waits can stretch a one-second wind-up into a minute on SwiftShader.
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  // Let go on the actual input cadence, before diagnostics/DevTools round trips can turn the
  // release into a deliberate pause (which correctly removes momentum in the product).
  if (release) pending.push(event("end", { x: centre.x + radius * Math.cos(start + turns * Math.PI * 2), y: centre.y + radius * Math.sin(start + turns * Math.PI * 2) }));
  await Promise.all(pending);
  const held = await page.evaluate(() => { const trace = window.p03HeldTrace; trace.observer.disconnect(); return trace.held ?? { ...document.querySelector("[data-workstation]").dataset }; });
  return { centre, radius, held, sent };
}

/** Native browser coordinates through the iframe's uniform fit and the outer 3D projection. */
export async function nativeSitePoint(page, x, y) {
  return page.locator(".workstation-projected-screen").evaluate((node, point) => {
    const iframe = node.querySelector("iframe"), fit = new DOMMatrix(getComputedStyle(iframe).transform);
    const projection = new DOMMatrix(getComputedStyle(node).transform);
    const p = projection.multiply(fit).transformPoint(new DOMPoint(point.x, point.y));
    return { x: p.x, y: p.y };
  }, { x, y });
}
