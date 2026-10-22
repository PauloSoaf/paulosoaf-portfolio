import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } }));
});

for (const locale of ["pt", "en", "es"]) for (const width of [1440, 390]) {
  test(`${locale}/${width}: first and repeated Projects clicks follow the actual section, including a stale fragment`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const nav = (id: string) => page.locator(`header nav a[href="/${locale}#${id}"]:visible`);
    const click = async (id: string, keyboard = false) => {
      if (width < 1024) await page.locator('header button[aria-controls]').click();
      if (keyboard) { await nav(id).focus(); await page.keyboard.press("Enter"); }
      else await nav(id).click();
    };
    const atWork = async () => {
      await expect.poll(() => page.locator("#work").evaluate(node => Math.abs(node.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)))).toBeLessThanOrEqual(1);
      await expect(page.locator(`header nav a[href="/${locale}#work"][aria-current="location"]`)).toHaveCount(2);
    };
    const atTop = async () => {
      await page.mouse.move(8, 450);
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await expect(page.locator('header nav a[aria-current="location"]')).toHaveCount(0);
    };
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("data-section-tracking", "true");
    await expect(page.locator('header nav a[aria-current="location"]')).toHaveCount(0);
    await click("work", true); await atWork();
    await atTop();
    // The fragment remains #work while the visitor is visibly in the Hero.
    await expect(page).toHaveURL(new RegExp(`/${locale}#work$`));
    await click("work"); await atWork();
    await click("about");
    await expect(page.locator(`header nav a[href="/${locale}#about"][aria-current="location"]`)).toHaveCount(2);
    await click("work"); await atWork();
    await page.reload(); await atWork();
    await atTop(); await click("work"); await atWork();
    expect(errors).toEqual([]);
  });
}

test("fragment navigation retains native history and no-JS repeated anchors", async ({ page, browser }) => {
  await page.goto("/pt");
  await expect(page.locator("html")).toHaveAttribute("data-section-tracking", "true");
  await page.locator('header .ui-nav[href="/pt#work"]').click();
  await page.locator('header .ui-nav[href="/pt#about"]').click();
  await page.goBack();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('header .ui-nav[href="/pt#work"]')).toHaveAttribute("aria-current", "location");
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  try {
    const native = await context.newPage(); await native.goto(`${test.info().project.use.baseURL}/pt#work`);
    await native.evaluate(() => scrollTo(0, 0));
    await native.locator('header .ui-nav[href="/pt#work"]').click();
    await expect.poll(() => native.locator("#work").evaluate(node => Math.abs(node.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)))).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
});
