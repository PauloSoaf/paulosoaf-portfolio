import { test, expect, type Page } from "@playwright/test";
import { brake } from "../../scripts/lib/workstation-p02.mjs";
const host = (page: Page) => page.locator("[data-workstation]");
const screen = (page: Page) => page.locator(".workstation-projected-screen [data-workstation-screen]");
async function open(page: Page) {
  await page.goto("/pt/workstation-lab");
  if (page.viewportSize()!.width < 1280) await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
}
async function point(page: Page, name: string) {
  const [x, y] = (await host(page).getAttribute(`data-${name}`))!.split(",").map(Number);
  return { x: x!, y: y! };
}
async function key(page: Page, label: string) {
  const target = await host(page).evaluate((node, label) => (JSON.parse(node.dataset.keyPoints!) as { label: string; x: number; y: number }[]).find((key) => key.label === label)!, label);
  await page.mouse.click(target.x, target.y);
}
async function moveCursor(page: Page, x: number, y: number) {
  const current = await page.locator(".workstation-projected-screen [data-notebook-cursor]").evaluate((node) => ({ x: parseFloat((node as SVGElement).style.left) / 100, y: parseFloat((node as SVGElement).style.top) / 100 }));
  const pad = await point(page, "trackpad-point"), pixels = Number(await host(page).getAttribute("data-chassis-width")) * 1.46 / 3.6;
  await page.mouse.move(pad.x, pad.y); await page.mouse.down();
  await page.mouse.move(pad.x + (x - current.x) * pixels * 1.05, pad.y + (y - current.y) * pixels * .6, { steps: 12 }); await page.mouse.up();
}
async function targetCursor(page: Page, id: string) {
  const target = await page.locator(`.workstation-projected-screen [data-input-action="${id}"]`).evaluate((node) => {
    const rect = node.getBoundingClientRect(), projected = node.closest<HTMLElement>(".workstation-projected-screen")!, layer = projected.parentElement!.getBoundingClientRect();
    const local = new DOMMatrix(getComputedStyle(projected).transform).inverse().transformPoint(new DOMPoint(rect.x + rect.width / 2 - layer.left, rect.y + rect.height / 2 - layer.top));
    return { x: local.x / 800, y: local.y / 458.5366 };
  });
  await moveCursor(page, target.x, target.y);
}
async function tap(page: Page) { const pad = await point(page, "trackpad-point"); await page.mouse.click(pad.x, pad.y); }

test("3D keys type into the desktop prompt and run the curated terminal", async ({ page }) => {
  await open(page);
  for (const label of ["H", "E", "L", "P"]) await key(page, label);
  await expect(page.locator("#workbench-desktop-prompt")).toHaveValue("help");
  await key(page, "enter");
  await expect(screen(page)).toHaveAttribute("data-app", "TERMINAL");
  await expect(page.locator(".workbench-terminal-log")).toContainText("comandos:");
  await page.keyboard.type("tema"); await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.keyboard.type("projetos"); await page.keyboard.press("Enter");
  await expect(host(page)).toHaveAttribute("data-chapter", "work", { timeout: 8_000 });
  expect(await host(page).getAttribute("data-slams")).toBe("0");
});

test("real 3D keys edit Notes with Shift, Caps, arrows and Backspace", async ({ page }) => {
  await open(page);
  await screen(page).getByRole("button", { name: /^Notas/ }).click();
  for (const label of ["shift", "A", "space", "B", "enter", "C", "⌫", "D", "caps", "E", "←", "space"]) await key(page, label);
  await expect(page.locator("textarea")).toHaveValue("A b\nd E");
  await page.keyboard.press("End"); await page.keyboard.type(" native");
  await expect(page.locator("textarea")).toHaveValue("A b\nd E native");
  expect(await host(page).getAttribute("data-body")).toBe("FOLLOW");
});

