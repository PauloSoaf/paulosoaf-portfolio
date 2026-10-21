/** Development-only regression: change a class initializer while its React owner is mounted.
 * Requires next dev at QA_ORIGIN (default localhost:1010). Temporarily instruments position.ts,
 * restores it in finally, and refuses to overwrite an unexpected concurrent edit. Run alone.
 */
import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { host, settle } from "./lib/workstation-p02.mjs";

const origin = process.env.QA_ORIGIN ?? "http://localhost:1010";
const raw = "docs/report/Workstation/P02.2/hotfix-refresh";
const path = "src/features/workstation/orchestrator/position.ts";
const original = await readFile(path, "utf8");
const classPoint = "export class MotionRig {", framePoint = "function paint(time: number) {";
if (!original.includes(classPoint) || !original.includes(framePoint)) throw Error("Refresh probe insertion points changed");
const initial = original.replace(classPoint, `${classPoint}\n  readonly hotReloadProbe = "initial";`)
  .replace(framePoint, `${framePoint}\n    setData(host, { hotReloadProbe: rig.hotReloadProbe, hotReloadCode: "initial" });`);
const updated = initial.replace('hotReloadProbe = "initial"', 'hotReloadProbe = "updated"')
  .replace('hotReloadCode: "initial"', 'hotReloadCode: "updated"');
const expectStale = process.argv.includes("--expect-stale");
await mkdir(raw, { recursive: true });
await writeFile(`${raw}/original-position.txt`, original);
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
let changed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (await readFile(path, "utf8") !== original) throw Error("Concurrent edit before refresh probe");
  changed = true; await writeFile(path, initial);
  await page.goto(`${origin}/pt/workstation-lab`, { timeout: 90_000 });
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 45_000 });
  await expect(host(page)).toHaveAttribute("data-hot-reload-probe", "initial");
  await page.evaluate(() => { window.qaRefreshDocument = "same-native-document"; });
  if (await readFile(path, "utf8") !== initial) throw Error("Concurrent edit during refresh probe");
  await writeFile(path, updated);
  await expect(host(page)).toHaveAttribute("data-hot-reload-code", "updated", { timeout: 18_000 });
  if (expectStale) {
    // Establish the old failure: new paint code runs, but the class initializer stays old.
    let advanced = false;
    try { await expect(host(page)).toHaveAttribute("data-hot-reload-probe", "updated", { timeout: 18_000 }); advanced = true; }
    catch { /* The baseline is expected to retain the old class. */ }
    expect(advanced).toBe(false);
    await expect(host(page)).toHaveAttribute("data-hot-reload-probe", "initial");
  } else await expect(host(page)).toHaveAttribute("data-hot-reload-probe", "updated", { timeout: 18_000 });
  await expect(host(page)).toHaveAttribute("data-scene", "ready", { timeout: 45_000 });
  await settle(page);
  expect(await page.evaluate(() => window.qaRefreshDocument)).toBe("same-native-document");
  expect(await page.locator("canvas").count()).toBe(1);
  expect(errors).toEqual([]);
  const result = { expectedStale: expectStale, observed: await host(page).getAttribute("data-hot-reload-probe"), sameDocument: true, canvas: 1, scene: "ready", errors };
  await writeFile(`${raw}/${expectStale ? "before" : "after"}.json`, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
} finally {
  try {
    if (changed) {
      const current = await readFile(path, "utf8");
      if (current !== initial && current !== updated) throw Error(`Concurrent edit preserved. Original saved at ${raw}/original-position.txt`);
      await writeFile(path, original);
    }
  } finally { await browser.close(); }
}
