import { defineConfig } from "vitest/config";

/**
 * Editorial release gate (`npm run release:check`). Deliberately separate from
 * `npm test`: it fails until the owner approves content, contacts and CV.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/release/**/*.test.ts"],
  },
});
