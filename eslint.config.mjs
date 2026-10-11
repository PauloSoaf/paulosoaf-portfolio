import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next registers the jsx-a11y plugin but only enables a handful of
    // its rules; RNF-002 asks for the full recommended set.
    name: "a11y/recommended",
    files: ["**/*.{jsx,tsx}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "docs/report/**",
    // Read-only spec package (vanilla JS POCs are reference material, not app code).
    "paulo_soaf_obsidian_orbit_specs_pocs_v01/**",
  ]),
]);

export default eslintConfig;
