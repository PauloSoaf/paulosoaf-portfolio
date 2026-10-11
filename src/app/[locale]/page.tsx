import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HeroEditorial } from "@/components/hero/HeroEditorial";
import { MotionRuntime } from "@/components/motion/MotionRuntime.client";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExpertiseSection } from "@/components/sections/ExpertiseSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { findChannel } from "@/features/contact/contact-links";
import { siteContent } from "@/features/content/site-content";
import { isEditorialPreview, visibleItems } from "@/features/content/visibility";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { landingMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? landingMetadata(locale, getDictionary(locale)) : {};
}

/** Landing page in IA order: hero, work, about, expertise, services, contact. Fully static. */
export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const preview = isEditorialPreview();
  const channels = visibleItems(siteContent.contactChannels, preview);

  return (
    <>
      <HeroEditorial locale={locale} dict={dict} profile={siteContent.profile} />
      <WorkSection
        locale={locale}
        dict={dict}
        projects={visibleItems(siteContent.projects, preview)}
        github={findChannel(channels, "github")}
        preview={preview}
      />
      <AboutSection
        locale={locale}
        dict={dict}
        chapters={visibleItems(siteContent.journeyChapters, preview)}
        preview={preview}
      />
      <ExpertiseSection
        locale={locale}
        dict={dict}
        groups={visibleItems(siteContent.expertiseGroups, preview)}
        preview={preview}
      />
      <ServicesSection
        locale={locale}
        dict={dict}
        offers={visibleItems(siteContent.serviceOffers, preview)}
        preview={preview}
      />
      <ContactSection dict={dict} channels={channels} preview={preview} />
      <MotionRuntime />
    </>
  );
}
