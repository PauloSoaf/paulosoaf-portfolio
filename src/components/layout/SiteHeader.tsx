import { PageLink as Link } from "@/components/ui/PageLink.client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch.client";
import { ThemeToggle } from "@/components/ui/ThemeToggle.client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath, sectionHref, sectionIds } from "@/i18n/paths";

import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu.client";
import { SectionNavigation } from "./SectionNavigation.client";

interface SiteHeaderProps {
  locale: Locale;
  dict: Dictionary;
}

/**
 * Sticky header (screen-states.md "/ : header"): brand, section nav, language + theme controls,
 * contact CTA. Wide screens show everything inline; below 1024px a disclosure menu holds the same
 * links. Without JavaScript the menu button is replaced by a link to the footer navigation.
 */
export function SiteHeader({ locale, dict }: SiteHeaderProps) {
  const navItems = sectionIds.map((id) => ({ id, href: sectionHref(locale, id), label: dict.nav[id] }));
  const contactHref = sectionHref(locale, "contact");

  return (
    <header id="top" className="sticky top-0 z-40 border-b border-line bg-(--oo-header-bg)">
      <SectionNavigation />
      <div className="container-page flex h-(--oo-header-height) items-center justify-between gap-5">
        <Logo href={localePath(locale)} label={dict.a11y.home} />

        <nav aria-label={dict.a11y.primaryNav} className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="ui-nav inline-flex min-h-11 items-center text-xs font-medium tracking-[0.07em] text-fg-muted uppercase transition-colors duration-(--oo-motion-fast) hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitch current={locale} label={dict.a11y.language} />
          <ThemeToggle labels={dict.theme} />
          <ButtonLink variant="outline" href={contactHref} className="ml-2">
            {dict.nav.headerCta}
            <Icon name="arrow-up-right" size={14} />
          </ButtonLink>
        </div>

        <a
          href="#site-footer-nav"
          className="nojs-only inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 text-xs font-semibold tracking-[0.08em] uppercase lg:hidden"
        >
          {dict.nav.menu}
        </a>

        <MobileMenu label={dict.nav.menu} className="lg:hidden">
          <nav aria-label={dict.a11y.primaryNav}>
            <ul className="flex flex-col">
              {navItems.map((item) => (
                <li key={item.id} className="border-b border-line">
                  <Link
                    href={item.href}
                    className="ui-cta flex min-h-13 items-center justify-between font-display text-xl font-semibold tracking-[-0.03em]"
                  >
                    {item.label}
                    <Icon name="arrow-down-right" size={16} className="text-fg-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center justify-between gap-4">
            <LanguageSwitch current={locale} label={dict.a11y.language} className="-ml-2" />
            <ThemeToggle labels={dict.theme} />
          </div>
          <ButtonLink variant="primary" href={contactHref}>
            {dict.nav.headerCta}
            <Icon name="arrow-up-right" size={16} />
          </ButtonLink>
        </MobileMenu>
      </div>
    </header>
  );
}
