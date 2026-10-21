import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settle } from "../../scripts/lib/workstation-p02.mjs";
const workstation = (page: Page) => page.locator("[data-workstation]");
async function open(page: Page) {
  await page.goto("/pt/workstation-lab");
  if (page.viewportSize()!.width < 1280) await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(workstation(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
  await expect(page.locator(".workstation-projected-screen [data-workstation-screen]")).toBeVisible();
  await expect(workstation(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
}
async function point(page: Page, name: string) {
  const [x, y] = (await workstation(page).getAttribute(`data-${name}`))!.split(",").map(Number);
  return { x: x!, y: y! };
}
async function menu(page: Page) {
  const grip = await point(page, "drag-point");
  await page.mouse.click(grip.x, grip.y, { button: "right" });
  await expect(page.getByRole("menu")).toBeVisible();
  return page.getByRole("menu");
}
async function focus(page: Page) {
  await page.locator('.workstation-projected-screen [data-input-action="focus"]').click();
  await expect(page.locator("dialog")).toBeVisible();
}

test("the notebook is the interface: no control bar, options stay hidden", async ({ page }) => {
  await open(page);
  expect(await page.locator("canvas").count()).toBe(1);
  await expect(page.locator(".workstation-controls, .workstation-tools, .workstation-hint, .workstation-entry")).toHaveCount(0);
  // Every visible button of the notebook lives inside its own screen.
  const stray = await page.evaluate(() => [...document.querySelectorAll("[data-workstation] button")].filter((node) => {
    const box = node.getBoundingClientRect(); return box.width > 2 && box.height > 2 && !node.closest("[data-workstation-screen]");
  }).length);
  expect(stray).toBe(0);
  const trigger = page.locator(".workstation-options-trigger");
  expect((await trigger.boundingBox())!.width).toBeLessThanOrEqual(1);
  await trigger.focus();
  expect((await trigger.boundingBox())!.width).toBeGreaterThan(60);
  await expect(page.locator('.workstation-projected-screen [data-workstation-mute]')).toBeVisible();
  const frames = await workstation(page).getAttribute("data-frames");
  await page.waitForTimeout(600);
  expect(await workstation(page).getAttribute("data-frames")).toBe(frames);
});

test("clicking the lid closes it with a spring, sleeps the screen and reopens it", async ({ page }) => {
  await open(page);
  const lid = await point(page, "lid-point");
  await page.mouse.move(lid.x, lid.y);
  await expect(workstation(page)).toHaveAttribute("data-part", "lid");
  await expect(page.locator(".workstation-badge")).toHaveAttribute("data-visible", "true");
  await page.mouse.click(lid.x, lid.y);
  await expect(workstation(page)).toHaveAttribute("data-lid", "0");
  await expect.poll(async () => Number(await workstation(page).getAttribute("data-lid-rendered"))).toBeLessThan(1);
  await expect(page.locator(".workstation-projected-screen")).not.toBeVisible();
  const hull = (await workstation(page).getAttribute("data-hull"))!.split(";").map((p) => p.split(",").map(Number));
  const cx = hull.reduce((sum, p) => sum + p[0]!, 0) / hull.length, cy = hull.reduce((sum, p) => sum + p[1]!, 0) / hull.length;
  await page.mouse.click(cx, cy);
  await expect(workstation(page)).toHaveAttribute("data-lid", "108");
  await expect.poll(async () => Number(await workstation(page).getAttribute("data-lid-rendered"))).toBeGreaterThan(106);
  await expect(page.locator(".workstation-projected-screen [data-workstation-screen]")).toBeVisible();
});

test("dragging the lid edge sets its angle", async ({ page }) => {
  await open(page);
  const lid = await point(page, "lid-point");
  await page.mouse.move(lid.x, lid.y); await page.mouse.down();
  await page.mouse.move(lid.x, lid.y + 90, { steps: 8 }); await page.mouse.up();
  const angle = Number(await workstation(page).getAttribute("data-lid"));
  expect(angle).toBeLessThan(100); expect(angle).toBeGreaterThan(15);
});

test("hidden options open from a right click or the keyboard and act on the notebook", async ({ page }) => {
  await open(page);
  const options = await menu(page);
  await expect(options.getByRole("menuitem")).toHaveCount(10);
  await expect(options.getByRole("menuitem").first()).toBeFocused();
  await page.keyboard.press("ArrowDown"); await expect(options.getByRole("menuitem").nth(1)).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("menu")).toHaveCount(0);
  const trigger = page.locator(".workstation-options-trigger");
  await trigger.focus(); await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "Fechar tampa" }).click();
  await expect(workstation(page)).toHaveAttribute("data-lid", "0");
  await (await menu(page)).getByRole("menuitem", { name: "Redefinir posição" }).click();
  await expect(workstation(page)).toHaveAttribute("data-lid", "108");
  const pose = await workstation(page).getAttribute("data-pose");
  await (await menu(page)).getByRole("menuitem", { name: "Girar à direita" }).click();
  await expect.poll(() => workstation(page).getAttribute("data-pose")).not.toBe(pose);
});

test("only the silhouette captures input: the page stays clickable around the notebook", async ({ page }) => {
  await open(page);
  const hull = (await workstation(page).getAttribute("data-hull"))!.split(";").map((p) => p.split(",").map(Number));
  const minX = Math.min(...hull.map((p) => p[0]!)), minY = Math.min(...hull.map((p) => p[1]!));
  const grip = await point(page, "drag-point");
  const inside = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className, grip);
  expect(inside).toContain("workstation-hit");
  // Corner of the bounding box, outside the convex silhouette.
  const outside = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("[data-workstation]") === null, { x: minX + 4, y: minY + 4 });
  expect(outside).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("DOM on the 3D display receives native input, clicks and wheel without moving the notebook", async ({ page }) => {
  await open(page);
  await page.locator(".workstation-projected-screen [data-workstation-screen]").getByRole("button", { name: /^Browser/ }).click();
  const fixture = page.frameLocator('iframe[data-project-site="fixture"]');
  await fixture.locator("input").fill("A real DOM screen");
  await fixture.locator("button").click();
  await expect(fixture.locator("output")).toHaveText("Interação confirmada");
  const iframe = page.locator("iframe"), box = (await iframe.boundingBox())!;
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => fixture.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await workstation(page).getAttribute("data-body")).toBe("FOLLOW");
  await page.getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(workstation(page)).toHaveAttribute("data-state", "DESKTOP");
  // Screen input never becomes a drag, throw or rotation of the notebook.
  expect(await workstation(page).getAttribute("data-body")).toBe("FOLLOW");
  expect(await workstation(page).getAttribute("data-input-intent")).toBe("SCREEN");
});

