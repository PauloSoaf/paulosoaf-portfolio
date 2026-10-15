import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P01.2", raw = "docs/report/Workstation/P01.2";
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const visual = await json(`${raw}/visual-results.json`), physics = await json(`${raw}/performance/physics-profile.json`);
const profile = await json(`${raw}/performance/profile.json`), hydration = await json(`${raw}/hydration/hydration.json`);
const lighthouse = [];
for (const name of ["workstation-mobile", "workstation-desktop", "control-mobile"]) {
  const report = await json(`${raw}/performance/lighthouse-${name}.json`), audit = report.audits;
  lighthouse.push({ name, version: report.lighthouseVersion, performance: report.categories.performance.score * 100,
    lcpMs: audit["largest-contentful-paint"].numericValue, cls: audit["cumulative-layout-shift"].numericValue,
    tbtMs: audit["total-blocking-time"].numericValue, accessibility: report.categories.accessibility.score * 100,
    bestPractices: report.categories["best-practices"].score * 100, seo: report.categories.seo.score * 100 });
}
const metrics = { date: "2026-10-15", base: "349d7cfffdc47a13e9aeffbc8ee141c4ffa2e5d3", environment: profile.environment,
  recordingProjectionComparison: "See trajectory.projectionComparison. Anchor consistency is not independent physical verification; all four viewport E2E compare the physical mesh.",
  studioAsset: await json("public/art/workstation/studio-pmrem-v1.json"),
  studioValidation: await json(`${raw}/final-local-smoke.json`),
  physicalProjectionRegression: { viewports: [390, 768, 1440, 1920], assertionLimitLogicalPx: .25, source: "tests/workstation/input-motion.spec.ts and visual-physics.spec.ts; physical mesh matrix, not DOM anchor" },
  trajectories: visual.results.map(({ id, stats, stages, projectionComparison }) => ({ id, projectionComparison, framesSampled: stats.framesSampled, maxPixelsPerSecond: stats.maxPixelsPerSecond,
    [projectionComparison === "physical-mesh" ? "maxPhysicalProjectionErrorLogicalPx" : "maxAnchorConsistencyErrorLogicalPx"]: stats.maxScreenErrorLogicalPixels, idleFrames600ms: stats.idleFrames600ms, stages })),
  profiles: profile.results.map(({ width, path, initialGzipBytes, lazyGzipBytes, cls, vitals, scene }) => ({ width, path, initialGzipBytes, lazyGzipBytes, cls,
    inpMs: vitals.find((entry) => entry.name === "portfolio:vital:INP")?.value ?? null,
    scene: scene ? { idleFrames600ms: scene.idleFrames600ms, drawCalls: Number(scene.drawCalls), triangles: Number(scene.triangles), renderCpuMs: Number(scene.renderCpuMs) } : null })),
  physics, lighthouse, hydration };
await writeFile(`${output}/metrics.json`, JSON.stringify(metrics, null, 2) + "\n");
const files = [], videos = [], browser = await chromium.launch();
try {
  for (const name of (await readdir(`${output}/videos`)).filter((name) => name.endsWith(".webm")).sort()) {
    const page = await browser.newPage(); await page.goto(pathToFileURL(resolve(output, "videos", name)).href);
    await page.waitForFunction(() => Number.isFinite(document.querySelector("video")?.duration));
    const metadata = await page.locator("video").evaluate((video) => ({ width: video.videoWidth, height: video.videoHeight, durationSeconds: video.duration }));
    const bytes = await readFile(`${output}/videos/${name}`);
    videos.push({ file: `videos/${name}`, ...metadata, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }); await page.close();
  }
} finally { await browser.close(); }
for (const name of (await readdir(`${output}/screenshots`)).filter((name) => name.endsWith(".png")).sort()) {
  const bytes = await readFile(`${output}/screenshots/${name}`);
  files.push({ file: `screenshots/${name}`, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
}
await writeFile(`${output}/evidence-manifest.json`, JSON.stringify({ date: "2026-10-15", screenshots: files, videos }, null, 2) + "\n");
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
await writeFile(`${output}/review.html`, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workstation P01.2 — evidências</title>
<style>:root{font:15px/1.6 system-ui;color-scheme:dark;background:#090d11;color:#eef4f3}body{max-width:1500px;margin:auto;padding:28px}a{color:#80dfcb}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:20px}figure{margin:0;padding:10px;border:1px solid #35434c;border-radius:10px;min-width:0}img,video{width:100%;height:auto;max-height:650px;object-fit:contain}figcaption{font:12px/1.6 monospace;overflow-wrap:anywhere}input{font:inherit;padding:10px;margin:20px 0}[hidden]{display:none!important}</style>
<h1>Workstation P01.2</h1><p><a href="REPORT.md">Relatório e limites</a> · <a href="metrics.json">Métricas</a> · <a href="evidence-manifest.json">Dimensões e hashes</a> · <a href="http://localhost:1010/pt">Abrir localhost 1010</a></p>
<p>Teclado/modelo, tela em profundidade, ângulos, dobradiça, arraste/arremesso e percurso. Vídeos nativos do Chromium sem alterar relógio ou velocidade de reprodução. SwiftShader não comprova FPS de GPU física nem aceite artístico.</p>
<h2>Vídeos (${videos.length})</h2><section>${videos.map((video) => `<figure><video controls preload="metadata" src="${esc(video.file)}"></video><figcaption>${esc(video.file)} · ${video.width}×${video.height} · ${video.durationSeconds.toFixed(2)}s</figcaption></figure>`).join("\n")}</section>
<h2>Capturas (${files.length})</h2><label>Filtrar <input id="filter" type="search" placeholder="390, light, grazing, before…"></label><section>${files.map((file) => `<figure data-name="${esc(file.file)}"><a href="${esc(file.file)}"><img loading="lazy" src="${esc(file.file)}" width="${file.width}" height="${file.height}" alt="${esc(file.file)}"></a><figcaption>${esc(file.file)}</figcaption></figure>`).join("\n")}</section>
<script>document.getElementById('filter').addEventListener('input',e=>{const value=e.target.value.toLowerCase();document.querySelectorAll('[data-name]').forEach(n=>n.hidden=!n.dataset.name.toLowerCase().includes(value))})</script></html>\n`);
console.log({ screenshots: files.length, videos, lighthouse, profiles: metrics.profiles, physics: physics.results });
