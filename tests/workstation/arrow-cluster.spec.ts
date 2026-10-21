import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { open, settle, waitScreenBoot } from "../../scripts/lib/workstation-p02.mjs";

type KeyPoint = { index: number; label: string; x: number; y: number };
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_WORKSTATION_ARROWS_OUTPUT ?? "docs/qa/Workstation/P02.2/arrow-cluster";

for (const width of [1440, 390]) for (const theme of ["dark", "light"]) {
  test.describe(`${theme} ${width}px arrow cluster`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, hasTouch: width === 390, isMobile: width === 390 });
    test("the four visible caps pick the correct arrow with mouse or touch", async ({ page }, testInfo) => {
      test.setTimeout(90_000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.context().addCookies([{ name: "ps-theme", value: theme, url: origin }]);
      await open(page, origin); await waitScreenBoot(page);
      const display = page.locator(".workstation-projected-screen [data-workstation-screen]");
      await display.locator('[data-input-action="notes"]').click();
      const area = display.locator("textarea");
      await area.fill("abcd\nefgh\nijkl");
      // Use the real accessible action, rather than changing the pose or rig from the test.
      await page.locator(".workstation-options-trigger").focus(); await page.keyboard.press("Enter");
      await page.getByRole("menuitem", { name: "Ver teclado", exact: true }).click(); await settle(page);
      const points = (): Promise<KeyPoint[]> => page.locator("[data-workstation]").evaluate((node) => JSON.parse((node as HTMLElement).dataset.keyPoints!) as KeyPoint[]);
      const results = [];
      for (const [label, caret] of [["↑", 2], ["←", 6], ["↓", 12], ["→", 8]] as const) {
        await area.evaluate((node) => (node as HTMLTextAreaElement).setSelectionRange(7, 7));
        let target = (await points()).find((key) => key.label === label)!;
        if (width === 1440) {
          await page.mouse.move(target.x, target.y); await settle(page);
          target = (await points()).find((key) => key.label === label)!;
          await page.mouse.click(target.x, target.y);
        } else await page.touchscreen.tap(target.x, target.y);
        await expect.poll(() => area.evaluate((node) => (node as HTMLTextAreaElement).selectionStart)).toBe(caret);
        await expect(area).toHaveValue("abcd\nefgh\nijkl");
        results.push({ label, caret, target });
      }
      await page.mouse.move(8, 420); await settle(page);
      const projected = await points(), arrows = projected.filter((key) => ["↑", "←", "↓", "→"].includes(key.label));
      // The final view has no roll: screen-space Up remains centred above the lower three caps.
      const arrow = (label: string) => arrows.find((key) => key.label === label)!;
      expect(arrow("↑").y).toBeLessThan(arrow("↓").y);
      expect(arrow("←").x).toBeLessThan(arrow("↓").x); expect(arrow("↓").x).toBeLessThan(arrow("→").x);
      expect(await page.locator("canvas").count()).toBe(1); expect(errors).toEqual([]);
      await mkdir(output, { recursive: true });
      const id = `${theme}-${width}`;
      await page.screenshot({ path: `${output}/${id}-notebook.png` });
      const viewport = page.viewportSize()!, xs = projected.map((key) => key.x), ys = projected.map((key) => key.y);
      const x = Math.max(0, Math.floor(Math.min(...xs) - 20)), y = Math.max(0, Math.floor(Math.min(...ys) - 20));
      const right = Math.min(viewport.width, Math.ceil(Math.max(...xs) + 20)), bottom = Math.min(viewport.height, Math.ceil(Math.max(...ys) + 20));
      await page.screenshot({ path: `${output}/${id}-keyboard.png`, clip: { x, y, width: right - x, height: bottom - y } });
      await testInfo.attach("arrow-picking", { body: JSON.stringify({ width, theme, input: width === 390 ? "touch" : "mouse", results, arrows, errors }, null, 2), contentType: "application/json" });
    });
  });
}
