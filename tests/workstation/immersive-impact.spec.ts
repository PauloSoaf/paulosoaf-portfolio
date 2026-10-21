import { test, expect, type Page } from "@playwright/test";
import { open, host, screen, settle, point, menu } from "../../scripts/lib/workstation-p02.mjs";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const sites = { nutriopus: "https://www.nutriopus.com.br/", deborah: "https://www.xn--advogadadborahlima-jwb.com.br/" };
// Isolated synthetic response tests UI invariants only. Separate live-domain tests prove the sites.
const documentFixture = '<!doctype html><html><head><title>Controlled cross-origin regression fixture</title><style>body{margin:0;background:#fff;color:#111;height:2400px}input,a{display:block;margin:40px}#end{margin-top:1400px}</style></head><body><h1>Regression fixture</h1><input aria-label="Native input"><a href="#end">Native anchor</a><p id="end">Native destination</p></body></html>';
async function commercial(page: Page, id: keyof typeof sites) {
  await screen(page).locator(`[data-input-action="${id}"]`).click();
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(screen(page)).toHaveAttribute("data-immersive", "true");
  return page.frameLocator(`iframe[data-project-site="${id}"]`);
}

for (const id of Object.keys(sites) as (keyof typeof sites)[]) {
  test(`immersive ${id}: entire display, native input/scroll, stable document across pose/theme/lid`, async ({ page }) => {
    test.setTimeout(90000);
    await page.route(`${sites[id]}**`, (route) => route.fulfill({ contentType: "text/html", body: documentFixture }));
    await open(page, origin);
    const frame = await commercial(page, id), iframe = page.locator("iframe");
    await settle(page); // P03 reading pose is a finite transition; native input follows its final projection.
    await expect(frame.locator("h1")).toHaveText("Regression fixture");
    await expect(screen(page).locator(".workbench-toolbar,.workbench-address,.workbench-browser-note")).toHaveCount(0);
    const coverage = await iframe.evaluate((node) => {
      const root = node.closest<HTMLElement>("[data-workstation-screen]")!;
      const physical = node.getBoundingClientRect(), display = root.getBoundingClientRect();
      return { x: (node as HTMLElement).offsetLeft, y: (node as HTMLElement).offsetTop, w: node.clientWidth, rw: root.clientWidth, rh: root.clientHeight,
        widthDelta: Math.abs(physical.width - display.width), heightDelta: Math.abs(physical.height - display.height) };
    });
    expect(coverage.x).toBe(0); expect(coverage.y).toBe(0); expect(coverage.rw).toBe(800); expect(coverage.rh).toBe(459);
    expect(coverage.w).toBe(id === "nutriopus" ? 1024 : 1200);
    expect(coverage.widthDelta).toBeLessThan(1); expect(coverage.heightDelta).toBeLessThan(1);
    const handle = await iframe.elementHandle();
    await frame.locator("input").fill("Native state survives");
    await frame.locator("body").evaluate(() => { document.documentElement.dataset.documentToken = "same-document"; });
    const box = (await iframe.boundingBox())!, pageScroll = await page.evaluate(() => scrollY);
    await page.mouse.move(box.x + box.width * .3, box.y + box.height * .65); await page.mouse.wheel(0, 450);
    await expect.poll(() => frame.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
    expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
    const scroll = await frame.locator("body").evaluate(() => scrollY);
    await page.locator("header .theme-toggle").filter({ visible: true }).click(); await settle(page);
    const grip = await point(page, "drag-point");
    await page.keyboard.down("Shift"); await page.mouse.move(grip.x, grip.y); await page.mouse.down();
    await page.mouse.move(grip.x - 50, grip.y - 10, { steps: 8 }); await page.mouse.up(); await page.keyboard.up("Shift"); await settle(page);
    await (await menu(page)).getByRole("menuitem", { name: "Fechar tampa" }).click();
    await expect(page.locator(".workstation-projected-screen")).not.toBeVisible();
    await page.locator(".workstation-options-trigger").focus(); await page.keyboard.press("Enter");
    await page.getByRole("menuitem", { name: "Abrir tampa" }).click(); await settle(page);
    await page.mouse.move(8, 450); await page.mouse.wheel(0, 120); await settle(page);
    expect(await handle!.evaluate((node) => node === document.querySelector("iframe"))).toBe(true);
    await expect(frame.locator("input")).toHaveValue("Native state survives");
    expect(await frame.locator("html").getAttribute("data-document-token")).toBe("same-document");
    expect(await frame.locator("body").evaluate(() => scrollY)).toBe(scroll);
    await expect(iframe).toHaveAttribute("src", sites[id]); await expect(iframe).toHaveCount(1);
    const exit = page.locator(".workbench-site-exit");
    await page.mouse.move(8, 450); await expect(exit).toHaveCSS("opacity", "0");
    await exit.hover(); await expect(exit).toHaveCSS("opacity", "1");
    await exit.focus(); await page.mouse.move(8, 450); await expect(exit).toHaveCSS("opacity", "1");
    await page.keyboard.press("Enter"); await expect(iframe).toHaveCount(0); await expect(screen(page)).toHaveAttribute("data-app", "DESKTOP");
  });
}

test("touch commercial preview stays in 3D and exposes an accessible close target", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.route(`${sites.nutriopus}**`, (route) => route.fulfill({ contentType: "text/html", body: documentFixture }));
    await open(page, origin); await commercial(page, "nutriopus");
    const exit = page.locator(".workbench-site-exit");
    await expect(exit).toHaveCSS("opacity", "1");
    const box = (await exit.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(43.5); expect(box.height).toBeGreaterThanOrEqual(43.5);
    await exit.tap(); await expect(page.locator("iframe")).toHaveCount(0);
    // Once explicitly opted into 3D, a motion preference must not force a commercial site
    // into the 2D dialog. Reduced motion still disables the physical effects.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('.filmstrip-button').filter({ hasText: "NutriOpus" }).click();
    await page.locator('.carousel-slide[data-active="true"]').getByRole("button", { name: "Explorar no notebook", exact: true }).click();
    await expect(page.locator("dialog")).not.toBeVisible();
    await expect(page.locator('iframe[data-project-site="nutriopus"]')).toHaveCount(1);
  } finally { await context.close(); }
});

