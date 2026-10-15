import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const host = (page: Page) => page.locator("[data-workstation]");
async function open(page: Page) {
  await page.goto("/pt/workstation-lab");
  if (page.viewportSize()!.width < 1280) await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
}
async function key(page: Page, label: string) {
  const point = await host(page).evaluate((node, label) => (JSON.parse(node.dataset.keyPoints!) as { label: string; x: number; y: number }[]).find((key) => key.label === label)!, label);
  const rect = (await page.locator("canvas").boundingBox())!;
  await page.mouse.click(rect.x + point.x * rect.width / 800, rect.y + point.y * rect.height / 620);
}
async function padPoint(page: Page) {
  const [x, y] = (await host(page).getAttribute("data-trackpad-point"))!.split(",").map(Number);
  const rect = (await page.locator("canvas").boundingBox())!, scale = rect.width / 800;
  return { x: rect.x + x! * scale, y: rect.y + y! * scale, scale };
}
async function moveCursor(page: Page, x: number, y: number) {
  const current = await page.locator("[data-notebook-cursor]").evaluate((node) => ({ x: parseFloat((node as SVGElement).style.left) / 100, y: parseFloat((node as SVGElement).style.top) / 100 }));
  const point = await padPoint(page);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x + (x - current.x) * 220 * point.scale, point.y + (y - current.y) * 150 * point.scale, { steps: 12 }); await page.mouse.up();
}
async function targetCursor(page: Page, id: string) {
  const target = await page.locator(`[data-input-action="${id}"]`).evaluate((node) => {
    const rect = node.getBoundingClientRect(), projected = node.closest<HTMLElement>(".workstation-projected-screen")!;
    const scene = node.closest<HTMLElement>(".workstation-scene")!, box = scene.getBoundingClientRect(), scale = box.width / 800;
    const point = new DOMMatrix(getComputedStyle(projected).transform).inverse().transformPoint(new DOMPoint((rect.x + rect.width / 2 - box.x) / scale, (rect.y + rect.height / 2 - box.y) / scale));
    return { x: point.x / 800, y: point.y / 458.5366 };
  });
  await moveCursor(page, target.x, target.y);
}
async function tap(page: Page) { const point = await padPoint(page); await page.mouse.click(point.x, point.y); }

test("large chassis and real 3D keys edit the owned app without rotation", async ({ page }) => {
  await open(page);
  expect(Number(await host(page).getAttribute("data-chassis-width"))).toBeGreaterThanOrEqual(520);
  expect(Number(await host(page).getAttribute("data-chassis-width"))).toBeLessThanOrEqual(680);
  await page.getByRole("button", { name: /^Notas/ }).click();
  const pose = await host(page).getAttribute("data-pose");
  for (const label of ["shift", "A", "space", "B", "enter", "C", "⌫", "D", "caps", "E", "←", "space"]) await key(page, label);
  await expect(page.locator("textarea")).toHaveValue("A b\nd E");
  expect(await host(page).getAttribute("data-pose")).toBe(pose);
  await page.locator("textarea").focus(); await page.keyboard.press("End"); await page.keyboard.type(" native");
  await expect(page.locator("textarea")).toHaveValue("A b\nd E native");
  await page.getByRole("button", { name: "Voltar ao desktop", exact: true }).click();
  await page.getByRole("button", { name: /^Notas/ }).click(); await expect(page.locator("textarea")).toHaveValue("A b\nd E native");
});

test("trackpad moves cursor, clicks, double clicks, drags and scrolls owned controls after rotation", async ({ page }) => {
  await open(page);
  await targetCursor(page, "notes"); await tap(page); await expect(page.locator("textarea")).toBeVisible();
  await page.locator("textarea").fill("Real trackpad input");
  await targetCursor(page, "notes-save"); await tap(page); await expect(page.locator("[data-notes-saved]")).toContainText("Real trackpad input");
  await targetCursor(page, "notes-text"); await tap(page); await tap(page);
  expect(await page.locator("textarea").evaluate((node) => (node as HTMLTextAreaElement).selectionEnd - (node as HTMLTextAreaElement).selectionStart)).toBe("Real trackpad input".length);
  await targetCursor(page, "notes-handle"); await moveCursor(page, .7, .4);
  await expect(page.locator(".workbench-notes-paper")).toHaveAttribute("style", /translate\(/);
  const pad = await padPoint(page), beforeScroll = await page.evaluate(() => scrollY);
  await page.mouse.move(pad.x, pad.y); await page.mouse.wheel(0, 180);
  await expect.poll(() => page.locator("[data-input-scroll]").evaluate((node) => node.scrollTop)).toBeGreaterThan(50);
  expect(await page.evaluate(() => scrollY)).toBe(beforeScroll);
  await page.getByRole("button", { name: "Girar à direita", exact: true }).click();
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 }); await moveCursor(page, 2, -2);
  const cursor = page.locator("[data-notebook-cursor]");
  await expect(cursor).toHaveAttribute("style", /left: 100%; top: 0%;/);
  await expect(page.locator("canvas")).toHaveCount(1);
});

