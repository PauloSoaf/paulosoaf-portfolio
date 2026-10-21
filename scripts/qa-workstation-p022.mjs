import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { open, host, settle, point, menu, sample, wheelTo } from "./lib/workstation-p02.mjs";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P02.2";
const raw = "docs/report/Workstation/P02.2/live-recordings";
const sites = [
  { id: "nutriopus", slug: "nutriopus", title: "NutriOpus", url: "https://www.nutriopus.com.br/" },
  { id: "deborah", slug: "deborah-lima", title: "Déborah Lima", url: "https://www.xn--advogadadborahlima-jwb.com.br/" },
];
for (const path of [raw, output, `${output}/screenshots`, `${output}/videos`]) await mkdir(path, { recursive: true });
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] }), results = [];
const selected = process.env.QA_WORKSTATION_WIDTHS?.split(",").map(Number) ?? [1440, 390];
const sourceIndex = JSON.parse(await readFile("src/features/workstation/code/generated/code-index.json", "utf8"));
const source = { base: sourceIndex.sha, files: sourceIndex.files.map(({ path, sha256, dirty }) => ({ path, sha256, dirty })) };
if (process.env.QA_WORKSTATION_WIDTHS) {
  try { results.push(...JSON.parse(await readFile(`${output}/live-evidence.json`, "utf8")).results.filter((item) => !selected.includes(item.width))); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
try {
  for (const width of selected) {
    const height = width === 390 ? 844 : 900, id = `pt-live-${width}`;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390, isMobile: width === 390,
      reducedMotion: "no-preference", recordVideo: { dir: raw, size: { width, height } } });
    const page = await context.newPage(), phases = [], proofs = [], responses = [], errors = [], screenshots = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.request().resourceType() === "document" && sites.some((site) => response.url().startsWith(site.url))) responses.push({ url: response.url(), status: response.status(), headers: response.headers() });
    });
    const phase = async (name, extra = {}) => phases.push({ name, browserTime: await page.evaluate(() => performance.now()), state: await sample(page), ...extra });
    const shot = async (name) => { const path = `screenshots/${id}-${name}.png`; await page.screenshot({ path: `${output}/${path}` }); screenshots.push(path); };
    const toggleTheme = async () => {
      if (width < 1024) await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page.locator("header .theme-toggle").filter({ visible: true }).click();
      if (width < 1024) await page.keyboard.press("Escape");
      await settle(page);
    };
    try {
      await open(page, origin);
      await page.evaluate(() => {
        const host = document.querySelector("[data-workstation]");
        window.p022Contacts = [];
        new MutationObserver(() => {
          if (host.dataset.reactionStage !== "IDLE" || host.dataset.body !== "FOLLOW") window.p022Contacts.push({ observedAt: performance.now(), ...host.dataset });
        }).observe(host, { attributes: true });
      });
      for (const site of sites) {
        await wheelTo(page, "[data-workstation-work-anchor]");
        await page.locator(".filmstrip-button").filter({ hasText: site.title }).click();
        const slide = page.locator(`.carousel-slide[data-project="${site.slug}"][data-active="true"]`);
        await slide.getByRole("button", { name: "Explorar no notebook", exact: true }).click();
        await settle(page); await expect(page.locator("dialog")).not.toBeVisible();
        const iframe = page.locator(`iframe[data-project-site="${site.id}"]`), frame = page.frameLocator(`iframe[data-project-site="${site.id}"]`);
        await expect(iframe).toHaveAttribute("src", site.url);
        await expect(frame.locator("h1")).not.toBeEmpty({ timeout: 35000 });
        await frame.locator("body").evaluate(() => document.fonts.ready);
        await phase(`carousel-${site.id}-immersive`); await shot(`${site.id}-dark`);
        const epoch = await frame.locator("body").evaluate(() => performance.timeOrigin), element = await iframe.elementHandle();
        const before = await frame.locator("body").evaluate(() => scrollY);
        const at = await page.locator(".workstation-projected-screen").evaluate((node) => {
          const p = new DOMMatrix(getComputedStyle(node).transform).transformPoint(new DOMPoint(350, 310)); return { x: p.x, y: p.y };
        });
        await page.mouse.move(at.x, at.y); await page.mouse.wheel(0, 600);
        await expect.poll(() => frame.locator("body").evaluate(() => scrollY)).toBeGreaterThan(before + 100);
        await phase(`${site.id}-native-wheel`, { iframeScroll: await frame.locator("body").evaluate(() => scrollY) }); await shot(`${site.id}-scroll`);
        await settle(page); // entering the iframe clears the page's pointer-look spring
        const visibleLink = () => frame.locator('a[href^="#"]:not(.sr-only):not([href="#"])').evaluateAll((nodes) => nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          const target = document.getElementById(node.getAttribute("href").slice(1));
          return { href: node.getAttribute("href"), x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height,
            distance: target ? Math.abs(target.getBoundingClientRect().top) : 0,
            visible: getComputedStyle(node).visibility !== "hidden" && rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth };
        }).find((item) => item.visible && item.width > 20 && item.height > 15 && item.distance > 60));
        let link = await visibleLink();
        if (!link) { await page.mouse.wheel(0, -800); await expect.poll(visibleLink).toBeTruthy(); link = await visibleLink(); }
        // Native coordinates avoid locator scrollIntoView moving an ancestor of the projected
        // iframe. Inspecting its DOM here is browser automation, never production cross-origin JS.
        const linkPoint = await page.locator(".workstation-projected-screen").evaluate((node, point) => {
          const p = new DOMMatrix(getComputedStyle(node).transform).transformPoint(new DOMPoint(point.x, point.y)); return { x: p.x, y: p.y };
        }, link);
        const linkScrollBefore = await frame.locator("body").evaluate(() => scrollY);
        await page.mouse.click(linkPoint.x, linkPoint.y);
        await expect.poll(() => frame.locator("body").evaluate((_node, { href, before }) => location.hash === href || Math.abs(scrollY - before) > 10, { href: link.href, before: linkScrollBefore })).toBe(true);
        await phase(`${site.id}-native-link`, { href: link.href, frameURL: await frame.locator("body").evaluate(() => location.href) });
        await toggleTheme(); await shot(`${site.id}-light`);
        const grip = await point(page, "drag-point");
        await page.keyboard.down("Shift"); await page.mouse.move(grip.x, grip.y); await page.mouse.down();
        await page.mouse.move(grip.x - Math.min(70, width * .12), grip.y - 12, { steps: 8 }); await page.mouse.up(); await page.keyboard.up("Shift"); await settle(page);
        expect(await element.evaluate((node) => node === document.querySelector("iframe"))).toBe(true);
        expect(await frame.locator("body").evaluate(() => performance.timeOrigin)).toBe(epoch);
        proofs.push({ site: site.id, actualURL: await frame.locator("body").evaluate(() => location.href), epoch, preservedAcrossThemeAndRotation: true,
          screen: await iframe.evaluate((node) => ({ width: node.clientWidth, height: node.clientHeight, rootWidth: node.closest("[data-workstation-screen]").clientWidth, rootHeight: node.closest("[data-workstation-screen]").clientHeight })) });
        const exit = page.locator(".workbench-site-exit");
        if (width === 390) await exit.tap(); else { await exit.hover(); await shot(`${site.id}-exit-hover`); await exit.click(); }
        await expect(page.locator("iframe")).toHaveCount(0); await phase(`${site.id}-closed-to-desktop`);
        await toggleTheme();
      }
      // Keep a real external document alive through the physical reaction as well.
      await wheelTo(page, "[data-workstation-work-anchor]");
      await page.locator(".filmstrip-button").filter({ hasText: "NutriOpus" }).click();
      await page.locator('.carousel-slide[data-project="nutriopus"][data-active="true"]').getByRole("button", { name: "Explorar no notebook", exact: true }).click();
      const real = page.frameLocator('iframe[data-project-site="nutriopus"]');
      await expect(real.locator("h1")).not.toBeEmpty({ timeout: 35000 });
      await settle(page);
      await page.locator(".workstation-options-trigger").focus(); await page.keyboard.press("Enter");
      await page.getByRole("menuitem", { name: "Redefinir posição", exact: true }).click(); await settle(page);
      const iframe = await page.locator("iframe").elementHandle(), epoch = await real.locator("body").evaluate(() => performance.timeOrigin);
      await phase("before-floor-throw");
      const grip = await point(page, "drag-point");
      const cdp = await context.newCDPSession(page);
      await page.mouse.move(grip.x, grip.y);
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: grip.x, y: grip.y, button: "left", buttons: 1, clickCount: 1 });
      const throwX = grip.x - Math.min(120, width * .15), liftY = Math.max(180, height * .23);
      for (let step = 1; step <= 6; step++) { await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: grip.x + (throwX - grip.x) * step / 6, y: grip.y + (liftY - grip.y) * step / 6, button: "left", buttons: 1 }); await page.waitForTimeout(20); }
      await expect(host(page)).toHaveAttribute("data-body", "HELD");
      // Queue the ordered native CDP input burst on one connection. No forged timestamps:
      // per-event Playwright round trips on SwiftShader can otherwise turn a throw into a pause.
      await Promise.all([...Array.from({ length: 4 }, (_, step) => cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: throwX, y: liftY + (step + 1) * 22, button: "left", buttons: 1 })),
        cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: throwX, y: liftY + 88, button: "left", buttons: 0 })]);
      await cdp.detach(); await phase("released-floor-throw");
      await expect(host(page)).toHaveAttribute("data-reaction", "dizzy", { timeout: 20000 });
      await shot("first-impact"); await phase("impact-dizzy"); await settle(page); await phase("recovered-floor");
      expect(await iframe.evaluate((node) => node === document.querySelector("iframe"))).toBe(true);
      expect(await real.locator("body").evaluate(() => performance.timeOrigin)).toBe(epoch);
      const beforeCeiling = Number((await host(page).getAttribute("data-trajectory")).split(",")[0]);
      const wall = width === 390 ? "side" : "ceiling";
      await (await menu(page)).getByRole("menuitem", { name: "Dar uma cambalhota", exact: true }).click();
      await expect.poll(() => page.evaluate(({ after, wall }) => window.p022Contacts.some((sample) => JSON.parse(sample.contactPacket ?? "[]")
        .some((contact) => (wall === "side" ? contact.wall === "left" || contact.wall === "right" : contact.wall === "ceiling") && contact.time > after)), { after: beforeCeiling, wall }), { timeout: 15000 }).toBe(true);
      await phase(`${wall}-contact`); await shot(wall); await settle(page); await phase(`recovered-${wall}`);
      const contacts = await page.evaluate(() => window.p022Contacts);
      const first = contacts.find((item) => item.reactionStage === "IMPACT");
      expect(first).toBeTruthy(); expect(first.body).toBe("AIRBORNE"); expect(first.reactionAt).toBe(first.reactionContactAt);
      expect(Number(first.reactionStartedAt) - Number(first.reactionContactDetectedAt)).toBeLessThan(100);
      await writeFile(`${raw}/${id}-contacts.json`, JSON.stringify(contacts, null, 2));
      proofs.push({ physicalIframePreserved: true, firstContact: first, contactLog: `${raw}/${id}-contacts.json` });
      await phase("final-idle"); await shot("final");
    } finally {
      const recording = page.video(); await context.close();
      const path = `videos/${id}-websites-impact.webm`;
      await copyFile(await recording.path(), `${output}/${path}`);
      const data = await readFile(`${output}/${path}`), meta = await browser.newPage();
      await meta.goto(pathToFileURL(resolve(`${output}/${path}`)).href);
      await meta.waitForFunction(() => Number.isFinite(document.querySelector("video")?.duration));
      const video = await meta.locator("video").evaluate((node) => ({ duration: node.duration, width: node.videoWidth, height: node.videoHeight })); await meta.close();
      results.push({ id, width, height, source, phases, proofs, responses, errors, screenshots, video: { path, ...video, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") } });
      await writeFile(`${output}/live-evidence.json`, JSON.stringify({ recordedAt: new Date().toISOString(), method: "Real remote websites, native browser input and original Playwright WebM. No route interception, fake pages, clock changes or image substitutes. SwiftShader is not physical GPU acceptance.", results }, null, 2) + "\n");
    }
    console.log(`${id}: real sites + impacts recorded`);
  }
} finally { await browser.close(); }
