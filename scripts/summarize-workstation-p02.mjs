import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
const output = process.env.QA_WORKSTATION_OUTPUT ?? "docs/qa/Workstation/P02.1";
const raw = process.env.QA_WORKSTATION_PROFILE_OUTPUT ?? "docs/report/Workstation/P02.1/performance";
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const evidence = await json(`${output}/evidence.json`), profile = await json(`${raw}/profile.json`);
const scenarios = new Map(), runs = [], hydrationCases = new Map(), hydrationImages = [];
await mkdir(`${output}/screenshots`, { recursive: true });
const current = await json("docs/report/Workstation/P02.1/workstation-e2e.json");
const currentCount = current.stats.expected + current.stats.skipped + current.stats.unexpected + current.stats.flaky;
// A fresh full run is self-contained. This delivery also retains its pre-fix full run and
// focused follow-ups, so its actual validation history remains reviewable without inventing a green full run.
const names = currentCount >= 40 ? ["workstation-e2e"] : ["workstation-e2e-initial", "workstation-brake-final", "workstation-rotation-final"];
for (const name of names) {
  let report;
  try { report = await json(`docs/report/Workstation/P02.1/${name}.json`); }
  catch (error) { if (error.code === "ENOENT") throw new Error("Run npm run test:workstation without filters before summarizing QA."); throw error; }
  runs.push({ name, stats: report.stats });
  const collect = (suites) => { for (const suite of suites) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      const result = test.results.at(-1);
      scenarios.set(`${spec.file}:${spec.title}`, result.status);
      const attachment = result.attachments?.find((item) => item.name === "hydration-geometry");
      if (attachment?.body) {
        const geometry = JSON.parse(Buffer.from(attachment.body, "base64").toString("utf8"));
        hydrationCases.set(`${geometry.width}:${geometry.hash}`, geometry);
        if (geometry.hash === "#about") for (const image of result.attachments.filter((item) => item.contentType === "image/png" && /^(before|after)-javascript$/.test(item.name))) {
          hydrationImages.push(copyFile(image.path, `${output}/screenshots/hydration-${geometry.width}-about-${image.name}.png`));
        }
      }
    }
    collect(suite.suites ?? []);
  } };
  collect(report.suites);
}
await Promise.all(hydrationImages);
const hydration = [...hydrationCases.values()];
if (hydration.length !== 6) throw new Error("Run all six Workstation hydration scenarios before summarizing QA.");
await writeFile(`${output}/hydration.json`, JSON.stringify(hydration, null, 2) + "\n");
const validation = { method: names.length === 1 ? "Single full Workstation E2E run." : "Consolidated unique scenarios: initial full run, then affected brake/reduced-motion scenarios and added rotation repeated after corrections. Not a single clean full run. Initial failure and follow-up reports are retained in ignored docs/report/Workstation/P02.1.",
  total: scenarios.size, passed: [...scenarios.values()].filter((status) => status === "passed").length, skipped: [...scenarios.values()].filter((status) => status === "skipped").length,
  failures: [...scenarios].filter(([, status]) => !["passed", "skipped"].includes(status)), runs };
const lighthouse = [];
for (const name of ["mobile", "desktop", "control-mobile"]) {
  const report = await json(`${raw}/lighthouse-${name}.json`);
  lighthouse.push({ name, version: report.lighthouseVersion, url: report.finalDisplayedUrl, categories: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: report.audits["largest-contentful-paint"].numericValue, tbtMs: report.audits["total-blocking-time"].numericValue, cls: report.audits["cumulative-layout-shift"].numericValue });
}
const metrics = { environment: profile.environment, source: evidence.source, hydration, validation,
  profile: profile.results.map(({ width, initialGzipBytes, sceneLazyGzipBytes, throwLazyGzipBytes, codeLazyGzipBytes, studioAssetBytes, sceneReadyAndSettledMs, idleFrames600ms, scene, vitals, events, errors }) => ({ width, initialGzipBytes, sceneLazyGzipBytes, throwLazyGzipBytes, codeLazyGzipBytes, studioAssetBytes, sceneReadyAndSettledMs, idleFrames600ms, renderCpuMs: Number(scene.renderCpuMs), drawCalls: Number(scene.drawCalls), triangles: Number(scene.triangles), vitals, slowestEvents: [...events].sort((a, b) => b.duration - a.duration).slice(0, 8), errors })),
  lighthouse, cases: evidence.results.map(({ id, observations, screenshots, video, errors }) => ({ id, idleFrames600ms: observations.idleFrames600ms, alignmentErrorPx: observations.alignmentErrorPx, screenshots: screenshots.length, video, errors })) };
await mkdir(output, { recursive: true });
await writeFile(`${output}/metrics.json`, JSON.stringify(metrics, null, 2) + "\n");
const gallery = ["# Workstation P02.1 — evidências", "", "Chromium/SwiftShader. Screenshots e WebM originais do Playwright; sem aceleração, interpolação ou remontagem. Freada do roteiro é sintética e identificada no manifesto. Aceite em hardware e aceite artístico continuam manuais.", ""];
gallery.push("## Hidratação lenta em #about", "", "Rede 120ms/180KB/s e CPU 4×. JavaScript bloqueado até fontes e âncora nativa assentarem; capturas antes/depois. A matriz numérica de seis casos está em [hydration.json](hydration.json).", "");
for (const width of [390, 1440]) for (const state of ["before", "after"]) gallery.push(`![${width}, ${state} JS](screenshots/hydration-${width}-about-${state}-javascript.png)`, "");
for (const result of evidence.results) {
  gallery.push(`## ${result.id}`, "");
  if (result.video) gallery.push(`[Vídeo nativo (${result.video.durationSeconds.toFixed(1)} s, ${result.video.width}×${result.video.height})](${result.video.path})`, "");
  for (const screenshot of result.screenshots) gallery.push(`![${screenshot.split("/").at(-1)}](${screenshot})`, "");
}
await writeFile(`${output}/GALLERY.md`, gallery.join("\n"));
console.log(JSON.stringify({ cases: metrics.cases.length, screenshots: metrics.cases.reduce((sum, item) => sum + item.screenshots, 0), videos: metrics.cases.filter((item) => item.video).length, validation: { total: validation.total, passed: validation.passed, skipped: validation.skipped, failures: validation.failures }, profile: metrics.profile.map(({ width, initialGzipBytes, vitals }) => ({ width, initialGzipBytes, vitals })), lighthouse }, null, 2));
if (validation.failures.length) process.exitCode = 1;
