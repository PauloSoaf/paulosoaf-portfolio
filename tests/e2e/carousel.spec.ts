import AxeBuilder from "@axe-core/playwright";
import { readFile, readdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { dictionaries } from "../../src/i18n/get-dictionary";

test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 }, launchOptions: { args: ["--enable-unsafe-swiftshader"] } });
const carousel = (page: Page) => page.locator("[data-carousel]");
const active = (page: Page) => page.locator('.carousel-slide[data-active="true"]');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const observer = window.IntersectionObserver;
    const log: unknown[] = [];
    Object.assign(window, { carouselObserverLog: log });
    window.IntersectionObserver = class extends observer {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super((entries, self) => {
          for (const entry of entries) if (entry.target.hasAttribute("data-carousel")) log.push({
            connected: entry.target.isConnected, current: entry.target === document.querySelector("[data-carousel]"),
            time: entry.time, batchLength: entries.length, intersecting: entry.isIntersecting, ratio: entry.intersectionRatio,
            rect: entry.boundingClientRect.toJSON(), nowRect: entry.target.getBoundingClientRect().toJSON(),
          });
          callback(entries, self);
        }, options);
      }
    };
  });
});
async function ready(page: Page) {
  await page.goto("/pt#work");
  await expect(carousel(page)).toHaveAttribute("data-enhanced", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".carousel-stage").evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  try { await expect(carousel(page)).toHaveAttribute("data-visible", "true"); }
  catch (error) {
    console.log(await page.evaluate(() => ({ log: Reflect.get(window, "carouselObserverLog"), scrollY,
      currentRect: document.querySelector("[data-carousel]")?.getBoundingClientRect().toJSON() })));
    throw error;
  }
}
async function outside(page: Page) {
  await page.mouse.move(0, 0);
  await page.locator("#hero-title").evaluate((el) => { (el as HTMLElement).tabIndex = -1; (el as HTMLElement).focus({ preventScroll: true }); });
}
async function readyWithClock(page: Page) {
  // Hydration/IntersectionObserver run on the real browser clock. Install the virtual clock only
  // after this commit, then create a fresh autoplay timeout through the actual play control.
  await ready(page); await page.locator(".carousel-stage").focus();
  await page.clock.install();
  await page.getByRole("button", { name: "Reproduzir automaticamente", exact: true }).click();
  await outside(page);
}

test("real project change, wrapping, position, verified links and inert neighbors", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await expect(active(page)).toHaveAttribute("data-project", "nutriopus");
  await expect(active(page).getByText("Rascunho")).toBeVisible();
  await expect(active(page).locator("a")).toHaveCount(0);
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  await expect(active(page).locator("a")).toHaveCount(0);
  await expect(page.locator(".carousel-position")).toHaveText("2 de 7");
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await expect(active(page)).toHaveAttribute("data-project", "dr-manaus");
  const code = active(page).getByRole("link");
  await expect(code).toHaveAttribute("href", "https://github.com/PauloSoaf/Dr-Manaus");
  await expect(code).toHaveAttribute("rel", /noopener/);
  await expect(page.locator('.carousel-slide[data-active="false"]').first()).toHaveAttribute("inert", "");
  await expect(page.locator('#work a[href*="/projects/"], #work a[href="#"]')).toHaveCount(0);
  await expect(page.locator("#work canvas")).toHaveCount(0);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Projeto anterior", exact: true }).click();
  await expect(active(page)).toHaveAttribute("data-project", "game-hub");
  expect(errors).toEqual([]);
});

test("keyboard arrows only at stage focus, button Space/Enter and active link tab order", async ({ page }) => {
  await ready(page);
  await page.locator(".carousel-stage").focus();
  await page.keyboard.press("ArrowRight");
  await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  await page.keyboard.press("ArrowRight");
  await expect(active(page)).toHaveAttribute("data-project", "dr-manaus");
  await page.keyboard.press("Tab");
  await expect(active(page).getByRole("link")).toBeFocused();
  await page.keyboard.press("ArrowLeft"); // An essential link does not hijack arrow navigation.
  await expect(active(page)).toHaveAttribute("data-project", "dr-manaus");
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(active(page)).toHaveAttribute("data-project", "iot-devices-manager");
  await page.keyboard.press("Enter");
  await expect(active(page)).toHaveAttribute("data-project", "chess-in-react");
  await expect(page.locator('[role="status"]')).toHaveText("5 de 7: ChessInReact");
});

