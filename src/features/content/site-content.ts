import { contactChannels, type ContactChannel } from "@/features/contact/contact-links";
import { journeyChapters, type JourneyChapter } from "@/features/experience/journey-data";
import { expertiseGroups, type ExpertiseGroup } from "@/features/expertise/expertise-data";
import { interfaceCopyStatus, profile, type Profile } from "@/features/profile/profile";
import { projects } from "@/features/projects/project-data";
import type { Project } from "@/features/projects/project-types";
import { serviceOffers, type ServiceOffer } from "@/features/services/services-data";

import type { ContentStatus } from "./types";

export interface SiteContent {
  profile: Profile;
  interfaceCopyStatus: ContentStatus;
  projects: readonly Project[];
  journeyChapters: readonly JourneyChapter[];
  expertiseGroups: readonly ExpertiseGroup[];
  serviceOffers: readonly ServiceOffer[];
  contactChannels: readonly ContactChannel[];
}

export const siteContent: SiteContent = {
  profile,
  interfaceCopyStatus,
  projects,
  journeyChapters,
  expertiseGroups,
  serviceOffers,
  contactChannels,
};
