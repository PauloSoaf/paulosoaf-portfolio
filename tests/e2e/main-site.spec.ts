import { expect, test } from "@playwright/test";

for (const locale of ["pt", "en", "es"]) {
  test(`${locale}: the canonical portfolio owns the notebook and strict embed policy`, async ({ page, request }) => {
    const response = await page.goto(`/${locale}?experience=classic`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/${locale}\\?experience=classic$`));
    await expect(page.locator("html")).toHaveAttribute("data-experience", "workstation");
    await expect(page.locator("[data-workstation-story], [data-workstation]")).toHaveCount(2);
    await expect(page.locator('[data-editorial="banner"], .workstation-lab-bar, [data-hero-art], [data-spatial-companion]')).toHaveCount(0);
    await expect(page.locator('a[href*="experience="], a[href*="workstation-lab"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${locale}$`));
    const policy = response!.headers()["content-security-policy"]!;
    expect(policy).toContain("frame-src 'self' https://www.nutriopus.com.br https://www.xn--advogadadborahlima-jwb.com.br;");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toContain("wasm-unsafe-eval");
    const unrelated = await request.get(`/${locale}/not-a-page`);
    expect(unrelated.headers()["content-security-policy"]).toContain("frame-src 'self';");
  });

  test(`${locale}: saved laboratory links preserve query and native hash without JavaScript`, async ({ browser, request }) => {
    const redirect = await request.get(`/${locale}/workstation-lab?source=old&tag=a&tag=b&experience=recovery`, { maxRedirects: 0 });
    expect(redirect.status()).toBe(307);
    expect(redirect.headers().location).toBe(`/${locale}?source=old&tag=a&tag=b`);
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:3200/${locale}/workstation-lab?source=old#work`);
      await expect(page).toHaveURL(new RegExp(`/${locale}\\?source=old#work$`));
      await expect(page.locator("#work-title")).toBeInViewport();
      await expect(page.locator("[data-workstation-story]")).toHaveCount(1);
      await expect(page.locator('[data-editorial="banner"], .workstation-lab-bar')).toHaveCount(0);
    } finally { await context.close(); }
  });
}
