import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { contactChannels, findChannel } from "@/features/contact/contact-links";
import { isEditorialPreview, visibleItems } from "@/features/content/visibility";
import { htmlLang, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSiteUrl } from "@/lib/site-config";
import { THEME_BOOTSTRAP_SCRIPT } from "@/theme/theme-script";
import { themeColor } from "@/theme/theme";

import { fontVariables } from "../fonts";
import "../globals.css";

// /pt, /en and /es are prerendered; every other URL is unmatched at routing level and served by
// app/global-not-found.tsx with a real 404. (A [...rest] catch-all + [locale]/not-found was tried:
// on-demand notFound() there produced an empty error shell without JavaScript — see ADR-005.)
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: themeColor.dark,
  colorScheme: "dark light",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    metadataBase: getSiteUrl(),
    title: dict.meta.title,
    description: dict.meta.description,
    authors: [{ name: "Paulo Soaf" }],
    // Draft content must never be indexed, even if a preview build is exposed by mistake.
    robots: isEditorialPreview() ? { index: false, follow: false } : undefined,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const preview = isEditorialPreview();
  const github = findChannel(visibleItems(contactChannels, preview), "github");

  return (
    // `data-js`/`data-theme` are set by the bootstrap script before hydration.
    <html lang={htmlLang[locale]} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-sm bg-accent px-4 py-3 text-sm font-bold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {dict.a11y.skipToContent}
        </a>
        <SiteHeader locale={locale} dict={dict} />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} github={github} />
      </body>
    </html>
  );
}
