import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = "docs/report/CreativeRecovery";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, hasTouch: width === 390, isMobile: width === 390, reducedMotion: "no-preference" });
    const page = await context.newPage(); await page.goto(`${origin}/pt?heroDebug=1`);
    await page.waitForFunction(() => document.querySelector("[data-hero-art]")?.getAttribute("data-hero-state") === "ready");
    results.push(await page.evaluate(width => ({ width, firstFrameMs: performance.getEntriesByName("portfolio:hero-first-frame")[0]?.startTime,
      paints: performance.getEntriesByType("paint").map(entry => ({ name: entry.name, timeMs: entry.startTime })),
      quality: document.querySelector("[data-hero-art]")?.getAttribute("data-hero-quality") }), width));
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/automatic-load.json`, JSON.stringify({ renderer: "Chromium SwiftShader", throttled: false, results }, null, 2) + "\n");
console.log(results);
