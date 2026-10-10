import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { locales } from "../../src/i18n/config";
import { dictionaries } from "../../src/i18n/get-dictionary";

const viewports = [
  { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 },
];
for (const locale of locales) for (const theme of ["dark", "light"] as const) for (const viewport of viewports) {
  test(`${locale}/${theme}/${viewport.width}: cinematic projects`, async ({ page, context }) => {
    await mkdir("docs/qa/S02/screenshots", { recursive: true });
    await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    await page.setViewportSize(viewport); await page.goto(`/${locale}#work`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-carousel]")).toHaveAttribute("data-enhanced", "true");
    // Use the real pause control, then move focus outside to capture the resting composition.
    await page.locator(".carousel-play").click();
    await page.getByRole("link", { name: dictionaries[locale].a11y.home, exact: true }).first().focus();
    await page.mouse.move(0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // The screenshot spans a section taller than the viewport. Hide only the fixed header during
    // capture so it is not stitched over the middle; this style is automatically restored.
    await page.locator("#work").screenshot({ path: `docs/qa/S02/screenshots/${locale}-${theme}-${viewport.width}.png`, style: "header { visibility: hidden !important; }" });
    if (locale === "pt" && [390, 1440].includes(viewport.width)) {
      for (const slug of ["deborah-lima", "dr-manaus", "iot-devices-manager", "chess-in-react"]) {
        await page.getByRole("button", { name: dictionaries[locale].carousel.next, exact: true }).click();
        await expect(page.locator('.carousel-slide[data-active="true"]')).toHaveAttribute("data-project", slug);
        await page.waitForTimeout(600);
        const image = page.locator('.carousel-slide[data-active="true"] img');
        if (await image.count()) await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
        await page.locator("#work").screenshot({ path: `docs/qa/S02/screenshots/pt-${theme}-${viewport.width}-${slug}.png`, style: "header { visibility: hidden !important; }" });
      }
    }
  });
}