test("a stalled external domain has an honest retry/external-link fallback; blocked content has manual help", async ({ page }) => {
  test.setTimeout(60000);
  await page.route(`${sites.nutriopus}**`, async (route) => { await new Promise((resolve) => setTimeout(resolve, 18000)); await route.abort(); });
  await open(page, origin); await commercial(page, "nutriopus");
  await expect(page.locator(".workbench-site-fallback")).toContainText("não respondeu a tempo", { timeout: 18000 });
  await expect(page.locator(".workbench-site-fallback a")).toHaveAttribute("href", sites.nutriopus);
  await page.getByRole("button", { name: "Voltar ao site", exact: true }).click();
  await page.locator(".workbench-site-help").focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".workbench-site-fallback")).toContainText("pode bloquear a incorporação");
  await page.locator(".workbench-site-exit").focus(); await page.keyboard.press("Enter");
  await page.route(`${sites.deborah}**`, (route) => route.fulfill({ contentType: "text/html", body: documentFixture, headers: { "Content-Security-Policy": "frame-ancestors 'none'" } }));
  await commercial(page, "deborah");
  // A child can forbid embedding and still fire iframe load. The owned help/exit must work.
  await page.locator(".workbench-site-help").focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".workbench-site-fallback")).toContainText("pode bloquear a incorporação");
  await expect(page.locator(".workbench-site-fallback a")).toHaveAttribute("href", sites.deborah);
});

