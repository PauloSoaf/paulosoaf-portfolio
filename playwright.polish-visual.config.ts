import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig({
  ...config, testDir: "./tests/visual", testMatch: "interaction-polish.spec.ts", fullyParallel: false, workers: 1,
  use: { ...config.use, reducedMotion: "no-preference", launchOptions: { args: ["--enable-unsafe-swiftshader"] } },
});
