import type { ContentStatus, LocalizedText } from "@/features/content/types";

export interface Profile {
  /** Covers the presentation name and role shown in the hero. */
  status: ContentStatus;
  name: string;
  role: LocalizedText;
}

/**
 * RF-001 needs name + role in the hero regardless of approval, so the hero always renders them;
 * publication is instead blocked by the release gate until the owner approves (`npm run release:check`).
 */
export const profile: Profile = {
  status: "review",
  name: "Paulo Soaf",
  role: {
    pt: "Engenheiro Full Stack",
    en: "Full Stack Engineer",
    es: "Ingeniero Full Stack",
  },
};

/**
 * Interface copy in src/i18n/dictionaries (hero tagline, headings, descriptions). Drafted from the
 * POC texts plus AI translations — a draft until the owner reviews tone, facts and naturalness.
 */
export const interfaceCopyStatus: ContentStatus = "review";
