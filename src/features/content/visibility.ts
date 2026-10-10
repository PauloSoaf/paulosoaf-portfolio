import type { ContentStatus } from "./types";

type EnvLike = Record<string, string | undefined>;

/**
 * Editorial preview shows drafts with visible badges: always in `next dev`, or in a build made
 * with `PORTFOLIO_CONTENT_PREVIEW=1` (never for a public deploy — the release gate checks it).
 */
export function isEditorialPreview(env: EnvLike = process.env): boolean {
  return env.NODE_ENV === "development" || env.PORTFOLIO_CONTENT_PREVIEW === "1";
}

export function isPublished(status: ContentStatus): boolean {
  return status === "approved";
}

/** Production keeps only approved items (RF-010); preview keeps everything for review. */
export function visibleItems<T extends { status: ContentStatus }>(
  items: readonly T[],
  preview: boolean,
): T[] {
  return preview ? [...items] : items.filter((item) => isPublished(item.status));
}
