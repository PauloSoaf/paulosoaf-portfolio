import { EditorialNotice, StatusBadge } from "@/components/editorial/Editorial";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import type { ServiceOffer } from "@/features/services/services-data";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { sectionHref } from "@/i18n/paths";

import { Section } from "./Section";

interface ServicesSectionProps {
  locale: Locale;
  dict: Dictionary;
  offers: readonly ServiceOffer[];
  preview: boolean;
}

/** What a client can hire, in plain language, with one clear path to contact (persona P3). */
export function ServicesSection({ locale, dict, offers, preview }: ServicesSectionProps) {
  return (
    <Section id="services" heading={dict.sections.services}>
      {offers.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
            {offers.map((offer, index) => (
              <li key={offer.id} className="flex flex-col gap-3 bg-surface p-6 lg:p-8">
                <div className="flex items-center justify-between gap-3">
                  <span aria-hidden="true" className="font-mono text-xs text-fg-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <StatusBadge status={offer.status} labels={dict.editorial.status} />
                </div>
                <h3 className="text-xl leading-tight font-semibold tracking-[-0.03em]">{offer.title[locale]}</h3>
                <p className="leading-[1.7] text-fg-muted">{offer.description[locale]}</p>
              </li>
            ))}
          </ul>
          <ButtonLink variant="primary" href={sectionHref(locale, "contact")} className="mt-10">
            {dict.services.cta}
            <Icon name="arrow-down-right" size={16} />
          </ButtonLink>
        </>
      ) : preview ? (
        <EditorialNotice>{dict.editorial.sectionPending}</EditorialNotice>
      ) : null}
    </Section>
  );
}
