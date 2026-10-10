import { findChannel, type ContactKind } from "@/features/contact/contact-links";

import type { SiteContent } from "./site-content";
import type { ContentIssue } from "./types";
import { isPublished } from "./visibility";

/** information-architecture.md: Selected Work shows 3–5 approved projects; never an empty section. */
export const MIN_APPROVED_PROJECTS = 3;

const REQUIRED_CHANNELS: readonly ContactKind[] = ["email", "linkedin", "cv"];

interface ReleaseContext {
  issues: readonly ContentIssue[];
  siteUrl: string | undefined;
  preview: boolean;
}

/**
 * Editorial publication gate (content-policy.md, screen-states.md "etapa bloqueada para publicação").
 * Separate from `next build`: the build must pass, publication must wait for approvals.
 */
export function getReleaseBlockers(content: SiteContent, context: ReleaseContext): string[] {
  const blockers: string[] = context.issues.map((issue) => `Conteúdo inválido em ${issue.path}: ${issue.message}`);

  if (context.preview) {
    blockers.push("Build em modo de prévia editorial (PORTFOLIO_CONTENT_PREVIEW=1): rascunhos ficariam públicos.");
  }
  if (!context.siteUrl?.startsWith("https://")) {
    blockers.push("SITE_URL ausente ou sem https:// — canonical, hreflang e Open Graph ficariam incorretos.");
  }
  if (!isPublished(content.profile.status)) {
    blockers.push("Perfil (nome de apresentação e cargo do hero) não aprovado.");
  }
  if (!isPublished(content.interfaceCopyStatus)) {
    blockers.push("Textos de interface PT/EN/ES (hero, títulos, descrições) não revisados/aprovados.");
  }

  const approvedProjects = content.projects.filter((project) => isPublished(project.status)).length;
  if (approvedProjects < MIN_APPROVED_PROJECTS) {
    blockers.push(`Projetos aprovados: ${approvedProjects} (mínimo ${MIN_APPROVED_PROJECTS}).`);
  }
  if (!content.journeyChapters.some((chapter) => isPublished(chapter.status))) {
    blockers.push("Trajetória (About) sem nenhum item aprovado.");
  }
  if (!content.expertiseGroups.some((group) => isPublished(group.status))) {
    blockers.push("Especialidades sem nenhum grupo aprovado.");
  }
  if (!content.serviceOffers.some((offer) => isPublished(offer.status))) {
    blockers.push("Serviços sem nenhuma oferta aprovada.");
  }

  for (const kind of REQUIRED_CHANNELS) {
    const channel = findChannel(content.contactChannels, kind);
    if (!channel?.href || !isPublished(channel.status)) {
      blockers.push(`Contato "${kind}" sem valor validado e aprovado.`);
    }
  }

  return blockers;
}
