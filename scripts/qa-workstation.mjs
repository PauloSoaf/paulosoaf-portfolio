import { chromium } from "playwright";
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P01";
const raw = "docs/report/Workstation/recordings";
await mkdir(`${output}/screenshots`, { recursive: true }); await mkdir(`${output}/videos`, { recursive: true }); await mkdir(raw, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const cases = [], videos = [];
try {
  for (const width of [1440, 390]) for (const locale of ["pt", "en", "es"]) for (const theme of ["dark", "light"]) {
    const id = `${locale}-${theme}-${width}`, mobile = width === 390;
    const context = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, hasTouch: mobile, isMobile: mobile, reducedMotion: "no-preference",
      ...(locale === "pt" ? { recordVideo: { dir: raw, size: { width, height: mobile ? 844 : 900 } } } : {}) });
    await context.addCookies([{ name: "ps-theme", value: theme, url: origin }]);
    const page = await context.newPage(), errors = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/${locale}/workstation-lab`); await page.evaluate(() => document.fonts.ready);
    if (mobile) await page.screenshot({ path: `${output}/screenshots/${id}-hero.png` });
    if (mobile) await page.locator("[data-workstation-anchor]").scrollIntoViewIfNeeded();
    await page.locator('[data-workstation][data-scene="ready"]').waitFor({ timeout: 25_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${output}/screenshots/${id}-notebook.png` });
    if (!mobile) {
      await page.locator(".workstation-controls button").nth(1).click(); await page.waitForTimeout(750);
      await page.screenshot({ path: `${output}/screenshots/${id}-closed.png` });
      await page.locator(".workstation-controls button").nth(1).click(); await page.waitForTimeout(750);
      await page.locator(".workstation-controls button").nth(3).click(); await page.waitForTimeout(750);
      const box = await page.locator("canvas").boundingBox();
      const [x, y] = (await page.locator("[data-workstation]").getAttribute("data-drag-point")).split(",").map(Number);
      await page.mouse.move(box.x + x, box.y + y); await page.mouse.down(); await page.mouse.move(box.x + x - 70, box.y + y - 12, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(800);
      await page.locator("[data-workstation-screen] .workbench-apps button").first().click();
      await page.frameLocator("iframe").locator("input").fill("DOM + Three.js"); await page.frameLocator("iframe").locator("button").click();
      const iframeBox = await page.locator("iframe").boundingBox(); await page.mouse.move(iframeBox.x + iframeBox.width * .5, iframeBox.y + iframeBox.height * .6); await page.mouse.wheel(0, 600); await page.waitForTimeout(400);
      await page.screenshot({ path: `${output}/screenshots/${id}-browser-3d.png` });
    }
    await page.locator(mobile ? ".workstation-entry button" : ".workstation-controls button").first().click();
    const modal = page.locator("dialog");
    if (await modal.locator(".workbench-apps").count()) await modal.locator(".workbench-apps button").first().click();
    const fixture = page.frameLocator("iframe"); await fixture.locator("input").fill("Obsidian Workstation"); await fixture.locator("button").click();
    const fixtureBox = await page.locator("iframe").boundingBox(); await page.mouse.move(fixtureBox.x + fixtureBox.width * .5, fixtureBox.y + fixtureBox.height * .6); await page.mouse.wheel(0, 650); await page.waitForTimeout(450);
    const scroll = await fixture.locator("body").evaluate(() => scrollY);
    await page.screenshot({ path: `${output}/screenshots/${id}-focus.png` });
    await modal.locator(".workbench-toolbar button").last().click();
    await modal.locator(".workbench-apps button").nth(1).click();
    await page.screenshot({ path: `${output}/screenshots/${id}-code-placeholder.png` });
    await modal.locator(".workbench-toolbar button").last().click();
    await page.screenshot({ path: `${output}/screenshots/${id}-desktop.png` });
    await modal.locator(".workstation-focus-heading button").click();
    if (!mobile) {
      await page.locator("[data-workstation-work-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(1400);
      await page.screenshot({ path: `${output}/screenshots/${id}-work.png` });
    }
    cases.push({ id, fixtureNativeScroll: scroll, canvasCount: await page.locator("canvas").count(), errors, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
    const video = page.video(); await context.close();
    if (video) {
      const destination = `${output}/videos/${id}.webm`; await copyFile(await video.path(), destination);
      videos.push({ path: destination, sha256: createHash("sha256").update(await readFile(destination)).digest("hex") });
    }
    console.log(id, scroll, errors.length);
  }
  for (const width of [360, 768, 1024, 1920]) for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
    await context.addCookies([{ name: "ps-theme", value: theme, url: origin }]);
    const page = await context.newPage(); await page.goto(`${origin}/pt/workstation-lab`);
    await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.locator('[data-workstation][data-scene="ready"]').waitFor();
    await page.waitForTimeout(300); await page.screenshot({ path: `${output}/screenshots/pt-${theme}-${width}-responsive.png` });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow ${width}/${theme}`);
    await context.close();
  }
  for (const reduced of [true, false]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: reduced ? "reduce" : "no-preference", javaScriptEnabled: reduced });
    const page = await context.newPage(); await page.goto(`${origin}/pt/workstation-lab`); await page.screenshot({ path: `${output}/screenshots/pt-${reduced ? "reduced" : "no-js"}.png`, fullPage: true });
    if (reduced) { await page.locator(".workstation-entry button").click(); await page.screenshot({ path: `${output}/screenshots/pt-reduced-focus.png` }); }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/visual-results.json`, JSON.stringify({ environment: "Chromium / Windows / software SwiftShader; native time and input, no speed changes", cases, videos }, null, 2) + "\n");
if (cases.some((entry) => entry.errors.length || entry.overflow || entry.fixtureNativeScroll < 100)) process.exitCode = 1;
