import { expect, test } from "@playwright/test";
import { host, open, screen, settle } from "../../scripts/lib/workstation-p02.mjs";

const gallery = (page: import("@playwright/test").Page) => screen(page).locator("[data-notebook-projects]");
const carousel = (page: import("@playwright/test").Page) => page.locator("[data-carousel]");
async function synchronized(page: import("@playwright/test").Page) {
  await expect.poll(() => page.evaluate(() => {
    const a = document.querySelector<HTMLElement>("[data-carousel]"), b = document.querySelector<HTMLElement>("[data-notebook-projects]");
    return !!a && !!b && a.dataset.selectedIndex === b.dataset.selectedIndex &&
      a.querySelector<HTMLElement>("[data-countdown]")?.dataset.countdown === b.querySelector<HTMLElement>("[data-countdown]")?.dataset.countdown;
  })).toBe(true);
}

test("native Projects navigation opens and plays the notebook carousel with one real clock and bidirectional controls", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await open(page, info.project.use.baseURL);
  const canvas = await page.locator("canvas").elementHandle();
  await page.locator('header .ui-nav[href="/pt#work"]').click();
  await settle(page);
  await expect(gallery(page)).toBeVisible(); await synchronized(page);
  await page.mouse.move(8, 400);
  await expect(gallery(page)).toHaveAttribute("data-running", "true");
  const initial = await gallery(page).getAttribute("data-selected-index");
  await expect.poll(() => gallery(page).getAttribute("data-selected-index"), { timeout: 10_000 }).not.toBe(initial);
  await synchronized(page);
  await expect(page.locator("iframe")).toHaveCount(0);
  // A direct selection in the page is reflected in the real projected screen.
  await page.locator(".filmstrip-button").nth(3).click();
  await expect(gallery(page)).toHaveAttribute("data-selected-index", "3");
  await gallery(page).locator('[data-input-action="project-next"]').click();
  await expect(carousel(page)).toHaveAttribute("data-selected-index", "4"); await synchronized(page);
  await expect(gallery(page).locator("h2")).toHaveText(await page.locator('[data-carousel] [data-active="true"] h3').innerText());
  await page.screenshot({ path: info.outputPath("projects-synchronized-desktop.png") });
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
  // Leaving returns the automatic app to Desktop. The same fragment works again from Hero.
  await page.locator('header .ui-nav[href="/pt#about"]').click();
  await expect(screen(page)).toHaveAttribute("data-app", "DESKTOP");
  await page.locator('header .ui-nav[href="/pt#work"]').click();
  await expect(gallery(page)).toBeVisible();
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator('header .ui-nav[aria-current="location"]')).toHaveCount(0);
  await page.locator('header .ui-nav[href="/pt#work"]').click();
  await settle(page); await expect(gallery(page)).toBeVisible();
  await synchronized(page); expect(errors).toEqual([]);
});

for (const theme of ["dark", "light"]) {
  test(`${theme}/mobile: gallery keeps playing when its page card is outside the viewport`, async ({ page, context }, info) => {
    test.setTimeout(100_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await context.addCookies([{ name: "ps-theme", value: theme, url: info.project.use.baseURL! }]);
    await open(page, info.project.use.baseURL);
    await page.locator("[data-workstation-work-anchor]").evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
    // The station is below the card. Advance until even the filmstrip has left the viewport;
    // centering the station alone still leaves the preceding controls visible on a tall phone.
    await carousel(page).evaluate(node => scrollTo({ top: scrollY + node.getBoundingClientRect().bottom + 16, behavior: "instant" }));
    await settle(page);
    await expect(gallery(page)).toBeVisible();
    await expect(host(page)).toHaveAttribute("data-project-reading", "false");
    await expect(carousel(page)).toHaveAttribute("data-visible", "false");
    await page.mouse.move(8, 80);
    await expect(gallery(page)).toHaveAttribute("data-running", "true");
    const initial = await gallery(page).getAttribute("data-selected-index");
    await expect.poll(() => gallery(page).getAttribute("data-selected-index"), { timeout: 10_000 }).not.toBe(initial);
    await synchronized(page);
    await page.screenshot({ path: info.outputPath(`projects-synchronized-mobile-${theme}.png`) });
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test("passive section scroll preserves a manual app; an explicit Projects click chooses the gallery", async ({ page }, info) => {
  test.setTimeout(100_000);
  await open(page, info.project.use.baseURL);
  await screen(page).getByRole("button", { name: /Notas/ }).click();
  await screen(page).locator("textarea").fill("Minha nota permanece.");
  await page.locator("#work").evaluate(node => node.scrollIntoView({ block: "start", behavior: "instant" }));
  await settle(page);
  await expect(screen(page)).toHaveAttribute("data-app", "NOTES");
  await page.locator('header .ui-nav[href="/pt#work"]').click();
  await expect(gallery(page)).toBeVisible();
  await screen(page).getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
  await screen(page).getByRole("button", { name: /Notas/ }).click();
  await expect(screen(page).locator("textarea")).toHaveValue("Minha nota permanece.");
});

for (const [locale, projectsLabel, focusLabel] of [["pt", "Projetos", "Focar tela"], ["en", "Projects", "Focus screen"], ["es", "Proyectos", "Enfocar pantalla"]] as const) {
  test(`${locale}: reduced motion has a translated 2D gallery with manual selection and disabled autoplay`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await page.locator("[data-workstation-anchor]").getByRole("button", { name: new RegExp(`^${focusLabel}`) }).click();
    const dialog = page.locator("dialog");
    await dialog.locator('[data-input-action="projects"]').click();
    await expect(dialog.locator(".workbench-title")).toHaveText(projectsLabel);
    const app = dialog.locator("[data-notebook-projects]");
    await expect(app).toHaveAttribute("data-running", "false");
    await expect(app.locator('[data-input-action="project-toggle"]')).toBeDisabled();
    await app.locator('[data-input-action="project-next"]').click();
    await expect(carousel(page)).toHaveAttribute("data-selected-index", "1");
    await expect(app).toHaveAttribute("data-selected-index", "1");
    await expect(page.locator("canvas")).toHaveCount(0);
  });
}

test("Projects opened explicitly from the notebook Desktop plays while the page stays in Hero", async ({ page }, info) => {
  test.setTimeout(90_000);
  await open(page, info.project.use.baseURL);
  await screen(page).locator('[data-input-action="projects"]').click();
  await page.mouse.move(8, 80);
  await expect(gallery(page)).toBeVisible();
  await expect(carousel(page)).toHaveAttribute("data-visible", "false");
  await expect(gallery(page)).toHaveAttribute("data-running", "true");
  const initial = await gallery(page).getAttribute("data-selected-index");
  await expect.poll(() => gallery(page).getAttribute("data-selected-index"), { timeout: 10_000 }).not.toBe(initial);
  await synchronized(page);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('header .ui-nav[aria-current="location"]')).toHaveCount(0);
});
