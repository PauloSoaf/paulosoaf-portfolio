import { EditorialNotice, StatusBadge } from "@/components/editorial/Editorial";
import type { JourneyChapter } from "@/features/experience/journey-data";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/get-dictionary";

import { Section } from "./Section";

interface AboutSectionProps {
  locale: Locale;
  dict: Dictionary;
  chapters: readonly JourneyChapter[];
  preview: boolean;
}

/**
 * About & journey as a linear, ordered list: fully readable without JavaScript (RF-007 baseline).
 * The interactive timeline (POC-003) arrives in S03 as an enhancement of this markup.
 */
export function AboutSection({ locale, dict, chapters, preview }: AboutSectionProps) {
  return (
    <Section id="about" heading={dict.sections.about}>
      {chapters.length > 0 ? (
        <ol className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {chapters.map((chapter, index) => (
            <li key={chapter.id} className="flex flex-col rounded-md border border-line bg-surface p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-kicker text-accent">
                  {format(dict.journey.chapter, { index: String(index + 1).padStart(2, "0") })} ·{" "}
                  {chapter.label[locale]}
                </p>
                <StatusBadge status={chapter.status} labels={dict.editorial.status} />
              </div>
              <h3 className="mt-5 text-2xl leading-tight font-semibold tracking-[-0.04em]">{chapter.title[locale]}</h3>
              <p className="mt-1.5 text-sm text-fg-subtle">{chapter.summary[locale]}</p>
              <p className="mt-5 leading-[1.7] text-fg-muted">{chapter.description[locale]}</p>
              <ul aria-label={dict.journey.tagsLabel} className="mt-auto flex flex-wrap gap-2 pt-6">
                {chapter.tags.map((tag) => (
                  <li key={tag} className="rounded-[6px] border border-line-strong px-2.5 py-1.5 text-xs text-fg-muted">
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : preview ? (
        <EditorialNotice>{dict.editorial.sectionPending}</EditorialNotice>
      ) : null}
    </Section>
  );
}
