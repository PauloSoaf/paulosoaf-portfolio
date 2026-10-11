"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { htmlLang, LOCALE_COOKIE, localeNames, locales, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/paths";
import { cx } from "@/lib/cx";
import { writePreferenceCookie } from "@/lib/preference-cookie";

interface LanguageSwitchProps {
  current: Locale;
  /** Group label, e.g. "Idioma". */
  label: string;
  className?: string;
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * PT / EN / ES as real links to the same page in each language (RF-022). Rendered on the server
 * with correct hrefs, so it works without JavaScript (AC-023). With JavaScript it also saves the
 * explicit choice for future visits to `/` and keeps the current `#section`. No flags.
 */
export function LanguageSwitch({ current, label, className }: LanguageSwitchProps) {
  const pathname = usePathname() || `/${current}`;

  function handleClick(event: MouseEvent<HTMLAnchorElement>, target: Locale, href: string) {
    writePreferenceCookie(LOCALE_COOKIE, target);
    if (!isPlainLeftClick(event)) return;
    if (target === current) {
      event.preventDefault();
      return;
    }
    // Each locale owns its root <html>. A document navigation reruns the head bootstrap
    // before paint; a client transition can replace <html> and lose its theme/JS attributes.
    event.currentTarget.href = `${href}${window.location.hash}`;
  }

  return (
    <div role="group" aria-label={label} className={cx("flex items-center", className)}>
      {locales.map((locale) => {
        const href = switchLocalePath(pathname, locale);
        const active = locale === current;
        return (
          <a
            key={locale}
            href={href}
            hrefLang={htmlLang[locale]}
            lang={htmlLang[locale]}
            aria-current={active ? "true" : undefined}
            aria-label={`${localeNames[locale]} (${locale.toUpperCase()})`}
            onClick={(event) => handleClick(event, locale, href)}
            className={cx(
              "ui-nav inline-flex min-h-11 min-w-10 items-center justify-center px-2 font-mono text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-(--oo-motion-fast)",
              active
                ? "text-fg"
                : "text-fg-subtle hover:text-fg",
            )}
          >
            {locale}
          </a>
        );
      })}
    </div>
  );
}
