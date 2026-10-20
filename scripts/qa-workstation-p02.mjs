import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { mkdir, writeFile, copyFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { host, screen, settle, point, wheelTo, brake, sample, waitScreenBoot } from "./lib/workstation-p02.mjs";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P02.1";
const raw = "docs/report/Workstation/P02.1/recordings";
const selected = process.env.QA_WORKSTATION_CASES?.split(",");
let results = [];
if (selected) {
  try { results = JSON.parse(await readFile(`${output}/evidence.json`, "utf8")).results.filter((item) => !selected.includes(item.id)); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
const sourceIndex = await readFile("src/features/workstation/code/generated/code-index.json", "utf8");
const { sha, files } = JSON.parse(sourceIndex);
const source = { sha, indexSha256: createHash("sha256").update(sourceIndex).digest("hex"), files: files.map(({ path, sha256, dirty }) => ({ path, sha256, dirty })) };
for (const path of [output, `${output}/screenshots`, `${output}/videos`, raw]) await mkdir(path, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
try {
  for (const locale of ["pt", "en", "es"]) for (const theme of ["dark", "light"]) for (const width of [1440, 390]) {
    const id = `${locale}-${theme}-${width}`, height = width === 390 ? 844 : 900;
    if (selected && !selected.includes(id)) continue;
    const record = locale === "pt" && theme === "dark";
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390, isMobile: width === 390, reducedMotion: "no-preference",
      ...(record ? { recordVideo: { dir: raw, size: { width, height } } } : {}) });
    await context.addCookies([{ name: "ps-theme", value: theme, url: origin }]);
    const page = await context.newPage(), errors = [], screenshots = [], phases = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const shot = async (name) => { const path = `screenshots/${id}-${name}.png`; await page.screenshot({ path: `${output}/${path}` }); screenshots.push(path); };
    const phase = async (name) => phases.push({ name, timeMs: await page.evaluate(() => performance.now()), state: await sample(page) });
    let observations, video;
    try {
      await page.goto(`${origin}/${locale}/workstation-lab`); await page.evaluate(() => document.fonts.ready);
      if (width < 1280) {
        await page.locator("#hero-title").evaluate((node) => Promise.allSettled(node.getAnimations({ subtree: true }).map((animation) => animation.finished)));
        await shot("hero-top");
        await page.locator("[data-workstation-anchor]").evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
      }
      await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 }); await settle(page);
      await waitScreenBoot(page);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await shot("hero"); await phase("ready");
      if (record) {
        const rotateGrip = await point(page, "drag-point");
        await page.keyboard.down("Shift"); await page.mouse.move(rotateGrip.x, rotateGrip.y); await page.mouse.down();
        await page.mouse.move(rotateGrip.x - Math.min(85, width * .2), rotateGrip.y - 25, { steps: 8 }); await page.mouse.up(); await page.keyboard.up("Shift");
        await settle(page); await shot("rotation"); await phase("shift-drag-rotation");
        await page.locator(".workstation-options-trigger").focus(); await page.keyboard.press("Enter");
        await page.getByRole("menuitem").nth(8).click(); await settle(page);
        const lid = await point(page, "lid-point");
        await page.mouse.click(lid.x, lid.y);
        await expect(host(page)).toHaveAttribute("data-lid", "0");
        await expect.poll(async () => Number(await host(page).getAttribute("data-lid-rendered")), { timeout: 15_000 }).toBeLessThan(1);
        await shot("lid-closed"); await phase("lid-closed");
        await page.locator(".workstation-options-trigger").focus(); await page.keyboard.press("Enter");
        await page.getByRole("menuitem").nth(8).click(); await settle(page);
        const grip = await point(page, "drag-point");
        await page.mouse.move(grip.x, grip.y); await page.mouse.down();
        for (let step = 1; step <= 8; step++) { await page.mouse.move(grip.x - step * Math.min(24, width * .045), grip.y - step * 4); await page.waitForTimeout(35); }
        await expect(host(page)).toHaveAttribute("data-body", "HELD");
        await shot("held"); await phase("held");
        // Shake again after the screenshot, so releasing actually has pointer momentum.
        for (let step = 1; step <= 5; step++) { await page.mouse.move(grip.x - Math.min(190, width * .36) + step * 16, grip.y - 32 - step * 8); await page.waitForTimeout(25); }
        await page.mouse.up(); await expect(host(page)).toHaveAttribute("data-body", "AIRBORNE");
        await shot("throw"); await phase("throw"); await settle(page); await phase("returned");
      }
      await screen(page).locator('[data-input-action="focus"]').click();
      const dialog = page.locator("dialog"); await expect(dialog).toBeVisible();
      await dialog.locator('[data-input-action="terminal"]').click();
      await dialog.locator("input").fill("help"); await page.keyboard.press("Enter");
      await expect(dialog.locator(".workbench-terminal-log")).toContainText(/commands:|comandos:/);
      await shot("terminal-focus"); await phase("terminal");
      await dialog.locator('[data-input-action="close"]').click();
      await dialog.locator('[data-input-action="code"]').click();
      await dialog.locator("[data-code-app]").waitFor();
      await dialog.getByRole("button", { name: "body.ts", exact: true }).click();
      await expect(dialog.locator(".workbench-ide-path")).toContainText("physics/body.ts");
      await shot("code-focus"); await phase("real-code");
      await page.keyboard.press("Escape"); await settle(page);
      if (record) await wheelTo(page, "#about [data-workstation-section-anchor]");
      else {
        await page.locator('#about [data-workstation-section-anchor]').evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
        await settle(page);
      }
      await expect(host(page)).toHaveAttribute("data-chapter", "about");
      await shot("about"); await phase("about");
      if (record) {
        const before = Number(await host(page).getAttribute("data-slams"));
        const gesture = await brake(page);
        phases.push({ name: "observed-synthetic-brake-input", ...gesture });
        await expect.poll(async () => Number(await host(page).getAttribute("data-slams")), { timeout: 15_000 }).toBeGreaterThan(before);
        await expect(host(page)).toHaveAttribute("data-body", "STUNNED", { timeout: 25_000 });
        await shot("brake-fall"); await phase("synthetic-scroll-brake");
        await settle(page); await phase("brake-return");
      }
      await page.mouse.move(4, 4); await settle(page);
      const frames = Number(await host(page).getAttribute("data-frames")); await page.waitForTimeout(600);
      observations = await sample(page);
      observations.idleFrames600ms = Number(observations.frames) - frames;
      expect(observations.idleFrames600ms).toBe(0); expect(observations.overflow).toBe(false); expect(observations.canvases).toBe(1);
      expect(observations.alignmentErrorPx).not.toBeNull(); expect(observations.alignmentErrorPx).toBeLessThan(.5);
      expect(errors).toEqual([]);
    } finally {
      const recording = page.video(); await context.close();
      if (recording) {
        const path = `videos/${id}-gestures.webm`;
        await copyFile(await recording.path(), `${output}/${path}`);
        const bytes = await readFile(`${output}/${path}`);
        const metadataPage = await browser.newPage();
        await metadataPage.goto(pathToFileURL(resolve(`${output}/${path}`)).href);
        await metadataPage.waitForFunction(() => Number.isFinite(document.querySelector("video")?.duration));
        const metadata = await metadataPage.locator("video").evaluate((node) => ({ durationSeconds: node.duration, width: node.videoWidth, height: node.videoHeight }));
        await metadataPage.close();
        video = { path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), ...metadata };
      }
      results.push({ id, locale, theme, width, height, observations, errors, phases, screenshots, video });
      results.sort((a, b) => ["pt", "en", "es"].indexOf(a.locale) - ["pt", "en", "es"].indexOf(b.locale) || a.theme.localeCompare(b.theme) || b.width - a.width);
      await writeFile(`${output}/evidence.json`, JSON.stringify({ source, environment: "Chromium/SwiftShader on Windows. Original Playwright WebM, no retiming/interpolation. Pointer/keyboard/wheel use browser input; the explicitly named brake uses a synthetic scroll trajectory. Device/GPU/physical input and artistic acceptance remain manual.", results }, null, 2) + "\n");
    }
    console.log(`${id}: ${screenshots.length} screenshots${video ? `, native video ${video.durationSeconds.toFixed(1)}s` : ""}, idle ${observations.idleFrames600ms}, alignment ${observations.alignmentErrorPx.toFixed(3)}px`);
  }
} finally { await browser.close(); }
