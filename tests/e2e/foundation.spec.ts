import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { dictionaries } from "../../src/i18n/get-dictionary";
import { htmlLang, locales } from "../../src/i18n/config";

for (const locale of locales) {
  const dict = dictionaries[locale];
  test(`${locale}: complete HTML, metadata and links without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const response = await page.goto(`http://127.0.0.1:3200/${locale}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", htmlLang[locale]);
    await expect(page).toHaveTitle(dict.meta.title);
    await expect(page.locator("#hero-title")).toContainText(dict.hero.titleLead);
    await expect(page.getByRole("link", { name: dict.hero.ctaProjects, exact: true })).toHaveAttribute("href", `/${locale}#work`);
    await expect(page.getByRole("link", { name: dict.hero.ctaContact, exact: true })).toHaveAttribute("href", `/${locale}#contact`);
    for (const id of ["work", "about", "expertise", "services", "contact"]) await expect(page.locator(`#${id}`)).toBeAttached();
    await page.getByRole("link", { name: dict.nav.menu, exact: true }).click();
    await expect(page).toHaveURL(/#site-footer-nav$/);
    await expect(page.locator("#site-footer-nav")).toBeInViewport();
    await expect(page.getByRole("link", { name: "English (EN)", exact: true }).last()).toHaveAttribute("href", "/en");
    await context.close();
  });

  for (const theme of ["dark", "light"] as const) {
    test(`${locale}/${theme}: responsive layout and automated accessibility`, async ({ page, context }) => {
      await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const width of [360, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), {
          message: `${locale}/${theme} must fit viewport ${width}px`,
        }).toBe(true);
      }
      const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(scan.violations).toEqual([]);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("button", { name: dict.nav.menu, exact: true }).click();
      const mobileScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(mobileScan.violations).toEqual([]);
    });
  }
}

test("mobile menu supports keyboard, Escape and section navigation", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/pt");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Projetos" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Sobre" }).click();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/#about$/);
});

test("theme and language persist while explicit URLs win over preferences", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/pt#work");
  await page.getByRole("button", { name: "Ativar tema claro" }).first().click();
  await page.getByRole("link", { name: "English (EN)", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en#work$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  expect(errors).toEqual([]);
});

test("root negotiates browser language and does not cache a personal redirect", async ({ request }) => {
  const response = await request.get("/", { headers: { "Accept-Language": "es-MX,en;q=0.5" }, maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/es$/);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers().vary).toContain("Accept-Language");
});

test("unknown routes serve a styled 404 with return links even without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of ["/xx", "/pt/does-not-exist", "/en/projects/unknown", "/es/unknown"]) {
    const response = await page.goto(`http://127.0.0.1:3200${path}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Página não");
    for (const locale of locales) await expect(page.locator(`a[href='/${locale}#work']`)).toBeVisible();
    expect(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor)).toBe("rgb(9, 13, 17)");
  }
  await page.locator("a[href='/es#work']").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await context.close();
});

test("reduced motion keeps content visible and broken artwork cannot block navigation", async ({ page }) => {
  await page.route("**/art/**/*.svg", (route) => route.abort());
  await page.goto("/pt");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar projetos", exact: true })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  await page.getByRole("link", { name: "Explorar projetos", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
});

test("200% text zoom preserves mobile content and controls", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["dark", "light"]) {
    await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    for (const locale of locales) {
      await page.goto(`/${locale}`);
      await page.addStyleTag({ content: "html { font-size: 200%; }" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.locator("#hero-title")).toBeVisible();
      await expect(page.getByRole("button", { name: dictionaries[locale].nav.menu, exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: dictionaries[locale].hero.ctaProjects, exact: true })).toBeVisible();
    }
  }
});

test("public build excludes editorial drafts and unapproved contact links", async ({ page }) => {
  test.skip(process.env.QA_EXPECT_PUBLIC_CONTENT !== "1", "Requires a build without editorial preview.");
  for (const locale of locales) {
    await page.goto(`/${locale}`);
    await expect(page.locator("[data-editorial]")).toHaveCount(0);
    await expect(page.locator("#work article")).toHaveCount(0);
    await expect(page.locator("#about article, #about [data-timeline]")).toHaveCount(0);
    await expect(page.locator("#contact a")).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"], a[href="#"]')).toHaveCount(0);
    await expect(page.locator("#hero-title")).toBeVisible();
  }
});
