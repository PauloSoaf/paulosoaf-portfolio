import type { ContentStatus } from "@/features/content/types";

export type ContactKind = "email" | "linkedin" | "github" | "cv";

/**
 * Contact channels (RF-008). `href: null` means the owner has not provided a validated value yet:
 * the UI shows an editorial notice in preview and nothing in production — never a fake address.
 * WhatsApp is intentionally absent until a professional number is approved (screen-states.md).
 */
export interface ContactChannel {
  kind: ContactKind;
  status: ContentStatus;
  href: string | null;
  /** Human-readable value shown next to the label, e.g. `github.com/PauloSoaf`. */
  display?: string;
  /** Date the link/address was confirmed (YYYY-MM-DD). */
  verifiedAt?: string;
}

export const contactChannels: readonly ContactChannel[] = [
  { kind: "email", status: "draft", href: null },
  { kind: "linkedin", status: "draft", href: null },
  {
    kind: "github",
    status: "review",
    href: "https://github.com/PauloSoaf",
    display: "github.com/PauloSoaf",
    verifiedAt: "2026-10-10",
  },
  { kind: "cv", status: "draft", href: null },
];

export function findChannel(
  channels: readonly ContactChannel[],
  kind: ContactKind,
): ContactChannel | undefined {
  return channels.find((channel) => channel.kind === kind);
}