test("focus dialog shows real source in the Code app and returns keyboard focus", async ({ page }) => {
  await open(page);
  await focus(page);
  const modal = page.locator("dialog");
  await modal.getByRole("button", { name: /^Browser/ }).click();
  await expect(page.frameLocator("iframe").locator("h1")).toContainText("experimentar");
  await modal.locator(".workbench-toolbar").getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
  await modal.getByRole("button", { name: /^Código/ }).click();
  await expect(modal.locator(".workbench-ide-files button").nth(20)).toBeVisible();
  await expect(modal.locator(".workbench-ide-view")).toContainText("export");
  await modal.getByRole("button", { name: "LaptopModel.client.tsx" }).click();
  await expect(modal.locator(".workbench-ide-path")).toContainText("src/features/workstation/models/LaptopModel.client.tsx");
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
  await expect(page.locator(".workstation-options-trigger")).toBeFocused();
});

test("double-clicking the window title focuses the screen", async ({ page }) => {
  await open(page);
  await page.locator(".workstation-projected-screen .workbench-title").dblclick();
  await expect(page.locator("dialog")).toBeVisible();
});

test("mobile has a readable 2D screen, native frame scroll and Escape/back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await focus(page);
  const modal = page.locator("dialog");
  await modal.getByRole("button", { name: /^Browser/ }).click();
  const fixture = page.frameLocator("iframe");
  await fixture.locator("input").fill("Mobile"); await fixture.locator("button").click();
  await expect(fixture.locator("output")).toHaveText("Interação confirmada");
  const box = (await page.locator("iframe").boundingBox())!;
  expect(box.width).toBeGreaterThan(340);
  await page.mouse.move(box.x + 150, box.y + 150); await page.mouse.wheel(0, 600);
  await expect.poll(() => fixture.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
  await modal.getByRole("button", { name: /Voltar ao notebook/ }).click();
  await expect(modal).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("reduced motion and unavailable WebGL retain complete 2D access", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pt/workstation-lab");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.locator(".workstation-fallback").getByRole("button", { name: /Focar tela/ }).click();
  await page.locator("dialog").getByRole("button", { name: /^Browser/ }).click();
  await expect(page.frameLocator("iframe").locator("input")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext; });
  await page.reload();
  await page.getByRole("button", { name: "Ativar notebook 3D", exact: true }).click();
  await expect(workstation(page)).toHaveAttribute("data-scene", "error");
  await page.locator(".workstation-fallback").getByRole("button", { name: /Focar tela/ }).click();
  await expect(page.locator("dialog [data-workstation-screen]")).toBeVisible();
});

