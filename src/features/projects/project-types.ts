import type { ContentStatus, LocalizedText, VerifiedLink } from "@/features/content/types";

export type ProjectCategory = "3d" | "web" | "fullstack" | "games" | "academic";
export type ProjectKind = "commercial-product" | "professional-website" | "open-source" | "enterprise-application" | "technical-experiment" | "academic-project";
export type ProjectArt = "nutrition" | "editorial" | "space" | "chess" | "telemetry" | "games" | "academic";

export interface ProjectImage {
  kind: "concept" | "screenshot";
  /** Path under `public/`, e.g. `/art/projects/chess.svg`. */
  src: string;
  width: number;
  height: number;
  alt: LocalizedText;
  /** `cover` fills the media panel (default); `contain` keeps transparent art whole. */
  fit?: "cover" | "contain";
}

/** data-model.md, extended to three locales (ADDENDUM-001 §3.3). */
export interface Project {
  slug: string;
  title: string;
  status: ContentStatus;
  kind: ProjectKind;
  /** Undefined keeps the project in the secondary catalog. Lower values appear first. */
  featuredOrder?: number;
  sourceVisibility: "public" | "private" | "unconfirmed";
  stackVerification: "confirmed" | "pending";
  art: ProjectArt;
  /** Availability is derived from the optional verified demo link; no invented destinations. */
  caseStudy: { availability: "planned" | "unavailable" } | { availability: "available"; path: `/${string}` };
  categories: readonly ProjectCategory[];
  summary: LocalizedText;
  /** Required before approval (case study, S04). */
  challenge?: LocalizedText;
  /** Paulo's individual contribution; required before approval. */
  contribution?: LocalizedText;
  tech: readonly string[];
  /** Missing image → local per-project fallback art. */
  image?: ProjectImage;
  repository?: VerifiedLink;
  /** Only after an explicit, successful check of the live demo. Never invented. */
  demo?: VerifiedLink;
  teamCredits?: readonly string[];
  /** Internal editorial notes: sources and open questions. Never rendered. */
  notes?: string;
}
