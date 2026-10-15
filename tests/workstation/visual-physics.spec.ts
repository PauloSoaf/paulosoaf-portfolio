import { test, expect, type Page } from "@playwright/test";
const host = (page: Page) => page.locator("[data-workstation]");
async function open(page: Page) {
  await page.goto("/pt/workstation-lab");
  if (page.viewportSize()!.width < 1280) await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
}
async function tool(page: Page, name: string) {
  await page.locator(".workstation-tools summary").click();
  await page.locator(`[data-notebook-tool="${name}"]`).click();
}
async function grip(page: Page) {
  const point = (await host(page).getAttribute("data-drag-point"))!.split(",").map(Number), rect = (await page.locator("canvas").boundingBox())!;
  return { x: rect.x + point[0]! * rect.width / 800, y: rect.y + point[1]! * rect.height / 620 };
}
async function drag(page: Page, dx: number, dy: number, stop = false) {
  const point = await grip(page); await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 8 });
  if (stop) await page.waitForTimeout(230);
  await page.mouse.up();
}
async function alignment(page: Page) {
  await expect.poll(() => host(page).evaluate((node) => {
    const screen = document.querySelector<HTMLElement>(".workstation-projected-screen")!;
    const expected = node.dataset.physicalDisplayCorners!.split(";").map((p) => p.split(",").map(Number));
    const matrix = new DOMMatrix(screen.style.transform);
    return Math.max(...[[0, 0], [800, 0], [0, 458.5366]].map(([x, y], i) => {
      const point = matrix.transformPoint(new DOMPoint(x, y)); return Math.hypot(point.x - expected[i]![0]!, point.y - expected[i]![1]!);
    }));
  })).toBeLessThan(.25);
  expect(await page.locator(".workstation-scene").evaluate((node) => getComputedStyle(node).overflow)).toBe("hidden");
}
test("native drag moves, release throws against Rapier walls, then rejoins scroll", async ({ page }) => {
  test.setTimeout(90_000); await open(page);
  expect(await host(page).getAttribute("data-physics")).toBe("deferred");
  const before = (await host(page).getAttribute("data-trajectory"))!.split(",").map(Number);
  await drag(page, -130, -45, true);
  await expect(host(page)).toHaveAttribute("data-manipulation", "FREE");
  await expect(host(page)).toHaveAttribute("data-physics", "ready");
  const moved = (await host(page).getAttribute("data-trajectory"))!.split(",").map(Number);
  expect(moved[1]!).toBeLessThan(before[1]! - 100);
  expect(Number(await host(page).getAttribute("data-throw-speed"))).toBe(0);
  await drag(page, -120, -30);
  await expect(host(page)).toHaveAttribute("data-manipulation", "FLYING");
  await expect.poll(async () => Number(await host(page).getAttribute("data-collisions")), { timeout: 20_000 }).toBeGreaterThan(0);
  await expect(host(page)).toHaveAttribute("data-manipulation", "FREE", { timeout: 35_000 });
  await expect(page.locator(".workstation-projected-screen")).not.toHaveAttribute("inert", "");
  await page.locator(".workstation-rejoin").click();
  await expect(host(page)).toHaveAttribute("data-manipulation", "FOLLOW");
  await expect(host(page)).toHaveAttribute("data-physics", "deferred");
  await expect(host(page)).toHaveAttribute("data-motion", "settled");
  await alignment(page);
});
test("rotation and hinge drag stay distinct from translation, display matches real mesh at extremes", async ({ page }) => {
  await open(page); await page.locator('[data-input-action="notes"]').click();
  await page.locator("textarea").fill("Tela presa ao notebook");
  await tool(page, "rotate");
  const before = await host(page).getAttribute("data-pose");
  await drag(page, -210, -350);
  await expect.poll(() => host(page).getAttribute("data-pose")).not.toBe(before);
  await expect(host(page)).toHaveAttribute("data-motion", "settled"); await alignment(page);
  expect(await host(page).getAttribute("data-manipulation")).toBe("FOLLOW");
  await page.locator(".workstation-controls button").nth(5).click();
  await expect(host(page)).toHaveAttribute("data-motion", "settled"); await tool(page, "rotate");
  await drag(page, 0, 140);
  for (let turn = 0; turn < 6; turn++) await page.locator(".workstation-controls button").nth(3).click();
  await expect(host(page)).toHaveAttribute("data-motion", "settled"); await alignment(page);
  const corners = (await host(page).getAttribute("data-physical-display-corners"))!.split(";").map((p) => p.split(",").map(Number));
  for (const [x, y] of corners) { expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(800); expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(620); }
  await page.locator(".workstation-controls button").nth(5).click();
  await expect(host(page)).toHaveAttribute("data-motion", "settled");
  await page.locator('[data-input-action="notes"]').click(); await tool(page, "lid");
  await drag(page, 0, 150, true);
  await expect.poll(async () => Number(await host(page).getAttribute("data-lid-rendered"))).toBeLessThan(30);
  await page.locator(".workstation-controls button").nth(1).click();
  await expect.poll(async () => Number(await host(page).getAttribute("data-lid-rendered"))).toBeLessThan(.1);
  await page.locator(".workstation-controls button").nth(1).click();
  await expect.poll(async () => Number(await host(page).getAttribute("data-lid-rendered"))).toBeGreaterThan(107.9);
  await expect(page.locator("textarea")).toHaveValue("Tela presa ao notebook"); await alignment(page);
});
test("keyboard inspection retains real key input; Escape and resize cancel manual ownership", async ({ page }) => {
  await open(page); await page.locator('[data-input-action="notes"]').click();
  await page.locator(".workstation-tools summary").click(); await page.locator("[data-keyboard-view]").click();
  await expect(host(page)).toHaveAttribute("data-motion", "settled");
  const key = await host(page).evaluate((node) => JSON.parse(node.dataset.keyPoints!).find((key: { label: string }) => key.label === "A") as { x: number; y: number });
  const box = (await page.locator("canvas").boundingBox())!;
  await page.mouse.click(box.x + key.x * box.width / 800, box.y + key.y * box.height / 620);
  await expect(page.locator("textarea")).toHaveValue("a"); await alignment(page);
  const point = await grip(page); await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x - 70, point.y - 30); await expect(host(page)).toHaveAttribute("data-manipulation", "DRAG");
  await page.keyboard.press("Escape"); await page.mouse.up(); await expect(host(page)).toHaveAttribute("data-manipulation", "FREE");
  await page.setViewportSize({ width: 1360, height: 900 });
  await expect(host(page)).toHaveAttribute("data-manipulation", "FOLLOW");
  await expect(host(page)).toHaveAttribute("data-motion", "settled");
  await expect(page.locator("canvas")).toHaveCount(1);
});
test("touch manipulation is explicit and returns to native page scrolling", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage(); await open(page); const cdp = await context.newCDPSession(page);
    await tool(page, "move"); const start = await page.evaluate(() => scrollY), point = await grip(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x - step * 3, y: point.y - step * 10 }] });
    await page.waitForTimeout(220); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(host(page)).toHaveAttribute("data-manipulation", "FREE");
    expect(await page.evaluate(() => scrollY)).toBe(start);
    await page.locator(".workstation-rejoin").click(); await expect(host(page)).toHaveAttribute("data-manipulation", "FOLLOW");
    await expect(page.locator(".workstation-scene")).toHaveCSS("touch-action", "pan-y");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
