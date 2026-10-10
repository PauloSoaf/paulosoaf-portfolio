import AxeBuilder from "@axe-core/playwright";
import { readFile, readdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 }, launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

const art = (page: Page) => page.locator("[data-hero-art]");
async function ready(page: Page) {
  await page.goto("/pt?heroDebug=1");
  await expect(art(page)).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
}
async function rotation(page: Page) {
  return (await art(page).getAttribute("data-hero-rotation"))!.split(",").map(Number);
}
async function settled(page: Page) {
  await expect.poll(async () => (await rotation(page)).every((value) => Math.abs(value) < 0.001)).toBe(true);
}

test("real WebGL: pointer changes pixels, clamps rotation and settles without an idle loop", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page); await settled(page);
  const before = await page.locator("canvas").screenshot();
  await page.locator("[data-hero]").dispatchEvent("pointermove", { clientX: 100_000, clientY: -100_000, pointerType: "mouse" });
  await expect.poll(async () => (await rotation(page))[1]).toBeGreaterThan(0.09);
  const angles = await rotation(page);
  expect(angles.every((value) => Math.abs(value) <= 0.1)).toBe(true);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(false);
  await page.locator("[data-hero]").dispatchEvent("pointerleave");
  await settled(page);
  await page.waitForTimeout(400);
  const frames = await art(page).getAttribute("data-hero-frames");
  await page.waitForTimeout(400);
  expect(await art(page).getAttribute("data-hero-frames")).toBe(frames);
  expect(errors).toEqual([]);
});

test("pause, offscreen and hidden tab suspend frames; theme updates the same canvas", async ({ page }) => {
  await ready(page); await settled(page);
  await page.getByRole("button", { name: "Pausar movimento", exact: true }).click();
  await expect(art(page)).toHaveAttribute("data-hero-state", "paused");
  await page.waitForTimeout(100);
  const frames = await art(page).getAttribute("data-hero-frames");
  await page.locator("[data-hero]").dispatchEvent("pointermove", { clientX: 1400, clientY: 400, pointerType: "mouse" });
  await page.waitForTimeout(200);
  expect(await art(page).getAttribute("data-hero-frames")).toBe(frames);
  const canvas = await page.locator("canvas").elementHandle();
  const dark = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: "Ativar tema claro", exact: true }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(async () => !(await page.locator("canvas").screenshot()).equals(dark)).toBe(true);
  expect(await canvas!.evaluate((element) => element === document.querySelector("canvas"))).toBe(true);
  await page.getByRole("button", { name: "Retomar movimento", exact: true }).click();
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(art(page)).toHaveAttribute("data-hero-state", "paused");
  await page.locator("#hero-title").scrollIntoViewIfNeeded();
  await expect(art(page)).toHaveAttribute("data-hero-state", "ready");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(art(page)).toHaveAttribute("data-hero-state", "paused");
});

test("context loss restores SVG and real CTAs; retries release old canvases", async ({ page }) => {
  await ready(page);
  await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    const extension = gl?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("The browser must expose actual context loss for this test");
    extension.loseContext();
  });
  await expect(art(page)).toHaveAttribute("data-hero-state", "error");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(art(page).locator("img").first()).toBeVisible();
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.getByRole("button", { name: "Ativar arte 3D", exact: true }).click();
    await expect(art(page)).toHaveAttribute("data-hero-state", "ready");
    expect(Number(await art(page).getAttribute("data-hero-geometries"))).toBe(5);
    const oldCanvas = await page.locator("canvas").elementHandle();
    await page.getByRole("button", { name: "Usar arte estática", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect.poll(() => oldCanvas!.evaluate((canvas) => (canvas as HTMLCanvasElement).getContext("webgl2")?.isContextLost())).toBe(true);
    await oldCanvas!.dispose();
  }
  await page.getByRole("link", { name: "Explorar projetos", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
});

test("unsupported GPU leaves a visible fallback and usable contact", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/pt");
  await expect(art(page)).toHaveAttribute("data-hero-state", "error", { timeout: 30_000 });
  await expect(art(page).locator("img").first()).toBeVisible();
  await page.getByRole("link", { name: "Entrar em contato", exact: true }).click();
  await expect(page).toHaveURL(/#contact$/);
});

test("shader compilation failure also restores the server artwork", async ({ page }) => {
  await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.shaderSource;
    WebGL2RenderingContext.prototype.shaderSource = function (shader, source) {
      original.call(this, shader, source.includes("vPosition") ? "intentional_invalid_shader" : source);
    };
  });
  await page.goto("/pt");
  await expect(art(page)).toHaveAttribute("data-hero-state", "error", { timeout: 30_000 });
  await expect(art(page).locator("img").first()).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Explorar projetos", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
});

