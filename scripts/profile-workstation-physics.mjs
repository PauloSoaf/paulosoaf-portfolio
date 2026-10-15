import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_WORKSTATION_PROFILE_OUTPUT ?? "docs/report/Workstation/P01.2/performance";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "no-preference" });
    const scripts = new Map(), pending = []; let studioAssetBytes = 0;
    page.on("response", (response) => {
      if (response.request().resourceType() === "script" && response.url().includes("/_next/")) pending.push(response.body().then((body) => scripts.set(response.url(), gzipSync(body).length)).catch(() => {}));
      if (response.url().endsWith("studio-pmrem-v1.bin.gz")) pending.push(response.body().then((body) => { studioAssetBytes = body.length; }));
    });
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } }));
    await page.goto(`${origin}/pt/workstation-lab`); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800); await Promise.all(pending);
    const initialGzip = [...scripts.values()].reduce((a, b) => a + b, 0);
    await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    const enableStart = Date.now(); await page.locator(".workstation-controls button").last().click();
    const host = page.locator("[data-workstation]"); await host.and(page.locator('[data-scene="ready"][data-motion="settled"]')).waitFor();
    const sceneReadyAfterEnableMs = Date.now() - enableStart;
    await Promise.all(pending); const sceneGzip = [...scripts.values()].reduce((a, b) => a + b, 0), beforeChunks = new Set(scripts.keys());
    const beforePhysics = await host.getAttribute("data-physics");
    const point = (await host.getAttribute("data-drag-point")).split(",").map(Number), rect = await page.locator("canvas").boundingBox();
    const x = rect.x + point[0] * rect.width / 800, y = rect.y + point[1] * rect.height / 620;
    await page.mouse.move(x, y); await page.mouse.down(); const start = Date.now();
    await page.mouse.move(x - 65, y - 15, { steps: 4 });
    await host.and(page.locator('[data-physics="ready"]')).waitFor(); const physicsReadyAfterDragMs = Date.now() - start;
    await page.waitForTimeout(230); await page.mouse.up();
    await Promise.all(pending); const totalGzip = [...scripts.values()].reduce((a, b) => a + b, 0);
    const resources = [...scripts].filter(([url]) => !beforeChunks.has(url)).map(([url, gzipBytes]) => ({ path: new URL(url).pathname, gzipBytes }));
    await page.locator(".workstation-rejoin").click();
    await host.and(page.locator('[data-manipulation="FOLLOW"][data-motion="settled"]')).waitFor();
    const frames = Number(await host.getAttribute("data-frames")); await page.waitForTimeout(600);
    const scene = await host.evaluate((node) => ({ drawCalls: Number(node.dataset.drawCalls), triangles: Number(node.dataset.triangles), renderCpuMs: Number(node.dataset.renderCpuMs), frames: Number(node.dataset.frames), physics: node.dataset.physics }));
    if (scene.frames !== frames) throw new Error(`${width}: renderer did not remain idle after following settled`);
    results.push({ width, initialGzipBytes: initialGzip, sceneLazyGzipBytes: sceneGzip - initialGzip, studioAssetBytes, sceneReadyAfterEnableMs, physicsLazyGzipBytes: totalGzip - sceneGzip, physicsReadyAfterDragMs, beforePhysics, afterFollowPhysics: scene.physics, physicsResources: resources, scene: { ...scene, idleFrames600ms: scene.frames - frames } });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/physics-profile.json`, JSON.stringify({ environment: "Windows/Chromium/SwiftShader, cold page, Save-Data isolates bootstrap; gzip per resource. Readiness includes pointer automation/network/WASM, not an isolated benchmark or field percentile.", results }, null, 2) + "\n");
console.log(results);