for (const width of [1440, 1920, 768, 390]) {
  test(`trajectory continuous through all sections, reverse, fast/slow scroll and resize at ${width}`, async ({ page }) => {
    test.setTimeout(120_000); await page.setViewportSize({ width, height: width === 390 ? 844 : width === 1920 ? 1080 : 900 }); await open(page);
    await page.evaluate(() => {
      const samples: { time: number; x: number; y: number; width: number; dt: number; shift: number; screenError: number }[] = [];
      (window as unknown as { trajectorySamples: typeof samples }).trajectorySamples = samples;
      let previous = { time: 0, x: 0, y: 0 };
      const sample = () => {
        const portal = document.querySelector<HTMLElement>("[data-workstation]")!;
        const [stamp, x, y, width] = portal.dataset.trajectory!.split(",").map(Number) as [number, number, number, number];
        if (stamp !== previous.time) {
          // Compare with the physical mesh matrix, independently of the DOM anchor formula.
          const screen = document.querySelector<HTMLElement>(".workstation-projected-screen");
          let screenError = 0;
          if (screen && portal.dataset.physicalDisplayCorners) {
            const points = portal.dataset.physicalDisplayCorners.split(";").map((point) => point.split(",").map(Number));
            const matrix = new DOMMatrix(screen.style.transform), corners = [[0, 0], [800, 0], [0, 458.5366]];
            screenError = Math.max(...corners.map(([x, y], index) => { const point = matrix.transformPoint(new DOMPoint(x, y)); return Math.hypot(point.x - points[index]![0]!, point.y - points[index]![1]!); }));
          }
          samples.push({ time: stamp, x, y, width, dt: stamp - previous.time, shift: Math.hypot(x - previous.x, y - previous.y), screenError });
          previous = { time: stamp, x, y };
        }
        if (samples.length < 5000) requestAnimationFrame(sample);
      }; requestAnimationFrame(sample);
    });
    const sections = ["work", "about", "expertise", "services", "contact", "services", "expertise", "about", "work"];
    for (const id of sections) {
      await page.locator(`[data-workstation-section-anchor="${id}"]`).evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
      await expect(host(page)).toHaveAttribute("data-chapter", id);
      await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
      await expect(page.locator("[data-workstation-screen]")).toBeVisible();
      await expect(page.locator("canvas")).toHaveCount(1);
      const overlap = await page.evaluate((id) => {
        const screen = document.querySelector(".workstation-projected-screen")!.getBoundingClientRect();
        return [...document.querySelectorAll(`#${id} h2,#${id} h3,#${id} p,#${id} a,#${id} button`)].filter((node) => {
          if (node.closest('[aria-hidden="true"],[inert]')) return false;
          const box = node.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && box.top > 80 && box.bottom < innerHeight && screen.left < box.right && screen.right > box.left && screen.top < box.bottom && screen.bottom > box.top;
        }).map((node) => node.textContent?.slice(0, 80));
      }, id);
      expect(overlap).toEqual([]);
    }
    await page.mouse.move(12, 400);
    for (const delta of [45, 45, 45, -45, -45, 1100, -1100]) { await page.mouse.wheel(0, delta); await page.waitForTimeout(80); }
    await page.setViewportSize({ width: width === 390 ? 420 : width - 80, height: 900 });
    await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
    const samples = await page.evaluate(() => (window as unknown as { trajectorySamples: { dt: number; shift: number; screenError: number }[] }).trajectorySamples);
    expect(samples.length).toBeGreaterThan(100);
    // First paint is initial placement. No later frame may snap to a distant scroll target.
    expect(samples.slice(1).every((sample) => sample.dt <= 0 || sample.shift / Math.min(sample.dt / 1000, .05) < 2401)).toBe(true);
    expect(samples.every((sample) => sample.screenError < .25)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("direct anchor navigation and reduced motion avoid an animated spatial chase", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pt/workstation-lab#about");
  await expect(host(page)).toHaveAttribute("data-chapter", "about");
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.locator('header nav a[href$="#about"]').filter({ visible: true }).click();
  await page.locator('[data-workstation-section-anchor="about"]').evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.locator('.workstation-controls button').first().click(); await expect(page.locator("dialog")).toBeVisible();
});

test("mobile trackpad accepts native one/two-finger gestures and releases page scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  await page.getByRole("button", { name: /^Notas/ }).click();
  await page.getByRole("button", { name: "Usar trackpad", exact: true }).click();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  const point = await padPoint(page), scroll = await page.evaluate(() => scrollY);
  const before = await page.locator("[data-notebook-cursor]").getAttribute("style");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: point.x, y: point.y }] });
  for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x + i * 3, y: point.y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator("[data-notebook-cursor]")).not.toHaveAttribute("style", before!);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: point.x - 8, y: point.y }, { x: point.x + 8, y: point.y }] });
  for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x - 8, y: point.y - i * 5 }, { x: point.x + 8, y: point.y - i * 5 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.locator("[data-input-scroll]").evaluate((node) => node.scrollTop)).toBeGreaterThan(40);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await page.getByRole("button", { name: "Liberar rolagem da página", exact: true }).click();
  await page.mouse.move(8, 400); await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll + 100);
});

