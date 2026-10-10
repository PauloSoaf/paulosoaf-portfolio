import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3202";
const browser = await chromium.launch();
const results = [];
await mkdir("docs/report/S02", { recursive: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const scripts = new Map(), pending = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "script" && response.url().includes("/_next/")) {
        pending.push(response.body().then((body) => scripts.set(response.url(), { bytes: body.length, gzip: gzipSync(body).length })));
      }
    });
    await page.addInitScript(() => {
      window.__carouselShifts = [];
      window.__carouselPhase = "initial";
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__carouselShifts.push({ value: entry.value,
          startTime: entry.startTime, phase: window.__carouselPhase,
          sources: entry.sources.map((source) => ({ node: source.node?.outerHTML?.slice(0, 140),
            before: source.previousRect.toJSON(), after: source.currentRect.toJSON() })) });
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${origin}/pt`); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(700);
    await Promise.all(pending);
    const initial = [...scripts];
    const count = await page.locator("[data-carousel]").count();
    const transitions = [];
    if (count) {
      await page.evaluate(() => { window.__carouselPhase = "scroll-to-work"; });
      await page.locator(".carousel-stage").evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.evaluate(() => { window.__carouselPhase = "motion-preference"; });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.locator(".carousel-stage").focus();
      await page.evaluate(() => { window.__carouselPhase = "manual-transitions"; });
      for (let i = 0; i < 4; i++) {
        // A trusted click supplies the real Event Timing / INP interaction.
        await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
        transitions.push(await page.evaluate(async () => {
          const times = [], transforms = new Set();
          await new Promise((resolve) => {
            const tick = (time) => {
              times.push(time);
              transforms.add(getComputedStyle(document.querySelector('.carousel-slide[data-active="true"]')).transform);
              if (time - times[0] < 650) requestAnimationFrame(tick); else resolve();
            }; requestAnimationFrame(tick);
          });
          const intervals = times.slice(1).map((time, i) => time - times[i]).sort((a, b) => a - b);
          return { observedRafHz: 1000 * intervals.length / intervals.reduce((sum, value) => sum + value, 0),
            intervalP95Ms: intervals[Math.floor(intervals.length * .95)], uniqueTransforms: transforms.size,
            selectedProject: document.querySelector('.carousel-slide[data-active="true"]').getAttribute("data-project") };
        }));
      }
    }
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(100);
    results.push({ width, mode: count ? "editorial-preview" : "public-empty", initialGzipBytes: initial.reduce((sum, [, script]) => sum + script.gzip, 0),
      initial, transitions, canvasCount: await page.locator("canvas").count(),
      vitals: await page.evaluate(() => performance.getEntriesByType("measure").filter((entry) => entry.name.startsWith("portfolio:vital:")).map((entry) => ({ name: entry.name, value: entry.duration }))),
      layoutShifts: await page.evaluate(() => window.__carouselShifts),
    });
    await page.close();
  }
  const sample = process.env.QA_PUBLIC_SAMPLE === "1" ? "-public" : "";
  await writeFile(`docs/report/S02/profile-carousel${sample}.json`, JSON.stringify(results, null, 2));
  console.log(results.map((result) => ({ ...result, initial: undefined, layoutShifts: undefined })));
} finally { await browser.close(); }
