import { readFile, writeFile } from "node:fs/promises";
const read = async path => JSON.parse(await readFile(path, "utf8"));
const root = "docs/report/S03.5", baseline = await read("docs/qa/S03/metrics.json");
// The historical capture is immutable and preserved in the versioned summary on fresh clones.
const hydrationBefore = await read(`${root}/baseline.json`).catch(async error => {
  if (error.code !== "ENOENT") throw error;
  return (await read("docs/qa/S03.5/metrics.json")).hydrationBefore;
});
const laboratory = [];
for (const sample of ["preview-desktop", "preview-mobile", "public-desktop", "public-mobile"]) {
  const report = await read(`${root}/lighthouse-${sample}.json`);
  laboratory.push({ sample, date: report.fetchTime, lighthouse: report.lighthouseVersion, formFactor: report.configSettings.formFactor,
    throttlingMethod: report.configSettings.throttlingMethod, scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: report.audits["largest-contentful-paint"].numericValue, cls: report.audits["cumulative-layout-shift"].numericValue, tbtMs: report.audits["total-blocking-time"].numericValue, warnings: report.runWarnings });
}
const profiles = async filename => (await read(`${root}/${filename}`)).map(profile => ({ width: profile.width, publicSample: profile.publicSample,
  saveData: profile.saveData, initialGzipBytes: profile.initialGzipBytes, vitals: profile.vitals, shifts: profile.shifts,
  revealCount: profile.reveals.length, durationsMs: [...new Set(profile.reveals.map(reveal => reveal.timing.duration))],
  remainingAnimations: profile.remainingAnimations, canvasCount: profile.canvasCount, overflow: profile.overflow }));
const heroProfiles = (await read(`${root}/profile.json`)).map(({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence, idleFrames, layoutShifts, vitals }) => ({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence, idleFrames, layoutShifts, vitals }));
const summary = { baseCommit: "0ad2532814677035435367a7aa5f7ed7c62445a0", branch: "feat/s03-5-interaction-polish",
  baselineS03: { source: "docs/qa/S03/metrics.json", initialGzipBytes: baseline.previewProfiles[0].initialGzipBytes, laboratory: baseline.laboratory },
  hydrationBefore, hydrationAfter: await read(`${root}/hydration.json`),
  laboratory, previewProfiles: await profiles("profile-motion.json"), publicProfiles: await profiles("profile-motion-public.json"), heroProfiles,
  limitations: ["One local laboratory sample per condition, not field p75 or physical GPU/device certification",
    "Save-Data profile isolates initial external Next JS gzip with motion enabled; excludes HTML/Flight/CDN differences",
    "S03.5 input profile adds two theme switches and mobile menu/Escape; INP is not an identical S03 interaction sequence",
    "Separate Hero profile starts reduced then enables real Three; observed rAF cadence is not physical FPS",
    "Raw before-hydration baseline used no network/CPU throttling and reduced motion; after includes 120ms network and 4x CPU",
    "Native CSS transitions paused only for midpoint PNGs; videos use unmodified real time",
    "Commercial content remains pending and filtered from public builds"] };
await writeFile("docs/qa/S03.5/metrics.json", JSON.stringify(summary, null, 2) + "\n");
console.log({ laboratory, initialGzipBytes: summary.previewProfiles.map(profile => profile.initialGzipBytes) });
