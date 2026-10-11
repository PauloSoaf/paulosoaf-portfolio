import { writePreferenceCookie } from "@/lib/preference-cookie";

import { parseTheme, THEME_COOKIE, themeColor, type Theme } from "./theme";

/**
 * The `<html data-theme>` attribute is the single source of truth on the client. Toggling only
 * swaps CSS tokens, so no React tree is remounted (carousel/scroll state survive, RNF-019).
 */
const listeners = new Set<() => void>();
let transitionTimer: ReturnType<typeof setTimeout> | undefined;

function endThemeTransition(): void {
  document.documentElement.removeAttribute("data-theme-switching");
  // A parent colour completing can restart descendant CSS colour transitions in Chromium.
  // Flush the resting styles first, then finish that tail within the 400ms theme deadline.
  // Keep transforms, opacity, and WAAPI scroll/carousel animations running independently.
  if (typeof CSSTransition === "undefined") return;
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition && animation.playState === "running" && /color$/.test(animation.transitionProperty)) {
      animation.finish();
    }
  }
}

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
  clearTimeout(transitionTimer);
  root.removeAttribute("data-theme-switching");
  if (getDocumentTheme() === theme) return;
  // Only a user action enables transitions. The pre-paint bootstrap stays synchronous.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.setAttribute("data-theme-switching", "");
    // Establish the current surface colour before changing the tokens.
    void getComputedStyle(document.body).backgroundColor;
    transitionTimer = setTimeout(endThemeTransition, 400);
  }
  root.setAttribute("data-theme", theme);
  writePreferenceCookie(THEME_COOKIE, theme);
  syncThemeColorMeta(theme);
  listeners.forEach((listener) => listener());
}
