import { readFile, writeFile } from "node:fs/promises";
const read = async path => JSON.parse(await readFile(path, "utf8"));
const root = "docs/report/CreativeFollowup", output = "docs/qa/CreativeFollowup", laboratory = [];
for (const sample of ["preview-desktop", "preview-mobile", "public-desktop", "public-mobile"]) {
  const report = await read(`${root}/lighthouse-${sample}.json`);
  laboratory.push({ sample, date: report.fetchTime, lighthouse: report.lighthouseVersion, throttling: report.configSettings.throttlingMethod,
    scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: report.audits["largest-contentful-paint"].numericValue, cls: report.audits["cumulative-layout-shift"].numericValue,
    tbtMs: report.audits["total-blocking-time"].numericValue, warnings: report.runWarnings });
}
const profiles = async filename => (await read(`${root}/${filename}`)).map(profile => ({ width: profile.width, publicSample: profile.publicSample,
  initialGzipBytes: profile.initialGzipBytes, vitals: profile.vitals, shifts: profile.shifts, idleRunningAnimations: profile.idleRunningAnimations, remainingAnimations: profile.remainingAnimations,
  canvasCount: profile.canvasCount, overflow: profile.overflow }));
const hero = (await read(`${root}/profile.json`)).map(({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence,
  visibleAmbientFramesIn500Ms, visibleCompanionFramesOutsideHeroIn500Ms, pausedFramesIn500Ms, layoutShifts, vitals }) =>
  ({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence, visibleAmbientFramesIn500Ms,
    visibleCompanionFramesOutsideHeroIn500Ms, pausedFramesIn500Ms, layoutShifts, vitals }));
const baseline = await read("docs/qa/CreativeRecovery/metrics.json"), counters = [];
for (const width of [1440, 390]) {
  const counter = await read(`${output}/countdown-${width}.json`);
  const zero = counter.sequence.find(entry => entry.seconds === 0);
  if (!zero || zero.project === counter.sequence[0].project) throw new Error(`Countdown did not select a project at width ${width}`);
  counters.push({ width, nativeClock: counter.nativeClock, seconds: counter.sequence.map(entry => entry.seconds),
    firstObservedSevenToZeroMs: zero.timeMs - counter.sequence[0].timeMs, projectAtZero: zero.project });
}
await writeFile(`${output}/metrics.json`, JSON.stringify({ date: "2026-10-12", baseCommit: "922fd77a29549694eaed3bc00ac437b027df7360",
  branch: "feat/creative-direction-recovery", baseline: { source: "docs/qa/CreativeRecovery/metrics.json", laboratory: baseline.laboratory,
    initialGzipBytes: baseline.heroProfiles[0].initialGzipBytes, lazyGzipBytes: baseline.heroProfiles[0].lazyGzipBytes },
  laboratory, heroProfiles: hero, previewProfiles: await profiles("profile-motion.json"), publicProfiles: await profiles("profile-motion-public.json"),
  hydration: await read(`${root}/hydration.json`), automaticLoad: await read(`${root}/automatic-load.json`), counters,
  limitations: ["Single local Lighthouse sample per condition, simulated throttling, not field p75",
    "Chromium SwiftShader is software rendering; no physical GPU or phone certification", "GPU timer availability is reported, never estimated",
    "Browser rAF cadence is not rendered GPU FPS; ambient frames are counted separately", "External JS gzip excludes HTML/Flight/CSS",
    "Hero profiling begins reduced then enables Three; normal automatic loading is measured separately",
    "The same scene remains visible outside Hero by request; compare paused frames rather than expecting it to stop while visible",
    "Videos use native recording and real time; countdown records observed DOM changes without controlling time",
    "Aesthetic acceptance and commercial/editorial approvals remain with the owner"] }, null, 2) + "\n");
console.log({ laboratory, counters, hero: hero.map(({ width, initialGzipBytes, lazyGzipBytes,
  visibleCompanionFramesOutsideHeroIn500Ms, pausedFramesIn500Ms }) => ({ width, initialGzipBytes, lazyGzipBytes,
    visibleCompanionFramesOutsideHeroIn500Ms, pausedFramesIn500Ms })) });
