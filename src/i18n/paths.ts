import { isLocale, type Locale } from "./config";

export type SectionId = "work" | "about" | "expertise" | "services" | "contact";

/** Landing sections in page order (information-architecture.md). */
export const sectionIds: readonly SectionId[] = ["work", "about", "expertise", "services", "contact"];

/** Absolute in-site path for a locale, e.g. `localePath("en", "#work")` → `/en#work`. */
export function localePath(locale: Locale, suffix = ""): string {
  return `/${locale}${suffix}`;
}

export function sectionHref(locale: Locale, section: SectionId): string {
  return localePath(locale, `#${section}`);
}

/**
 * Same page in another language: `/pt/projects/x` → `/en/projects/x`.
 * Slugs stay stable across languages (ADDENDUM-001 §3.1).
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = target;
    return segments.join("/");
  }
  return pathname === "/" || pathname === "" ? `/${target}` : `/${target}${pathname}`;
}
