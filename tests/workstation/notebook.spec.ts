import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const workstation = (page: Page) => page.locator("[data-workstation]");
async function open(page: Page) {
  await page.goto("/pt/workstation-lab");
  await expect(workstation(page)).toHaveAttribute("data-scene", "ready");
  await expect(page.locator("[data-workstation-screen]")).toBeVisible();
  await expect(workstation(page)).toHaveAttribute("data-motion", "settled");
}
async function focus(page: Page) {
  await page.locator(".workstation-controls").getByRole("button", { name: "Focar tela", exact: false }).click();
  await expect(page.locator("dialog")).toBeVisible();
}

test("real mesh hinge, three axes, chassis drag and quiet renderer", async ({ page }) => {
  await open(page);
  expect(await page.locator("canvas").count()).toBe(1);
  await page.getByRole("button", { name: "Fechar tampa", exact: true }).click();
  await expect.poll(async () => Number(await workstation(page).getAttribute("data-lid-rendered"))).toBeLessThan(.1);
  await expect(page.locator("[data-workstation-screen]")).toHaveCount(0);
  await page.getByRole("button", { name: "Abrir tampa", exact: true }).click();
  await expect.poll(async () => Number(await workstation(page).getAttribute("data-lid-rendered"))).toBeGreaterThan(107.9);
  const before = await workstation(page).getAttribute("data-pose");
  await page.getByRole("button", { name: "Girar à direita", exact: true }).click();
  await expect.poll(() => workstation(page).getAttribute("data-pose")).not.toBe(before);
  await page.getByRole("button", { name: "Inclinar notebook", exact: true }).click();
  await page.waitForTimeout(700);
  const pose = await workstation(page).getAttribute("data-pose");
  const box = (await page.locator("canvas").boundingBox())!;
  const point = (await workstation(page).getAttribute("data-drag-point"))!.split(",").map(Number);
  const scale = box.width / 800;
  await page.mouse.move(box.x + point[0]! * scale, box.y + point[1]! * scale);
  await page.mouse.down();
  await page.mouse.move(box.x + point[0]! * scale - 80, box.y + point[1]! * scale - 20, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => workstation(page).getAttribute("data-pose")).not.toBe(pose);
  await expect(workstation(page)).not.toHaveAttribute("data-state", "MANIPULATE");
  await page.waitForTimeout(1500);
  const frames = await workstation(page).getAttribute("data-frames");
  await page.waitForTimeout(500);
  expect(await workstation(page).getAttribute("data-frames")).toBe(frames);
});

test("keyboard and trackpad hit targets block the chassis ray behind them", async ({ page }) => {
  await open(page);
  const box = (await page.locator("canvas").boundingBox())!, before = await workstation(page).getAttribute("data-pose");
  for (const target of ["keyboard", "trackpad"]) {
    const [x, y] = (await workstation(page).getAttribute(`data-${target}-point`))!.split(",").map(Number);
    const scale = box.width / 800;
    await page.mouse.move(box.x + x! * scale, box.y + y! * scale); await page.mouse.down();
    await page.mouse.move(box.x + x! * scale + 60, box.y + y! * scale, { steps: 10 }); await page.mouse.up();
    expect(await workstation(page).getAttribute("data-state")).toBe("DESKTOP");
    expect(await workstation(page).getAttribute("data-pose")).toBe(before);
  }
});

test("DOM on the 3D display receives native input, clicks and wheel without rotating", async ({ page }) => {
  await open(page);
  const pose = await workstation(page).getAttribute("data-pose");
  await page.locator("[data-workstation-screen]").getByRole("button", { name: /^Browser/ }).click();
  const fixture = page.frameLocator('iframe[data-project-site="fixture"]');
  await fixture.locator("input").fill("A real DOM screen");
  await fixture.locator("button").click();
  await expect(fixture.locator("output")).toHaveText("Interação confirmada");
  const iframe = page.locator("iframe"), box = (await iframe.boundingBox())!;
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => fixture.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await workstation(page).getAttribute("data-pose")).toBe(pose);
  await page.getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(workstation(page)).toHaveAttribute("data-state", "DESKTOP");
});

