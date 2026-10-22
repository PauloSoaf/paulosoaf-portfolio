import { expect, test, type Page } from "@playwright/test";
import { dictionaries } from "../../src/i18n/get-dictionary";

test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 }, launchOptions: { args: ["--enable-unsafe-swiftshader"] } });
const art = (page: Page) => page.locator("[data-workstation]");
async function noWebGL(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } }));
}
async function position(page: Page) {
  return page.evaluate(() => ({
    height: document.querySelector("[data-timeline]")!.getBoundingClientRect().height,
    aboutTop: document.querySelector("#about")!.getBoundingClientRect().top,
    expertiseTop: document.querySelector("#expertise")!.getBoundingClientRect().top,
    scrollY,
  }));
}

for (const width of [390, 1440]) for (const hash of ["", "#about"]) {
  test(`slow JS/network: ${width}${hash || '/top'} keeps geometry and anchor through hydration`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await noWebGL(page);
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: 180_000, uploadThroughput: 80_000 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/_next/**/*.js", async route => { await gate; await route.continue(); });
    await page.goto(`/pt${hash}`, { waitUntil: "commit" });
    await page.locator("[data-timeline]").waitFor(); await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const before = await position(page);
    await expect(page.locator("[data-timeline]")).toHaveAttribute("data-desktop", "false");
    if (hash) await expect(page.locator("#about-title")).toBeInViewport();
    release();
    await expect(page.locator("[data-carousel]")).toHaveAttribute("data-enhanced", "true", { timeout: 30_000 });
    await expect(page.locator("[data-timeline]")).toHaveAttribute("data-desktop", String(width >= 1024));
    await page.waitForTimeout(650);
    const after = await position(page);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.aboutTop - before.aboutTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.expertiseTop - before.expertiseTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.scrollY - before.scrollY)).toBeLessThanOrEqual(1);
    if (hash) await expect(page.locator("#about-title")).toBeInViewport();
    expect(errors).toEqual([]);
  });
}

