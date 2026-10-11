import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import type { Profile } from "@/features/profile/profile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { sectionHref } from "@/i18n/paths";

import { HeroFallback } from "./HeroFallback";
import { HeroArtBoundary } from "./HeroArtBoundary.client";
import { HeroVitals } from "./HeroVitals.client";

interface HeroEditorialProps {
  locale: Locale;
  dict: Dictionary;
  profile: Profile;
}
/**
 * Hero (RF-001): name, role, summary and two CTAs (projects, contact) rendered on the server, so
 * they are visible and clickable without JavaScript or WebGL (AC-001). Layout per responsive.md:
 * desktop copy left / art right; tablet art behind the copy with an overlay; mobile copy above art.
 */
export function HeroEditorial({ locale, dict, profile }: HeroEditorialProps) {
  const { hero } = dict;

  return (
    <section data-hero aria-labelledby="hero-title" className="relative isolate overflow-clip border-b border-line">
      <HeroVitals />
      <div aria-hidden="true" data-scroll-decor className="hero-grid pointer-events-none absolute inset-0 -z-20" />

      <div className="container-page flex flex-col lg:min-h-[calc(100svh-var(--oo-header-height))]">
        <div className="hero-copy relative z-10 max-w-[47.5rem] pt-12 sm:max-w-[36rem] sm:pt-20 sm:pb-16 lg:my-auto lg:max-w-[47.5rem] lg:py-20">
          <p className="hero-identity inline-flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[1.25rem] border border-accent-edge bg-accent-wash px-3.5 py-2 font-mono text-[0.6875rem] leading-snug font-semibold tracking-[0.1em] text-fg-muted uppercase">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_11px_var(--oo-accent-primary)]" />
            <span>{profile.name}</span>
            <span aria-hidden="true">/</span>
            <span className="sr-only">, </span>
            <span>{profile.role[locale]}</span>
          </p>

          <h1
            id="hero-title"
            className="mt-7 mb-6 wrap-anywhere text-[clamp(2.8rem,11vw,4.4rem)] leading-[0.95] font-bold tracking-[-0.055em] lg:mt-8 lg:text-[clamp(3.4rem,7.4vw,7.5rem)]"
          >
            <span className="hero-title-lead">{hero.titleLead}</span>{" "}<em className="hero-title-em heading-em block">{hero.titleEmphasis}</em>
          </h1>

          <p className="hero-summary max-w-[30rem] text-base leading-[1.7] text-fg-muted sm:text-[1.0625rem]">{hero.summary}</p>

          <div className="hero-actions mt-8 flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5">
            <ButtonLink variant="primary" href={sectionHref(locale, "work")}>
              {hero.ctaProjects}
              <Icon name="arrow-up-right" size={16} />
            </ButtonLink>
            <ButtonLink variant="text" href={sectionHref(locale, "contact")} className="-ml-4 sm:ml-0">
              {hero.ctaContact}
              <Icon name="arrow-down-right" size={16} />
            </ButtonLink>
          </div>
        </div>

        <HeroArtBoundary labels={dict.heroScene} className="relative -mx-5 mt-6 w-[calc(100%+2.5rem)] max-w-[37.5rem] self-center sm:absolute sm:-right-[12%] sm:bottom-[3%] sm:mx-0 sm:mt-0 sm:w-[72vw] sm:max-w-none sm:self-auto lg:top-1/2 lg:right-[-1.5%] lg:bottom-auto lg:w-[min(58vw,800px)] lg:-translate-y-1/2">
          <HeroFallback />
        </HeroArtBoundary>

        {/* Tablet: art sits behind the copy; this wash keeps the text contrast intact. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] hidden bg-linear-to-r from-base via-base/85 to-transparent sm:block lg:hidden"
        />

        <div
          aria-hidden="true"
          className="text-kicker pointer-events-none relative z-10 flex items-center justify-between gap-6 pt-4 pb-8 text-fg-subtle lg:pb-9"
        >
          <span>{hero.signature}</span>
          <span className="hidden items-center gap-3 sm:inline-flex">
            {hero.scrollHint}
            <span className="h-px w-14 bg-line-strong" />
            <Icon name="arrow-down" size={14} />
          </span>
        </div>
      </div>
    </section>
  );
}