test("mouse drag changes pixels and project, interrupted drag cancels, dragging links cannot navigate", async ({ page }) => {
  await ready(page);
  const art = active(page).locator(".project-media");
  const before = await art.screenshot();
  const rect = (await art.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 - 140, rect.y + rect.height / 2, { steps: 10 });
  await expect(carousel(page)).toHaveAttribute("data-dragging", "true");
  await page.mouse.up();
  await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  expect((await active(page).locator(".project-media").screenshot()).equals(before)).toBe(false);
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  const link = active(page).getByRole("link"); await link.scrollIntoViewIfNeeded();
  const lr = (await link.boundingBox())!;
  const popups: Page[] = []; page.on("popup", (popup) => popups.push(popup));
  await page.mouse.move(lr.x + lr.width / 2, lr.y + lr.height / 2); await page.mouse.down();
  await page.mouse.move(lr.x + lr.width / 2 - 90, lr.y + lr.height / 2, { steps: 8 }); await page.mouse.up();
  await expect(active(page)).toHaveAttribute("data-project", "iot-devices-manager");
  expect(popups).toHaveLength(0); await expect(page).toHaveURL(/\/pt#work$/);
  await page.locator(".carousel-stage").dispatchEvent("pointerdown", { pointerId: 99, isPrimary: true, button: 0, clientX: 300, clientY: 300 });
  await page.locator(".carousel-stage").dispatchEvent("pointercancel", { pointerId: 99 });
  await expect(carousel(page)).toHaveAttribute("data-dragging", "false");
});

test("7-second autoplay, hover suspension, manual pause and focus stops until explicit restart", async ({ page }) => {
  await readyWithClock(page);
  await expect(carousel(page)).toHaveAttribute("data-auto", "true");
  await page.clock.fastForward(7_001);
  await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  await expect(page.locator('[role="status"]')).toHaveText("");
  await active(page).hover(); await expect(carousel(page)).toHaveAttribute("data-auto", "false");
  await page.clock.fastForward(21_000); await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  await page.mouse.move(0, 0); await expect(carousel(page)).toHaveAttribute("data-auto", "true");
  await page.clock.fastForward(7_001); await expect(active(page)).toHaveAttribute("data-project", "dr-manaus");
  await page.getByRole("button", { name: "Pausar reprodução automática", exact: true }).click();
  await outside(page); await page.clock.fastForward(21_000);
  await expect(active(page)).toHaveAttribute("data-project", "dr-manaus");
  await page.getByRole("button", { name: "Reproduzir automaticamente", exact: true }).click(); await outside(page);
  await expect(carousel(page)).toHaveAttribute("data-auto", "true");
  await active(page).getByRole("link").focus(); await outside(page);
  await expect(carousel(page)).toHaveAttribute("data-playing", "false");
  await page.clock.fastForward(14_000); await expect(active(page)).toHaveAttribute("data-project", "dr-manaus");
});

test("hidden tab and offscreen suspend timers; reduced motion disables autoplay and transitions", async ({ page }) => {
  await readyWithClock(page);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(carousel(page)).toHaveAttribute("data-auto", "false"); await page.clock.fastForward(14_000);
  await expect(active(page)).toHaveAttribute("data-project", "nutriopus");
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(carousel(page)).toHaveAttribute("data-auto", "true");
  await page.locator("#contact").scrollIntoViewIfNeeded(); await expect(carousel(page)).toHaveAttribute("data-visible", "false");
  await page.clock.fastForward(14_000); await expect(active(page)).toHaveAttribute("data-project", "nutriopus");
  await page.locator(".carousel-stage").scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(carousel(page)).toHaveAttribute("data-reduced", "true");
  await expect(page.getByRole("button", { name: "Reproduzir automaticamente", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  expect(await active(page).evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
});

test("real touch swipe and vertical scroll on compact mobile with accessible alternatives", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage(); await page.goto("http://127.0.0.1:3200/pt#work");
  await expect(carousel(page)).toHaveAttribute("data-enhanced", "true");
  await page.evaluate(() => document.fonts.ready);
  await active(page).locator(".project-media").evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(350);
  const rect = (await active(page).locator(".project-media").boundingBox())!;
  const session = await context.newCDPSession(page);
  const swipe = async (dx: number, dy: number) => {
    const x = rect.x + rect.width * .7, y = rect.y + rect.height * .55;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / 10, y: y + dy * i / 10 }] });
      await page.waitForTimeout(16);
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await swipe(-140, 4); await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  const scrollBefore = await page.evaluate(() => scrollY); await swipe(2, -160);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore + 60);
  await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click(); await expect(active(page)).toHaveAttribute("data-project", "dr-manaus");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test("failed images restore distinct concepts with stable dimensions and usable links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/art/**/*.svg", (route) => route.abort()); await ready(page);
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await expect(active(page).locator("img")).toHaveCount(0);
  await expect(active(page).locator('[data-concept="space"]')).toBeVisible();
  await expect(active(page).getByText(dictionaries.pt.projects.conceptArt)).toBeVisible();
  await expect(active(page).getByRole("link")).toHaveAttribute("href", "https://github.com/PauloSoaf/Dr-Manaus");
  const dimensions = await active(page).locator(".project-media").boundingBox();
  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await expect(active(page).locator('[data-concept="telemetry"]')).toBeVisible();
  expect((await active(page).locator(".project-media").boundingBox())!.height).toBeCloseTo(dimensions!.height, 0);
});

