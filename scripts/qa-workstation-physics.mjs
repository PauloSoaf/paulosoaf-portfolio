import { chromium } from "playwright";
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P01.2";
const raw = "docs/report/Workstation/P01.2/recordings";
const resultsOutput = process.env.QA_WORKSTATION_RESULTS ?? "docs/report/Workstation/P01.2";
await mkdir(resultsOutput, { recursive: true });
await mkdir(`${output}/screenshots`, { recursive: true }); await mkdir(`${output}/videos`, { recursive: true }); await mkdir(raw, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
const selected = process.env.QA_WORKSTATION_CASES?.split(",");
async function settle(page) { await page.locator('[data-workstation][data-motion="settled"]').waitFor(); await page.waitForTimeout(100); }
async function moveToStage(page, selector) {
  const target = await page.locator(selector).evaluate((node) => { const rect = node.getBoundingClientRect(); return scrollY + rect.top + rect.height / 2 - innerHeight / 2; });
  await page.mouse.move(8, 420);
  // Real wheel input at native time; no altered clock, scroll velocity or video playback.
  for (let step = 0; step < 35; step++) {
    const delta = target - await page.evaluate(() => scrollY); if (Math.abs(delta) < 3) break;
    await page.mouse.wheel(0, Math.sign(delta) * Math.min(700, Math.abs(delta))); await page.waitForTimeout(95);
  }
  await settle(page);
}
async function key(page, label) {
  const point = await page.locator("[data-workstation]").evaluate((node, label) => JSON.parse(node.dataset.keyPoints).find((key) => key.label === label), label);
  const rect = await page.locator("canvas").boundingBox();
  await page.mouse.click(rect.x + point.x * rect.width / 800, rect.y + point.y * rect.height / 620); await page.waitForTimeout(100);
}
async function grip(page) {
  const [x, y] = (await page.locator("[data-workstation]").getAttribute("data-drag-point")).split(",").map(Number), rect = await page.locator("canvas").boundingBox();
  return { x: rect.x + x * rect.width / 800, y: rect.y + y * rect.height / 620 };
}
async function drag(page, dx, dy, stop = false) {
  const point = await grip(page); await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 8 });
  if (stop) await page.waitForTimeout(230); await page.mouse.up();
}
async function tool(page, name) {
  await page.locator(".workstation-tools summary").click(); await page.locator(`[data-notebook-tool="${name}"]`).click();
}
try {
  for (const [width, height, theme] of [[1440, 900, "dark"], [1440, 900, "light"], [1920, 1080, "dark"], [768, 900, "dark"], [390, 844, "dark"], [390, 844, "light"]]) {
    const id = `pt-${theme}-${width}`, errors = [];
    if (selected && !selected.includes(id)) continue;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1024, isMobile: width === 390, reducedMotion: "no-preference", recordVideo: { dir: raw, size: { width, height } } });
    await context.addCookies([{ name: "ps-theme", value: theme, url: origin }]);
    const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/pt/workstation-lab`); await page.evaluate(() => document.fonts.ready);
    if (width < 1280) await moveToStage(page, "[data-workstation-anchor]");
    await page.locator('[data-workstation][data-scene="ready"]').waitFor(); await settle(page);
    await page.evaluate(() => {
      window.notebookSamples = []; window.notebookRecord = true;
      let last = 0;
      const sample = () => {
        const node = document.querySelector("[data-workstation]");
        const pose = node.dataset.trajectory.split(",").map(Number);
        if (pose[0] !== last) {
          const screen = document.querySelector(".workstation-projected-screen"); let alignmentError = null;
          if (screen && node.dataset.physicalDisplayCorners) {
            const expected = node.dataset.physicalDisplayCorners.split(";").map((point) => point.split(",").map(Number)), matrix = new DOMMatrix(screen.style.transform);
            alignmentError = Math.max(...[[0, 0], [800, 0], [0, 458.5366]].map(([x, y], index) => { const actual = matrix.transformPoint(new DOMPoint(x, y)); return Math.hypot(actual.x - expected[index][0], actual.y - expected[index][1]); }));
          }
          window.notebookSamples.push({ time: pose[0], x: pose[1], y: pose[2], width: pose[3], pitch: pose[4], yaw: pose[5], roll: pose[6], scrollY, chapter: node.dataset.chapter, state: node.dataset.state, manipulation: node.dataset.manipulation, frame: Number(node.dataset.frames), alignmentError, viewport: [innerWidth, innerHeight] });
          last = pose[0];
        }
        if (window.notebookRecord) requestAnimationFrame(sample);
      }; requestAnimationFrame(sample);
    });
    await page.screenshot({ path: `${output}/screenshots/${id}-hero.png` });
    // Show the physical controls in the recording, then keep a useful Notes app throughout the tour.
    await page.locator('[data-input-action="notes"]').click();
    for (const label of ["shift", "O", "B", "S", "I", "D", "I", "A", "N", "space", "enter", "3", "D"]) await key(page, label);
    const value = await page.locator("textarea").inputValue();
    if (value !== "Obsidian \n3d") throw new Error(`${id}: physical key input was ${JSON.stringify(value)}`);
    await page.screenshot({ path: `${output}/screenshots/${id}-keys.png` });
    const host = page.locator("[data-workstation]"), pad = (await host.getAttribute("data-trackpad-point")).split(",").map(Number), rect = await page.locator("canvas").boundingBox(), scale = rect.width / 800;
    await page.mouse.move(rect.x + pad[0] * scale, rect.y + pad[1] * scale); await page.mouse.down();
    await page.mouse.move(rect.x + pad[0] * scale + 32 * scale, rect.y + pad[1] * scale - 10 * scale, { steps: 12 }); await page.mouse.up();
    await page.mouse.wheel(0, 150); await page.waitForTimeout(200);
    await page.locator('.workstation-controls button').nth(3).click(); await settle(page);
    await page.screenshot({ path: `${output}/screenshots/${id}-pointer.png` });
    await page.locator('.workstation-controls button').nth(5).click(); await settle(page);
    await page.locator(".workstation-tools summary").click(); await page.locator("[data-keyboard-view]").click(); await settle(page);
    await page.screenshot({ path: `${output}/screenshots/${id}-keyboard-view.png` });
    await page.locator('.workstation-controls button').nth(5).click(); await settle(page);
    await tool(page, "rotate"); await drag(page, -180 * scale, -240 * scale); await settle(page);
    await page.screenshot({ path: `${output}/screenshots/${id}-angle.png` });
    await page.locator('.workstation-controls button').nth(5).click(); await settle(page);
    await page.locator('[data-input-action="notes"]').click();
    await tool(page, "rotate"); await drag(page, 0, 140);
    for (let turn = 0; turn < 6; turn++) await page.locator('.workstation-controls button').nth(3).click(); await settle(page);
    await page.screenshot({ path: `${output}/screenshots/${id}-grazing.png` });
    await page.locator('.workstation-controls button').nth(5).click(); await settle(page);
    await tool(page, "lid"); await drag(page, 0, 125, true); await settle(page);
    await page.screenshot({ path: `${output}/screenshots/${id}-lid-half.png` });
    await page.locator('.workstation-controls button').nth(1).click(); await settle(page);
    await page.screenshot({ path: `${output}/screenshots/${id}-closed.png` });
    await page.locator('.workstation-controls button').nth(5).click(); await settle(page);
    await drag(page, -65, -25, true); await settle(page);
    await page.screenshot({ path: `${output}/screenshots/${id}-drag.png` });
    await drag(page, -110, -35);
    await page.locator('[data-workstation][data-manipulation="FLYING"]').waitFor();
    await page.locator('[data-workstation]:not([data-collisions="0"])').waitFor();
    await page.screenshot({ path: `${output}/screenshots/${id}-throw.png` });
    await page.locator('[data-workstation][data-manipulation="FREE"]').waitFor();
    await page.locator('.workstation-rejoin').click(); await settle(page);
    const stages = [];
    for (const chapter of ["work", "about", "expertise", "services", "contact"]) {
      await moveToStage(page, `[data-workstation-section-anchor="${chapter}"]`);
      const data = await host.evaluate((node) => ({ chapter: node.dataset.chapter, chassisWidth: Number(node.dataset.chassisWidth), screen: !!document.querySelector(".workstation-projected-screen"), canvas: document.querySelectorAll("canvas").length, horizontalOverflow: document.documentElement.scrollWidth > innerWidth }));
      if (data.chapter !== chapter || !data.screen || data.canvas !== 1 || data.horizontalOverflow) throw new Error(`${id}/${chapter}: ${JSON.stringify(data)}`);
      stages.push(data); await page.screenshot({ path: `${output}/screenshots/${id}-${chapter}.png` });
    }
    await moveToStage(page, '[data-workstation-section-anchor="services"]');
    await page.mouse.wheel(0, -1100); await page.waitForTimeout(100); await page.mouse.wheel(0, 700); await settle(page);
    await page.setViewportSize({ width: width === 390 ? 420 : width - 60, height }); await settle(page);
    await page.setViewportSize({ width, height }); await settle(page);
    await moveToStage(page, '[data-workstation-section-anchor="about"]');
    await page.locator(".workstation-controls button").first().click();
    await page.locator('dialog [data-input-action="notes"]').click(); await page.locator("dialog textarea").fill("Notes / focus");
    await page.screenshot({ path: `${output}/screenshots/${id}-focus.png` }); await page.keyboard.press("Escape");
    await settle(page);
    const frames = Number(await host.getAttribute("data-frames")); await page.waitForTimeout(600);
    const idleFrames = Number(await host.getAttribute("data-frames")) - frames;
    const samples = await page.evaluate(() => { window.notebookRecord = false; return window.notebookSamples; });
    const speed = samples.slice(1).map((sample, index) => sample.manipulation === "FOLLOW" && samples[index].manipulation === "FOLLOW" ? Math.hypot(sample.x - samples[index].x, sample.y - samples[index].y) / ((sample.time - samples[index].time) / 1000) : 0);
    const alignment = samples.map((sample) => sample.alignmentError).filter((value) => value !== null);
    const stats = { framesSampled: samples.length, maxPixelsPerSecond: Math.max(...speed), maxScreenErrorLogicalPixels: Math.max(...alignment), idleFrames600ms: idleFrames };
    if (stats.maxPixelsPerSecond > 2401 || stats.maxScreenErrorLogicalPixels > .25 || idleFrames || errors.length) throw new Error(`${id}: ${JSON.stringify({ stats, errors })}`);
    await writeFile(`${resultsOutput}/${id}-trajectory.json`, JSON.stringify({ id, stats, stages, samples }, null, 2) + "\n");
    const video = page.video(); await context.close(); const destination = `${output}/videos/${id}.webm`; await copyFile(await video.path(), destination);
    results.push({ id, width, height, theme, projectionComparison: "physical-mesh", stats, stages, errors, video: { path: `videos/${id}.webm`, bytes: (await readFile(destination)).length, sha256: createHash("sha256").update(await readFile(destination)).digest("hex") } });
    console.log(id, stats);
  }
} finally { await browser.close(); }
const previous = selected ? JSON.parse(await readFile(`${resultsOutput}/visual-results.json`, "utf8").catch(() => '{"results":[]}')).results.filter((entry) => !selected.includes(entry.id)) : [];
await writeFile(`${resultsOutput}/visual-results.json`, JSON.stringify({ origin, projectionComparison: "physical-mesh", environment: "Windows / Chromium / SwiftShader. Native wheel and mesh clicks, unchanged clock and playback. Projection is compared independently to the physical display mesh; software rendering is not a GPU FPS measurement.", results: [...previous, ...results] }, null, 2) + "\n");
