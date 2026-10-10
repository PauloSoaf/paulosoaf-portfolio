import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    maxWorkers: 2,
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/unit/setup.ts"],
    css: false,
    restoreMocks: true,
    unstubEnvs: true,
  },
});
