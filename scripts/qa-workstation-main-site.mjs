import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { host, settle, sample } from "./lib/workstation-p02.mjs";

const origin = process.env.QA_ORIGIN ?? "http://localhost:1010";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/MainSite";
const locales = process.env.QA_LOCALES?.split(",") ?? ["pt", "en", "es"];
const widths = process.env.QA_WIDTHS?.split(",").map(Number) ?? [1440, 390, 2880];
await mkdir(`${output}/screenshots`, { recursive: true });
const sources = JSON.parse(await readFile("src/features/workstation/code/generated/code-index.json", "utf8"));
for (const file of sources.files) if (createHash("sha256").update(await readFile(file.path, "utf8")).digest("hex") !== file.sha256) throw Error(`Stale source index: ${file.path}`);
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const results = [];
async function anchor(page, target, block = "start") {
  await page.locator(target).evaluate((node, block) => node.scrollIntoView({ block, behavior: "instant" }), block);
  await settle(page);
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
}
async function geometry(page) {
  return page.evaluate(() => {
    const rect = s => { const node = document.querySelector(s); return node?.getBoundingClientRect().toJSON(); };
    return { url: location.href, scrollY, viewport: { width: innerWidth, height: innerHeight }, work: rect("#work"), heading: rect("#work .section-heading"), card: rect('[data-active="true"] .project-card'), controls: rect(".carousel-controls"), carousel: rect("[data-carousel]"), anchor: rect("[data-workstation-work-anchor]") };
  });
}
try {
  for (const locale of locales) for (const width of widths) for (const theme of ["dark", "light"]) {
    if (width === 2880 && locale !== "pt") continue;
    const height = width === 390 ? 844 : width === 2880 ? 1800 : 900;
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference", hasTouch: width === 390, isMobile: width === 390 });
    await context.addCookies([{ name: "ps-theme", value: theme, url: origin }]);
    const page = await context.newPage(), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const id = `${locale}-${theme}-${width}`, pictures = [];
    const shot = async stage => { const path = `screenshots/${id}-${stage}.png`; await page.screenshot({ path: `${output}/${path}` }); pictures.push(path); };
    try {
      await page.goto(`${origin}/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      if (width < 1280) await page.locator("[data-workstation-anchor]").evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
      await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 45_000 });
      await settle(page);
      if (width >= 1280) await shot("hero");
      await anchor(page, "#work");
      const arrival = { ...await geometry(page), notebook: await sample(page) };
      await shot("projects");
      let station = null;
      if (width < 1280) {
        await anchor(page, ".carousel-stage");
        await shot("project-card");
        await anchor(page, "[data-workstation-work-anchor]", "center");
        await expect(host(page)).toBeVisible();
        station = { ...await geometry(page), notebook: await sample(page) };
        await shot("notebook");
      }
      expect(errors).toEqual([]);
      expect(arrival.notebook.overflow).toBe(false);
      results.push({ id, locale, width, height, theme, arrival, station, errors, pictures });
      console.log(`Captured ${id}`);
    } finally { await context.close(); }
  }
  await writeFile(`${output}/evidence.json`, JSON.stringify({ origin, sources: { sha: sources.sha, files: sources.files.map(({ path, sha256, dirty }) => ({ path, sha256, dirty })) }, results }, null, 2));
} finally { await browser.close(); }
