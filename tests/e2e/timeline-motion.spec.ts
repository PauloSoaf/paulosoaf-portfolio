import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { dictionaries } from "../../src/i18n/get-dictionary";

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const timeline = (page: Page) => page.locator("[data-timeline]");
const scrollTo = async (page: Page, selector: string) => page.locator(selector).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
async function ready(page: Page, url = "/pt#about") {
  await page.goto(url); await expect(timeline(page)).toHaveAttribute("data-desktop", "true");
  await page.evaluate(() => document.fonts.ready);
}

test("desktop timeline selects actual details, uses keyboard tabs and preserves focus", async ({ page }) => {
  await ready(page); const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(3); await tabs.nth(1).click();
  await expect(timeline(page)).toHaveAttribute("data-selected-chapter", "industrial-systems");
  await expect(page.getByRole("tabpanel")).toContainText("Participação em soluções para operações");
  await expect(page.getByRole("tabpanel")).toContainText("SQL Server");
  await expect(page.locator('.journey-item[aria-hidden="true"]')).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab", { selected: true })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("exploração espacial");
  await page.keyboard.press("Home"); await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  await expect(timeline(page)).toHaveAttribute("data-selected-chapter", "foundations");
  // Let focus scrolling from the preceding End/wrap keys finish before measuring Space.
  await expect.poll(async () => {
    const y = await page.evaluate(() => scrollY); await page.waitForTimeout(120);
    return await page.evaluate(() => scrollY) === y;
  }).toBe(true);
  await page.evaluate(() => document.addEventListener("keydown", event => Reflect.set(window, "spacePrevented", event.defaultPrevented), { once: true }));
  const beforeSpace = await page.evaluate(() => scrollY); await page.keyboard.press("Space"); await page.waitForTimeout(160);
  expect(await page.evaluate(() => Reflect.get(window, "spacePrevented"))).toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(beforeSpace);
  await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Acompanhar a rolagem" })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("tabpanel")).toBeFocused();
  const titles = await page.locator(".journey-panel h3").allTextContents();
  expect(titles).toEqual(["Desenvolvimento Full Stack", "Software para operações", "3D e projetos próprios"]);
});

test("mobile remains linear and highlights chapters while scrolling in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/pt#about");
  await expect(timeline(page)).toHaveAttribute("data-desktop", "false");
  await expect(page.getByRole("tablist")).toHaveCount(0); await expect(page.locator(".journey-item[inert]")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  for (const id of ["industrial-systems", "creative-engineering", "foundations"]) {
    await scrollTo(page, `[data-chapter="${id}"]`);
    await expect(timeline(page)).toHaveAttribute("data-selected-chapter", id);
    await expect(page.locator(`[data-chapter="${id}"]`)).toBeVisible();
  }
  expect(await page.locator(".journey-panel").evaluateAll((nodes) => nodes.every((n) => getComputedStyle(n).position !== "sticky"))).toBe(true);
});

test("desktop scroll sync is opt-in, manual selection takes priority, reduced motion disables sync", async ({ page }) => {
  await ready(page); await expect(timeline(page)).toHaveAttribute("data-follow", "false");
  await page.getByRole("button", { name: "Acompanhar a rolagem" }).click();
  await page.mouse.move(0, 0);
  await scrollTo(page, '.journey-tab[data-chapter-id="creative-engineering"]');
  await expect(timeline(page)).toHaveAttribute("data-selected-chapter", "creative-engineering");
  await page.getByRole("tab").first().click();
  await expect(timeline(page)).toHaveAttribute("data-follow", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Acompanhar a rolagem" })).toBeDisabled();
  await page.getByRole("tab").nth(1).click(); await expect(page.getByRole("tabpanel")).toContainText("Software para operações");
});

test("editorial reveal uses real intermediate transforms, runs once and does not affect carousel selection", async ({ page }) => {
  await ready(page, "/pt"); const heading = page.locator("#expertise-title");
  await expect(heading).toHaveAttribute("data-motion-state", "ready");
  await page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (this.id === "expertise-title") Reflect.set(window, "measuredReveal", { frames: (animation.effect as KeyframeEffect | null)?.getKeyframes(), duration: animation.effect?.getTiming().duration });
      return animation;
    };
  });
  await scrollTo(page, "#expertise-title");
  await expect(heading).toHaveAttribute("data-motion-state", "finished");
  const observed = await page.evaluate(() => Reflect.get(window, "measuredReveal"));
  expect(observed.frames[0].transform).toContain("24px"); expect(observed.duration).toBe(550);
  await expect(heading).toHaveAttribute("data-motion-runs", "1");
  await scrollTo(page, "#contact"); await scrollTo(page, "#expertise-title");
  await expect(heading).toHaveAttribute("data-motion-runs", "1");
  expect(await heading.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-selected-index", "0");
});