test("owned notes app is accessible in focus mode and retains its text after Escape", async ({ page }) => {
  await open(page); await page.getByRole("button", { name: /^Notas/ }).click();
  await page.locator("textarea").fill("Accessible input");
  await page.locator(".workstation-controls button").first().click();
  await expect(page.locator("dialog textarea")).toHaveValue("Accessible input");
  expect((await new AxeBuilder({ page }).include("dialog").analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator(".workstation-projected-screen textarea")).toHaveValue("Accessible input");
});

test("native iframe survives all six chapters without virtual cross-origin input", async ({ page }) => {
  await open(page); await page.getByRole("button", { name: /^Browser/ }).click();
  const frame = page.frameLocator("iframe"), original = await page.locator("iframe").elementHandle();
  await frame.locator("input").fill("Persistent native screen");
  for (const id of ["work", "about", "expertise", "services", "contact"]) {
    await page.locator(`[data-workstation-section-anchor="${id}"]`).evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
    expect(await original!.evaluate((node) => node === document.querySelector("iframe"))).toBe(true);
    await expect(frame.locator("input")).toHaveValue("Persistent native screen");
  }
  await key(page, "A"); await expect(frame.locator("input")).toHaveValue("Persistent native screen");
  await expect(page.locator(".workstation-hint")).toContainText("interaja diretamente na tela");
});

for (const locale of ["en", "es"]) for (const theme of ["dark", "light"]) for (const width of [1440, 390]) {
  test(`${locale}/${theme}/${width}: translated owned input and accessible focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.context().addCookies([{ name: "ps-theme", value: theme, url: process.env.QA_ORIGIN ?? "http://127.0.0.1:3300" }]);
    await page.goto(`/${locale}/workstation-lab`);
    if (width < 1280) await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 }); await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.locator('[data-input-action="notes"]').click(); await key(page, "shift"); await key(page, "A");
    await expect(page.locator("textarea")).toHaveValue("A");
    if (process.env.QA_WORKSTATION_LOCALE_SCREENSHOTS) await page.screenshot({ path: `${process.env.QA_WORKSTATION_LOCALE_SCREENSHOTS}/${locale}-${theme}-${width}-notes.png` });
    await page.locator(".workstation-controls button").first().click();
    const modal = page.locator("dialog");
    await expect(modal.getByLabel(locale === "en" ? "Write on the notebook" : "Escribe en el notebook")).toHaveValue("A");
    expect((await new AxeBuilder({ page }).include("dialog").analyze()).violations).toEqual([]);
    if (process.env.QA_WORKSTATION_LOCALE_SCREENSHOTS) await page.screenshot({ path: `${process.env.QA_WORKSTATION_LOCALE_SCREENSHOTS}/${locale}-${theme}-${width}-focus.png` });
    await page.keyboard.press("Escape"); await expect(page.locator("textarea")).toHaveValue("A");
  });
}

test("tablet reserves the full scene and controls before the hero signature", async ({ page }) => {
  for (const width of [768, 1024]) {
    await page.setViewportSize({ width, height: 900 }); await open(page);
    const anchor = (await page.locator("[data-workstation-anchor]").boundingBox())!, scene = (await host(page).boundingBox())!;
    expect(scene.height).toBeLessThanOrEqual(anchor.height + 1);
    const controls = (await page.locator(".workstation-controls").boundingBox())!;
    const signature = await page.locator('[data-hero] .container-page>div[aria-hidden="true"]').last().boundingBox();
    expect(controls.y + controls.height).toBeLessThan(signature!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
