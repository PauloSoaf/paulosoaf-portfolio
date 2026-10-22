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
import { WorkstationDiscovery } from "@/features/workstation/WorkstationDiscovery";
import { workstationAvailable } from "@/features/workstation/config";
import { siteForProject } from "@/features/workstation/sites";
import { orderProjects } from "@/features/projects/project-presentation";
import { ProjectPlaybackProvider } from "@/features/projects/ProjectPlaybackProvider.client";

/** One public experience; editorial visibility is independent of the notebook. */
export function LandingContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale), preview = isEditorialPreview();
  const channels = visibleItems(siteContent.contactChannels, preview);
  const cv = findChannel(channels, "cv");
  const projects = visibleItems(siteContent.projects, preview);
  const access = { sites: projects.flatMap(project => { const site = siteForProject(project.slug); return site ? [site] : []; }), fixture: workstationAvailable() };
  const content = <>
    <div data-spatial-story>
      <HeroEditorial locale={locale} dict={dict} profile={siteContent.profile}
        art={<WorkstationOrchestrator locale={locale} access={access} discovery={<WorkstationDiscovery locale={locale} cvHref={cv?.status === "approved" ? cv.href ?? undefined : undefined} />} />} />
      <WorkSection locale={locale} dict={dict} projects={projects}
        github={findChannel(channels, "github")} preview={preview} workstation />
    </div>
    <AboutSection locale={locale} dict={dict} chapters={visibleItems(siteContent.journeyChapters, preview)} preview={preview} />
    <ExpertiseSection locale={locale} dict={dict} groups={visibleItems(siteContent.expertiseGroups, preview)} preview={preview} />
    <ServicesSection locale={locale} dict={dict} offers={visibleItems(siteContent.serviceOffers, preview)} preview={preview} />
    <ContactSection dict={dict} channels={channels} preview={preview} />
    <MotionRuntime /><CreativeRuntime />
  </>;
  const playbackProjects = orderProjects(projects).map(({ slug, title, kind, status, summary, image, art }) => ({ slug, title, kind, status, summary, image, art }));
  return <ProjectPlaybackProvider projects={playbackProjects} labels={{ carousel: dict.carousel, projects: dict.projects, editorial: dict.editorial }}><div data-workstation-story>{content}</div></ProjectPlaybackProvider>;
}
