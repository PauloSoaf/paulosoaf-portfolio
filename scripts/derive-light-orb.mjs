// Derives the Light-theme hero fallback from the original Dark artwork (ADDENDUM-001 §5.1).
// Only colours change — geometry, framing and composition are byte-for-byte the same, so both
// themes keep the identical procedural orb. Run with `npm run art:light` after editing the map.
import { readFileSync, writeFileSync } from "node:fs";

const source = new URL("../public/art/hero/orb-dark.svg", import.meta.url);
const target = new URL("../public/art/hero/orb-light.svg", import.meta.url);

/** Dark → Light. Graphite/blue-grey planet, contained rim, neutral halo: no green wash. */
const palette = {
  // Planet body gradient
  "#267D74": "#57767C",
  "#193E4C": "#36515B",
  "#0B1F2F": "#21323C",
  "#060C16": "#141D25",
  // Rim light on the sphere
  "#A8FFDD": "#E8F3F0",
  "#73DFC7": "#BFD8D3",
  "#091722": "#21323C",
  // Halo and blurred glow behind the planet: neutral, not saturated
  "#54CBA9": "#8A9DAA",
  "#63E6C3": "#7F95A2",
  // Planet outline: the light theme's accent, kept thin
  "#6AE3C2": "#176B63",
  // Topography and continents drawn on the (still dark) planet surface
  "#79D7C5": "#A3BDBA",
  "#56BBAA": "#8FB3AD",
  "#99EED3": "#D3E6E1",
  "#83C9B7": "#A9C6C0",
  "#ACFCE0": "#DCEBE7",
  // Orbits, stars, moons and labels sit on the light page background: darker for legibility
  "#3B9D91": "#4A6A70",
  "#82EACA": "#5D7C82",
  "#42CDAE": "#4A6A70",
  "#92DCCB": "#6F818C",
  "#9AFFF0": "#176B63",
  "#83B7B4": "#53616B",
};

let svg = readFileSync(source, "utf8");
for (const [dark, light] of Object.entries(palette)) {
  svg = svg.replaceAll(new RegExp(dark, "gi"), light);
}
svg = svg.replace("com anéis orbitais verdes", "com anéis orbitais");

const leftovers = [...new Set(svg.match(/#[0-9a-f]{6}\b/gi) ?? [])].filter(
  (hex) => !Object.values(palette).some((value) => value.toLowerCase() === hex.toLowerCase()),
);
if (leftovers.length > 0) {
  throw new Error(`Unmapped colours in the dark artwork: ${leftovers.join(", ")}`);
}

writeFileSync(target, svg);
console.log(`Wrote ${target.pathname} (${svg.length} bytes, ${Object.keys(palette).length} colours mapped).`);
