import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig({
  ...config,
  testDir: "./tests/visual",
  testMatch: "foundation.spec.ts",
  fullyParallel: false,
  workers: 1,
});
