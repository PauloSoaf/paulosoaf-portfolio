import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { open, host, screen, settle, point, menu, sample, wheelTo } from "./lib/workstation-p02.mjs";
import { circularGesture, nativeSitePoint, togglePortfolioTheme } from "./lib/workstation-p03.mjs";

const origin = process.env.QA_ORIGIN ?? "http://localhost:1010";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P03";
const raw = "docs/report/Workstation/P03/live-recordings";
const sites = [
  { id: "nutriopus", slug: "nutriopus", title: "NutriOpus", width: 1024, url: "https://www.nutriopus.com.br/" },
  { id: "deborah", slug: "deborah-lima", title: "Déborah Lima", width: 1200, url: "https://www.xn--advogadadborahlima-jwb.com.br/" },
];
for (const directory of [raw, output, `${output}/screenshots`, `${output}/videos`]) await mkdir(directory, { recursive: true });
const index = JSON.parse(await readFile("src/features/workstation/code/generated/code-index.json", "utf8"));
for (const file of index.files) {
  const actual = createHash("sha256").update(await readFile(file.path, "utf8")).digest("hex");
  if (actual !== file.sha256) throw new Error(`Stale source index for ${file.path}; run npm run code:index before recording.`);
}
const source = { base: index.sha, files: index.files.map(({ path, sha256, dirty }) => ({ path, sha256, dirty })) };
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
const widths = process.env.QA_WORKSTATION_WIDTHS?.split(",").map(Number) ?? [1440, 390];
if (process.env.QA_WORKSTATION_WIDTHS) {
  try { results.push(...JSON.parse(await readFile(`${output}/cinematic-evidence.json`, "utf8")).results.filter((entry) => !widths.includes(entry.width))); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
try {
  for (const width of widths) {
    const height = width === 390 ? 844 : 900, id = `pt-cinematic-${width}`;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390, isMobile: width === 390,
      reducedMotion: "no-preference", recordVideo: { dir: raw, size: { width, height } } });
    const page = await context.newPage(), phases = [], proofs = [], responses = [], errors = [], screenshots = [];
    let failure;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.request().resourceType() === "document" && sites.some((site) => response.url().startsWith(site.url))) responses.push({ url: response.url(), status: response.status(), headers: response.headers() }); });
    const phase = async (name, extra = {}) => phases.push({ name, browserTime: await page.evaluate(() => performance.now()), state: await sample(page), ...extra });
    const shot = async (name) => { const path = `screenshots/${id}-${name}.png`; await page.screenshot({ path: `${output}/${path}` }); screenshots.push(path); };
    const toggle = async () => { const before = await page.evaluate(() => scrollY); await togglePortfolioTheme(page); expect(await page.evaluate(() => scrollY)).toBe(before); };
    try {
      await open(page, origin); await shot("context"); await phase("context");
      await page.evaluate(() => {
        const node = document.querySelector("[data-workstation]"); window.p03Spin = [];
        new MutationObserver(() => {
          const { body, trajectory, angularVelocity, spinIntent, spinRelease, spinGestures } = node.dataset;
          if (body !== "FOLLOW" && window.p03Spin.length < 1000) window.p03Spin.push({ body, trajectory, angularVelocity, spinIntent, spinRelease, spinGestures });
        }).observe(node, { attributes: true });
      });
      const gesture = await circularGesture(page, { touch: width === 390 });
      expect(gesture.held.spinIntent).toBe("true");
      await expect.poll(async () => Math.abs(Number(await host(page).getAttribute("data-spin-release")))).toBeGreaterThan(2);
      await phase("native-circular-release"); await shot("spin-release"); await settle(page);
      const spin = await page.evaluate(() => window.p03Spin);
      const angles = spin.filter((entry) => entry.body === "HELD").map((entry) => Number(entry.trajectory.split(",")[4]));
      expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(Math.PI * 1.5);
      proofs.push({ nativeSpin: { gesture, angleRange: Math.max(...angles) - Math.min(...angles), samples: spin } });
      await phase("spin-recovered");
      for (const site of sites) {
        await wheelTo(page, "[data-workstation-work-anchor]");
        await page.locator(".filmstrip-button").filter({ hasText: site.title }).click();
        await page.locator(`.carousel-slide[data-project="${site.slug}"][data-active="true"]`).getByRole("button", { name: "Explorar no notebook", exact: true }).click();
        await settle(page); await expect(host(page)).toHaveAttribute("data-presentation-amount", "1.0000");
        const selector = `iframe[data-project-site="${site.id}"]`, frame = page.frameLocator(selector), iframe = await page.locator(selector).elementHandle();
        await expect(frame.locator("h1")).not.toBeEmpty({ timeout: 35000 });
        await frame.locator("body").evaluate(async () => {
          await document.fonts.ready;
          // A real external hero can reveal a blurred placeholder before its portrait decodes.
          // Wait for visible images and its native intro; never finish or replace animations.
          await Promise.allSettled([...document.images].filter((image) => {
            const rect = image.getBoundingClientRect(); return rect.width > 24 && rect.height > 24 && rect.top < innerHeight && rect.bottom > 0;
          }).map((image) => image.decode()));
        }); await page.waitForTimeout(1800);
        const viewport = await frame.locator("body").evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
          controls: [...document.querySelectorAll("header a,header button,nav a,nav button")].filter((node) => { const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== "hidden"; }).map((node) => ({ text: node.textContent.trim(), left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right })) }));
        expect(viewport.width).toBe(site.width); expect(viewport.scrollWidth).toBeLessThanOrEqual(site.width);
        expect(viewport.controls.length).toBeGreaterThan(0);
        for (const control of viewport.controls) { expect(control.left).toBeGreaterThanOrEqual(0); expect(control.right).toBeLessThanOrEqual(site.width); }
        // Browser automation can inspect the child; production never reads cross-origin DOM.
        const navbar = await nativeSitePoint(page, site.width - 35, 30);
        expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, navbar)).toBe("IFRAME");
        const epoch = await frame.locator("body").evaluate(() => performance.timeOrigin);
        await shot(`${site.id}-dark`); await phase(`${site.id}-reading`, { viewport });
        const pointer = await nativeSitePoint(page, site.width * .45, viewport.height * .6), outerScroll = await page.evaluate(() => scrollY);
        await page.mouse.move(pointer.x, pointer.y); await page.mouse.wheel(0, 600);
        await expect.poll(() => frame.locator("body").evaluate(() => scrollY)).toBeGreaterThan(100);
        expect(await page.evaluate(() => scrollY)).toBe(outerScroll);
        await shot(`${site.id}-native-scroll`); await settle(page);
        const visibleLink = () => frame.locator('a[href^="#"]:not(.sr-only):not([href="#"])').evaluateAll((nodes) => nodes.map((node) => {
          const r = node.getBoundingClientRect(), target = document.getElementById(node.getAttribute("href").slice(1));
          return { href: node.getAttribute("href"), x: r.x + r.width / 2, y: r.y + r.height / 2,
            valid: r.width > 20 && r.height > 15 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && target && Math.abs(target.getBoundingClientRect().top) > 60 };
        }).find((entry) => entry.valid));
        let link = await visibleLink();
        if (!link) { await page.mouse.wheel(0, -800); await expect.poll(visibleLink).toBeTruthy(); link = await visibleLink(); }
        const at = await nativeSitePoint(page, link.x, link.y), before = await frame.locator("body").evaluate(() => scrollY);
        await page.mouse.click(at.x, at.y);
        await expect.poll(() => frame.locator("body").evaluate((_node, { href, before }) => location.hash === href || Math.abs(scrollY - before) > 10, { href: link.href, before })).toBe(true);
        await toggle(); await shot(`${site.id}-light`);
        const grip = await point(page, "drag-point");
        await page.keyboard.down("Shift"); await page.mouse.move(grip.x, grip.y); await page.mouse.down();
        await page.mouse.move(grip.x - Math.min(50, width * .1), grip.y - 8, { steps: 6 }); await page.mouse.up(); await page.keyboard.up("Shift"); await settle(page);
        await expect(host(page)).toHaveAttribute("data-presentation-manual", "true");
        await (await menu(page)).getByRole("menuitem", { name: "Apresentar conteúdo", exact: true }).click(); await settle(page);
        await expect(host(page)).toHaveAttribute("data-presentation-amount", "1.0000");
        expect(await iframe.evaluate((node) => node === document.querySelector("iframe"))).toBe(true);
        expect(await frame.locator("body").evaluate(() => performance.timeOrigin)).toBe(epoch);
        proofs.push({ site: site.id, viewport, epoch, nativeWheel: true, nativeLink: link.href, actualURL: await frame.locator("body").evaluate(() => location.href), sameDocumentAfterThemeManualAndResume: true });
        await page.locator(".workbench-site-exit").click(); await settle(page);
        await expect(host(page)).toHaveAttribute("data-presentation-amount", "0.0000"); await phase(`${site.id}-context-restored`); await toggle();
      }
      await screen(page).locator('[data-input-action="code"]').click();
      const code = page.locator("[data-code-app]"); await code.waitFor();
      await code.locator('[data-input-action="code-file-spin-intent"]').click();
      await expect(code.locator(".workbench-ide-view")).toContainText("export class SpinIntent");
      await settle(page); await shot("actual-code"); await phase("code-workbench");
      if (width === 390) await page.keyboard.press("Escape");
      await screen(page).locator('[data-input-action="close"]').click(); await settle(page);
      // Help is native, optional and never automatically displayed.
      const panel = page.locator("#workstation-discovery-card"); await expect(panel).not.toBeVisible();
      await page.locator('[popoverTarget="workstation-discovery-card"]').first().evaluate((node) => node.click());
      await expect(panel).toBeVisible(); await shot("optional-discovery");
      await page.keyboard.press("Escape"); await page.mouse.move(4, 4); await settle(page);
      const frames = Number(await host(page).getAttribute("data-frames")); await page.waitForTimeout(600);
      const final = await sample(page); expect(Number(final.frames) - frames).toBe(0); expect(final.overflow).toBe(false); expect(final.canvases).toBe(1); expect(final.alignmentErrorPx).toBeLessThan(.5); expect(errors).toEqual([]);
      await phase("idle", { idleFrames600ms: Number(final.frames) - frames });
    } catch (error) { failure = error.stack; throw error; }
    finally {
      const recording = page.video(); await context.close();
      const path = `videos/${id}-spin-sites-code.webm`; await copyFile(await recording.path(), `${output}/${path}`);
      const bytes = await readFile(`${output}/${path}`), metadata = await browser.newPage();
      await metadata.goto(pathToFileURL(resolve(`${output}/${path}`)).href);
      await metadata.waitForFunction(() => Number.isFinite(document.querySelector("video")?.duration));
      const video = await metadata.locator("video").evaluate((node) => ({ duration: node.duration, width: node.videoWidth, height: node.videoHeight })); await metadata.close();
      results.push({ id, width, height, source, phases, proofs, responses, errors, screenshots, failure, video: { path, ...video, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") } });
      await writeFile(`${output}/cinematic-evidence.json`, JSON.stringify({ recordedAt: new Date().toISOString(), method: "Original browser WebM, native mouse/touch/wheel, real remote documents. No fixtures, input proxy, app-state writes or clock changes. Chromium/SwiftShader is not physical-GPU acceptance.", results }, null, 2) + "\n");
    }
    console.log(`${id}: spin, real sites and reading poses passed`);
  }
} finally { await browser.close(); }