test("trackpad moves the cursor, clicks, double clicks and scrolls owned controls", async ({ page }) => {
  await open(page);
  await targetCursor(page, "notes"); await tap(page); await expect(page.locator("textarea")).toBeVisible();
  await page.locator("textarea").fill("Real trackpad input");
  await targetCursor(page, "notes-save"); await tap(page); await expect(page.locator("[data-notes-saved]")).toContainText("Real trackpad input");
  await targetCursor(page, "notes-text"); await tap(page); await tap(page);
  expect(await page.locator("textarea").evaluate((node) => (node as HTMLTextAreaElement).selectionEnd - (node as HTMLTextAreaElement).selectionStart)).toBe("Real trackpad input".length);
  const pad = await point(page, "trackpad-point"), before = await page.evaluate(() => scrollY);
  await page.mouse.move(pad.x, pad.y); await page.mouse.wheel(0, 180);
  await expect.poll(() => page.locator(".workstation-projected-screen [data-input-scroll]").evaluate((node) => node.scrollTop)).toBeGreaterThan(50);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await moveCursor(page, 2, -2);
  await expect(page.locator(".workstation-projected-screen [data-notebook-cursor]")).toHaveAttribute("style", /left: 100%; top: 0%;/);
});

test("the terminal opens this portfolio's real source and inspect mode maps page components to files", async ({ page }) => {
  await open(page);
  await page.locator("#workbench-desktop-prompt").fill("codigo rigid-body"); await page.keyboard.press("Enter");
  await expect(screen(page)).toHaveAttribute("data-app", "CODE");
  await expect(page.locator(".workstation-projected-screen .workbench-ide-path")).toContainText("src/features/workstation/physics/body.ts");
  await page.locator(".workstation-projected-screen .workbench-ide-inspect").click();
  await expect(page.locator("html")).toHaveAttribute("data-inspecting", "true");
  const title = page.locator("#hero-title");
  await title.hover(); await expect(page.locator(".workstation-inspect")).toHaveAttribute("data-visible", "true");
  await title.click();
  await expect(page.locator(".workstation-projected-screen .workbench-ide-path")).toContainText("src/components/hero/HeroEditorial.tsx");
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveAttribute("data-inspecting", "true");
});

test("the mute control sits in the screen corner and persists", async ({ page }) => {
  await open(page);
  const mute = page.locator(".workstation-projected-screen [data-workstation-mute]");
  const toolbar = (await page.locator(".workstation-projected-screen .workbench-toolbar").boundingBox())!, box = (await mute.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(toolbar.x + toolbar.width - 70);
  await mute.click(); await expect(mute).toHaveAttribute("aria-pressed", "true");
  await page.reload(); await open(page);
  await expect(page.locator(".workstation-projected-screen [data-workstation-mute]")).toHaveAttribute("aria-pressed", "true");
});

test("Shift-drag rotates the physical notebook without throwing it or losing Notes", async ({ page }) => {
  await open(page);
  await screen(page).locator('[data-input-action="notes"]').click();
  await screen(page).locator("textarea").fill("Notes survive a real rotation gesture");
  const corners = async () => (await host(page).getAttribute("data-physical-display-corners"))!.split(";").map((pair) => pair.split(",").map(Number));
  const before = await corners(), grip = await point(page, "drag-point");
  await page.keyboard.down("Shift"); await page.mouse.move(grip.x, grip.y); await page.mouse.down();
  await page.mouse.move(grip.x - 85, grip.y - 25, { steps: 8 }); await page.mouse.up(); await page.keyboard.up("Shift");
  await expect(host(page)).toHaveAttribute("data-body", "FOLLOW");
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 15_000 });
  const after = await corners();
  expect(Math.max(...before.map(([x, y], i) => Math.hypot(x! - after[i]![0]!, y! - after[i]![1]!)))).toBeGreaterThan(20);
  await expect(screen(page).locator("textarea")).toHaveValue("Notes survive a real rotation gesture");
  expect(await host(page).getAttribute("data-slams")).toBe("0");
});

