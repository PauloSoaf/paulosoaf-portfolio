import { readFile, writeFile } from "node:fs/promises";
const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const baseline = await read("docs/qa/S02/metrics.json");
const profiles = async (filename) => (await read(`docs/report/S03/${filename}`)).map((profile) => ({
  width: profile.width, publicSample: profile.publicSample, saveData: profile.saveData,
  initialGzipBytes: profile.initialGzipBytes, vitals: profile.vitals, shifts: profile.shifts,
  revealCount: profile.reveals.length,
  durationsMs: [...new Set(profile.reveals.map((reveal) => reveal.timing.duration))],
  maxRunsPerTarget: Math.max(0, ...Object.values(profile.states).map((state) => Number(state.runs))),
  remainingAnimations: profile.remainingAnimations, canvasCount: profile.canvasCount, overflow: profile.overflow,
}));
const laboratory = [];
for (const sample of ["preview-desktop", "preview-mobile", "public-desktop", "public-mobile"]) {
  const report = await read(`docs/report/S03/lighthouse-${sample}.json`);
  laboratory.push({ sample, date: report.fetchTime, lighthouse: report.lighthouseVersion,
    formFactor: report.configSettings.formFactor, throttlingMethod: report.configSettings.throttlingMethod,
    scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: report.audits["largest-contentful-paint"].numericValue,
    cls: report.audits["cumulative-layout-shift"].numericValue,
    tbtMs: report.audits["total-blocking-time"].numericValue, warnings: report.runWarnings,
  });
}
const summary = {
  baseCommit: "66c8ff0fae0b275b1b2d86bfcd70b29a8da80852", branch: "feat/s03-interactive-timeline-motion",
  baselineS02: { source: "docs/qa/S02/metrics.json", initialGzipBytes: baseline.previewProfiles[0].initialGzipBytes,
    laboratory: baseline.laboratory.filter((sample) => !sample.sample.includes("before-font-fix")) },
  laboratory, previewProfiles: await profiles("profile-motion.json"), publicProfiles: await profiles("profile-motion-public.json"),
  limitations: ["Local laboratory samples, not field p75 or physical-device certification",
    "Public build omits all unapproved chapters/projects; content interactions measured in preview",
    "Profile enables Save-Data to isolate non-WebGL initial JS while leaving motion enabled; S02 used reduced motion for that budget",
    "Unique external Next scripts gzip only, excludes HTML/Flight inline and CDN transfer differences",
    "Videos use unmodified live animations; intermediate PNGs pause native WAAPI at controlled times",
    "Prior sprint screenshots remain intact; new regression capture outputs and raw profiles are ignored"],
};
await writeFile("docs/qa/S03/metrics.json", `${JSON.stringify(summary, null, 2)}\n`);
console.log({ laboratory, initialGzipBytes: summary.previewProfiles.map((p) => p.initialGzipBytes) });
