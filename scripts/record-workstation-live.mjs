import { chromium } from "playwright";
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300", output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P01", raw = process.env.QA_WORKSTATION_RAW_OUTPUT ?? "docs/report/Workstation/live-videos";
await mkdir(`${output}/screenshots`, { recursive: true }); await mkdir(`${output}/videos`, { recursive: true }); await mkdir(raw, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
try {
  for (const [index, id] of ["nutriopus", "deborah"].entries()) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", recordVideo: { dir: raw, size: { width: 1440, height: 900 } } });
    const page = await context.newPage(), errors = [], policies = [];
    page.on("console", (event) => { if (event.type() === "error") errors.push(event.text()); });
    page.on("response", async (response) => {
      if (response.request().resourceType() !== "document") return;
      const headers = await response.allHeaders();
      policies.push({ url: response.url(), status: response.status(), headers: Object.fromEntries(["content-security-policy", "x-frame-options", "location", "content-type"].filter((name) => headers[name]).map((name) => [name, headers[name]])) });
    });
    await page.goto(`${origin}/pt/workstation-lab`);
    await page.locator('[data-workstation][data-scene="ready"]').waitFor(); await page.waitForTimeout(500);
    await page.locator(".workstation-controls button").first().click();
    await page.locator("dialog .workbench-projects button").nth(index).click();
    const frame = page.frameLocator("iframe"); await frame.locator("h1").waitFor({ timeout: 30_000 }); await frame.locator("body").evaluate(() => document.fonts.ready); await page.waitForTimeout(1800);
    const title = await frame.locator("body").evaluate(() => document.title), before = await frame.locator("body").evaluate(() => scrollY);
    const box = await page.locator("iframe").boundingBox(); await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6); await page.mouse.wheel(0, 650); await page.waitForTimeout(700);
    const after = await frame.locator("body").evaluate(() => scrollY);
    await page.screenshot({ path: `${output}/screenshots/live-${id}-scroll.png` });
    await frame.locator(id === "nutriopus" ? 'a[href="#recursos"]' : 'a[href="#topo"]').first().click(); await page.waitForTimeout(600);
    const afterClick = await frame.locator("body").evaluate(() => ({ url: location.href, scrollY }));
    await page.screenshot({ path: `${output}/screenshots/live-${id}-click.png` });
    await page.locator("dialog .workbench-toolbar button").last().click(); await page.waitForTimeout(300);
    const video = page.video(); await context.close(); const destination = `${output}/videos/live-${id}.webm`; await copyFile(await video.path(), destination);
    results.push({ id, title, wheel: { before, after }, afterClick, errors, policies, video: { path: destination, sha256: createHash("sha256").update(await readFile(destination)).digest("hex") } });
    console.log(id, before, after);
  }
} finally { await browser.close(); }
await writeFile(`${output}/live-embed-results.json`, JSON.stringify({ environment: "Anonymous public landing pages in Chromium; native input, no private sessions or authentication", origin, results }, null, 2) + "\n");
if (results.some((entry) => entry.wheel.after < entry.wheel.before + 100 || entry.errors.length)) process.exitCode = 1;
