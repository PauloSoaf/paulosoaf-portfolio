import { HeroEditorial } from "@/components/hero/HeroEditorial";
import { MotionRuntime } from "@/components/motion/MotionRuntime.client";
import { CreativeRuntime } from "@/features/creative/CreativeRuntime.client";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExpertiseSection } from "@/components/sections/ExpertiseSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { findChannel } from "@/features/contact/contact-links";
import { siteContent } from "@/features/content/site-content";
import { isEditorialPreview, visibleItems } from "@/features/content/visibility";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { WorkstationOrchestrator } from "@/features/workstation/orchestrator/WorkstationOrchestrator.client";

/** Shared server editorial tree. The laboratory swaps only the scene island. */
export function LandingContent({ locale, workstation = false }: { locale: Locale; workstation?: boolean }) {
  const dict = getDictionary(locale), preview = isEditorialPreview();
  const channels = visibleItems(siteContent.contactChannels, preview);
  const content = <>
    <div data-spatial-story>
      <HeroEditorial locale={locale} dict={dict} profile={siteContent.profile}
        art={workstation ? <WorkstationOrchestrator locale={locale} /> : undefined} />
      <WorkSection locale={locale} dict={dict} projects={visibleItems(siteContent.projects, preview)}
        github={findChannel(channels, "github")} preview={preview} workstation={workstation} />
    </div>
    <AboutSection locale={locale} dict={dict} chapters={visibleItems(siteContent.journeyChapters, preview)} preview={preview} />
    <ExpertiseSection locale={locale} dict={dict} groups={visibleItems(siteContent.expertiseGroups, preview)} preview={preview} />
    <ServicesSection locale={locale} dict={dict} offers={visibleItems(siteContent.serviceOffers, preview)} preview={preview} />
    <ContactSection dict={dict} channels={channels} preview={preview} />
    <MotionRuntime /><CreativeRuntime />
  </>;
  return workstation ? <div data-workstation-story>{content}</div> : content;
}
