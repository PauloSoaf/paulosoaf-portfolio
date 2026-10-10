import type { ContentStatus, LocalizedText, VerifiedLink } from "@/features/content/types";

export type ProjectCategory = "3d" | "web" | "fullstack" | "games" | "academic";

export interface ProjectImage {
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
