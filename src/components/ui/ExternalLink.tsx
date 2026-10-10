import type { ComponentProps, ReactNode } from "react";

import { Icon } from "./Icon";

type ExternalLinkProps = Omit<ComponentProps<"a">, "target" | "rel" | "children"> & {
  children: ReactNode;
  /** Localized "opens in a new tab" hint (RF-017). */
  newTabLabel: string;
  /** Optional fuller accessible name; must start with the visible text (WCAG 2.5.3). */
  label?: string;
};

/** Verified external URL in a new tab, with a safe `rel` and an announced hint. */
export function ExternalLink({ children, newTabLabel, label, ...props }: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ? `${label} (${newTabLabel})` : undefined}
      {...props}
    >
      {children}
      {label ? null : <span className="sr-only"> ({newTabLabel})</span>}
      <Icon name="arrow-up-right" size={14} />
    </a>
  );
}
