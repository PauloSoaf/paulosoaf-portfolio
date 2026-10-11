import { readFile, writeFile } from "node:fs/promises";
const read = async path => JSON.parse(await readFile(path, "utf8"));
const root = "docs/report/CreativeRecovery", laboratory = [];
for (const sample of ["preview-desktop", "preview-mobile", "public-desktop", "public-mobile"]) {
  const report = await read(`${root}/lighthouse-${sample}.json`);
  laboratory.push({ sample, date: report.fetchTime, lighthouse: report.lighthouseVersion, throttling: report.configSettings.throttlingMethod,
    scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: report.audits["largest-contentful-paint"].numericValue, cls: report.audits["cumulative-layout-shift"].numericValue,
    tbtMs: report.audits["total-blocking-time"].numericValue, warnings: report.runWarnings });
}
const profiles = async filename => (await read(`${root}/${filename}`)).map(profile => ({ width: profile.width, publicSample: profile.publicSample,
  initialGzipBytes: profile.initialGzipBytes, vitals: profile.vitals, shifts: profile.shifts, remainingAnimations: profile.remainingAnimations,
  canvasCount: profile.canvasCount, overflow: profile.overflow }));
const hero = (await read(`${root}/profile.json`)).map(({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence, visibleAmbientFramesIn500Ms, offscreenFramesIn500Ms, layoutShifts, vitals }) =>
  ({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence, visibleAmbientFramesIn500Ms, offscreenFramesIn500Ms, layoutShifts, vitals }));
const baseline = await read("docs/qa/S03.5/metrics.json");
await writeFile("docs/qa/CreativeRecovery/metrics.json", JSON.stringify({ baseCommit: "bd21d677df571286d192618b0aba79437145dee3",
  branch: "feat/creative-direction-recovery", baseline: { source: "docs/qa/S03.5/metrics.json", laboratory: baseline.laboratory,
    initialGzipBytes: baseline.previewProfiles[0].initialGzipBytes, lazyGzipBytes: baseline.heroProfiles[0].lazyGzipBytes },
  laboratory, heroProfiles: hero, previewProfiles: await profiles("profile-motion.json"), publicProfiles: await profiles("profile-motion-public.json"),
  hydration: await read(`${root}/hydration.json`), automaticLoad: await read(`${root}/automatic-load.json`),
  limitations: ["Single local Lighthouse sample per condition, simulated throttling, not field p75",
    "Chromium SwiftShader is software rendering; no physical GPU or phone certification", "GPU timer extension availability is reported, never estimated",
    "Observed browser rAF cadence is not rendered GPU FPS; ambient frames are counted separately", "External JS gzip excludes HTML/Flight/CSS",
    "The Hero profiling sequence starts reduced, then enables real Three; normal automatic loading is measured separately",
    "Original S03 was built with webpack in a detached worktree; baseline videos are experiential comparisons, not performance benchmarks",
    "Videos are native Playwright recordings at real time; mobile uses a touch-enabled viewport, touch drag and wheel navigation",
    "Aesthetic acceptance and commercial/editorial approvals remain with the owner"] }, null, 2) + "\n");
console.log({ laboratory, hero: hero.map(({ width, initialGzipBytes, lazyGzipBytes, visibleAmbientFramesIn500Ms, offscreenFramesIn500Ms }) => ({ width, initialGzipBytes, lazyGzipBytes, visibleAmbientFramesIn500Ms, offscreenFramesIn500Ms })) });
