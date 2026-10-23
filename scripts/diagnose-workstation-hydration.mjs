import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

// Run against next dev: React's detailed hydration warning is development-only.
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:1010";
const output = process.env.QA_HYDRATION_OUTPUT ?? "docs/report/Workstation/LiveExperience";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch(), evidence = [];
try {
  for (const injected of [false, true]) {
    const context = await browser.newContext({ reducedMotion: "reduce" }), page = await context.newPage();
    if (injected) await page.addInitScript(() => {
      // Mirror an extension's document-start mutation without rewriting the HTTP
      // response (which changes Chromium's local-network classification for HMR).
      const observer = new MutationObserver(() => {
        if (!document.body) return;
        document.body.setAttribute("cz-shortcut-listen", "true"); observer.disconnect();
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    const errors = [];
    page.on("console", event => { if (event.type() === "error") errors.push(event.text()); });
    page.on("pageerror", error => errors.push(error.message));
    for (const reload of [false, true]) {
      const start = errors.length;
      if (reload) await page.reload(); else await page.goto(`${origin}/pt`);
      await page.locator('html[data-section-tracking="true"]').waitFor({ state: "attached" });
      await page.waitForTimeout(700);
      evidence.push({ injected, reload, errors: errors.slice(start), bodyAttribute: await page.locator("body").getAttribute("cz-shortcut-listen") });
    }
    await context.close();
  }
} finally { await browser.close(); }
writeFileSync(`${output}/hydration-diagnosis.json`, JSON.stringify({ origin, evidence }, null, 2));
console.log(JSON.stringify(evidence.map(item => ({ injected: item.injected, reload: item.reload, errors: item.errors.length, matching: item.errors.some(error => error.includes("cz-shortcut-listen")) }))));
if (evidence.some(item => item.injected ? !item.errors.some(error => error.includes("cz-shortcut-listen")) : item.errors.length)) process.exitCode = 1;
