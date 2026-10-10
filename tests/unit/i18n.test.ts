import { describe, expect, it } from "vitest";
import { dictionaries } from "@/i18n/get-dictionary";
import { locales } from "@/i18n/config";
import { parseAcceptLanguage, resolvePreferredLocale } from "@/i18n/negotiate";
import { switchLocalePath } from "@/i18n/paths";
import { localeAlternates } from "@/lib/metadata";

function leaves(value: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "string" ? [[path, entry]] : Object.entries(leaves(entry, path));
  }));
}

describe("language contracts", () => {
  it.each(locales)("%s has the complete dictionary with no empty translations", (locale) => {
    const entries = leaves(dictionaries[locale]);
    expect(Object.keys(entries)).toEqual(Object.keys(leaves(dictionaries.pt)));
    for (const value of Object.values(entries)) expect(value.trim()).not.toBe("");
  });
  it("uses saved language before browser preference", () => {
    expect(resolvePreferredLocale({ cookieLocale: "es", acceptLanguage: "en-US" })).toBe("es");
  });
  it("ignores invalid cookies and matches regional browser languages by quality", () => {
    expect(resolvePreferredLocale({ cookieLocale: "xx", acceptLanguage: "de,pt-BR;q=0.5,en-US;q=0.9" })).toBe("en");
    expect(resolvePreferredLocale({ acceptLanguage: "es-MX,en;q=0.2" })).toBe("es");
  });
  it("ignores unsupported, disabled and malformed preferences", () => {
    expect(parseAcceptLanguage("en;q=0,es;q=no,*;q=1,pt;q=0.5")).toEqual(["pt"]);
    expect(resolvePreferredLocale({ acceptLanguage: "de,fr" })).toBe("pt");
  });
  it("keeps the same project slug and anchors when switching languages", () => {
    expect(switchLocalePath("/pt/projects/dr-manaus", "es")).toBe("/es/projects/dr-manaus");
    expect(switchLocalePath("/en/projects/dr-manaus#work", "pt")).toBe("/pt/projects/dr-manaus#work");
    expect(switchLocalePath("/", "en")).toBe("/en");
  });
  it("provides reciprocal language metadata", () => {
    expect(localeAlternates("es")).toEqual({ canonical: "/es", languages: {
      "pt-BR": "/pt", en: "/en", es: "/es", "x-default": "/",
    } });
  });
});
