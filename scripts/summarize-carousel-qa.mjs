import { readFile, writeFile } from "node:fs/promises";

const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const optional = async (path) => {
  try { return await read(path); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
};
const previous = await optional("docs/qa/S02/metrics.json");
const baseline = await read("docs/qa/S01/metrics.json");
const profiles = async (filename) => (await read(`docs/report/S02/${filename}`)).map((profile) => ({
  width: profile.width, mode: profile.mode, initialGzipBytes: profile.initialGzipBytes,
  transitions: profile.transitions, vitals: profile.vitals, canvasCount: profile.canvasCount,
  // Preserve the largest diagnostic and its phase, even when Lighthouse reports zero CLS.
  layoutShifts: profile.layoutShifts.map((entry) => ({ value: entry.value, startTime: entry.startTime,
    phase: entry.phase, nodes: entry.sources?.map((source) => source.node ?? null) ?? entry.nodes })),
}));
const historicalProfiles = async (filename, saved) => {
  if (!await optional(`docs/report/S02/${filename}`)) return saved ?? [];
  return profiles(filename);
};
const laboratory = [];
const names = ["preview-desktop", "preview-mobile", "public-desktop", "public-mobile"];
for (const name of [...names, ...names.map((name) => `${name}-before-font-fix`)]) {
  const report = await optional(`docs/report/S02/lighthouse-${name}.json`);
  if (!report) {
    if (!name.endsWith("-before-font-fix")) throw new Error(`Missing raw Lighthouse sample: ${name}`);
    const saved = previous?.laboratory.find((sample) => sample.sample === name);
    if (saved) laboratory.push(saved);
    continue;
  }
  laboratory.push({ sample: name, date: report.fetchTime, lighthouse: report.lighthouseVersion,
    formFactor: report.configSettings.formFactor, throttlingMethod: report.configSettings.throttlingMethod,
    userAgent: report.userAgent,
    scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: report.audits["largest-contentful-paint"].numericValue, cls: report.audits["cumulative-layout-shift"].numericValue,
    tbtMs: report.audits["total-blocking-time"].numericValue, warnings: report.runWarnings,
  });
}
const summary = {
  baseCommit: "758557ecc342875ce098f6912cc26d14bf3fc284", branch: "feat/s02-cinematic-projects",
  baselineS01: { source: "docs/qa/S01/metrics.json", initialGzipBytes: baseline.profiles[0].initialGzipBytes,
    laboratory: baseline.laboratory.filter((sample) => ["lighthouse-desktop", "lighthouse-mobile"].includes(sample.sample)) },
  laboratory, previewProfiles: await profiles("profile-carousel.json"), publicProfiles: await profiles("profile-carousel-public.json"),
  firstPreviewProfile: await historicalProfiles("profile-carousel-first.json", previous?.firstPreviewProfile),
  profilesBeforeFontFix: {
    preview: await historicalProfiles("profile-carousel-before-font-fix.json", previous?.profilesBeforeFontFix?.preview),
    public: await historicalProfiles("profile-carousel-public-before-font-fix.json", previous?.profilesBeforeFontFix?.public),
  },
  limitations: ["Local runs, not field p75", "Public catalog contains no approved projects; transitions measured in editorial preview",
    "Desktop viewport and 390px mouse emulation; real touch covered separately in E2E", "rAF cadence and changing CSS transforms do not certify physical-device FPS",
    "Pre-fix font swap contributed mobile CLS; its samples are retained beside final results",
    "Raw logs and original POC capture are ignored under docs/report/S02"],
};
await writeFile("docs/qa/S02/metrics.json", `${JSON.stringify(summary, null, 2)}\n`);
console.log(laboratory.map(({ sample, scores, lcpMs, cls, tbtMs }) => ({ sample, scores, lcpMs, cls, tbtMs })));
