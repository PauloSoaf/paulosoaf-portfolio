import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";

/*
 * Self-hosted at build time by next/font (no runtime request to Google; all three are OFL).
 * Fallback metrics are adjusted automatically to avoid layout shift. Only the display and body
 * faces are preloaded (critical for the hero); the mono face is used for small labels.
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
});

export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
