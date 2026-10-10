import { mkdir } from "node:fs/promises";
import { test } from "@playwright/test";
import { locales } from "../../src/i18n/config";

for (const locale of locales) {
  for (const theme of ["dark", "light"] as const) {
    for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
      test(`${locale}-${theme}-${viewport.name}`, async ({ page, context }) => {
        await mkdir("docs/qa/S00", { recursive: true });
        await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
        await page.setViewportSize(viewport);
        await page.goto(`/${locale}`);
        await page.evaluate(() => document.fonts.ready);
        await page.locator("#hero-title").waitFor();
        await page.screenshot({ path: `docs/qa/S00/${locale}-${theme}-${viewport.name}-viewport.png` });
        await page.screenshot({ path: `docs/qa/S00/${locale}-${theme}-${viewport.name}.png`, fullPage: true });
      });
    }
  }
}
