import { StatusBadge } from "@/components/editorial/Editorial";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { publicRepository } from "@/features/projects/project-presentation";
import type { Project } from "@/features/projects/project-types";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/get-dictionary";

import { ProjectMedia } from "./ProjectMedia.client";

interface ProjectCardProps {
  project: Project;
  locale: Locale;
  dict: Dictionary;
  position: number;
  total: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Semantic project card (S00 static grid; S02 reuses it as the carousel slide and no-JS fallback).
 * Shows only verified links: "Código" when a public repository was checked, never an unverified demo.
 */
export function ProjectCard({ project, locale, dict, position, total }: ProjectCardProps) {
  const titleId = `project-${project.slug}-title`;
  const categories = project.categories.map((category) => dict.projects.categories[category]).join(" / ");
  const repository = publicRepository(project);

  return (
    <article
      aria-labelledby={titleId}
      className="project-card flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface shadow-card"
    >
      <ProjectMedia image={project.image} title={project.title} slug={project.slug} art={project.art} locale={locale} conceptLabel={dict.projects.conceptArt} />

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-kicker text-fg-subtle">{dict.projects.kinds[project.kind]} · {categories}</p>
          <span aria-hidden="true" className="font-mono text-xs text-fg-subtle">
            {pad(position)} / {pad(total)}
          </span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 id={titleId} className="text-[1.375rem] leading-tight font-bold tracking-[-0.035em]">
            {project.title}
          </h3>
          <StatusBadge status={project.status} labels={dict.editorial.status} />
        </div>

        <p className="text-sm leading-relaxed text-fg-muted">{project.summary[locale]}</p>
        <p className="font-mono text-xs leading-relaxed text-fg-subtle">{project.stackVerification === "confirmed" ? project.tech.join(" • ") : dict.projects.stackPending}</p>
        {project.teamCredits?.length ? (
          <p className="text-xs text-fg-subtle">
            {format(dict.projects.teamCredits, { names: project.teamCredits.join(", ") })}
          </p>
        ) : null}

        {repository || project.demo ? (
          <div className="mt-auto flex flex-wrap gap-3 pt-3">
            {repository && (
              <ExternalLink
                href={repository.href}
                newTabLabel={dict.a11y.newTab}
                label={format(dict.projects.sourceCodeLabel, { title: project.title })}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong bg-accent-wash px-3.5 text-xs font-semibold transition-colors duration-(--oo-motion-fast) hover:border-accent"
              >
                {dict.projects.sourceCode}
              </ExternalLink>
            )}
            {project.demo && <ExternalLink href={project.demo.href} newTabLabel={dict.a11y.newTab}
              label={format(dict.projects.demoLabel, { title: project.title })}
              className="carousel-button text-sm">{dict.projects.demo}</ExternalLink>}
          </div>
        ) : null}
      </div>
    </article>
  );
}
