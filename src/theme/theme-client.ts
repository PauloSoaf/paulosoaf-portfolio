import { writePreferenceCookie } from "@/lib/preference-cookie";

import { parseTheme, THEME_COOKIE, themeColor, type Theme } from "./theme";

/**
 * The `<html data-theme>` attribute is the single source of truth on the client. Toggling only
 * swaps CSS tokens, so no React tree is remounted (carousel/scroll state survive, RNF-019).
 */
const listeners = new Set<() => void>();

export function getDocumentTheme(): Theme {
  return parseTheme(document.documentElement.getAttribute("data-theme"));
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function syncThemeColorMeta(theme: Theme): void {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor[theme]);
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  // Suppress colour transitions for the swap itself: no animated "flash" between themes.
  root.setAttribute("data-theme-switching", "");
  root.setAttribute("data-theme", theme);
  writePreferenceCookie(THEME_COOKIE, theme);
  syncThemeColorMeta(theme);
  listeners.forEach((listener) => listener());
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.removeAttribute("data-theme-switching")),
  );
}
