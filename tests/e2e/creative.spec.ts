import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 }, launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

test("opening, independent 3D layers, scroll camera and editorial continuity change actual pixels", async ({ page }) => {
  await page.goto("/pt?heroDebug=1");
  const art = page.locator("[data-hero-art]"), view = page.locator(".hero-view");
  expect(await page.locator(".hero-title-em").evaluate(el => getComputedStyle(el).animationName)).toBe("orbit-opening");
  await expect(art).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
  await expect(art).toHaveAttribute("data-hero-entrance", "850");
  const first = await page.locator("canvas").screenshot(); await page.waitForTimeout(650);
  expect((await page.locator("canvas").screenshot()).equals(first)).toBe(false);
  const before = await view.evaluate(el => getComputedStyle(el).transform);
  await page.mouse.wheel(0, 450);
  await expect.poll(() => view.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  await expect.poll(async () => Number(await art.getAttribute("data-hero-scroll"))).toBeGreaterThan(.35);
  await expect.poll(async () => Number((await art.getAttribute("data-hero-rotation"))!.split(",")[0])).toBeGreaterThan(.2);
  await expect(page.locator("#work-title")).toBeInViewport();
  await page.locator("#contact").scrollIntoViewIfNeeded(); await expect(art).toHaveAttribute("data-hero-state", "paused");
  await page.waitForTimeout(150); const frames = await art.getAttribute("data-hero-frames"); await page.waitForTimeout(350);
  expect(await art.getAttribute("data-hero-frames")).toBe(frames);
});

test("classic comparison keeps the earlier sphere and resting render policy", async ({ page }) => {
  await page.goto("/pt?experience=classic&heroDebug=1");
  await expect(page.locator("html")).toHaveAttribute("data-experience", "classic");
  const art = page.locator("[data-hero-art]"); await expect(art).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
  await expect(art).toHaveAttribute("data-hero-geometries", "5"); await expect(art).toHaveAttribute("data-hero-ambient", "none");
  await expect(art).toHaveAttribute("data-hero-entrance", "850"); await page.waitForTimeout(1300);
  const frames = await art.getAttribute("data-hero-frames"); await page.waitForTimeout(300);
  expect(await art.getAttribute("data-hero-frames")).toBe(frames);
});

test("About depth follows scroll, chapter selection keeps keyboard priority, reduction stops signatures", async ({ page }) => {
  await page.goto("/pt#about"); const panel = page.getByRole("tabpanel");
  const before = await panel.evaluate(el => getComputedStyle(el).transform);
  await page.mouse.wheel(0, 190);
  await expect.poll(() => panel.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  await page.getByRole("tab").first().focus(); await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab").nth(1)).toBeFocused();
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
  expect(await panel.locator(".journey-content").evaluate(el => getComputedStyle(el).animationName)).toBe("chapter-opening");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => panel.evaluate(el => getComputedStyle(el).transform)).toBe("none");
  expect(await panel.locator(".journey-content").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  await expect(page.getByRole("button", { name: "Acompanhar a rolagem", exact: true })).toBeDisabled();
});