test("lab policies stay strict and no longer allow WebAssembly", async ({ request }) => {
  const parent = await request.get("/pt/workstation-lab"), fixture = await request.get("/workstation/embed-fixture");
  const policy = parent.headers()["content-security-policy"]!;
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("frame-src 'self' https://www.nutriopus.com.br https://www.xn--advogadadborahlima-jwb.com.br");
  expect(policy).not.toContain("wasm-unsafe-eval");
  expect(fixture.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(fixture.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect((await request.get("/pt")).headers()["x-frame-options"]).toBe("DENY");
});

test("context loss returns to the still and retry owns one fresh canvas", async ({ page }) => {
  await open(page);
  await page.locator("canvas").evaluate((node) => {
    (node as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(workstation(page)).toHaveAttribute("data-scene", "error");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".workstation-still")).toBeVisible();
  await page.getByRole("button", { name: "Ativar notebook 3D", exact: true }).click();
  await expect(workstation(page)).toHaveAttribute("data-scene", "ready");
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("mobile defers WebGL while the slot is a peek, then loads when most of it is visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pt/workstation-lab");
  await expect(workstation(page)).toHaveAttribute("data-positioned", "true");
  await page.waitForTimeout(1900);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(workstation(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
});

test("a failed lazy OS chunk keeps the portfolio readable and the focus dialog dismissible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let blocked = 0;
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    if ((await response.text()).includes("workbench-toolbar")) { blocked++; await route.abort(); }
    else await route.fulfill({ response });
  });
  await page.goto("/pt/workstation-lab");
  await page.locator(".workstation-fallback").getByRole("button", { name: /Focar tela/ }).click();
  await expect(page.locator("dialog [data-screen-error]")).toContainText("A tela não carregou", { timeout: 20_000 });
  expect(blocked).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Recarregar página", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(page.locator("h1")).toBeVisible();
  await page.locator('header nav a[href$="#contact"]').filter({ visible: true }).click();
  await expect(page.locator("#contact")).toBeInViewport();
});

test("options menu and focus screen meet automated accessibility checks", async ({ page }) => {
  await open(page);
  await menu(page);
  expect((await new AxeBuilder({ page }).include(".workstation-menu").analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await focus(page);
  expect((await new AxeBuilder({ page }).include("dialog").analyze()).violations).toEqual([]);
});

test("no JavaScript keeps editorial links, headings and notebook still", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/pt/workstation-lab");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".workstation-still")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator('a[href="/pt/workstation-lab#contact"]').first()).toBeVisible();
  await context.close();
});

test("project actions approach the notebook, theme keeps state, anchors stay in the lab", async ({ page }) => {
  await open(page);
  const canvas = await page.locator("canvas").elementHandle();
  await page.locator("[data-workstation-work-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(workstation(page)).toHaveAttribute("data-chapter", "work");
  await settle(page);
  // Let the actual entry finish and select explicitly, which also pauses autoplay. Repeated
  // scrollIntoView retries during entry can otherwise move the target and trigger a brake.
  await page.locator("[data-carousel]").evaluate((node) => Promise.allSettled(node.getAnimations({ subtree: true })
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished)));
  await page.locator(".filmstrip-button").filter({ hasText: "NutriOpus" }).click();
  await settle(page);
  await page.locator('.carousel-slide[data-active="true"]').getByRole("button", { name: /Explorar no notebook/ }).click();
  await expect(workstation(page)).toHaveAttribute("data-state", "PREVIEW");
  await expect(page.locator('iframe[data-project-site="nutriopus"]')).toHaveAttribute("src", "https://www.nutriopus.com.br/");
  await page.locator("header .theme-toggle").filter({ visible: true }).click();
  await expect(workstation(page)).toHaveAttribute("data-state", "PREVIEW");
  expect(await canvas?.evaluate((node) => node === document.querySelector("canvas"))).toBe(true);
  await page.locator('header nav a[href$="#about"]').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/pt\/workstation-lab#about$/);
  await page.locator('header a[lang="en"]').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/workstation-lab#about$/);
});

for (const site of [{ id: "nutriopus", title: "NutriOpus" }, { id: "deborah", title: "Déborah Lima" }]) {
  test(`live ${site.id}: native external iframe click and wheel, independent close`, async ({ page }) => {
    test.skip(process.env.QA_LIVE_EMBEDS !== "1", "Live-domain preflight is an explicit network QA run.");
    await open(page); await focus(page);
    const modal = page.locator("dialog");
    await modal.getByRole("button", { name: new RegExp(`^${site.title}`) }).click();
    const frame = page.frameLocator(`iframe[data-project-site="${site.id}"]`);
    await expect(frame.locator("h1")).not.toBeEmpty({ timeout: 30_000 });
    await frame.locator("body").evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    const before = await frame.locator("body").evaluate(() => scrollY);
    const box = (await page.locator("iframe").boundingBox())!;
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6); await page.mouse.wheel(0, 600);
    await expect.poll(() => frame.locator("body").evaluate(() => scrollY)).toBeGreaterThan(before + 100);
    await modal.getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
  });
}
