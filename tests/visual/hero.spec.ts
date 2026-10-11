import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { locales } from "../../src/i18n/config";

const viewports = [
  { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 },
];
// A later sprint can retain new regression captures without replacing the accepted S01 evidence.
const outputDir = process.env.QA_HERO_SCREENSHOT_DIR ?? "docs/qa/S01/screenshots";
for (const locale of locales) for (const theme of ["dark", "light"] as const) for (const viewport of viewports) {
  test(`${locale}/${theme}/${viewport.width}`, async ({ page, context }) => {
    await mkdir(outputDir, { recursive: true });
    await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    await page.setViewportSize(viewport);
    await page.goto(`/${locale}?heroDebug=1`);
    await page.evaluate(() => document.fonts.ready);
    const art = page.locator("[data-hero-art]");
    await art.scrollIntoViewIfNeeded();
    await expect(art).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
    await page.locator("[data-hero]").dispatchEvent("pointerleave");
    await expect(art).toHaveAttribute("data-hero-entrance", "850");
    // Freeze through the visitor control for repeatable screenshots; videos keep ambient motion.
    await page.getByRole("button", { name: /Pausar movimento|Pause motion|Pausar movimiento/, exact: true }).click();
    await expect.poll(async () => {
      const frames = await art.getAttribute("data-hero-frames"); await page.waitForTimeout(250);
      return await art.getAttribute("data-hero-frames") === frames;
    }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const bottom = await page.locator("[data-hero]").evaluate((element) => element.getBoundingClientRect().bottom);
    await page.screenshot({ path: `${outputDir}/${locale}-${theme}-${viewport.width}.png`, fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height: Math.ceil(bottom) } });
  });
}
