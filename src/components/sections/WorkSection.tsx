import { ProjectCarousel } from "@/components/carousel/ProjectCarousel.client";
import { EditorialNotice } from "@/components/editorial/Editorial";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ExternalLink } from "@/components/ui/ExternalLink";
import type { ContactChannel } from "@/features/contact/contact-links";
import type { Project } from "@/features/projects/project-types";
import { orderProjects } from "@/features/projects/project-presentation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

import { Section } from "./Section";

interface WorkSectionProps {
  locale: Locale;
  dict: Dictionary;
  /** Already filtered by visibility (approved only in production). */
  projects: readonly Project[];
  github: ContactChannel | undefined;
  preview: boolean;
}

/**
 * Server filters stay upstream. S02 enhances server cards; without JS the entire list remains.
 */
export function WorkSection({ locale, dict, projects, github, preview }: WorkSectionProps) {
  return (
    <Section id="work" heading={dict.sections.work} band>
      {projects.length > 0 ? (
        <ProjectCarousel labels={dict.carousel} slides={orderProjects(projects).map((project, index) => ({
          slug: project.slug,
          title: project.title,
          content: (
            <ProjectCard project={project} locale={locale} dict={dict}
              position={index + 1} total={projects.length} />
          ),
        }))} />
      ) : github?.href ? (
        <div className="flex flex-col items-start gap-4 rounded-md border border-line bg-surface p-6 sm:p-8">
          <p className="font-display text-2xl font-semibold tracking-[-0.03em]">{dict.projects.fallbackTitle}</p>
          <p className="max-w-xl text-fg-muted">{dict.projects.fallbackText}</p>
          <ExternalLink
            href={github.href}
            newTabLabel={dict.a11y.newTab}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-sm font-semibold hover:border-accent"
          >
            {dict.projects.fallbackCta}
          </ExternalLink>
        </div>
      ) : preview ? (
        <EditorialNotice>{dict.editorial.sectionPending}</EditorialNotice>
      ) : null}
    </Section>
  );
}
