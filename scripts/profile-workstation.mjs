import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300", output = "docs/report/Workstation/performance";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
try {
  for (const width of [390, 1440]) for (const path of ["/pt", "/pt/workstation-lab"]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "no-preference" });
    const scripts = new Map(), pending = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "script" && response.url().includes("/_next/")) pending.push(response.body().then((body) => scripts.set(response.url(), gzipSync(body).length)).catch(() => {}));
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
      window.workstationVitals = { shifts: [], lcp: [] };
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.workstationVitals.shifts.push(entry.value); }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.workstationVitals.lcp.push(entry.startTime); }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto(`${origin}${path}`); await page.evaluate(() => document.fonts.ready);
    await page.locator('[data-carousel][data-enhanced="true"]').waitFor();
    await page.waitForTimeout(700); await Promise.all(pending);
    const initialGzipBytes = [...scripts.values()].reduce((a, b) => a + b, 0);
    let scene = null;
    if (path.includes("workstation")) {
      await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.locator(".workstation-controls button").last().click();
      await page.locator('[data-workstation][data-scene="ready"]').waitFor();
      for (let index = 0; index < 6; index++) { await page.locator(".workstation-controls button").nth(index % 2 ? 2 : 3).click(); await page.waitForTimeout(150); }
      await page.waitForTimeout(1600);
      const before = Number(await page.locator("[data-workstation]").getAttribute("data-frames")); await page.waitForTimeout(600);
      scene = await page.locator("[data-workstation]").evaluate((node) => ({ ...node.dataset }));
      scene.idleFrames600ms = Number(scene.frames) - before;
      await page.locator(".workstation-controls button").first().click();
      await page.locator("dialog .workbench-apps button").first().click();
      await page.frameLocator("iframe").locator("input").fill("Performance sample"); await page.frameLocator("iframe").locator("button").click();
      await page.locator("dialog .workstation-focus-heading button").click();
    }
    await Promise.all(pending);
    const totalGzipBytes = [...scripts.values()].reduce((a, b) => a + b, 0);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const measurements = await page.evaluate(() => ({ ...window.workstationVitals,
      cls: window.workstationVitals.shifts.reduce((a, b) => a + b, 0),
      vitals: performance.getEntriesByType("measure").filter((entry) => entry.name.startsWith("portfolio:vital:")).map((entry) => ({ name: entry.name, value: entry.duration })),
      firstFrame: performance.getEntriesByName("portfolio:workstation-first-frame")[0]?.startTime,
      paints: performance.getEntriesByType("paint").map((entry) => ({ name: entry.name, time: entry.startTime })) }));
    results.push({ width, path, initialGzipBytes, lazyGzipBytes: totalGzipBytes - initialGzipBytes, scene, ...measurements }); await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/profile.json`, JSON.stringify({ environment: "Windows / Chromium / SwiftShader; unthrottled laboratory; Save-Data isolates initial/lazy JS; CPU gl.render timing is not GPU FPS", results }, null, 2) + "\n");
console.log(results.map(({ width, path, initialGzipBytes, lazyGzipBytes, cls, vitals, scene }) => ({ width, path, initialGzipBytes, lazyGzipBytes, cls, vitals, idleFrames: scene?.idleFrames600ms, renderCpuMs: scene?.renderCpuMs })));
