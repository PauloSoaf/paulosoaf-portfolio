import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { dictionaries } from "../../src/i18n/get-dictionary";

const output = process.env.QA_CREATIVE_OUTPUT_DIR ?? "docs/qa/CreativeFollowup";
const recordings = process.env.QA_CREATIVE_RAW_DIR ?? "docs/report/CreativeFollowup/recordings";
for (const locale of ["pt", "en", "es"] as const) for (const theme of ["dark", "light"] as const) for (const width of [1440, 390]) {
  test(`${locale}/${theme}/${width}: real scene, signature transitions and gallery`, async ({ browser }) => {
    await mkdir(`${output}/screenshots`, { recursive: true }); await mkdir(`${output}/videos`, { recursive: true });
    const height = width === 390 ? 844 : 900, dict = dictionaries[locale];
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390, isMobile: width === 390, reducedMotion: "no-preference",
      recordVideo: locale === "pt" ? { dir: recordings, size: { width, height } } : undefined });
    await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    const page = await context.newPage(), errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:3200/${locale}?heroDebug=1`); await page.evaluate(() => document.fonts.ready);
    const art = page.locator("[data-hero-art]");
    await expect(art).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${output}/screenshots/after-${locale}-${theme}-${width}-opening.png` });
    if (width === 390) await art.scrollIntoViewIfNeeded();
    const box = (await page.locator("[data-hero-surface]").boundingBox())!;
    if (width === 1440) {
      await page.mouse.move(box.x + box.width * .4, box.y + box.height * .5); await page.mouse.down();
      await page.mouse.move(box.x + box.width * .7, box.y + box.height * .5, { steps: 12 }); await page.mouse.up();
    } else {
      const cdp = await context.newCDPSession(page), x = box.x + box.width * .4, y = Math.min(height - 140, box.y + box.height * .5);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let step = 1; step <= 8; step++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + step * 12, y }] }); await page.waitForTimeout(30); }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach();
    }
    await expect.poll(async () => Number(await art.getAttribute("data-hero-exploration"))).toBeGreaterThan(.15);
    const navigate = async (selector: string) => {
      for (let step = 0; step < 100; step++) {
        const top = await page.locator(selector).evaluate(el => el.getBoundingClientRect().top);
        if (Math.abs(top - 145) < 75) break;
        await page.mouse.wheel(0, Math.sign(top - 145) * Math.min(110, Math.abs(top - 145))); await page.waitForTimeout(75);
      }
      await page.waitForTimeout(650);
    };
    // Real wheel navigation, no scroll locking, retiming or injected animation frames.
    await page.mouse.wheel(0, width === 1440 ? 420 : 140); await page.waitForTimeout(650);
    await page.screenshot({ path: `${output}/screenshots/after-${locale}-${theme}-${width}-transition.png` });
    await navigate("#work"); await page.locator(".carousel-next").click(); await page.waitForTimeout(700);
    await page.locator(".carousel-stage").evaluate(el => el.scrollIntoView({ block: "center", behavior: "smooth" })); await page.waitForTimeout(750);
    await page.screenshot({ path: `${output}/screenshots/after-${locale}-${theme}-${width}-work.png` });
    await navigate("#about");
    if (width === 1440) { await page.getByRole("tab").nth(1).click(); await page.waitForTimeout(800); await page.getByRole("tab").nth(2).click(); await page.waitForTimeout(800); }
    else await navigate(".journey-item:nth-child(2)");
    await page.screenshot({ path: `${output}/screenshots/after-${locale}-${theme}-${width}-about.png` });
    for (const selector of ["#expertise", "#services", "#contact"]) {
      await navigate(selector);
      if (locale === "pt") {
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${output}/screenshots/after-${locale}-${theme}-${width}-${selector.slice(1)}.png` });
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
    await expect(page.getByRole("heading", { name: `${dict.hero.titleLead} ${dict.hero.titleEmphasis}` })).toBeAttached();
    const video = page.video(); await context.close();
    if (video) await video.saveAs(`${output}/videos/after-${locale}-${theme}-${width}.webm`);
  });
}

for (const width of [1440, 390]) test(`reduced/${width}: complete static content`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pt"); await expect(page.locator("canvas")).toHaveCount(0);
  await page.screenshot({ path: `${output}/screenshots/after-reduced-${width}.png` });
  await page.locator("#about").scrollIntoViewIfNeeded();
  expect(await page.locator(".journey-panel").first().evaluate(el => getComputedStyle(el).transform)).toBe("none");
});
