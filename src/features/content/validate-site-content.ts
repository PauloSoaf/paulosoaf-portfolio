import { validateProjects } from "@/features/projects/project-validation";

import type { SiteContent } from "./site-content";
import type { ContentIssue } from "./types";
import { checkIsoDate, checkLocalizedText, checkUnique, checkVerifiedLink } from "./validation";

interface ValidationOptions {
  today: Date;
  publicAssetExists?: (publicPath: string) => boolean;
}

/** Structural rules for every collection. Runs in `npm test`, so a broken entry fails CI. */
export function validateSiteContent(content: SiteContent, options: ValidationOptions): ContentIssue[] {
  const { today, publicAssetExists } = options;
  const issues = validateProjects(content.projects, options);

  if (content.profile.name.trim() === "") issues.push({ path: "profile.name", message: "nome vazio" });
  checkLocalizedText(content.profile.role, "profile.role", issues);

  checkUnique(
    content.journeyChapters.map((chapter) => chapter.id),
    "journeyChapters[].id",
    issues,
  );
  content.journeyChapters.forEach((chapter, index) => {
    const path = `journeyChapters[${index}:${chapter.id}]`;
    checkLocalizedText(chapter.label, `${path}.label`, issues);
    checkLocalizedText(chapter.title, `${path}.title`, issues);
    checkLocalizedText(chapter.summary, `${path}.summary`, issues);
    checkLocalizedText(chapter.description, `${path}.description`, issues);
  });

  checkUnique(
    content.expertiseGroups.map((group) => group.id),
    "expertiseGroups[].id",
    issues,
  );
  content.expertiseGroups.forEach((group, index) => {
    const path = `expertiseGroups[${index}:${group.id}]`;
    checkLocalizedText(group.title, `${path}.title`, issues);
    checkLocalizedText(group.problem, `${path}.problem`, issues);
    if (group.tech.length === 0) issues.push({ path: `${path}.tech`, message: "stack vazia" });
  });

  checkUnique(
    content.serviceOffers.map((offer) => offer.id),
    "serviceOffers[].id",
    issues,
  );
  content.serviceOffers.forEach((offer, index) => {
    const path = `serviceOffers[${index}:${offer.id}]`;
    checkLocalizedText(offer.title, `${path}.title`, issues);
    checkLocalizedText(offer.description, `${path}.description`, issues);
  });

  checkUnique(
    content.contactChannels.map((channel) => channel.kind),
    "contactChannels[].kind",
    issues,
  );
  content.contactChannels.forEach((channel) => {
    const path = `contactChannels[${channel.kind}]`;
    if (channel.href === null) {
      if (channel.status === "approved") {
        issues.push({ path, message: "canal aprovado sem endereço validado" });
      }
      return;
    }
    if (channel.kind === "cv" && channel.href.startsWith("/")) {
      if (publicAssetExists && !publicAssetExists(channel.href)) {
        issues.push({ path: `${path}.href`, message: `arquivo inexistente em public${channel.href}` });
      }
      if (channel.verifiedAt) checkIsoDate(channel.verifiedAt, `${path}.verifiedAt`, issues, today);
    } else {
      checkVerifiedLink(
        { href: channel.href, verifiedAt: channel.verifiedAt ?? "" },
        path,
        issues,
        { today, protocols: channel.kind === "email" ? ["mailto:"] : ["https:"] },
      );
    }
  });

  return issues;
}
