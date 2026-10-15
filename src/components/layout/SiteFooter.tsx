import { PageLink as Link } from "@/components/ui/PageLink.client";

import { ExternalLink } from "@/components/ui/ExternalLink";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch.client";
import type { ContactChannel } from "@/features/contact/contact-links";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath, sectionHref, sectionIds } from "@/i18n/paths";

import { Logo } from "./Logo";

interface SiteFooterProps {
  locale: Locale;
  dict: Dictionary;
  /** Already filtered for visibility (approved in production). */
  github: ContactChannel | undefined;
}

/**
 * Footer navigation doubles as the no-JavaScript menu target (`#site-footer-nav`), so section and
 * language links stay reachable on compact screens without scripts (RNF-003, AC-023).
 */
export function SiteFooter({ locale, dict, github }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-sunken">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:py-14">
        <div>
          <Logo href={localePath(locale)} label={dict.a11y.home} />
          <p className="mt-3 max-w-xs text-sm text-fg-subtle">{dict.footer.tagline}</p>
        </div>

        <nav id="site-footer-nav" aria-label={dict.a11y.footerNav}>
          <ul className="grid gap-1">
            {sectionIds.map((id) => (
              <li key={id}>
                <Link
                  href={sectionHref(locale, id)}
                  className="inline-flex min-h-11 items-center text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                >
                  {dict.nav[id]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col items-start gap-4">
          <p className="text-meta text-fg-subtle">{dict.footer.languages}</p>
          <LanguageSwitch current={locale} label={dict.footer.languages} className="-ml-2" />
          {github?.href ? (
            <ExternalLink
              href={github.href}
              newTabLabel={dict.a11y.newTab}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-semibold tracking-[0.06em] uppercase hover:border-accent"
            >
              {dict.contact.channels.github}
            </ExternalLink>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>{format(dict.footer.copyright, { year })}</p>
          <a href="#top" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-fg hover:underline">
            {dict.footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
}