test("reduced motion skips WebGL automatically and manual 3D stays static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pt?heroDebug=1");
  await expect(page.getByText("Movimento reduzido ativo")).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Ativar arte 3D", exact: true }).click();
  await expect(art(page)).toHaveAttribute("data-hero-state", "paused", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Pausar movimento" })).toHaveCount(0);
  const before = await rotation(page);
  await page.locator("[data-hero]").dispatchEvent("pointermove", { clientX: 1400, clientY: 0, pointerType: "mouse" });
  await page.waitForTimeout(300);
  expect(await rotation(page)).toEqual(before);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("limited connection keeps SVG; manual opt-in uses the smallest budget", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true }));
  await page.goto("/pt?heroDebug=1");
  await expect(art(page)).toHaveAttribute("data-hero-quality", "mobile");
  await page.waitForTimeout(700);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Ativar arte 3D", exact: true }).click();
  await expect(art(page)).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
  expect(Number(await art(page).getAttribute("data-hero-triangles"))).toBeLessThan(3000);
});

test("an offscreen hero defers the canvas; a failed lazy chunk preserves SVG and links", async ({ page }) => {
  await page.goto("/pt#contact");
  await page.waitForTimeout(700);
  await expect(page.locator("canvas")).toHaveCount(0);
  const chunks = await readdir(".next/static/chunks");
  const three = [];
  for (const chunk of chunks.filter((name) => name.endsWith(".js"))) {
    if ((await readFile(`.next/static/chunks/${chunk}`, "utf8")).includes("WebGLRenderer")) three.push(chunk);
  }
  expect(three.length).toBeGreaterThan(0);
  for (const chunk of three) await page.route(`**/_next/static/chunks/${chunk}`, (route) => route.abort());
  await page.locator("#hero-title").scrollIntoViewIfNeeded();
  await expect(art(page)).toHaveAttribute("data-hero-state", "error", { timeout: 30_000 });
  await expect(art(page).locator("img").first()).toBeVisible();
  await page.getByRole("link", { name: "Explorar projetos", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
});

test("mobile touch never rotates the scene or intercepts natural scrolling", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3200/pt?heroDebug=1");
  await page.waitForTimeout(700);
  await expect(page.locator("canvas")).toHaveCount(0);
  await art(page).scrollIntoViewIfNeeded();
  await expect(art(page)).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
  await settled(page);
  const angles = await rotation(page);
  await page.locator("[data-hero]").dispatchEvent("pointermove", { clientX: 390, clientY: 0, pointerType: "touch" });
  await page.waitForTimeout(200);
  expect(await rotation(page)).toEqual(angles);
  await page.locator("#about").scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500);
  await expect(art(page)).toHaveAttribute("data-hero-state", "paused");
  await context.close();
});

test("active 3D controls pass accessibility checks in both themes", async ({ page }) => {
  await ready(page);
  for (const theme of ["dark", "light"]) {
    if (theme === "light") await page.getByRole("button", { name: "Ativar tema claro", exact: true }).first().click();
    expect((await new AxeBuilder({ page }).include("[data-hero]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  }
});

test("tablet controls remain operable by keyboard without shifting the copy", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await ready(page);
  const titleLeft = await page.locator("#hero-title").evaluate((element) => element.getBoundingClientRect().left);
  const pause = page.getByRole("button", { name: "Pausar movimento", exact: true });
  await pause.focus(); await page.keyboard.press("Enter");
  await expect(art(page)).toHaveAttribute("data-hero-state", "paused");
  expect(await page.locator("#hero-title").evaluate((element) => element.getBoundingClientRect().left)).toBe(titleLeft);
  await page.getByRole("button", { name: "Usar arte estática", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("canvas")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).include("[data-hero]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
});

test("a delayed fallback image keeps the reserved hero dimensions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/orb-dark.svg", async (route) => { await pending; await route.continue(); });
  await page.goto("/pt", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  const before = await art(page).boundingBox();
  expect(before!.height).toBeCloseTo(before!.width * 760 / 820, 0);
  release();
  await expect.poll(() => art(page).locator("img").first().evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect((await art(page).boundingBox())!.height).toBe(before!.height);
  await expect(page.getByRole("link", { name: "Explorar projetos", exact: true })).toBeVisible();
});

test("high DPR and responsive quality budgets reach the actual renderer", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3200/pt?heroDebug=1");
  await expect(art(page)).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
  for (const [width, profile, dpr] of [[1440, "desktop", "1.5"], [768, "tablet", "1.25"], [390, "mobile", "1"]] as const) {
    await page.setViewportSize({ width, height: 1024 });
    await expect(art(page)).toHaveAttribute("data-hero-quality", profile);
    await expect(art(page)).toHaveAttribute("data-hero-dpr", dpr);
    await expect(art(page)).toHaveAttribute("data-hero-geometries", "5");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await context.close();
});
