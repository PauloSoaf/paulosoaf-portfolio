import { expect } from "@playwright/test";

export const host = (page) => page.locator("[data-workstation]");
export const screen = (page) => page.locator(".workstation-projected-screen [data-workstation-screen]");
export async function waitScreenBoot(page) {
  await screen(page).evaluate((node) => Promise.allSettled(node.getAnimations({ subtree: true })
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished)));
}
export async function settle(page) {
  // React actions/anchor changes schedule the next rig frame. Do not accept the previous
  // frame's "settled" flag or reuse projected hit points before those actions have rendered.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(host(page)).toHaveAttribute("data-body", "FOLLOW", { timeout: 35_000 });
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 45_000 });
}
export async function open(page, origin, locale = "pt", manual = false) {
  await page.goto(`${origin}/${locale}`);
  await page.evaluate(() => document.fonts.ready);
  if (page.viewportSize().width < 1280) await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  if (manual) await page.getByRole("button", { name: "Ativar notebook 3D", exact: true }).click();
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
  await settle(page);
}
export async function point(page, name) {
  const value = await host(page).getAttribute(`data-${name}`);
  if (!value) throw new Error(`Missing P02 hit point: ${name}`);
  const [x, y] = value.split(",").map(Number);
  return { x, y }; // P02 points are viewport pixels; do not apply P01's 800×620 scale.
}
export async function menu(page) {
  const grip = await point(page, "drag-point");
  await page.mouse.click(grip.x, grip.y, { button: "right" });
  await expect(page.getByRole("menu")).toBeVisible();
  return page.getByRole("menu");
}
export async function wheelTo(page, selector) {
  const target = await page.locator(selector).evaluate((node) => { const rect = node.getBoundingClientRect(); return scrollY + rect.top + rect.height / 2 - innerHeight / 2; });
  await page.mouse.move(8, 420);
  // Readable native wheel pace, below the intentional fast-brake threshold.
  for (let step = 0; step < 100; step++) {
    const delta = target - await page.evaluate(() => scrollY);
    if (Math.abs(delta) < 3) break;
    await page.mouse.wheel(0, Math.sign(delta) * Math.min(230, Math.abs(delta)));
    await page.waitForTimeout(120);
  }
  await settle(page);
}
export async function brake(page, direction = 1) {
  // Synthetic native-scroll trajectory, explicitly NOT a physical wheel/trackpad acceptance.
  return page.evaluate((direction) => new Promise((resolve, reject) => {
    let last = performance.now(), velocity = 0, lastRig = 0, fastFirst = 0, fastFrames = 0;
    const start = last, samples = [];
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      const node = document.querySelector("[data-workstation]");
      const time = Number(node.dataset.trajectory.split(",")[0]), observed = Math.abs(Number(node.dataset.scrollVelocity));
      if (time !== lastRig) {
        lastRig = time;
        samples.push({ time, velocity: observed, scrollY });
        if (observed >= 3000) { if (!fastFrames) fastFirst = time; fastFrames++; }
        else { fastFirst = 0; fastFrames = 0; }
        // Validate the input's sustained phase from actual sampled scroll, rather than assuming
        // a fixed 420ms gesture contained enough frames on a software renderer. Never change time,
        // rig state, speed thresholds or the brake itself. Three samples span > the 110ms contract.
        if (fastFrames >= 3 && time - fastFirst >= 160) { resolve({ samples, durationMs: now - start }); return; }
      }
      if (now - start > 1800) { reject(new Error(`Fast-scroll input was not sustained: ${JSON.stringify(samples)}`)); return; }
      velocity = Math.min(5200, velocity + 30000 * dt);
      scrollBy({ top: direction * velocity * dt, behavior: "instant" });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), direction);
}
export async function sample(page) {
  return host(page).evaluate((node) => {
    const screen = document.querySelector(".workstation-projected-screen");
    let alignmentErrorPx = null;
    if (screen && node.dataset.physicalDisplayCorners) {
      const expected = node.dataset.physicalDisplayCorners.split(";").map((p) => p.split(",").map(Number));
      const matrix = new DOMMatrix(getComputedStyle(screen).transform);
      alignmentErrorPx = Math.max(...[[0, 0], [800, 0], [0, 458.5366]].map(([x, y], index) => {
        const actual = matrix.transformPoint(new DOMPoint(x, y));
        return Math.hypot(actual.x - expected[index][0], actual.y - expected[index][1]);
      }));
    }
    return { ...node.dataset, alignmentErrorPx, overflow: document.documentElement.scrollWidth > innerWidth, canvases: document.querySelectorAll("canvas").length };
  });
}
