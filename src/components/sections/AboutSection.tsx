import { EditorialNotice, StatusBadge } from "@/components/editorial/Editorial";
import { JourneyTimeline } from "@/components/timeline/JourneyTimeline.client";
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
 * Server-rendered chapter content. S03 enhances the linear list into desktop tabs.
 */
export function AboutSection({ locale, dict, chapters, preview }: AboutSectionProps) {
  return (
    <Section id="about" heading={dict.sections.about}>
      {chapters.length > 0 ? (
        <JourneyTimeline labels={dict.journey} chapters={chapters.map((chapter, index) => ({
          id: chapter.id, label: chapter.label[locale], title: chapter.title[locale], summary: chapter.summary[locale],
          content: <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-kicker text-accent">
                  {format(dict.journey.chapter, { index: String(index + 1).padStart(2, "0") })} ·{" "}
                  {chapter.label[locale]}
                </p>
                <StatusBadge status={chapter.status} labels={dict.editorial.status} />
              </div>
              <h3 id={`journey-heading-${chapter.id}`} className="mt-5">{chapter.title[locale]}</h3>
              <p className="mt-1.5 text-sm text-fg-subtle">{chapter.summary[locale]}</p>
              <p className="mt-5 leading-[1.7] text-fg-muted">{chapter.description[locale]}</p>
              <ul aria-label={dict.journey.tagsLabel} className="mt-auto flex flex-wrap gap-2 pt-6">
                {chapter.tags.map((tag) => (
                  <li key={tag} className="rounded-[6px] border border-line-strong px-2.5 py-1.5 text-xs text-fg-muted">
                    {tag}
                  </li>
                ))}
              </ul>
          </>,
        }))} />
      ) : preview ? (
        <EditorialNotice>{dict.editorial.sectionPending}</EditorialNotice>
      ) : null}
    </Section>
  );
}