test("physical contact starts dizzy/stars in the same useful frame, recovers continuously and sleeps", async ({ page }, testInfo) => {
  test.setTimeout(90000); await open(page, origin);
  await page.evaluate(() => {
    const node = document.querySelector<HTMLElement>("[data-workstation]")!;
    const samples: Record<string, string | number>[] = [];
    (window as unknown as { impactSamples: typeof samples }).impactSamples = samples;
    new MutationObserver(() => {
      if (samples.length < 1800) samples.push({ observedAt: performance.now(), ...node.dataset });
    }).observe(node, { attributes: true });
  });
  // The hero is close to the floor: a plain drop there is correctly a light contact.
  // A flip supplies genuine initial velocity and reaches a strong physical contact.
  await (await menu(page)).getByRole("menuitem", { name: "Dar uma cambalhota", exact: true }).click();
  await expect(host(page)).toHaveAttribute("data-reaction-count", "1", { timeout: 15000 });
  await settle(page);
  const samples = await page.evaluate(() => (window as unknown as { impactSamples: Record<string, string | number>[] }).impactSamples);
  const first = samples.find((s) => s.reactionStage === "IMPACT")!;
  expect(first).toBeTruthy(); expect(first.body).toBe("AIRBORNE"); expect(first.stars).toBe("true");
  expect(Number(first.reactionAt) - Number(first.reactionContactAt)).toBe(0);
  const callbackDelay = Number(first.reactionStartedAt) - Number(first.reactionContactDetectedAt);
  expect(callbackDelay).toBeGreaterThanOrEqual(0); expect(callbackDelay).toBeLessThan(100);
  const renderDelay = Number(first.reactionRenderedAt) - Number(first.reactionContactDetectedAt);
  expect(first.reactionRenderedCount).toBe("1"); expect(renderDelay).toBeGreaterThanOrEqual(0); expect(renderDelay).toBeLessThan(100);
  expect(samples.some((s) => s.reactionStage === "DIZZY")).toBe(true);
  expect(samples.some((s) => s.reactionStage === "RECOVERING")).toBe(true);
  expect(Math.max(...samples.map((s) => Number(s.reactionCount)))).toBe(1);
  // The visual recovery can span only one software-rendered frame. Measure the whole
  // physical return from that point through idle, rather than accepting a vacuous 0px/s.
  const recoveryIndex = samples.findIndex((s) => s.reactionStage === "RECOVERING");
  const recovery = samples.slice(Math.max(0, recoveryIndex - 1));
  expect(new Set(recovery.map((s) => String(s.trajectory).split(",")[0])).size).toBeGreaterThan(2);
  let maxSpeed = 0;
  for (let i = 1; i < recovery.length; i++) {
    const a = String(recovery[i - 1]!.trajectory).split(",").map(Number), b = String(recovery[i]!.trajectory).split(",").map(Number);
    if (b[0]! > a[0]!) maxSpeed = Math.max(maxSpeed, Math.hypot(b[1]! - a[1]!, b[2]! - a[2]!) / (b[0]! - a[0]!) * 1000);
  }
  expect(maxSpeed).toBeLessThan(4500);
  expect(maxSpeed).toBeGreaterThan(0);
  await expect(host(page)).toHaveAttribute("data-stars", "false"); await expect(host(page)).toHaveAttribute("data-reaction-stage", "IDLE");
  const frames = await host(page).getAttribute("data-frames"); await page.waitForTimeout(600); expect(await host(page).getAttribute("data-frames")).toBe(frames);
  await testInfo.attach("actual-contact-reaction-timestamps", { body: JSON.stringify({ callbackDelay, renderDelay, maxRecoverySpeed: maxSpeed, samples }, null, 2), contentType: "application/json" });
});

test("a real grab interrupts the recovery instead of fighting the return spring", async ({ page }) => {
  test.setTimeout(90000); await open(page, origin);
  const cdp = await page.context().newCDPSession(page);
  let grabbed!: () => void;
  const inputSent = new Promise<void>((resolve) => { grabbed = resolve; });
  // Ask Node for native input from the observed recovery frame. Several separate locator/
  // mouse round trips can miss a moving object on SwiftShader; do not slow the product clock.
  await page.exposeBinding("grabRecoveringNotebook", async (_source, grip: { x: number; y: number }) => {
    await Promise.all([
      cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: grip.x, y: grip.y }),
      cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: grip.x, y: grip.y, button: "left", buttons: 1, clickCount: 1 }),
      cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: grip.x - 18, y: grip.y - 8, button: "left", buttons: 1 }),
    ]);
    grabbed();
  });
  await page.evaluate(() => {
    const node = document.querySelector<HTMLElement>("[data-workstation]")!;
    const observer = new MutationObserver(() => {
      if (node.dataset.reactionStage !== "RECOVERING") return;
      observer.disconnect();
      const [x, y] = node.dataset.dragPoint!.split(",").map(Number);
      void (window as unknown as { grabRecoveringNotebook: (point: { x: number; y: number }) => Promise<void> }).grabRecoveringNotebook({ x: x!, y: y! });
    });
    observer.observe(node, { attributes: true });
  });
  await (await menu(page)).getByRole("menuitem", { name: "Dar uma cambalhota", exact: true }).click();
  await inputSent;
  await expect(host(page)).toHaveAttribute("data-body", "HELD"); await expect(host(page)).toHaveAttribute("data-reaction-stage", "IDLE");
  const grip = await point(page, "drag-point");
  await page.mouse.move(grip.x - 60, grip.y - 20, { steps: 5 });
  await expect(host(page)).toHaveAttribute("data-body", "HELD");
  await page.mouse.up(); await settle(page); await cdp.detach();
});
