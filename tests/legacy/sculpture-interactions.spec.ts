import { expect, test, type Page } from "@playwright/test";
const art = (page: Page) => page.locator("[data-hero-art]");
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
  await page.locator("#contact").scrollIntoViewIfNeeded(); await expect(art).toHaveAttribute("data-hero-state", "ready");
  await expect(page.locator("[data-spatial-companion]")).toHaveAttribute("data-docked", "true");
  await page.getByRole("button", { name: "Pausar movimento", exact: true }).click();
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

test("one real canvas follows all five sections with changing sizes, and global pause freezes it",async({page})=>{
  await page.goto("/pt?heroDebug=1"); const art=page.locator("[data-hero-art]"), companion=page.locator("[data-spatial-companion]");
  await expect(art).toHaveAttribute("data-hero-state","ready",{timeout:30000}); const canvas=await page.locator("canvas").elementHandle(), widths:number[]=[];
  for(const id of ["work","about","expertise","services","contact"]){
    await page.locator('#'+id).evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));
    await expect(companion).toHaveAttribute("data-spatial-section",id); await expect(companion).toBeInViewport();
    widths.push((await companion.boundingBox())!.width); expect(await canvas!.evaluate(el=>el===document.querySelector("canvas"))).toBe(true);
    await expect(art).toHaveAttribute("data-hero-state","ready");
  }
  expect(Math.max(...widths)-Math.min(...widths)).toBeGreaterThan(60);
  await page.getByRole("button",{name:"Pausar movimento",exact:true}).click(); await page.waitForTimeout(150);
  const frames=await art.getAttribute("data-hero-frames"); await page.waitForTimeout(400); expect(await art.getAttribute("data-hero-frames")).toBe(frames);
  await page.getByRole("button",{name:"Usar arte estática",exact:true}).click(); await expect(page.locator("canvas")).toHaveCount(0);
});

test("Hero drag, keyboard equivalent and damping operate on the same real canvas and pause", async ({ page }) => {
  await page.goto("/pt?heroDebug=1"); await expect(art(page)).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
  await expect(art(page)).toHaveAttribute("data-hero-entrance", "850");
  const canvas = await page.locator("canvas").elementHandle(), before = await page.locator("canvas").screenshot();
  const box = (await page.locator("[data-hero-surface]").boundingBox())!;
  await page.mouse.move(box.x + box.width * .4, box.y + box.height * .5); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .75, box.y + box.height * .5, { steps: 10 }); await page.mouse.up();
  await expect.poll(async () => Number(await art(page).getAttribute("data-hero-exploration"))).toBeGreaterThan(.3);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(false);
  const angle = Number(await art(page).getAttribute("data-hero-exploration"));
  await page.getByRole("button", { name: "Explorar objeto à esquerda", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect.poll(async () => Number(await art(page).getAttribute("data-hero-exploration"))).toBeLessThan(angle);
  await page.mouse.move(0, 0); await page.waitForTimeout(2200);
  await page.getByRole("button", { name: "Pausar movimento", exact: true }).click(); await page.waitForTimeout(100);
  const frames = await art(page).getAttribute("data-hero-frames"); await page.waitForTimeout(400);
  expect(await art(page).getAttribute("data-hero-frames")).toBe(frames);
  expect(await canvas!.evaluate(node => node === document.querySelector("canvas"))).toBe(true);
});

test("real touch drag explores the orb, vertical swipe scrolls, and touch CTA press has feedback", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "no-preference" });
  const page = await context.newPage(); await page.goto("http://127.0.0.1:3200/pt?heroDebug=1");
  const cdp = await context.newCDPSession(page);
  const cta = page.getByRole("link", { name: "Explorar projetos", exact: true });
  await page.evaluate(() => document.fonts.ready); await cta.scrollIntoViewIfNeeded();
  const button = (await cta.boundingBox())!;
  const touch = async (type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  await touch("touchStart", button.x + button.width / 2, button.y + button.height / 2);
  await page.waitForTimeout(180);
  expect(await cta.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeLessThan(1);
  await touch("touchEnd"); await expect(page).toHaveURL(/#work$/);
  await page.goto("http://127.0.0.1:3200/pt?heroDebug=1");
  await art(page).scrollIntoViewIfNeeded(); await expect(art(page)).toHaveAttribute("data-hero-state", "ready", { timeout: 30_000 });
  await expect(art(page)).toHaveAttribute("data-hero-entrance", "850");
  const box = (await page.locator("[data-hero-surface]").boundingBox())!;
  const x = box.x + box.width * .4, y = Math.min(650, box.y + box.height * .55);
  await touch("touchStart", x, y);
  for (let step = 1; step <= 8; step++) { await touch("touchMove", x + step * 12, y); await page.waitForTimeout(25); }
  await touch("touchEnd");
  await expect.poll(async () => Number(await art(page).getAttribute("data-hero-exploration"))).toBeGreaterThan(.2);
  await expect(page.locator("[data-hero-surface]")).not.toHaveAttribute("data-interacting", "true");
  await page.waitForTimeout(100); // Allow the completed gesture's bounded inertia to reach the renderer probe.
  const angle = await art(page).getAttribute("data-hero-exploration"), before = await page.evaluate(() => scrollY);
  await touch("touchStart", x, y);
  for (let step = 1; step <= 8; step++) { await touch("touchMove", x, y - step * 25); await page.waitForTimeout(25); }
  await touch("touchEnd");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
  expect(await art(page).getAttribute("data-hero-exploration")).toBe(angle);
  await context.close();
});
