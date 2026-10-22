import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/workstation", timeout: 60_000, fullyParallel: false, workers: 1,
  reporter: [["list"], ["html", { outputFolder: "docs/report/Workstation/playwright", open: "never" }],
    ["json", { outputFile: process.env.QA_WORKSTATION_TEST_REPORT ?? "docs/report/Workstation/P02.2/workstation-e2e.json" }]],
  outputDir: "docs/report/Workstation/test-results",
  use: { baseURL: process.env.QA_ORIGIN ?? "http://127.0.0.1:3300", viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference", trace: "retain-on-failure", screenshot: "only-on-failure",
    launchOptions: { args: ["--enable-unsafe-swiftshader"] } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: process.env.QA_MANAGE_SERVER === "1" ? {
    command: "npm run start -- --hostname 127.0.0.1 --port 3300",
    url: "http://127.0.0.1:3300/pt", reuseExistingServer: false, timeout: 60_000,
    env: { PORTFOLIO_CONTENT_PREVIEW: "1", EXPERIMENTAL_WORKSTATION: "1" },
  } : undefined,
});
