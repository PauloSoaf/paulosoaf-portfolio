import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3202";
const publicSample = process.env.QA_PUBLIC_SAMPLE === "1";
const output = process.env.QA_MOTION_OUTPUT_DIR ?? "docs/report/S03";
const results = [];
const browser = await chromium.launch();
await mkdir(output, { recursive: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
    const scripts = new Map(), pending = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "script" && response.url().includes("/_next/")) pending.push(response.body().then((body) => scripts.set(response.url(), gzipSync(body).length)));
    });
    await page.addInitScript(() => {
      // Isolate the non-WebGL budget without disabling the new scroll/reveal system.
      Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
      window.motionMeasurements = { shifts: [], reveals: [], vitals: [] };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.motionMeasurements.shifts.push({ value: entry.value, time: entry.startTime,
          sources: entry.sources.map((source) => source.node?.outerHTML?.slice(0, 180)) });
      }).observe({ type: "layout-shift", buffered: true });
      const native = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const animation = native.apply(this, args);
        if (this.hasAttribute("data-motion")) window.motionMeasurements.reveals.push({ target: this.id || this.dataset.motion,
          timing: animation.effect?.getTiming(), started: performance.now() });
        return animation;
      };
    });
    await page.goto(`${origin}/pt`); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(700); await Promise.all(pending);
    const initialGzipBytes = [...scripts.values()].reduce((sum, bytes) => sum + bytes, 0);
    for (const selector of ["#work", "#about", "#expertise", "#services", "#contact", "#about"]) {
      await page.locator(selector).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForTimeout(650);
      if (selector === "#work" && await page.locator(".carousel-next").count()) {
        await page.locator(".carousel-next").click(); await page.waitForTimeout(650);
      }
    }
    if (width >= 1024 && await page.getByRole("tab").count()) {
      await page.getByRole("tab").nth(1).click(); await page.waitForTimeout(350);
      await page.getByRole("tab").nth(2).click(); await page.waitForTimeout(350);
    }
    if (process.env.QA_POLISH_PROFILE === "1") {
      if (width < 1024) await page.getByRole("button", { name: "Menu", exact: true }).click();
      const toggle = (await page.locator("header .theme-toggle").filter({ visible: true }).boundingBox());
      for (let index = 0; index < 2; index++) {
        await page.mouse.click(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
        await page.waitForTimeout(450);
      }
      if (width < 1024) {
        await page.keyboard.press("Escape");
        // Escape restores focus to Menu; allow its finite 280ms focus shadow to settle.
        await page.waitForTimeout(350);
      }
    }
    if (publicSample) {
      await page.getByRole("link", { name: "Voltar ao topo", exact: true }).click(); await page.waitForTimeout(650);
    }
    // The owner's longer reveals need to finish before reporting an idle sample.
    await page.waitForTimeout(1200);
    const idleRunningAnimations = await page.evaluate(() => document.getAnimations().filter(a => a.playState === "running").length);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const measurements = await page.evaluate(() => ({ ...window.motionMeasurements,
      vitals: performance.getEntriesByType("measure").filter((entry) => entry.name.startsWith("portfolio:vital:")).map((entry) => ({ name: entry.name, value: entry.duration })),
      remainingAnimations: document.getAnimations().filter((a) => a.playState === "running").length,
      overflow: document.documentElement.scrollWidth > innerWidth, canvasCount: document.querySelectorAll("canvas").length,
      states: Object.fromEntries([...document.querySelectorAll("[data-motion]")].map((n, i) => [n.id || `${n.dataset.motion}-${i}`, { state: n.dataset.motionState, runs: n.dataset.motionRuns || "0" }])) }));
    results.push({ width, publicSample, saveData: true, initialGzipBytes, idleRunningAnimations, ...measurements }); await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/profile-motion${publicSample ? "-public" : ""}.json`, JSON.stringify(results, null, 2));
console.log(results.map(({ width, initialGzipBytes, reveals, remainingAnimations, canvasCount, overflow, vitals }) => ({ width, initialGzipBytes, reveals: reveals.length, remainingAnimations, canvasCount, overflow, vitals })));
