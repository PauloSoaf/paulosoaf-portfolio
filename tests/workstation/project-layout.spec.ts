import { expect, test } from "@playwright/test";
import { host, settle } from "../../scripts/lib/workstation-p02.mjs";

const sizes = [[2880, 1800], [1920, 1080], [1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844], [360, 800]] as const;
test("the CSS two-column boundary stays visible with a narrower scrollbar host", async ({ page }, testInfo) => {
  for (const width of [1024, 1037]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pt#work");
    await page.evaluate(() => document.fonts.ready);
    await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    await settle(page);
    await page.locator(".carousel-stage").focus();
    await page.locator("[data-carousel]").evaluate(node => Promise.all(node.getAnimations({ subtree: true }).filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
    await expect(host(page)).toHaveAttribute("data-project-reading", "false");
    await expect(host(page)).toBeVisible();
    const geometry = await host(page).evaluate((node: HTMLElement) => {
      const points = node.dataset.hull!.split(";").map(point => point.split(",").map(Number));
      return { css: innerWidth, drawable: node.clientWidth, columns: getComputedStyle(document.querySelector("#work>.container-page")!).gridTemplateColumns.trim().split(/\s+/), notebookLeft: Math.min(...points.map(point => point[0]!)), cardRight: document.querySelector('[data-active="true"] .project-card')!.getBoundingClientRect().right };
    });
    expect(geometry.columns).toHaveLength(2);
    expect(geometry.notebookLeft).toBeGreaterThan(geometry.cardRight);
    await page.screenshot({ path: testInfo.outputPath(`css-${width}.png`) });
    await testInfo.attach(`css-${width}`, { body: JSON.stringify(geometry), contentType: "application/json" });
  }
});

for (const theme of ["dark", "light"]) for (const [width, height] of sizes) {
  test(`${theme}/${width}x${height}: native project anchor, full cards and aligned station`, async ({ page, context }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await context.addCookies([{ name: "ps-theme", value: theme, url: test.info().project.use.baseURL! }]);
    await page.goto("/pt#work");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-carousel]")).toHaveAttribute("data-enhanced", "true");
    const geometry = await page.evaluate(() => {
      const rect = (s: string) => document.querySelector(s)!.getBoundingClientRect().toJSON() as { top: number; bottom: number; left: number; right: number };
      return { work: rect("#work"), heading: rect("#work .section-heading"), carousel: rect("[data-carousel]"), anchor: rect("[data-workstation-work-anchor]"), padding: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(Math.abs(geometry.work.top - geometry.padding)).toBeLessThanOrEqual(1);
    expect(geometry.carousel.top).toBeGreaterThan(geometry.heading.bottom);
    expect(geometry.overflow).toBe(false);
    if (width >= 1024) {
      expect(Math.abs(geometry.anchor.top - geometry.carousel.top)).toBeLessThanOrEqual(1);
      expect(geometry.anchor.left).toBeGreaterThan(geometry.carousel.right);
    } else {
      expect(geometry.anchor.top).toBeGreaterThan(geometry.carousel.bottom);
    }
    // Long summaries, stack and credits must fit too; every project is selected via its real button.
    for (const selector of await page.locator(".filmstrip-button").all()) {
      await selector.click();
      const boxes = await page.evaluate(() => {
        const get = (s: string) => document.querySelector(s)!.getBoundingClientRect().toJSON() as { top: number; bottom: number; left: number; right: number };
        return { card: get('[data-active="true"] .project-card'), stage: get(".carousel-stage"), copy: get('[data-active="true"] .project-copy'), controls: get(".carousel-controls"), carousel: get("[data-carousel]") };
      });
      expect(boxes.card.left).toBeGreaterThanOrEqual(boxes.stage.left - 1);
      expect(boxes.card.right).toBeLessThanOrEqual(boxes.stage.right + 1);
      expect(boxes.card.bottom).toBeLessThanOrEqual(boxes.stage.bottom + 1);
      expect(boxes.copy.bottom).toBeLessThanOrEqual(boxes.card.bottom + 1);
      expect(boxes.controls.top).toBeGreaterThanOrEqual(boxes.card.bottom);
      expect(boxes.controls.bottom).toBeLessThanOrEqual(boxes.carousel.bottom);
    }
    await test.info().attach("project-layout", { body: JSON.stringify(geometry), contentType: "application/json" });
  });
}

for (const width of [390, 768]) {
  test(`${width}: an already loaded scene yields to project reading and opens the site on a real click`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route("https://www.nutriopus.com.br/**", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Controlled project document</title><h1>Project input regression</h1>" }));
    await page.goto("/pt");
    await page.locator("[data-workstation-anchor]").evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    await settle(page);
    const canvas = await page.locator("canvas").elementHandle();
    await page.locator("#work").evaluate(node => node.scrollIntoView({ block: "start", behavior: "instant" }));
    await settle(page);
    await expect(host(page)).toHaveAttribute("data-project-reading", "true");
    await expect(host(page)).toHaveAttribute("inert", "");
    await expect(host(page)).toBeHidden();
    await page.locator('[data-active="true"]').getByRole("button", { name: /Explorar no notebook/ }).click();
    await settle(page);
    await expect(host(page)).toHaveAttribute("data-project-reading", "false");
    await expect(host(page)).not.toHaveAttribute("inert");
    await expect(page.frameLocator('iframe[data-project-site="nutriopus"]').locator("h1")).toHaveText("Project input regression");
    expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
  });
}

for (const [width, height] of [[1440, 900], [2880, 1800]]) {
  test(`${width}: native navigation keeps the real notebook beside the project card`, async ({ page }) => {
    await page.setViewportSize({ width: width!, height: height! });
    await page.goto("/pt");
    await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    await settle(page);
    const canvas = await page.locator("canvas").elementHandle();
    const link = page.locator('header .ui-nav[href="/pt#work"]');
    const rect = (await link.boundingBox())!;
    await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await expect(page).toHaveURL(/\/pt#work$/);
    await expect.poll(() => page.evaluate(() => Math.abs(document.querySelector("#work")!.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)))).toBeLessThanOrEqual(1);
    await settle(page);
    // Autoplay can advance while the software-rendered rig settles. Inspect the actual
    // resting card after a real stage focus suspends rotation and its CSS transition ends.
    await page.locator(".carousel-stage").focus();
    await expect(page.locator("[data-carousel]")).toHaveAttribute("data-auto", "false");
    await page.locator("[data-carousel]").evaluate(node => Promise.all(node.getAnimations({ subtree: true }).filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
    const result = await host(page).evaluate((node: HTMLElement) => {
      const points = node.dataset.hull!.split(";").map(p => p.split(",").map(Number));
      const card = document.querySelector('[data-active="true"] .project-card')!.getBoundingClientRect();
      return { left: Math.min(...points.map(p => p[0]!)), cardRight: card.right };
    });
    expect(result.left).toBeGreaterThan(result.cardRight);
    expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
    const selected = Number(await page.locator("[data-carousel]").getAttribute("data-selected-index"));
    await page.locator(".carousel-next").click();
    await expect(page.locator("[data-carousel]")).toHaveAttribute("data-selected-index", String((selected + 1) % 7));
  });
}
