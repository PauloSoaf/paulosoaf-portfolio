export const locales = ["pt", "en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

/** Cookie that stores an explicit language choice; only consulted for `/`. */
export const LOCALE_COOKIE = "ps-locale";

/** BCP 47 tags for `<html lang>`, `hreflang` and `Intl` APIs. */
export const htmlLang: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
};

/** Open Graph locale codes (`language_TERRITORY`). */
export const ogLocale: Record<Locale, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
};

/** Native language names. The switch never uses flags: language is not nationality. */
export const localeNames: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
