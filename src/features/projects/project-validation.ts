import {
  checkLocalizedText,
  checkSlug,
  checkUnique,
  checkVerifiedLink,
} from "@/features/content/validation";
import type { ContentIssue } from "@/features/content/types";

import type { Project } from "./project-types";

interface ProjectValidationOptions {
  today: Date;
  /** Checks that a `public/` asset exists; injected so the rules stay pure and testable. */
  publicAssetExists?: (publicPath: string) => boolean;
  /** S04 will supply the actual case route registry before any case action can be accepted. */
  caseRouteExists?: (path: string) => boolean;
}

/** Build-time rules from data-model.md ("Política de build"). */
export function validateProjects(
  items: readonly Project[],
  { today, publicAssetExists, caseRouteExists }: ProjectValidationOptions,
): ContentIssue[] {
  const issues: ContentIssue[] = [];
  checkUnique(
    items.map((project) => project.slug),
    "projects[].slug",
    issues,
  );

  items.forEach((project, index) => {
    const path = `projects[${index}:${project.slug}]`;
    checkSlug(project.slug, `${path}.slug`, issues);
    if (project.title.trim() === "") issues.push({ path: `${path}.title`, message: "título vazio" });
    if (project.categories.length === 0) issues.push({ path: `${path}.categories`, message: "sem categoria" });
    if (project.stackVerification === "confirmed" && project.tech.length === 0) issues.push({ path: `${path}.tech`, message: "stack confirmada vazia" });
    if (project.featuredOrder !== undefined && (!Number.isInteger(project.featuredOrder) || project.featuredOrder < 0)) {
      issues.push({ path: `${path}.featuredOrder`, message: "ordem deve ser inteiro não negativo" });
    }
    if (project.repository && project.sourceVisibility !== "public") {
      issues.push({ path: `${path}.repository`, message: "código não público não pode expor repositório" });
    }
    if (project.caseStudy.availability === "available" && !caseRouteExists?.(project.caseStudy.path)) {
      issues.push({ path: `${path}.caseStudy`, message: "rota de case não registrada" });
    }
    checkLocalizedText(project.summary, `${path}.summary`, issues);

    if (project.status === "approved") {
      if (project.stackVerification !== "confirmed") issues.push({ path: `${path}.stackVerification`, message: "stack aguarda confirmação" });
      checkLocalizedText(project.challenge, `${path}.challenge`, issues);
      checkLocalizedText(project.contribution, `${path}.contribution`, issues);
    }

    if (project.image) {
      const { src, width, height, alt } = project.image;
      if (!src.startsWith("/")) issues.push({ path: `${path}.image.src`, message: "caminho deve começar com /" });
      else if (publicAssetExists && !publicAssetExists(src)) {
        issues.push({ path: `${path}.image.src`, message: `arquivo inexistente em public${src}` });
      }
      if (!(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0)) {
        issues.push({ path: `${path}.image`, message: "width/height devem ser inteiros positivos" });
      }
      checkLocalizedText(alt, `${path}.image.alt`, issues);
    }

    if (project.repository) checkVerifiedLink(project.repository, `${path}.repository`, issues, { today });
    if (project.demo) checkVerifiedLink(project.demo, `${path}.demo`, issues, { today });
  });

  return issues;
}
