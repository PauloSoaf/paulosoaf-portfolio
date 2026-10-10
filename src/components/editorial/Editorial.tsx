import type { ReactNode } from "react";

import type { ContentStatus } from "@/features/content/types";

/*
 * Editorial-preview markers. They only ever render for non-approved content, which production
 * builds filter out — so `[data-editorial]` must never appear in a production page (E2E-checked).
 */

export function StatusBadge({
  status,
  labels,
}: {
  status: ContentStatus;
  labels: Record<ContentStatus, string>;
}) {
  if (status === "approved") return null;
  return (
    <span
      data-editorial="status"
      className="text-kicker inline-flex shrink-0 items-center rounded-full border border-dashed border-accent-2 px-2.5 py-1 text-accent-2"
    >
      {labels[status]}
    </span>
  );
}

export function EditorialNotice({ children }: { children: ReactNode }) {
  return (
    <p
      role="note"
      data-editorial="notice"
      className="rounded-sm border border-dashed border-accent-2 px-4 py-3 text-sm text-fg-muted"
    >
      {children}
    </p>
  );
}

export function PreviewBanner({ text }: { text: string }) {
  return (
    <div
      role="note"
      data-editorial="banner"
      className="text-kicker border-b border-dashed border-accent-2 bg-surface px-5 py-2 text-center text-accent-2"
    >
      {text}
    </div>
  );
}
