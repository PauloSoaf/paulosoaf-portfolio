import { readFile, writeFile, copyFile, readdir, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "docs/qa/Workstation/P03", raw = "docs/report/Workstation/P03";
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
await mkdir(`${root}/screenshots`, { recursive: true }); await mkdir(`${root}/videos`, { recursive: true });
for (const [from, to] of [["nutriopus-800.png", "before-nutriopus-800.png"], ["deborah-800.png", "before-deborah-800.png"], ["circular-release.png", "before-circular-release.png"]]) await copyFile(`${raw}/baseline/${from}`, `${root}/screenshots/${to}`);
await copyFile(`${raw}/baseline/baseline.json`, `${root}/baseline.json`); await copyFile(`${raw}/baseline/fit-audit.json`, `${root}/site-fit-audit.json`);
const workstation = await json(`${raw}/workstation-e2e.json`), general = await json(`${raw}/general-e2e.json`), publicGate = await json(`${raw}/public-gate.json`);
const visual = await json(`${root}/evidence.json`), live = await json(`${root}/cinematic-evidence.json`), profile = await json(`${raw}/performance/profile.json`);
for (const [name, report, expected, skipped] of [["Workstation", workstation, 57, 0], ["general", general, 87, 1], ["public gate", publicGate, 1, 0]]) {
  if (report.stats.expected !== expected || report.stats.skipped !== skipped || report.stats.unexpected || report.stats.flaky) throw new Error(`${name}: final clean results required; exploratory/parallel failures cannot be reported as passing.`);
}
if (visual.results.length !== 12 || visual.results.some(({ observations, errors }) => errors.length || observations.overflow || observations.idleFrames600ms !== 0)) throw new Error("The complete clean visual matrix is required.");
if (live.results.length !== 2 || live.results.some(({ failure, errors, proofs }) => failure || errors.length || proofs.filter((proof) => proof.site).length !== 2)) throw new Error("Both complete, clean real-site recordings are required.");
const hydration = [], scenarios = [];
async function collect(suites) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      const result = test.results.at(-1); scenarios.push({ file: spec.file, title: spec.title, status: result.status, durationMs: result.duration });
      const data = result.attachments?.find((entry) => entry.name === "hydration-geometry");
      if (data?.body) {
        const measurement = JSON.parse(Buffer.from(data.body, "base64").toString("utf8")); hydration.push(measurement);
        if (measurement.hash === "#about") for (const image of result.attachments.filter((entry) => /^(before|after)-javascript$/.test(entry.name))) await copyFile(image.path, `${root}/screenshots/hydration-${measurement.width}-about-${image.name}.png`);
      }
    }
    await collect(suite.suites ?? []);
  }
}
await collect(workstation.suites);
if (hydration.length !== 6 || scenarios.length !== 57) throw new Error("A complete P03 Workstation run with all six hydration cases is required.");
const lighthouse = [];
for (const name of ["mobile", "desktop"]) {
  const report = await json(`${raw}/performance/lighthouse-${name}.json`), audit = report.audits;
  lighthouse.push({ name, fetchTime: report.fetchTime, version: report.lighthouseVersion, url: report.finalDisplayedUrl,
    categories: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: audit["largest-contentful-paint"].numericValue, cls: audit["cumulative-layout-shift"].numericValue, tbtMs: audit["total-blocking-time"].numericValue });
}
const metrics = { base: "6dedb39cfa4ba8c8f9b96e3a0e1714ffddf4d272", branch: "feat/workstation-cinematic-spin-fit", recordedAt: new Date().toISOString(),
  environment: profile.environment, validation: { method: "One final full Workstation run, one worker; browser recordings and profiling run separately. Earlier exploratory/concurrent runs are retained only in ignored reports.", workstation: workstation.stats, general: general.stats, generalReportFormat: "Native report.json extracted from Playwright HTML report (default general configuration has no JSON reporter).", generalStartTime: general.startTime, generalDurationMs: general.duration, publicGate: publicGate.stats, scenarios }, hydration,
  profiles: profile.results.map(({ width, initialGzipBytes, sceneLazyGzipBytes, codeLazyGzipBytes, vitals, idleFrames600ms, scene, errors }) => ({ width, initialGzipBytes, initialBudgetBytes: 180000, sceneLazyGzipBytes, codeLazyGzipBytes, vitals, idleFrames600ms, drawCalls: Number(scene.drawCalls), triangles: Number(scene.triangles), errors })),
  lighthouse, visual: visual.results.map(({ id, observations, screenshots, errors }) => ({ id, idleFrames600ms: observations.idleFrames600ms, alignmentErrorPx: observations.alignmentErrorPx, screenshots: screenshots.length, overflow: observations.overflow, errors })),
  live: live.results.map(({ id, proofs, errors, failure, video }) => ({ id, spin: proofs.find((entry) => entry.nativeSpin)?.nativeSpin.angleRange, websites: proofs.filter((entry) => entry.site), errors, failure, video })) };
