import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";

/*
 * Self-hosted at build time by next/font (no runtime request to Google; all three are OFL).
 * Display/body use Next's adjusted fallbacks and preload. Mono stays deferred, with a true
 * monospace fallback: Next's adjusted Arial widened labels and changed their line count in QA.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Courier New", "monospace"],
});

export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
