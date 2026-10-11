import { mkdir, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { locales } from "../../src/i18n/config";

const output = process.env.QA_TIMELINE_SCREENSHOT_DIR ?? "docs/qa/S03/screenshots";
const videoOutput = process.env.QA_TIMELINE_VIDEO_DIR ?? "docs/qa/S03/videos";
const viewports = [
  { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 },
];
for (const locale of locales) for (const theme of ["dark", "light"] as const) for (const viewport of viewports) {
  test(`${locale}/${theme}/${viewport.width}: responsive trajectory`, async ({ page, context }) => {
    await mkdir(output, { recursive: true });
    await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    await page.setViewportSize(viewport); await page.goto(`/${locale}#about`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-timeline]")).toHaveAttribute("data-desktop", String(viewport.width >= 1024));
    await page.waitForTimeout(650);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator("#about").screenshot({ path: `${output}/${locale}-${theme}-${viewport.width}.png`, style: "header {visibility:hidden!important}" });
    if (locale === "pt" && [390, 1440].includes(viewport.width)) {
      if (viewport.width >= 1024) {
        for (const index of [1, 2]) {
          await page.getByRole("tab").nth(index).click(); await page.waitForTimeout(350);
          await page.locator("#about").screenshot({ path: `${output}/${locale}-${theme}-${viewport.width}-chapter-${index + 1}.png`, style: "header {visibility:hidden!important}" });
        }
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#about").screenshot({ path: `${output}/${locale}-${theme}-${viewport.width}-reduced.png`, style: "header {visibility:hidden!important}" });
    }
  });
}

for (const width of [390, 1440]) {
  test(`${width}: actual entry phases and continuous native-scroll recording`, async ({ browser }) => {
    await mkdir(output, { recursive: true }); await mkdir(videoOutput, { recursive: true });
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "no-preference", recordVideo: { dir: "docs/report/S03/videos", size: { width, height: width === 390 ? 844 : 900 } } });
    const page = await context.newPage(); await page.goto("http://127.0.0.1:3200/pt");
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(350);
    await page.screenshot({ path: `${output}/motion-${width}-initial.png` });
    // Capture real browser-computed WAAPI phases at deterministic timestamps, not fake CSS.
    await page.evaluate(() => {
      const native = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const animation = native.apply(this, args);
        if (this.id === "expertise-title") { animation.pause(); animation.currentTime = 0; Reflect.set(window, "captureMotion", animation); }
        return animation;
      };
    });
    await page.locator("#expertise-title").evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForFunction(() => !!Reflect.get(window, "captureMotion"));
    await page.screenshot({ path: `${output}/motion-${width}-entering.png` });
    await page.evaluate(() => { (Reflect.get(window, "captureMotion") as Animation).currentTime = 140; });
    const computed = await page.locator("#expertise-title").evaluate((el) => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }));
    expect(computed.transform).not.toBe("none"); expect(Number(computed.opacity)).toBeLessThan(1);
    await writeFile(`docs/report/S03/motion-${width}-intermediate.json`, JSON.stringify(computed, null, 2));
    await page.screenshot({ path: `${output}/motion-${width}-intermediate.png` });
    await page.evaluate(() => (Reflect.get(window, "captureMotion") as Animation).finish());
    await page.waitForTimeout(400); await page.screenshot({ path: `${output}/motion-${width}-final.png` });
    await context.close();
    // A separate unmodified recording proves the live timing and native scrolling, including tabs.
    const live = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "no-preference", recordVideo: { dir: "docs/report/S03/videos", size: { width, height: width === 390 ? 844 : 900 } } });
    const livePage = await live.newPage(); await livePage.goto("http://127.0.0.1:3200/pt"); await livePage.waitForTimeout(500);
    for (const selector of ["#work", "#about", "#expertise", "#services", "#contact", "#about"]) {
      await livePage.locator(selector).evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "start" }));
      await livePage.waitForTimeout(1000);
      if (selector === "#about" && width >= 1024) { await livePage.getByRole("tab").nth(1).click(); await livePage.waitForTimeout(350); }
    }
    const video = livePage.video()!; await live.close(); await video.saveAs(`${videoOutput}/scroll-${width}.webm`);
  });
}
