import { readFile, writeFile } from "node:fs/promises";

// Commit a compact, reviewable summary; raw Lighthouse traces and request lists remain ignored.
const read = async (name) => JSON.parse((await readFile(`docs/report/S01/${name}`, "utf8")).replace(/^\uFEFF/, ""));
const optional = async (name) => { try { return await read(name); } catch (error) { if (error.code === "ENOENT") return null; throw error; } };
const previous = await readFile("docs/qa/S01/metrics.json", "utf8").then(JSON.parse).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
const laboratory = [];
for (const name of ["lighthouse-S00-desktop", "lighthouse-S00-mobile", "lighthouse-mobile-early-load", "lighthouse-mobile-unreserved", "lighthouse-desktop", "lighthouse-mobile"]) {
  const report = await optional(`${name}.json`);
  if (!report) {
    if (name === "lighthouse-desktop" || name === "lighthouse-mobile") throw new Error(`Missing raw report: ${name}.json. Follow docs/qa/S01/REPORT.md.`);
    const historical = previous?.laboratory.find((entry) => entry.sample === name);
    if (historical) laboratory.push(historical);
    continue;
  }
  laboratory.push({ sample: name, date: report.fetchTime, lighthouse: report.lighthouseVersion, userAgent: report.userAgent,
    formFactor: report.configSettings.formFactor, throttlingMethod: report.configSettings.throttlingMethod,
    scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])),
    lcpMs: report.audits["largest-contentful-paint"].numericValue,
    cls: report.audits["cumulative-layout-shift"].numericValue,
    tbtMs: report.audits["total-blocking-time"].numericValue, warnings: report.runWarnings,
  });
}
const profile = await read("profile.json");
const baseline = await optional("profile-S00.json");
const diagnostic = await optional("profile-before-repeat.json");
const result = { baselineCommit: "ea3cf243094ba524335c6e367467c8bbf6107574", branch: "feat/s01-hero-procedural",
  laboratory,
  baselineInitialGzipBytes: baseline?.[0].initialGzipBytes ?? previous?.baselineInitialGzipBytes ?? null,
  diagnosticVitals: diagnostic?.profiles.map(({ width, vitals }) => ({ width, vitals })) ?? previous?.diagnosticVitals ?? [],
  profiles: profile.map(({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence, idleFrames, vitals }) => ({ width, initialGzipBytes, lazyGzipBytes, measurements, cadence, idleFrames, vitals })),
  limitations: ["Single local Lighthouse run per configuration; not field p75", "SwiftShader software rendering; GPU timer extension unavailable", "No physical desktop/mobile FPS certification", "Raw logs remain in ignored docs/report/S01"],
};
await writeFile("docs/qa/S01/metrics.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(laboratory.map(({ sample, scores, lcpMs, cls, tbtMs }) => ({ sample, scores, lcpMs, cls, tbtMs })));
