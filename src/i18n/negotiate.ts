import { defaultLocale, isLocale, type Locale } from "./config";

/** Language tags from an `Accept-Language` header, ordered by quality (`q`), then position. */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];

  return header
    .split(",")
    .map((part, index) => {
      const [rawTag = "", ...params] = part.trim().split(";");
      const quality = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      const q = quality === undefined ? 1 : Number(quality.slice(2));
      return { tag: rawTag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter(({ tag, q }) => tag !== "" && tag !== "*" && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map(({ tag }) => tag);
}

/**
 * Locale for an entry at `/` (ADDENDUM-001 §3.1): explicit saved choice first,
 * then the browser's `Accept-Language`, then the default (`pt`).
 * Localized URLs never go through this — the URL is the source of truth.
 */
export function resolvePreferredLocale({
  cookieLocale,
  acceptLanguage,
}: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(cookieLocale)) return cookieLocale;

  for (const tag of parseAcceptLanguage(acceptLanguage)) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }

  return defaultLocale;
}
