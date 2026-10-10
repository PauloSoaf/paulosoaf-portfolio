import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import reference from "../../paulo_soaf_obsidian_orbit_specs_pocs_v01/assets/design-tokens.json";

const css = readFileSync("src/styles/tokens.css", "utf8");
function palette(theme: "dark" | "light") {
  const block = css.split(`[data-theme="${theme}"] {`)[1]!.split("}")[0]!;
  return Object.fromEntries([...block.matchAll(/--oo-([a-z-]+):\s*(#[\da-fA-F]{6})/g)].map((match) => [match[1], match[2]!]));
}
function luminance(hex: string): number {
  const values = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

describe("Obsidian Orbit colour contracts", () => {
  it("preserves the original dark palette", () => {
    const dark = palette("dark");
    for (const [token, value] of Object.entries(reference.colors)) {
      expect(dark[token === "error" ? "status-error" : token]).toBe(value);
    }
  });
  it.each(["dark", "light"] as const)("%s text and button colours meet AA contrast", (theme) => {
    const colors = palette(theme);
    for (const foreground of ["fg-primary", "fg-secondary", "fg-tertiary"]) {
      for (const background of ["bg-base", "bg-surface", "bg-elevated"]) {
        expect(contrast(colors[foreground]!, colors[background]!)).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contrast(colors["on-accent"]!, colors["accent-primary"]!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors["border-strong"]!, colors["bg-base"]!)).toBeGreaterThanOrEqual(3);
  });
});
