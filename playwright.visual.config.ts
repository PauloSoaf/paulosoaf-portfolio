import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig({
  ...config,
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1,
});
