import type { Metadata } from "next";

import { Logo } from "@/components/layout/Logo";
import { htmlLang, localeNames, locales } from "@/i18n/config";
import { dictionaries } from "@/i18n/get-dictionary";
import { localePath, sectionHref } from "@/i18n/paths";
import { THEME_BOOTSTRAP_SCRIPT } from "@/theme/theme-script";

import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: dictionaries.pt.meta.notFoundTitle,
};

/**
 * The single 404 page (testing.md scenario 6) for every unmatched URL — /xx, /pt/unknown, future
 * invalid case slugs. Served at routing level with a real 404 status and complete HTML, so it works
 * without JavaScript. The locale of the request is unknown here, so each language gets its own
 * block (marked with `lang`) with links back to that locale's Work section and home page.
 */
export default function GlobalNotFound() {
  const pt = dictionaries.pt.notFound;

  return (
    <html lang={htmlLang.pt} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <header className="border-b border-line">
          <div className="container-page flex h-(--oo-header-height) items-center">
            <Logo href="/" label={dictionaries.pt.a11y.home} />
          </div>
        </header>
        <main className="container-page py-20 lg:py-28">
          <p className="text-kicker text-accent">{pt.kicker}</p>
          <h1 className="mt-6 text-[clamp(2.75rem,8vw,6rem)] leading-none font-bold tracking-[-0.05em]">
            {pt.titleLead} <em className="heading-em">{pt.titleEmphasis}</em>
          </h1>

          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {locales.map((locale) => {
              const { notFound } = dictionaries[locale];
              return (
                <li
                  key={locale}
                  lang={htmlLang[locale]}
                  className="flex flex-col gap-4 rounded-md border border-line bg-surface p-6"
                >
                  <p className="text-kicker text-fg-subtle">{localeNames[locale]}</p>
                  <p className="leading-[1.7] text-fg-muted">{notFound.description}</p>
                  <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1">
                    <a
                      href={sectionHref(locale, "work")}
                      hrefLang={htmlLang[locale]}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-fg underline underline-offset-4 hover:text-accent"
                    >
                      {notFound.toWork}
                    </a>
                    <a
                      href={localePath(locale)}
                      hrefLang={htmlLang[locale]}
                      className="inline-flex min-h-11 items-center text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                    >
                      {notFound.toHome}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </main>
      </body>
    </html>
  );
}
