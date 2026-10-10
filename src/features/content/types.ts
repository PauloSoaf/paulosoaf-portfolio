import type { Locale } from "@/i18n/config";

/**
 * Editorial workflow: draft → review (fact-check) → approved → published (content-policy.md).
 * Only the owner may set `approved`; production builds publish nothing else.
 */
export type ContentStatus = "draft" | "review" | "approved";

export type LocalizedText = Record<Locale, string>;

/** A link that someone actually opened/checked; `verifiedAt` is an ISO date (YYYY-MM-DD). */
export interface VerifiedLink {
  href: string;
  verifiedAt: string;
}

export interface ContentIssue {
  path: string;
  message: string;
}
