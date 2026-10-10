import type { Metadata } from "next";

import { defaultLocale, htmlLang, locales, ogLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Canonical + reciprocal hreflang for one page in every locale (ADDENDUM-001 §3.4). `x-default`
 * points to `/` (which negotiates the language) for the landing page, else to the default locale.
 */
export function localeAlternates(locale: Locale, path = ""): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const target of locales) languages[htmlLang[target]] = `/${target}${path}`;
  languages["x-default"] = path === "" ? "/" : `/${defaultLocale}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}

export function landingMetadata(locale: Locale, dict: Dictionary): Metadata {
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: localeAlternates(locale),
    openGraph: {
      type: "website",
      siteName: "Paulo Soaf",
      title: dict.meta.title,
      description: dict.meta.description,
      url: `/${locale}`,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((target) => target !== locale).map((target) => ogLocale[target]),
    },
  };
}
