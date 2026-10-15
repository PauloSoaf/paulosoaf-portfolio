import { readFile, readdir, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P01.1";
const raw = "docs/report/Workstation/P01.1";
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const visual = await json(`${output}/visual-results.json`), videos = await json(`${output}/video-metadata.json`);
const profile = await json(`${raw}/performance/profile.json`), hydration = await json(`${raw}/hydration/hydration.json`);
await copyFile(`${raw}/baseline/hero.png`, `${output}/screenshots/before-p01-hero-1440.png`);
await copyFile(`${raw}/baseline/about.png`, `${output}/screenshots/before-p01-about-1440.png`);
await copyFile(`${raw}/baseline/positions.json`, `${output}/baseline-positions.json`);
const lighthouse = [];
for (const name of ["workstation-mobile", "workstation-desktop", "control-mobile"]) {
  const report = await json(`${raw}/performance/lighthouse-${name}.json`), audit = report.audits;
  lighthouse.push({ name, version: report.lighthouseVersion, performance: report.categories.performance.score * 100,
    lcpMs: audit["largest-contentful-paint"].numericValue, cls: audit["cumulative-layout-shift"].numericValue,
    tbtMs: audit["total-blocking-time"].numericValue, accessibility: report.categories.accessibility.score * 100,
    bestPractices: report.categories["best-practices"].score * 100, seo: report.categories.seo.score * 100 });
}
const metrics = { date: "2026-10-15", base: "3c395abeabed80004893fa30ac60fe4d0b9b1922", environment: profile.environment,
  trajectories: visual.results.map(({ id, stats, stages }) => ({ id, ...stats, stages })),
  profiles: profile.results.map(({ width, path, initialGzipBytes, lazyGzipBytes, cls, vitals, scene }) => ({ width, path, initialGzipBytes, lazyGzipBytes, cls,
    inpMs: vitals.find((entry) => entry.name === "portfolio:vital:INP")?.value ?? null,
    scene: scene ? { idleFrames600ms: scene.idleFrames600ms, drawCalls: Number(scene.drawCalls), triangles: Number(scene.triangles), renderCpuMs: Number(scene.renderCpuMs) } : null })),
  lighthouse, hydration };
await writeFile(`${output}/metrics.json`, JSON.stringify(metrics, null, 2) + "\n");
const files = [];
for (const name of (await readdir(`${output}/screenshots`)).filter((name) => name.endsWith(".png")).sort()) {
  const bytes = await readFile(`${output}/screenshots/${name}`);
  files.push({ file: `screenshots/${name}`, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
}
await writeFile(`${output}/evidence-manifest.json`, JSON.stringify({ date: "2026-10-15", screenshots: files, videos }, null, 2) + "\n");
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const videoHtml = videos.map((video) => `<figure><video controls preload="metadata" src="${esc(video.file)}"></video><figcaption>${esc(video.file)} · ${video.width}×${video.height} · ${video.durationSeconds}s</figcaption></figure>`).join("\n");
const imageHtml = files.map((file) => `<figure data-name="${esc(file.file)}"><a href="${esc(file.file)}"><img loading="lazy" src="${esc(file.file)}" alt="${esc(file.file.replaceAll("-", " "))}" width="${file.width}" height="${file.height}"></a><figcaption>${esc(file.file)}</figcaption></figure>`).join("\n");
await writeFile(`${output}/review.html`, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Workstation P01.1 — evidências</title>
<style>:root{color-scheme:dark light;font-family:system-ui;background:#0d1318;color:#e5eeed}body{max-width:1500px;margin:auto;padding:28px}a{color:#80dfcb}h1{font-size:32px}p{max-width:80ch;line-height:1.6}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}figure{margin:0;border:1px solid #384750;padding:10px;border-radius:12px;min-width:0}img,video{width:100%;height:auto;max-height:700px;object-fit:contain;background:#080c10}figcaption{font:12px/1.6 monospace;overflow-wrap:anywhere;padding:10px 0}label{display:block;margin:24px 0}input{padding:10px;font:inherit;min-width:min(90%,340px)}[hidden]{display:none}</style>
<h1>Workstation P01.1</h1><p>15/10/2026 · <a href="REPORT.md">Relatório e limitações</a> · <a href="metrics.json">Métricas</a> · <a href="evidence-manifest.json">Dimensões e hashes</a> · <a href="http://localhost:1010/pt">Abrir implementação local</a></p>
<p>Vídeos reais do Chromium em tempo nativo. Sem acelerar playback ou desenhar instrumentação sobre a experiência. Telemetria em arquivos JSON separados. Validação local com SwiftShader; não equivale a aceite artístico, GPU física ou publicação.</p>
<h2>Movimento, controles e sites reais</h2><section>${videoHtml}</section>
<h2>Capturas (${files.length})</h2><label>Filtrar capturas <input id="filter" type="search" placeholder="Ex.: 390, light, en, before, contact"></label><section id="screenshots">${imageHtml}</section>
<script>document.getElementById('filter').addEventListener('input',event=>{const value=event.target.value.toLowerCase();document.querySelectorAll('[data-name]').forEach(figure=>{figure.hidden=!figure.dataset.name.toLowerCase().includes(value)})})</script></html>\n`);
console.log({ screenshots: files.length, videos: videos.length, lighthouse, profiles: metrics.profiles });