test("focus dialog, browser close, code placeholder and focus restoration", async ({ page }) => {
  await open(page);
  await focus(page);
  const modal = page.locator("dialog");
  await modal.getByRole("button", { name: /^Browser/ }).click();
  await expect(page.frameLocator("iframe").locator("h1")).toContainText("experimentar");
  await modal.locator(".workbench-toolbar").getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
  await modal.getByRole("button", { name: /^Código/ }).click();
  await expect(modal).toContainText("fase P03");
  await modal.locator(".workbench-toolbar").getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
  await expect(page.locator(".workstation-controls").getByRole("button", { name: /Focar tela/ })).toBeFocused();
});

test("mobile has a readable 2D screen, native frame scroll and Escape/back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pt/workstation-lab");
  await page.getByRole("button", { name: "Explorar notebook", exact: false }).click();
  const modal = page.locator("dialog");
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: /^Browser/ }).click();
  const fixture = page.frameLocator("iframe");
  await fixture.locator("input").fill("Mobile"); await fixture.locator("button").click();
  await expect(fixture.locator("output")).toHaveText("Interação confirmada");
  const box = (await page.locator("iframe").boundingBox())!;
  expect(box.width).toBeGreaterThan(340);
  await page.mouse.move(box.x + 150, box.y + 150); await page.mouse.wheel(0, 600);
  await expect.poll(() => fixture.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
  const cdp = await page.context().newCDPSession(page);
  const touchX = box.x + box.width * .5, touchY = box.y + box.height * .7;
  const beforeTouch = await fixture.locator("body").evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: touchX, y: touchY }] });
  for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: touchX, y: touchY - step * 25 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => fixture.locator("body").evaluate(() => scrollY)).toBeGreaterThan(beforeTouch + 50);
  await modal.getByRole("button", { name: /Voltar ao notebook/ }).click();
  await expect(modal).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("reduced motion and unavailable WebGL retain complete 2D access", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pt/workstation-lab");
  await expect(page.locator("canvas")).toHaveCount(0);
  await focus(page);
  await page.locator("dialog").getByRole("button", { name: /^Browser/ }).click();
  await expect(page.frameLocator("iframe").locator("input")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext; });
  await page.reload();
  await page.getByRole("button", { name: "Ativar notebook 3D", exact: true }).click();
  await expect(workstation(page)).toHaveAttribute("data-scene", "error");
  await focus(page);
  await expect(page.locator("dialog [data-workstation-screen]")).toBeVisible();
});

test("same-origin fixture security is scoped and lab parent keeps strict policies", async ({ request }) => {
  const parent = await request.get("/pt/workstation-lab"), fixture = await request.get("/workstation/embed-fixture");
  expect(parent.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(parent.headers()["content-security-policy"]).toContain("frame-src 'self' https://www.nutriopus.com.br https://www.xn--advogadadborahlima-jwb.com.br");
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
  await focus(page); await expect(page.locator("dialog [data-workstation-screen]")).toBeVisible();
  await page.locator("dialog .workstation-focus-heading button").click();
  await page.getByRole("button", { name: "Ativar notebook 3D", exact: true }).click();
  await expect(workstation(page)).toHaveAttribute("data-scene", "ready");
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("mobile defers WebGL while the scene is a peek, then loads when most of it is visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pt/workstation-lab");
  await expect(page.locator("[data-workstation]")).toHaveAttribute("data-positioned", "true");
  await page.waitForTimeout(1900);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(workstation(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
  await expect(page.locator("[data-workstation-screen]")).toBeVisible();
});

test("keyboard and focus screen meet automated accessibility checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pt/workstation-lab");
  const trigger = page.locator(".workstation-controls").getByRole("button", { name: /Focar tela/ });
  await trigger.focus(); await page.keyboard.press("Enter");
  const results = await new AxeBuilder({ page }).include("dialog").analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
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

test("existing project actions approach the notebook, theme keeps state, anchors stay in the lab", async ({ page }) => {
  await open(page);
  const canvas = await page.locator("canvas").elementHandle();
  await page.locator('[data-workstation-work-anchor]').evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(workstation(page)).toHaveAttribute("data-chapter", "work");
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
    // Remote pages finish their own opening/hydration after server HTML is visible.
    await page.waitForTimeout(1800);
    const before = await frame.locator("body").evaluate(() => scrollY);
    const box = (await page.locator("iframe").boundingBox())!;
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6); await page.mouse.wheel(0, 600);
    await expect.poll(() => frame.locator("body").evaluate(() => scrollY)).toBeGreaterThan(before + 100);
    await frame.locator(site.id === "nutriopus" ? 'a[href="#recursos"]' : 'a[href="#topo"]').first().click();
    await modal.getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
  });
}
