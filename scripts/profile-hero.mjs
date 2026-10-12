import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

// Run against an owned production server, never next dev. Raw logs stay outside Git.
const origin = process.env.QA_ORIGIN || "http://127.0.0.1:3200";
const baseline = process.env.QA_BASELINE === "1";
const output = process.env.QA_HERO_OUTPUT_DIR ?? "docs/report/S01";
const total = (entries) => entries.reduce((sum, [, value]) => sum + value.gzip, 0);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const results = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__heroShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__heroShifts.push({ value: entry.value,
          sources: entry.sources.map((source) => ({ node: source.node?.outerHTML?.slice(0, 180), before: source.previousRect.toJSON(), after: source.currentRect.toJSON() })),
        });
      }).observe({ type: "layout-shift", buffered: true });
    });
    const scripts = new Map();
    const downloads = [];
    page.on("response", (response) => {
      if (response.request().resourceType() !== "script" || !response.url().includes("/_next/")) return;
      downloads.push(response.body().then((body) => scripts.set(response.url(), { bytes: body.length, gzip: gzipSync(body).length })));
    });
    await page.goto(`${origin}/pt?heroDebug=1`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    await Promise.all(downloads);
    const initial = new Map(scripts);
    if (baseline) {
      await page.mouse.click(40, 200);
      await page.waitForTimeout(100);
      results.push({ width, initialGzipBytes: total([...initial]), initial: [...initial], vitals: await page.evaluate(() => performance.getEntriesByType("measure").filter((entry) => entry.name.startsWith("portfolio:vital:")).map((entry) => ({ name: entry.name, value: entry.duration }))) });
      await context.close(); continue;
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const art = page.locator("[data-hero-art]");
    await art.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("[data-hero-art]")?.getAttribute("data-hero-state") === "ready", { timeout: 30_000 });
    await Promise.all(downloads);
    const lazy = [...scripts].filter(([url]) => !initial.has(url));
    // A sustained real pointer stream, then return to idle. Measure observed cadence, not an invented FPS claim.
    const cadence = await page.evaluate(async () => {
      const section = document.querySelector("[data-hero]");
      const times = [];
      await new Promise((resolve) => {
        const tick = (time) => {
          times.push(time);
          section.dispatchEvent(new PointerEvent("pointermove", { clientX: 720 + Math.sin(time / 140) * 500, clientY: 350 + Math.cos(time / 190) * 200, pointerType: "mouse" }));
          if (times.length < 180) requestAnimationFrame(tick); else resolve();
        };
        requestAnimationFrame(tick);
      });
      const intervals = times.slice(1).map((value, index) => value - times[index]).sort((a, b) => a - b);
      return { observedRafHz: (times.length - 1) * 1000 / (times.at(-1) - times[0]), intervalP95Ms: intervals[Math.floor(intervals.length * 0.95)] };
    });
    const measurements = await art.evaluate((element) => ({ ...element.dataset }));
    await page.locator("[data-hero]").dispatchEvent("pointerleave");
    await page.waitForTimeout(1800);
    const idleStart = await art.getAttribute("data-hero-frames");
    await page.waitForTimeout(500);
    const idleEnd = await art.getAttribute("data-hero-frames");
    await page.locator("#contact").scrollIntoViewIfNeeded(); await page.waitForTimeout(1800);
    const companionStart = Number(await art.getAttribute("data-hero-frames"));
    await page.waitForTimeout(500);
    const companionFrames = Number(await art.getAttribute("data-hero-frames")) - companionStart;
    await page.getByRole("button", { name: "Pausar movimento", exact: true }).click(); await page.waitForTimeout(200);
    const pausedStart = Number(await art.getAttribute("data-hero-frames")); await page.waitForTimeout(500);
    const pausedFrames = Number(await art.getAttribute("data-hero-frames")) - pausedStart;
    await page.getByRole("button", { name: "Retomar movimento", exact: true }).click();
    await art.scrollIntoViewIfNeeded();
    await page.mouse.click(40, 200);
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: "Pausar movimento", exact: true }).click();
    await page.getByRole("button", { name: "Retomar movimento", exact: true }).click();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(100);
    results.push({ width, initialGzipBytes: total([...initial]), lazyGzipBytes: total(lazy), initial: [...initial], lazy,
      measurements, cadence, idleFrames: Number(idleEnd) - Number(idleStart),
      visibleAmbientFramesIn500Ms: Number(idleEnd) - Number(idleStart), visibleCompanionFramesOutsideHeroIn500Ms: companionFrames, pausedFramesIn500Ms: pausedFrames,
      layoutShifts: await page.evaluate(() => window.__heroShifts),
      vitals: await page.evaluate(() => performance.getEntriesByType("measure").filter((entry) => entry.name.startsWith("portfolio:vital:")).map((entry) => ({ name: entry.name, value: entry.duration }))),
    });
    await context.close();
  }
  await writeFile(`${output}/profile${baseline ? "-S00" : ""}.json`, JSON.stringify(results, null, 2));
  console.log(results.map((result) => ({ ...result, initial: undefined, lazy: undefined })));
} finally { await browser.close(); }