test("parallax is limited to decoration, responds to native scroll and stops in reduced motion", async ({ page }) => {
  await ready(page, "/pt"); const decor = page.locator("[data-hero] [data-scroll-decor]");
  await expect.poll(() => decor.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--scroll-drift"))).not.toBe("");
  const before = await decor.evaluate((el) => getComputedStyle(el).transform);
  await page.evaluate(() => scrollBy({ top: 230, behavior: "instant" }));
  await expect.poll(() => decor.evaluate((el) => getComputedStyle(el).transform)).not.toBe(before);
  const matrix = await decor.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
  expect(Math.abs(matrix)).toBeLessThanOrEqual(14);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => decor.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  await expect(page.locator("#expertise-title")).toHaveAttribute("data-motion-state", "reduced");
});

test("anchors and reload midway reveal immediately, native navigation remains functional", async ({ page }) => {
  await ready(page); await expect(page.locator("#about-title")).toBeVisible();
  await expect(page.locator("#about-title")).not.toHaveAttribute("data-motion-state", "ready");
  await page.reload(); await expect(timeline(page)).toHaveAttribute("data-desktop", "true");
  await expect(page.getByRole("tabpanel")).toBeVisible();
  await page.locator('header a[href="/pt#services"]').first().click();
  await expect(page).toHaveURL(/#services$/); await expect(page.locator("#services-title")).toBeInViewport();
});

test("WAAPI failure keeps every resting section visible", async ({ page }) => {
  await page.addInitScript(() => { Element.prototype.animate = () => { throw new Error("QA unavailable animation"); }; });
  await ready(page, "/pt"); await scrollTo(page, "#expertise-title");
  await expect(page.locator("#expertise-title")).toHaveAttribute("data-motion-state", "fallback");
  expect(await page.locator("#expertise-title").evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  await scrollTo(page, "#about-title"); await page.getByRole("tab").nth(1).click();
  await expect(page.getByRole("tabpanel")).toContainText("Software para operações");
});

test("dynamic reveal targets are discovered, removed targets cancelled and focused CTAs remain visible", async ({ page }) => {
  await ready(page, "/pt");
  await page.evaluate(() => {
    const node = document.createElement("a"); node.id = "motion-dynamic"; node.href = "#contact"; node.textContent = "QA dynamic"; node.dataset.motion = "horizontal";
    document.querySelector("#contact")!.append(node);
  });
  await expect(page.locator("#motion-dynamic")).toHaveAttribute("data-motion-state", "ready");
  await scrollTo(page, "#motion-dynamic"); await page.locator("#motion-dynamic").focus();
  await expect(page.locator("#motion-dynamic")).toBeVisible();
  await page.locator("#motion-dynamic").evaluate((el) => el.remove());
  await expect(page.locator("#motion-dynamic")).toHaveCount(0);
});

test("no-JS and no-CSS keep a semantic complete trajectory and valid anchors", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await page.goto("http://127.0.0.1:3200/pt#about");
  await expect(page.locator("#about article")).toHaveCount(3);
  for (const panel of await page.locator("#about article").all()) await expect(panel).toBeVisible();
  await page.route("**/*.css", (route) => route.abort()); await page.reload();
  for (const panel of await page.locator("#about article").all()) await expect(panel).toBeVisible();
  await expect(page.locator('#about [inert]')).toHaveCount(0); await context.close();
});

for (const locale of ["pt", "en", "es"] as const) for (const theme of ["dark", "light"] as const) {
  test(`${locale}/${theme}: reflow at six viewports, axe, translated tabs and theme/locale persistence`, async ({ page }) => {
    await page.context().addCookies([{ name: "ps-theme", value: theme, domain: "127.0.0.1", path: "/" }]);
    await ready(page, `/${locale}#about`); await page.getByRole("tab").nth(2).click();
    await expect(page.getByRole("button", { name: dictionaries[locale].journey.followScroll })).toBeVisible();
    expect((await new AxeBuilder({ page }).include("#about").include("#expertise").include("#services").include("#contact").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    for (const width of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(80);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px`).toBe(true);
    }
    await page.addStyleTag({ content: "html {font-size:200%}" });
    await expect(page.getByRole("tabpanel")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("S02 explicit play while focused remains suspended until focus leaves, then advances", async ({ page }) => {
  await page.goto("/pt#work");
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-enhanced", "true");
  await scrollTo(page, ".carousel-stage");
  await page.clock.install();
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).focus();
  await page.getByRole("button", { name: "Reproduzir automaticamente", exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-playing", "true");
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-auto", "false");
  await page.clock.fastForward(7001); await expect(page.locator("[data-carousel]")).toHaveAttribute("data-selected-index", "0");
  await page.locator("header a").first().focus();
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-auto", "true");
  await page.clock.fastForward(7001); await expect(page.locator("[data-carousel]")).toHaveAttribute("data-selected-index", "1");
});

test("S02 real browser timer advances after seven seconds with the shared motion runtime", async ({ page }) => {
  await page.goto("/pt#work"); await expect(page.locator("[data-carousel]")).toHaveAttribute("data-enhanced", "true");
  await scrollTo(page, ".carousel-stage"); await page.locator(".carousel-stage").focus();
  await page.getByRole("button", { name: "Reproduzir automaticamente", exact: true }).click();
  await page.mouse.move(0, 0); await page.locator("header a").first().focus();
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-auto", "true");
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-selected-index", "1", { timeout: 8500 });
});

test("timeline remains interactive through a real theme and language change", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await ready(page); await page.getByRole("tab").nth(1).click();
  await page.getByRole("button", { name: "Ativar tema claro", exact: true }).first().click();
  await expect(timeline(page)).toHaveAttribute("data-selected-chapter", "industrial-systems");
  await page.getByRole("link", { name: "English (EN)", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en#about$/); await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(timeline(page)).toHaveAttribute("data-desktop", "true");
  await page.getByRole("tab").nth(2).click(); await expect(page.getByRole("tabpanel")).toContainText("3D and personal projects");
  expect(errors).toEqual([]);
});
