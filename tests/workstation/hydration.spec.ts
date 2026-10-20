import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) for (const hash of ["", "#work", "#about"]) {
  test(`slow JavaScript preserves timeline geometry and native anchor ${hash || "top"} at ${width}`, async ({ browser }, testInfo) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
    const page = await context.newPage(), errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: 180_000, uploadThroughput: 80_000 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/_next/**/*.js", async (route) => { await gate; await route.continue(); });
    try {
      await page.goto(`${testInfo.project.use.baseURL}/pt/workstation-lab${hash}`, { waitUntil: "commit" });
      await page.locator("[data-timeline]").waitFor(); await page.evaluate(() => document.fonts.ready);
      // Let CSS/fonts and the browser's native hash navigation settle while app JS stays blocked.
      await page.waitForTimeout(800);
      if (hash) await expect.poll(() => page.evaluate(() => {
        const target = document.getElementById(location.hash.slice(1))!;
        return Math.abs(target.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
      })).toBeLessThanOrEqual(1);
      const geometry = () => page.evaluate(() => ({
        timelineHeight: document.querySelector("[data-timeline]")!.getBoundingClientRect().height,
        aboutTop: document.querySelector("#about")!.getBoundingClientRect().top,
        expertiseTop: document.querySelector("#expertise")!.getBoundingClientRect().top,
        scrollY,
      }));
      const before = await geometry();
      await page.screenshot({ path: testInfo.outputPath("before-javascript.png") });
      await testInfo.attach("before-javascript", { path: testInfo.outputPath("before-javascript.png"), contentType: "image/png" });
      release();
      await page.locator('[data-carousel][data-enhanced="true"]').waitFor();
      if (width >= 1024) await page.locator('[data-timeline][data-desktop="true"]').waitFor();
      await page.locator('[data-workstation][data-positioned="true"]').waitFor();
      // Include deferred WebGL startup where a slot is visible; never force a scene just for QA.
      await page.waitForTimeout(2200);
      if (await page.locator('[data-workstation][data-scene="loading"]').count()) await page.locator('[data-workstation][data-scene="ready"]').waitFor({ timeout: 30_000 });
      const after = await geometry();
      const delta = Object.fromEntries(Object.keys(before).map((key) => [key, after[key as keyof typeof after] - before[key as keyof typeof before]]));
      await testInfo.attach("hydration-geometry", { body: JSON.stringify({ width, hash, latencyMs: 120, bytesPerSecond: 180000, cpuSlowdown: 4, before, after, delta, scene: await page.locator("[data-workstation]").getAttribute("data-scene"), errors }, null, 2), contentType: "application/json" });
      await page.screenshot({ path: testInfo.outputPath("after-javascript.png") });
      await testInfo.attach("after-javascript", { path: testInfo.outputPath("after-javascript.png"), contentType: "image/png" });
      for (const value of Object.values(delta)) expect(Math.abs(value)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    } finally { release(); await context.close(); }
  });
}
