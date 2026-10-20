import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { host, screen, settle, point, sample } from "./lib/workstation-p02.mjs";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_WORKSTATION_PROFILE_OUTPUT ?? "docs/report/Workstation/P02.1/performance";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "no-preference" });
    const scripts = new Map(), pending = [], errors = []; let studioAssetBytes = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.request().resourceType() === "script" && response.url().includes("/_next/")) pending.push(response.body().then((body) => scripts.set(response.url(), gzipSync(body).length)).catch(() => {}));
      if (response.url().endsWith("studio-pmrem-v1.bin.gz")) pending.push(response.body().then((body) => { studioAssetBytes = body.length; }));
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
      window.p02Profile = { action: "bootstrap", shifts: [], longTasks: [], events: [], lcp: [] };
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.p02Profile.shifts.push({ value: e.value, time: e.startTime }); }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.p02Profile.lcp.push({ time: e.startTime, element: e.element?.id || e.element?.tagName }); }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.p02Profile.longTasks.push({ time: e.startTime, duration: e.duration, action: window.p02Profile.action }); }).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.interactionId) window.p02Profile.events.push({ name: e.name, interaction: e.interactionId, time: e.startTime, duration: e.duration, inputDelay: e.processingStart - e.startTime, processing: e.processingEnd - e.processingStart, action: window.p02Profile.action, target: e.target?.id || e.target?.className }); }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    });
    const action = (name) => page.evaluate((name) => { window.p02Profile.action = name; }, name);
    const bytes = async () => { await Promise.all(pending); return [...scripts.values()].reduce((a, b) => a + b, 0); };
    await page.goto(`${origin}/pt/workstation-lab`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('[data-carousel][data-enhanced="true"]').waitFor(); await page.waitForTimeout(700);
    const initialGzipBytes = await bytes();
    expect(await page.locator("canvas").count()).toBe(0);
    await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await action("enable-3d"); const enableStart = Date.now();
    await page.getByRole("button", { name: "Ativar notebook 3D", exact: true }).click();
    await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 }); await settle(page);
    const sceneReadyAndSettledMs = Date.now() - enableStart, afterSceneBytes = await bytes();
    const grip = await point(page, "drag-point");
    await action("drag-and-throw"); await page.mouse.move(grip.x, grip.y); await page.mouse.down();
    await page.mouse.move(grip.x - Math.min(200, width * .3), grip.y - 50, { steps: 10 }); await page.mouse.up(); await settle(page);
    const afterThrowBytes = await bytes();
    await action("open-code"); await screen(page).locator('[data-input-action="code"]').click();
    const codeRoot = page.locator("[data-code-app]"); await codeRoot.waitFor();
    const afterCodeBytes = await bytes();
    await action("switch-source"); await codeRoot.getByRole("button", { name: "body.ts", exact: true }).click();
    await expect(codeRoot.locator(".workbench-ide-path")).toContainText("physics/body.ts");
    // On mobile, opening Code intentionally enters focus mode.
    const focused = await page.locator("dialog").isVisible();
    if (focused) await page.keyboard.press("Escape");
    await settle(page);
    await action("focus-screen"); await screen(page).locator('[data-input-action="focus"]').click();
    const dialog = page.locator("dialog"); await expect(dialog).toBeVisible();
    await dialog.locator('[data-input-action="close"]').click();
    await action("open-notes"); await dialog.locator('[data-input-action="notes"]').click();
    await action("type-notes"); await dialog.locator("textarea").pressSequentially("P02 interaction timing", { delay: 45 });
    await action("close-focus"); await page.keyboard.press("Escape"); await settle(page);
    await page.mouse.move(4, 4); await settle(page); await page.waitForTimeout(150);
    const frames = Number(await host(page).getAttribute("data-frames")); await page.waitForTimeout(600);
    const scene = await sample(page), idleFrames600ms = Number(scene.frames) - frames;
    expect(idleFrames600ms).toBe(0); expect(errors).toEqual([]);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(50);
    const measurements = await page.evaluate(() => ({ ...window.p02Profile,
      vitals: performance.getEntriesByType("measure").filter((e) => e.name.startsWith("portfolio:vital:")).map((e) => ({ name: e.name, value: e.duration })),
      firstFrame: performance.getEntriesByName("portfolio:workstation-first-frame")[0]?.startTime }));
    results.push({ width, initialGzipBytes, sceneLazyGzipBytes: afterSceneBytes - initialGzipBytes, throwLazyGzipBytes: afterThrowBytes - afterSceneBytes, codeLazyGzipBytes: afterCodeBytes - afterThrowBytes,
      studioAssetBytes, sceneReadyAndSettledMs, idleFrames600ms, scene, errors, resources: [...scripts].map(([url, gzipBytes]) => ({ path: new URL(url).pathname, gzipBytes })), ...measurements });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/profile.json`, JSON.stringify({ environment: "Windows/Chromium/SwiftShader, cold contexts, unthrottled CPU/network; Save-Data isolates bootstrap from explicit 3D activation. INP is the Next/web-vitals value for this local scripted visit, not a field p75. Enable time includes loading and spring settling. CPU render time is not GPU FPS. Videos and Lighthouse run separately.", results }, null, 2) + "\n");
console.log(results.map(({ width, initialGzipBytes, sceneLazyGzipBytes, throwLazyGzipBytes, codeLazyGzipBytes, idleFrames600ms, vitals }) => ({ width, initialGzipBytes, sceneLazyGzipBytes, throwLazyGzipBytes, codeLazyGzipBytes, idleFrames600ms, vitals })));
