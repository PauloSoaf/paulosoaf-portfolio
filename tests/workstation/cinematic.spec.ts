import { test, expect } from "@playwright/test";
import { open, host, screen, settle, point, menu } from "../../scripts/lib/workstation-p02.mjs";
import { circularGesture, togglePortfolioTheme, nativeSitePoint } from "../../scripts/lib/workstation-p03.mjs";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const fixture = '<!doctype html><html><body style="margin:0;height:3000px;background:white;color:black"><h1>Controlled framing regression</h1><input aria-label="Native input"><a href="#end" style="display:block;margin-top:40px">Jump</a><div id="end" style="margin-top:1600px">End</div></body></html>';

test("circular native gesture produces free spin, release momentum and a recoverable body", async ({ page }, testInfo) => {
  test.setTimeout(120_000); await open(page, origin);
  await page.evaluate(() => {
    const node = document.querySelector<HTMLElement>("[data-workstation]")!;
    const samples: Record<string, string | undefined>[] = []; (window as unknown as { spinSamples: typeof samples }).spinSamples = samples;
    new MutationObserver(() => { if (samples.length < 1200) samples.push({ ...node.dataset }); }).observe(node, { attributes: true });
  });
  const gesture = await circularGesture(page);
  const samples = await page.evaluate(() => (window as unknown as { spinSamples: Record<string, string | undefined>[] }).spinSamples);
  const held = samples.filter((sample) => sample.body === "HELD"), angles = held.map((sample) => Number(sample.trajectory!.split(",")[4]));
  await testInfo.attach("native-circular-spin", { body: JSON.stringify({ gesture, samples }), contentType: "application/json" });
  expect(gesture.held.spinGestures).toBe("1"); expect(gesture.held.spinIntent).toBe("true");
  expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(Math.PI * 1.5);
  await expect.poll(async () => Number(await host(page).getAttribute("data-spin-release"))).toBeGreaterThan(2);
  await settle(page); await expect(host(page)).toHaveAttribute("data-reaction-stage", "IDLE");
  const frames = await host(page).getAttribute("data-frames"); await page.waitForTimeout(600); expect(await host(page).getAttribute("data-frames")).toBe(frames);
});

for (const width of [1440, 390]) {
  test(`presentation and fitted native iframe survive theme/manual interaction at ${width}`, async ({ browser }, testInfo) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, hasTouch: width === 390, isMobile: width === 390 });
    const page = await context.newPage();
    try {
      await page.route("https://www.nutriopus.com.br/**", (route) => route.fulfill({ contentType: "text/html", body: fixture }));
      await open(page, origin); const before = await host(page).getAttribute("data-trajectory");
      await screen(page).locator('[data-input-action="nutriopus"]').click();
      await expect(host(page)).toHaveAttribute("data-presentation", "preview"); await settle(page);
      await expect(host(page)).toHaveAttribute("data-presentation-amount", "1.0000");
      const frame = page.frameLocator("iframe"); await expect(frame.locator("h1")).toHaveText("Controlled framing regression");
      const iframe = await page.locator("iframe").elementHandle(), epoch = await frame.locator("body").evaluate(() => performance.timeOrigin);
      expect(await frame.locator("body").evaluate(() => innerWidth)).toBe(1024);
      // The persistent touch actions must leave the external navigation natively clickable.
      const navbar = await nativeSitePoint(page, 990, 24);
      expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, navbar)).toBe("IFRAME");
      await frame.locator("input").fill("native fitted input");
      const scroll = await page.evaluate(() => scrollY);
      await togglePortfolioTheme(page); expect(await page.evaluate(() => scrollY)).toBe(scroll);
      const grip = await point(page, "drag-point");
      await page.keyboard.down("Shift"); await page.mouse.move(grip.x, grip.y); await page.mouse.down();
      await page.mouse.move(grip.x - 35, grip.y - 8, { steps: 6 }); await page.mouse.up(); await page.keyboard.up("Shift"); await settle(page);
      await expect(host(page)).toHaveAttribute("data-presentation-manual", "true");
      expect(await iframe!.evaluate((node) => node === document.querySelector("iframe"))).toBe(true);
      expect(await frame.locator("body").evaluate(() => performance.timeOrigin)).toBe(epoch);
      await expect(frame.locator("input")).toHaveValue("native fitted input");
      await (await menu(page)).getByRole("menuitem", { name: "Apresentar conteúdo", exact: true }).click(); await settle(page);
      await expect(host(page)).toHaveAttribute("data-presentation-amount", "1.0000");
      expect(await frame.locator("body").evaluate(() => performance.timeOrigin)).toBe(epoch);
      const exit = page.locator(".workbench-site-exit"); if (width === 390) await exit.tap(); else await exit.click();
      await settle(page); await expect(host(page)).toHaveAttribute("data-presentation", "context");
      await expect(host(page)).toHaveAttribute("data-presentation-amount", "0.0000");
      await testInfo.attach("reading-pose-and-document", { body: JSON.stringify({ width, before, after: await host(page).getAttribute("data-trajectory"), epoch }), contentType: "application/json" });
    } finally { await context.close(); }
  });
}

test("Code has a workbench pose with actual new controller source", async ({ page }) => {
  await open(page, origin); await screen(page).locator('[data-input-action="code"]').click();
  await expect(host(page)).toHaveAttribute("data-presentation", "code"); await settle(page);
  await page.locator('[data-input-action="code-file-spin-intent"]').click();
  await expect(page.locator(".workbench-ide-view")).toContainText("export class SpinIntent");
  await screen(page).locator('[data-input-action="close"]').click(); await settle(page);
  await expect(host(page)).toHaveAttribute("data-presentation-amount", "0.0000");
});

for (const locale of ["pt", "en", "es"]) {
  test(`optional native discovery and commercial access work without JavaScript in ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/${locale}/workstation-lab`);
      const panel = page.locator("#workstation-discovery-card"); await expect(panel).not.toBeVisible();
      await page.locator('[popoverTarget="workstation-discovery-card"]').first().click();
      await expect(panel).toBeVisible(); await expect(panel.locator('a[href="#about"]')).toBeVisible();
      await expect(panel.locator('a[href="#work"]')).toBeVisible(); await expect(panel.locator('a[href="#contact"]')).toBeVisible();
      expect(await panel.locator('a[download],a[href$=".pdf"]').count()).toBe(0);
      await page.keyboard.press("Escape"); await expect(panel).not.toBeVisible();
    } finally { await context.close(); }
  });
}