test("catalog stays fully accessible without JavaScript and hides unavailable actions", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage(); await page.goto("http://127.0.0.1:3200/pt#work");
  await expect(page.locator("#work article")).toHaveCount(7);
  await expect(page.getByRole("button", { name: "Próximo projeto", exact: true })).toHaveCount(0);
  await expect(page.locator(".carousel-controls")).toBeHidden();
  await expect(page.locator(".carousel-slide[inert]")).toHaveCount(0);
  await expect(page.locator('#work a[href^="https://github.com/"]')).toHaveCount(5);
  for (const title of ["NutriOpus", "Déborah Lima", "Dr-Manaus", "Game Hub"]) {
    const heading = page.getByRole("heading", { name: title, exact: true });
    await heading.scrollIntoViewIfNeeded(); await expect(heading).toBeVisible();
  }
  await context.close();
});

for (const locale of ["pt", "en", "es"] as const) for (const theme of ["dark", "light"]) {
  test(`${locale}/${theme}: active carousel accessibility and reflow`, async ({ page, context }) => {
    await context.addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto(`/${locale}#work`);
    await expect(carousel(page)).toHaveAttribute("data-enhanced", "true");
    for (const width of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await expect(page.getByRole("button", { name: dictionaries[locale].carousel.next, exact: true })).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    expect((await page.locator(".carousel-play").boundingBox())!.width).toBeGreaterThan(190);
    const scan = await new AxeBuilder({ page }).include("#work").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(scan.violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 }); await page.addStyleTag({ content: "html { font-size: 200%; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: dictionaries[locale].carousel.next, exact: true }).click();
    await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  });
}

test("theme and locale changes preserve working controls, anchor and approved link destinations", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await ready(page); await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await page.getByRole("button", { name: "Ativar tema claro", exact: true }).first().click();
  await expect(active(page)).toHaveAttribute("data-project", "deborah-lima");
  await page.getByRole("link", { name: "English (EN)", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en#work$/); await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Next project", exact: true }).click();
  await page.getByRole("button", { name: "Next project", exact: true }).click();
  await expect(active(page).getByRole("link")).toHaveAttribute("href", "https://github.com/PauloSoaf/Dr-Manaus");
  expect(errors).toEqual([]);
});

test("delayed mono font keeps the hero badge and carousel controls dimensions stable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" });
  const cssFiles = (await readdir(".next/static/chunks")).filter((file) => file.endsWith(".css"));
  const css = (await Promise.all(cssFiles.map((file) => readFile(`.next/static/chunks/${file}`, "utf8")))).join("\n");
  const monoFiles = new Set([...css.matchAll(/@font-face\{font-family:IBM Plex Mono;[^}]*src:url\(([^)]+)\)/g)]
    .map((match) => match[1]!.replaceAll('"', "").split("/").pop()));
  expect(monoFiles.size).toBeGreaterThan(0);
  let released = false;
  const pending: (() => void)[] = [];
  await page.route("**/*.woff2", async (route) => {
    if (!released && monoFiles.has(new URL(route.request().url()).pathname.split("/").pop())) {
      await new Promise<void>((resolve) => pending.push(resolve));
    }
    await route.continue();
  });
  await page.goto("/pt", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await document.fonts.load('400 16px "Inter"'); await document.fonts.load('700 45px "Space Grotesk"'); });
  await expect(carousel(page)).toHaveAttribute("data-enhanced", "true");
  await expect.poll(() => pending.length).toBeGreaterThan(0);
  const measure = () => page.locator("#hero-title").evaluate((el) => ({
    titleTop: el.getBoundingClientRect().top, badgeHeight: el.previousElementSibling!.getBoundingClientRect().height,
  }));
  const before = await measure();
  const playBefore = await page.locator(".carousel-play").evaluate((el) => el.getBoundingClientRect().height);
  released = true; for (const resume of pending) resume(); await page.evaluate(() => document.fonts.ready);
  const after = await measure();
  expect(Math.abs(after.titleTop - before.titleTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.badgeHeight - before.badgeHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(await page.locator(".carousel-play").evaluate((el) => el.getBoundingClientRect().height) - playBefore)).toBeLessThanOrEqual(1);
});
