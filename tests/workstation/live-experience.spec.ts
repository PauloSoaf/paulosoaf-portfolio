import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { open, screen, settle, sample, waitScreenBoot } from "../../scripts/lib/workstation-p02.mjs";
import { togglePortfolioTheme } from "../../scripts/lib/workstation-p03.mjs";

test("the project player embeds the authorized website with native input, scroll and persistent reading", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  let loads = 0;
  await page.route("https://www.nutriopus.com.br/**", route => {
    loads++;
    return route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="pt"><title>Controlled embed interaction</title><body><h1>Site interativo de teste</h1><label>Ideia <input></label><button onclick="document.querySelector(\'output\').textContent=\'OK\'">Testar</button><output></output><div style="height:2000px">Conteúdo para rolagem</div><p>Fim</p></body></html>' });
  });
  await open(page, info.project.use.baseURL);
  await page.locator('header .ui-nav[href="/pt#work"]').click(); await settle(page);
  await page.locator(".filmstrip-button").first().click();
  const app = screen(page).locator("[data-notebook-projects]");
  await expect(app.locator("img, .project-media")).toHaveCount(0);
  await expect(app.locator("iframe")).toHaveAttribute("src", "https://www.nutriopus.com.br/");
  const site = page.frameLocator('iframe[data-project-site="nutriopus"]');
  await app.locator('[data-input-action="project-toggle"]').click();
  await page.mouse.click(8, 200);
  await expect(app).toHaveAttribute("data-running", "true");
  await site.getByRole("textbox", { name: "Ideia" }).fill("Leitura continua");
  await expect(app.locator('[data-input-action="project-toggle"]')).toHaveText("Reproduzir automaticamente");
  await site.getByRole("button", { name: "Testar" }).click();
  await expect(site.locator("output")).toHaveText("OK");
  const scroll = await page.evaluate(() => scrollY);
  const box = (await app.locator("iframe").boundingBox())!;
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .55); await page.mouse.wheel(0, 500);
  await expect.poll(() => site.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await page.mouse.move(8, 200); await page.waitForTimeout(7600);
  await expect(app).toHaveAttribute("data-project", "nutriopus");
  await expect(site.getByRole("textbox")).toHaveValue("Leitura continua");
  const documentFrame = await app.locator("iframe").elementHandle();
  await togglePortfolioTheme(page);
  await expect(site.getByRole("textbox")).toHaveValue("Leitura continua");
  expect(await documentFrame!.evaluate((node: HTMLIFrameElement) => node === document.querySelector('iframe[data-project-site="nutriopus"]'))).toBe(true);
  expect(loads).toBe(1);
  await app.locator('[data-input-action="project-next"]').click();
  await expect(app.locator("iframe")).toHaveAttribute("data-project-site", "deborah");
  await app.locator('[data-input-action="project-next"]').click();
  await expect(app.locator("iframe")).toHaveCount(0);
  await expect(app).toContainText("ainda não possui um site de demonstração verificado");
  await expect(app.getByRole("link", { name: "Ver repositório" })).toHaveAttribute("href", "https://github.com/PauloSoaf/Dr-Manaus");
  const geometry = await sample(page); expect(geometry.alignmentErrorPx).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test("Journey keeps its rail on the page and moves the single set of details into the notebook", async ({ page }, info) => {
  test.setTimeout(100_000);
  await open(page, info.project.use.baseURL);
  await page.locator('header .ui-nav[href="/pt#about"]').click(); await settle(page);
  await expect(screen(page)).toHaveAttribute("data-app", "JOURNEY");
  await expect(page.locator("#about .journey-panel")).toHaveCount(0);
  await expect(screen(page).locator(".journey-panel")).toHaveCount(3);
  const tabs = page.locator("#about [role=tab]");
  await tabs.nth(1).click();
  await expect(screen(page).getByRole("tabpanel")).toContainText("SQL Server");
  await page.keyboard.press("ArrowDown");
  await expect(screen(page).getByRole("tabpanel")).toContainText("exploração espacial");
  await expect(page.getByRole("tab", { selected: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Acompanhar a rolagem" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(screen(page).getByRole("tabpanel")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Acompanhar a rolagem" })).toBeFocused();
  expect(await page.locator(".journey-panel[id]").evaluateAll(nodes => new Set(nodes.map(n => n.id)).size)).toBe(3);
  await expect(page.locator('[data-editorial="status"]', { hasText: "Rascunho" })).toHaveCount(0);
  await waitScreenBoot(page);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  await info.attach("journey-accessibility", { body: JSON.stringify(accessibility), contentType: "application/json" });
  expect(accessibility.violations).toEqual([]);
  await page.locator('header .ui-nav[href="/pt#home"]').click(); await settle(page);
  await expect(screen(page)).toHaveAttribute("data-app", "DESKTOP");
  await expect(page.locator('header .ui-nav[href="/pt#home"]')).toHaveAttribute("aria-current", "location");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

for (const [id, title] of [["nutriopus", "NutriOpus"], ["deborah", "Déborah Lima"]]) {
  test(`live project iframe ${title} renders its real website in the synchronized carousel`, async ({ page }, info) => {
    test.skip(process.env.QA_LIVE_EMBEDS !== "1", "Explicit live-network check");
    test.setTimeout(100_000);
    await open(page, info.project.use.baseURL);
    await page.locator('header .ui-nav[href="/pt#work"]').click(); await settle(page);
    await page.locator(".filmstrip-button").nth(id === "nutriopus" ? 0 : 1).click();
    const frame = page.frameLocator(`iframe[data-project-site="${id}"]`);
    await expect(frame.locator("body")).toContainText(id === "nutriopus" ? /nutri/i : /Déborah/i, { timeout: 30000 });
    await frame.locator(id === "nutriopus" ? 'a[href="#recursos"]' : 'a[href="#topo"]').first().click();
    if (id === "nutriopus") await expect.poll(() => frame.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
    else await expect.poll(() => frame.locator("body").evaluate(() => location.hash)).toBe("#topo");
    // NutriOpus scrolls with its own handler; changing the URL fragment is not required.
    await expect.poll(async () => { const before = await frame.locator("body").evaluate(() => scrollY); await page.waitForTimeout(150); return Math.abs(await frame.locator("body").evaluate(() => scrollY) - before); }).toBeLessThan(1);
    const parentScroll = await page.evaluate(() => scrollY);
    const beforeScroll = await frame.locator("body").evaluate(() => scrollY);
    const bounds = (await page.locator(`iframe[data-project-site="${id}"]`).boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .5);
    await page.mouse.wheel(0, 450);
    await expect.poll(() => frame.locator("body").evaluate(() => scrollY)).toBeGreaterThan(beforeScroll + 20);
    expect(await page.evaluate(() => scrollY)).toBe(parentScroll);
    await info.attach(`${id}-real-website`, { body: await page.screenshot(), contentType: "image/png" });
  });
}
