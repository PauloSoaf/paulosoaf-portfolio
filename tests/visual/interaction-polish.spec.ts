import { mkdir, writeFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { dictionaries } from "../../src/i18n/get-dictionary";

const root = "docs/qa/S03.5", output = `${root}/screenshots`;
async function scroll(page: Page, selector: string) {
  await page.locator(selector).evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(650);
}
async function heroScreenshot(page: Page, path: string, width: number) {
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  const bottom = await page.locator("[data-hero]").evaluate(el => el.getBoundingClientRect().bottom);
  await page.screenshot({ path, fullPage: true, clip: { x: 0, y: 0, width, height: Math.ceil(bottom) }, animations: "allow" });
}
for (const locale of ["pt", "en", "es"] as const) for (const theme of ["dark", "light"] as const) for (const width of [390, 1440]) {
  test(`${locale}/${theme}/${width}: genuine hero, controls, trajectory and theme frames`, async ({ page, context }) => {
    await mkdir(output, { recursive: true });
    await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(`/${locale}?heroDebug=1`); await page.evaluate(() => document.fonts.ready);
    await page.locator("[data-hero-art]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-hero-art]")).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
    await expect(page.locator("[data-hero-art]")).toHaveAttribute("data-hero-entrance", "850");
    await heroScreenshot(page, `${output}/${locale}-${theme}-${width}-hero.png`, width);
    if (locale === "pt") {
      if (width === 390) await page.getByRole("button", { name: dictionaries[locale].nav.menu, exact: true }).click();
      await page.getByRole("button", { name: theme === "dark" ? dictionaries[locale].theme.toLight : dictionaries[locale].theme.toDark, exact: true }).filter({ visible: true }).click();
      // Freeze native CSS transitions for a repeatable midpoint screenshot only; live videos below use real time.
      const phase = await page.evaluate(() => {
        const animations = document.getAnimations().filter(animation => animation instanceof CSSTransition && animation.effect?.getTiming().duration === 320);
        for (const animation of animations) { animation.pause(); animation.currentTime = 160; }
        return { count: animations.length, background: getComputedStyle(document.body).backgroundColor };
      });
      expect(phase.count).toBeGreaterThan(0);
      await page.screenshot({ path: `${output}/${locale}-${theme}-${width}-theme-midpoint.png`, animations: "allow" });
      await writeFile(`${output}/${locale}-${theme}-${width}-theme-midpoint.json`, JSON.stringify(phase, null, 2));
      await page.waitForTimeout(450);
      await page.locator("header .theme-toggle").filter({ visible: true }).click(); await page.waitForTimeout(450);
      if (width === 390) await page.keyboard.press("Escape");
      if (width === 1440 && theme === "dark") {
        const cta = page.getByRole("link", { name: dictionaries[locale].hero.ctaProjects, exact: true });
        await cta.hover(); await page.waitForTimeout(300);
        await page.screenshot({ path: `${output}/pt-dark-1440-hover.png`, animations: "allow" });
        await page.mouse.down(); await page.waitForTimeout(180);
        await page.screenshot({ path: `${output}/pt-dark-1440-press.png`, animations: "allow" });
        await page.mouse.move(0, 0); await page.mouse.up();
      }
    }
    await scroll(page, "#work"); await page.locator(".carousel-next").click(); await page.waitForTimeout(650);
    await expect(page.locator("[data-carousel]")).toHaveAttribute("data-selected-index", "1");
    await page.locator("#work").screenshot({ path: `${output}/${locale}-${theme}-${width}-work.png`, style: "header {visibility:hidden!important}" });
    await scroll(page, "#about");
    if (width >= 1024) await page.getByRole("tab").nth(1).click();
    await page.waitForTimeout(350);
    await page.locator("#about").screenshot({ path: `${output}/${locale}-${theme}-${width}-about.png`, style: "header {visibility:hidden!important}" });
    if (locale === "pt") {
      await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      await heroScreenshot(page, `${output}/${locale}-${theme}-${width}-reduced.png`, width);
      await expect(page.locator("canvas")).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [390, 1440]) {
  test(`${width}: real-time theme, press, 3D exploration, work and timeline recording`, async ({ browser }) => {
    await mkdir(`${root}/videos`, { recursive: true });
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 },
      hasTouch: width === 390, isMobile: width === 390, reducedMotion: "no-preference",
      recordVideo: { dir: "test-results/polish-videos", size: { width, height: width === 390 ? 844 : 900 } } });
    const page = await context.newPage(); await page.goto("http://127.0.0.1:3200/pt?heroDebug=1");
    await page.waitForTimeout(600);
    if (width === 390) await page.getByRole("button", { name: "Menu", exact: true }).tap();
    const toggle = page.locator("header .theme-toggle").filter({ visible: true });
    if (width === 390) await toggle.tap(); else await toggle.click(); await page.waitForTimeout(650);
    if (width === 390) await toggle.tap(); else await toggle.click(); await page.waitForTimeout(650);
    if (width === 390) await page.keyboard.press("Escape");
    const cta = page.getByRole("link", { name: "Explorar projetos", exact: true });
    if (width === 1440) {
      await cta.hover(); await page.waitForTimeout(500); await page.mouse.down(); await page.waitForTimeout(280);
      await page.mouse.move(0, 0); await page.mouse.up();
    }
    await scroll(page, "[data-hero-art]");
    await expect(page.locator("[data-hero-art]")).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
    const box = (await page.locator("[data-hero-surface]").boundingBox())!;
    const x = box.x + box.width * .35, y = Math.min(650, box.y + box.height * .5);
    if (width === 390) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let step = 1; step <= 10; step++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + step * 12, y }] }); await page.waitForTimeout(35); }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 200, y, { steps: 16 }); await page.mouse.up();
    }
    await page.waitForTimeout(1200); await scroll(page, "#work");
    await page.locator(".carousel-next").click(); await page.waitForTimeout(900);
    await scroll(page, "#about");
    if (width === 1440) { await page.getByRole("tab").nth(1).click(); await page.waitForTimeout(600); await page.getByRole("tab").nth(2).click(); }
    else await scroll(page, '[data-chapter="creative-engineering"]');
    await page.waitForTimeout(900); await scroll(page, "#services"); await page.waitForTimeout(600);
    const video = page.video()!; await context.close(); await video.saveAs(`${root}/videos/interactions-${width}.webm`);
  });
}