test("failed modules retain native trajectory links and scrollable project strip", async ({ page, browser }) => {
  await page.route("**/_next/**/*.js", route => route.abort());
  await page.goto("/pt#about");
  await expect(page.locator(".journey-tab").nth(1)).toHaveAttribute("href", "#journey-panel-industrial-systems");
  await page.locator(".journey-tab").nth(1).click();
  await expect(page.locator('[data-chapter="industrial-systems"]')).toBeVisible();
  await page.locator(".journey-tab").nth(2).click();
  await expect(page.locator('[data-chapter="creative-engineering"]')).toBeVisible();
  expect(await page.locator(".carousel-stage").evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  await page.locator(".carousel-stage").focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.locator(".carousel-stage").evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.locator(".carousel-stage").evaluate(el => { el.scrollLeft = el.scrollWidth; });
  expect(await page.locator(".carousel-stage").evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const fallback = await context.newPage(); await fallback.goto("http://127.0.0.1:3200/pt#about");
  for (const article of await fallback.locator("#about article").all()) await expect(article).toBeVisible();
  await expect(fallback.locator("#work article")).toHaveCount(7); await context.close();
});

test("a native chapter choice made before hydration survives enhancement", async ({ page }) => {
  await noWebGL(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/_next/**/*.js", async route => { await gate; await route.continue(); });
  await page.goto("/pt#about", { waitUntil: "commit" }); await page.locator(".journey-tab").nth(2).click();
  await expect(page).toHaveURL(/#journey-panel-creative-engineering$/);
  await expect(page.locator('[data-chapter="creative-engineering"]')).toBeVisible();
  release();
  await expect(page.locator("[data-timeline]")).toHaveAttribute("data-desktop", "true");
  await expect(page.locator("[data-timeline]")).toHaveAttribute("data-selected-chapter", "creative-engineering");
  await expect(page.getByRole("tabpanel")).toContainText("3D e projetos próprios");
});

for (const locale of ["pt", "en", "es"] as const) for (const theme of ["dark", "light"] as const) {
  test(`${locale}/${theme}: pre-paint preference, animated switch and reload persistence`, async ({ page }) => {
    await noWebGL(page);
    await page.context().addCookies([{ name: "ps-theme", value: theme, url: "http://127.0.0.1:3200" }]);
    await page.addInitScript(() => {
      const states: string[] = [];
      Reflect.set(window, "paintThemes", states);
      const sample = () => { if (document.body) states.push(document.documentElement.dataset.theme ?? "missing"); if (states.length < 12) requestAnimationFrame(sample); };
      requestAnimationFrame(sample);
    });
    await page.goto(`/${locale}`); await page.waitForTimeout(220);
    const painted: string[] = await page.evaluate(() => Reflect.get(window, "paintThemes"));
    expect(painted.length).toBeGreaterThan(0); expect(painted.every(value => value === theme)).toBe(true);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching");
    const target = theme === "dark" ? "light" : "dark";
    const label = theme === "dark" ? dictionaries[locale].theme.toLight : dictionaries[locale].theme.toDark;
    await page.evaluate(() => {
      Reflect.set(window, "themeFrames", []);
      document.addEventListener("transitionrun", event => {
        const node = event.target as HTMLElement;
        if (node !== document.body && !node.classList.contains("theme-icon")) return;
        Reflect.get(window, "themeFrames").push({ icon: node.classList.contains("theme-icon"), frames: node.getAnimations().map(animation => ({ duration: animation.effect?.getTiming().duration, frames: (animation.effect as KeyframeEffect | null)?.getKeyframes() })) });
      });
    });
    await page.getByRole("button", { name: label, exact: true }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", target);
    await expect.poll(() => page.evaluate(() => Reflect.get(window, "themeFrames").length)).toBeGreaterThan(0);
    const recorded: { icon: boolean; frames: { duration: number; frames: Keyframe[] }[] }[] = await page.evaluate(() => Reflect.get(window, "themeFrames"));
    const animations = recorded.filter(item => !item.icon).flatMap(item => item.frames);
    expect(animations.some(animation => animation.duration === 320 && animation.frames?.some(frame => frame.backgroundColor))).toBe(true);
    const iconAnimations = recorded.filter(item => item.icon).flatMap(item => item.frames).map(animation => animation.frames);
    expect(iconAnimations.some(frames => frames?.some(frame => frame.transform))).toBe(true);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching", { timeout: 2000 });
    await page.waitForTimeout(100);
    const trailingColours = await page.evaluate(() => document.getAnimations().filter(animation => animation instanceof CSSTransition && animation.playState === "running" && /color/.test(animation.transitionProperty)).length);
    expect(trailingColours).toBe(0);
    await page.reload(); await expect(page.locator("html")).toHaveAttribute("data-theme", target);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching");
  });
}

test("rapid switches preserve canvas, timeline, carousel, URL and scroll without stale transition state", async ({ page }) => {
  await page.goto("/pt"); await expect(art(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
  const canvas = await page.locator("canvas").elementHandle();
  await page.locator("#about").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.getByRole("tab").nth(1).click();
  await page.locator(".carousel-next").click();
  // Finish the browser's scroll from the real carousel click before measuring theme stability.
  await page.evaluate(() => new Promise<void>(resolve => {
    let previous = scrollY, stable = 0;
    const tick = () => {
      stable = scrollY === previous ? stable + 1 : 0; previous = scrollY;
      if (stable >= 6) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  await page.locator("#about").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
  const before = await position(page), url = page.url();
  // Coordinate clicks exercise a sticky header without automation's scroll-into-view changing the page.
  const toggle = (await page.locator("header .theme-toggle").first().boundingBox())!;
  for (let index = 0; index < 8; index++) { await page.mouse.click(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2); }
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching", { timeout: 2000 });
  await expect(page.locator("[data-timeline]")).toHaveAttribute("data-selected-chapter", "industrial-systems");
  await expect(page.locator("[data-carousel]")).toHaveAttribute("data-selected-index", "1");
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
  expect(await position(page)).toEqual(before); expect(page.url()).toBe(url);
});

test("CTA mouse hover/press and keyboard focus change pixels without changing layout", async ({ page }) => {
  await noWebGL(page); await page.goto("/pt"); await page.evaluate(() => document.fonts.ready);
  const cta = page.getByRole("link", { name: "Explorar projetos", exact: true });
  const layout = () => cta.evaluate(el => ({ top: (el as HTMLElement).offsetTop, left: (el as HTMLElement).offsetLeft, height: (el as HTMLElement).offsetHeight, width: (el as HTMLElement).offsetWidth }));
  const before = await layout(); await cta.hover(); await page.waitForTimeout(300);
  expect(await cta.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)).toBe(-2);
  expect(await cta.locator("svg").evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)).toBe(2);
  await page.mouse.down(); await page.waitForTimeout(170);
  expect(await cta.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeLessThan(1);
  expect(await layout()).toEqual(before); await page.mouse.move(0, 0); await page.mouse.up();
  await page.keyboard.press("Tab"); await cta.focus();
  expect(await cta.evaluate(el => el.matches(":focus-visible"))).toBe(true);
  expect(await cta.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
  await page.keyboard.press("Enter"); await expect(page).toHaveURL(/#work$/);
});


test("reduced motion keeps switches immediate and disables decorative transforms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/pt");
  await page.getByRole("button", { name: "Ativar tema claro", exact: true }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching");
  await expect(page.locator("canvas")).toHaveCount(0);
  const cta = page.getByRole("link", { name: "Explorar projetos", exact: true }); await cta.hover();
  expect(await cta.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).isIdentity)).toBe(true);
  await expect(page.locator(".carousel-play")).toBeDisabled();
  await page.goto("/pt#about"); await page.getByRole("tab").nth(2).click();
  await expect(page.getByRole("tabpanel")).toContainText("3D e projetos próprios");
});