for (const width of [1440, 1920, 768, 390]) {
  test(`page path stays on screen and attached to the content through every section at ${width}`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : width === 1920 ? 1080 : 900 }); await open(page);
    await page.evaluate(() => {
      type Sample = { time: number; x: number; y: number; width: number; scroll: number; screenError: number };
      const samples: Sample[] = []; (window as unknown as { pathSamples: Sample[] }).pathSamples = samples;
      let last = 0;
      const sample = () => {
        const node = document.querySelector<HTMLElement>("[data-workstation]")!;
        const [time, x, y, width, , , , scroll] = node.dataset.trajectory!.split(",").map(Number) as number[];
        if (time !== last) {
          last = time!;
          const element = document.querySelector<HTMLElement>(".workstation-projected-screen");
          let screenError = 0;
          if (element && node.dataset.physicalDisplayCorners) {
            const physical = node.dataset.physicalDisplayCorners.split(";").map((pair) => pair.split(",").map(Number));
            const matrix = new DOMMatrix(element.style.transform);
            screenError = Math.max(...[[0, 0], [800, 0], [0, 458.5366]].map(([px, py], index) => { const p = matrix.transformPoint(new DOMPoint(px, py)); return Math.hypot(p.x - physical[index]![0]!, p.y - physical[index]![1]!); }));
          }
          samples.push({ time: time!, x: x!, y: y!, width: width!, scroll: scroll!, screenError });
        }
        if (samples.length < 6000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const ids = ["work", "about", "expertise", "services", "contact"];
    for (const id of ids) {
      await page.locator(`[data-workstation-section-anchor="${id}"]`).evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(host(page)).toHaveAttribute("data-chapter", id);
      await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
      // In its slot, the live screen never covers the section's own text.
      const overlap = await page.evaluate((id) => {
        const screen = document.querySelector(".workstation-projected-screen")!.getBoundingClientRect();
        return [...document.querySelectorAll(`#${id} h2,#${id} h3,#${id} p,#${id} a,#${id} button`)].filter((node) => {
          if (node.closest('[aria-hidden="true"],[inert],[data-workstation]')) return false;
          const box = node.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && box.top > 80 && box.bottom < innerHeight && screen.left < box.right && screen.right > box.left && screen.top < box.bottom && screen.bottom > box.top;
        }).map((node) => node.textContent?.slice(0, 60));
      }, id);
      expect(overlap).toEqual([]);
    }
    // Continuous reading scroll up and down (below the brake threshold), after the jump home settles.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    // Let the jump reach the rig before waiting for its flight home to settle.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
    const reading = await page.evaluate(() => (window as unknown as { pathSamples: unknown[] }).pathSamples.length);
    await page.mouse.move(8, 400);
    for (let step = 0; step < 40; step++) { await page.mouse.wheel(0, 110); await page.waitForTimeout(90); }
    for (let step = 0; step < 20; step++) { await page.mouse.wheel(0, -110); await page.waitForTimeout(90); }
    await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
    const samples = await page.evaluate(() => (window as unknown as { pathSamples: { time: number; x: number; y: number; width: number; scroll: number; screenError: number }[] }).pathSamples);
    expect(samples.length).toBeGreaterThan(80);
    const viewport = page.viewportSize()!;
    for (const sample of samples) {
      const half = sample.width * 1.08 / 2;
      expect(sample.x - half).toBeGreaterThan(-4); expect(sample.x + half).toBeLessThan(viewport.width + 4);
      expect(sample.screenError).toBeLessThan(.5);
    }
    // After instant anchor jumps it flies to the new slot instead of teleporting.
    for (let index = 1; index < reading; index++) {
      const a = samples[index - 1]!, b = samples[index]!;
      if (b.scroll !== a.scroll) continue;
      expect(Math.hypot(b.x - a.x, b.y - a.y) / Math.max(1 / 60, (b.time - a.time) / 1000)).toBeLessThan(4200);
    }
    // While reading, it is attached to the page: relative to the content it moves no further than the scroll that
    // moved it, plus the intentional inertial float (slow headless frames widen a single step).
    for (let index = reading + 1; index < samples.length; index++) {
      const a = samples[index - 1]!, b = samples[index]!, scrolled = Math.abs(b.scroll - a.scroll);
      expect(Math.abs(b.x - a.x)).toBeLessThan(2 * scrolled + 90);
      expect(Math.abs((b.y + b.scroll) - (a.y + a.scroll))).toBeLessThan(2 * scrolled + 90);
    }
    expect(await host(page).getAttribute("data-slams")).toBe("0");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("an abrupt fast-scroll brake knocks the notebook over; it lands and gets back up", async ({ page }, testInfo) => {
  // Includes the full fall, return and fifteen native wheel round trips on SwiftShader.
  // The actual slam (4s), impacts (20s) and return (30s) assertions retain their limits.
  test.setTimeout(150_000);
  await open(page);
  const gesture = await brake(page);
  await testInfo.attach("observed-brake-input", { body: JSON.stringify(gesture), contentType: "application/json" });
  await expect(host(page)).toHaveAttribute("data-slams", "1", { timeout: 4_000 });
  await expect(host(page)).not.toHaveAttribute("data-body", "FOLLOW");
  await expect.poll(async () => Number(await host(page).getAttribute("data-impacts")), { timeout: 20_000 }).toBeGreaterThan(0);
  await expect(host(page)).toHaveAttribute("data-body", "FOLLOW", { timeout: 30_000 });
  await expect(screen(page)).toBeVisible();
  // Ordinary reading never does it.
  await page.waitForTimeout(2800);
  await page.mouse.move(8, 400);
  for (let step = 0; step < 15; step++) { await page.mouse.wheel(0, 80); await page.waitForTimeout(80); }
  await page.waitForTimeout(800);
  expect(await host(page).getAttribute("data-slams")).toBe("1");
});

test("carried, it swings like a pendulum; thrown, it flies, lands and returns by itself", async ({ page }) => {
  test.setTimeout(90_000);
  await open(page);
  const grip = await point(page, "drag-point");
  await page.mouse.move(grip.x, grip.y); await page.mouse.down();
  await page.mouse.move(grip.x - 20, grip.y - 10, { steps: 3 });
  await expect(host(page)).toHaveAttribute("data-body", "HELD");
  let swing = 0;
  for (const dx of [-160, 160, -160, 160]) {
    await page.mouse.move(grip.x + dx, grip.y - 40, { steps: 4 });
    swing = Math.max(swing, Math.abs(Number((await host(page).getAttribute("data-trajectory"))!.split(",")[4])));
  }
  expect(swing).toBeGreaterThan(.03);
  for (let step = 1; step <= 6; step++) await page.mouse.move(grip.x - 160 - step * 45, grip.y - 40 - step * 20);
  await page.mouse.up();
  await expect(host(page)).toHaveAttribute("data-body", /AIRBORNE|STUNNED/);
  await expect.poll(async () => Number(await host(page).getAttribute("data-impacts")), { timeout: 20_000 }).toBeGreaterThan(0);
  await expect(host(page)).toHaveAttribute("data-body", "FOLLOW", { timeout: 30_000 });
});

test("touch: a vertical swipe on the notebook scrolls the page, a sideways swipe picks it up", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await open(page);
    const cdp = await context.newCDPSession(page), grip = await point(page, "drag-point"), start = await page.evaluate(() => scrollY);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [grip] });
    for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: grip.x, y: grip.y - step * 22 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(start + 40);
    expect(await host(page).getAttribute("data-body")).toBe("FOLLOW");
    await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
    const next = await point(page, "drag-point");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [next] });
    for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: next.x - step * 14, y: next.y - step * 2 }] });
    await expect(host(page)).toHaveAttribute("data-body", "HELD");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(host(page)).toHaveAttribute("data-body", "FOLLOW", { timeout: 30_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});

test("reduced motion with explicit 3D: drags move directly, no flight and no brake fall", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/pt/workstation-lab");
  await page.getByRole("button", { name: "Ativar notebook 3D", exact: true }).click();
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 15_000 });
  await expect(host(page)).toHaveAttribute("data-motion", "settled", { timeout: 12_000 });
  const grip = await point(page, "drag-point");
  await page.mouse.move(grip.x, grip.y); await page.mouse.down();
  await page.mouse.move(grip.x - 200, grip.y - 60, { steps: 6 }); await page.mouse.up();
  await expect(host(page)).toHaveAttribute("data-body", "FOLLOW");
  await brake(page);
  await page.waitForTimeout(600);
  expect(await host(page).getAttribute("data-slams")).toBe("0");
});

test("missing studio asset keeps a lit model and a working native screen", async ({ page }) => {
  await page.route("**/studio-pmrem-v1.bin.gz", (route) => route.abort()); await open(page);
  await expect(host(page)).toHaveAttribute("data-studio", "fallback");
  await screen(page).getByRole("button", { name: /^Notas/ }).click(); await page.locator("textarea").fill("Environment fallback");
  await expect(page.locator("textarea")).toHaveValue("Environment fallback");
});
