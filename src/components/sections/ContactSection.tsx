import type { ReactNode } from "react";

import { EditorialNotice, StatusBadge } from "@/components/editorial/Editorial";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Icon } from "@/components/ui/Icon";
import type { ContactChannel } from "@/features/contact/contact-links";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/get-dictionary";

import { Section } from "./Section";

interface ContactSectionProps {
  dict: Dictionary;
  /** Already filtered by visibility (approved only in production). */
  channels: readonly ContactChannel[];
  preview: boolean;
}

const cardClass =
  "ui-cta flex min-h-20 flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-surface px-5 py-4 hover:border-accent";

/**
 * Contact (RF-008). Only validated channels become links. A channel without a validated value is
 * an editorial blocker: preview shows a notice, production shows nothing — never a fake address.
 */
export function ContactSection({ dict, channels, preview }: ContactSectionProps) {
  const items = channels.flatMap((channel): ReactNode[] => {
    const label = dict.contact.channels[channel.kind];
    if (!channel.href) {
      return preview
        ? [
            <li key={channel.kind} data-motion="settle">
              <EditorialNotice>{format(dict.editorial.channelPending, { channel: label })}</EditorialNotice>
            </li>,
          ]
        : [];
    }

    const content = (
      <>
        <span className="flex min-w-0 flex-col gap-1 wrap-anywhere">
          <span className="text-kicker text-fg-subtle">{label}</span>
          <span className="text-base text-fg">{channel.display ?? channel.href}</span>
        </span>
        <StatusBadge status={channel.status} labels={dict.editorial.status} />
      </>
    );
    const isExternal = channel.href.startsWith("https://");

    return [
      <li key={channel.kind} data-motion="settle">
        {isExternal ? (
          <ExternalLink href={channel.href} newTabLabel={dict.a11y.newTab} className={cardClass}>
            {content}
          </ExternalLink>
        ) : (
          <a href={channel.href} className={cardClass}>
            {content}
            <Icon name="arrow-up-right" size={14} />
          </a>
        )}
      </li>,
    ];
  });

  return (
    <Section id="contact" heading={dict.sections.contact} band>
      {items.length > 0 ? <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">{items}</ul> : null}
    </Section>
  );
}