test("Rapier WASM is scoped to the lab CSP and remains absent before a drag", async ({ page, request }) => {
  const chunks: string[] = []; page.on("request", (r) => { if (r.resourceType() === "script") chunks.push(r.url()); });
  await open(page);
  expect(await host(page).getAttribute("data-physics")).toBe("deferred");
  expect((await request.get("/pt/workstation-lab")).headers()["content-security-policy"]).toContain("'wasm-unsafe-eval'");
  expect((await request.get("/pt?experience=recovery")).headers()["content-security-policy"]).not.toContain("'wasm-unsafe-eval'");
  expect(chunks.length).toBeGreaterThan(0);
});
test("failed physics chunk keeps manual positioning and the owned screen usable", async ({ page }) => {
  await open(page);
  await page.route("**/_next/static/chunks/*.js", (route) => route.abort());
  await drag(page, -100, -30);
  await expect(host(page)).toHaveAttribute("data-physics", "unavailable");
  await expect(host(page)).toHaveAttribute("data-manipulation", "FREE");
  await page.locator('[data-input-action="notes"]').click(); await page.locator("textarea").fill("Input remains available");
  await expect(page.locator("textarea")).toHaveValue("Input remains available");
  await page.locator(".workstation-rejoin").click(); await expect(host(page)).toHaveAttribute("data-manipulation", "FOLLOW");
});
test("explicit 3D with reduced motion moves directly without loading physics or flight", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/pt/workstation-lab");
  await page.locator(".workstation-controls button").last().click();
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
  await drag(page, -100, -30);
  await expect(host(page)).toHaveAttribute("data-manipulation", "FREE");
  expect(await host(page).getAttribute("data-physics")).toBe("deferred");
  expect(Number(await host(page).getAttribute("data-throw-speed"))).toBe(0);
});
test("missing studio asset keeps a lit model and working native screen", async ({ page }) => {
  await page.route("**/studio-pmrem-v1.bin.gz", (route) => route.abort()); await open(page);
  await expect(host(page)).toHaveAttribute("data-studio", "fallback");
  await page.locator('[data-input-action="notes"]').click(); await page.locator("textarea").fill("Environment fallback");
  await expect(page.locator("textarea")).toHaveValue("Environment fallback");
  await page.locator(".workstation-controls button").first().click(); await expect(page.locator("dialog textarea")).toHaveValue("Environment fallback");
});
