import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 }, launchOptions: { args: ["--enable-unsafe-swiftshader"] } });
test("About depth follows scroll, chapter selection keeps keyboard priority, reduction stops signatures", async ({ page }) => {
  await page.goto("/pt#about"); const panel = page.getByRole("tabpanel");
  await panel.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
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
