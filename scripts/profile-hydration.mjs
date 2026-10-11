import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3202";
const output = process.env.QA_HYDRATION_OUTPUT_DIR ?? "docs/report/S03.5";
const screenshots = process.env.QA_HYDRATION_SCREENSHOT_DIR ?? "docs/qa/S03.5/screenshots";
const results = [], browser = await chromium.launch();
await mkdir(output, { recursive: true });
await mkdir(screenshots, { recursive: true });
try {
  for (const width of [390, 1440]) for (const hash of ["", "#about"]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } }));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: 180_000, uploadThroughput: 80_000 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route("**/_next/**/*.js", async route => { await gate; await route.continue(); });
    await page.goto(`${origin}/pt${hash}`, { waitUntil: "commit" });
    await page.locator("[data-timeline]").waitFor(); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
    const measure = () => page.evaluate(() => ({ height: document.querySelector("[data-timeline]").getBoundingClientRect().height,
      aboutTop: document.querySelector("#about").getBoundingClientRect().top, expertiseTop: document.querySelector("#expertise").getBoundingClientRect().top, scrollY }));
    const before = await measure();
    if (hash && width === 1440) await page.screenshot({ path: `${screenshots}/after-hydration-about-before-js.png` });
    release(); await page.locator('[data-carousel][data-enhanced="true"]').waitFor();
    if (width >= 1024) await page.locator('[data-timeline][data-desktop="true"]').waitFor();
    await page.waitForTimeout(650); const after = await measure();
    if (hash && width === 1440) await page.screenshot({ path: `${screenshots}/after-hydration-about-after-js.png` });
    const delta = Object.fromEntries(Object.keys(before).map(key => [key, after[key] - before[key]]));
    if (Object.values(delta).some(value => Math.abs(value) > 1)) throw new Error(`Hydration shift: ${JSON.stringify({ width, hash, delta })}`);
    results.push({ width, hash, before, after, delta }); await page.close();
  }
  await writeFile(`${output}/hydration.json`, JSON.stringify({ latencyMs: 120, downloadBytesPerSecond: 180000, cpuSlowdown: 4, scriptGateMsAfterFonts: 800, results }, null, 2));
  console.log(results);
} finally { await browser.close(); }