await writeFile(`${root}/metrics.json`, JSON.stringify(metrics, null, 2) + "\n");
await writeFile(`${root}/hydration.json`, JSON.stringify(hydration, null, 2) + "\n");
const screenshots = [];
for (const name of (await readdir(`${root}/screenshots`)).filter((name) => name.endsWith(".png")).sort()) {
  const bytes = await readFile(`${root}/screenshots/${name}`);
  screenshots.push({ path: `screenshots/${name}`, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
}
await writeFile(`${root}/evidence-manifest.json`, JSON.stringify({ recordedAt: new Date().toISOString(), screenshots, videos: live.results.map((entry) => entry.video) }, null, 2) + "\n");
const imageRows = screenshots.map((entry) => `<figure data-name="${entry.path}"><a href="${entry.path}"><img loading="lazy" src="${entry.path}" alt="${entry.path}" width="${entry.width}" height="${entry.height}"></a><figcaption>${entry.path}</figcaption></figure>`).join("\n");
const videoRows = live.results.map(({ video }) => `<figure><video controls preload="metadata" src="${video.path}"></video><figcaption>${video.width}×${video.height} · ${video.duration.toFixed(1)}s · ${video.path}</figcaption></figure>`).join("\n");
await writeFile(`${root}/review.html`, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workstation P03 — evidências</title>
<style>:root{color-scheme:dark;font:16px/1.6 system-ui;background:#0d1318;color:#e5eeed}body{max-width:1500px;margin:auto;padding:24px}a{color:#80dfcb}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}figure{margin:0;border:1px solid #384750;padding:10px;border-radius:12px;min-width:0}img,video{width:100%;height:auto;max-height:700px;object-fit:contain;background:#080c10}figcaption{font:12px/1.6 monospace;overflow-wrap:anywhere;padding:10px 0}input{font:inherit;padding:10px;margin:24px 0}[hidden]{display:none}</style>
<h1>Workstation P03</h1><p><a href="REPORT.md">QA e limites</a> · <a href="metrics.json">Métricas</a> · <a href="evidence-manifest.json">Dimensões e hashes</a> · <a href="http://localhost:1010/pt">Abrir localhost</a></p><p>Sites reais, gestos nativos e vídeos originais sem retiming. As capturas “before” pertencem à base 6dedb39. Chromium/SwiftShader não substitui validação em GPU física ou aprovação estética.</p><h2>Vídeos desktop e touch</h2><section>${videoRows}</section><h2>Capturas (${screenshots.length})</h2><label>Filtrar <input type="search" id="filter" placeholder="390, light, nutriopus, before"></label><section>${imageRows}</section><script>document.getElementById('filter').addEventListener('input',event=>document.querySelectorAll('[data-name]').forEach(node=>{node.hidden=!node.dataset.name.toLowerCase().includes(event.target.value.toLowerCase())}))</script></html>\n`);
console.log(JSON.stringify({ workstation: workstation.stats, general: general.stats, publicGate: publicGate.stats, screenshots: screenshots.length, profiles: metrics.profiles, lighthouse }, null, 2));
