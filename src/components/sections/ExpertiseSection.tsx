import { EditorialNotice, StatusBadge } from "@/components/editorial/Editorial";
import type { ExpertiseGroup } from "@/features/expertise/expertise-data";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

import { Section } from "./Section";

interface ExpertiseSectionProps {
  locale: Locale;
  dict: Dictionary;
  groups: readonly ExpertiseGroup[];
  preview: boolean;
}

/** Skills grouped by the problem they solve, with the stack as supporting detail (RF-019). */
export function ExpertiseSection({ locale, dict, groups, preview }: ExpertiseSectionProps) {
  return (
    <Section id="expertise" heading={dict.sections.expertise} band>
      {groups.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {groups.map((group, index) => (
            <li key={group.id} data-motion="rise" data-motion-delay={index * 50} className="ui-card motion-expertise flex flex-col gap-4 rounded-md border border-line bg-surface p-6 lg:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-xl leading-tight font-semibold tracking-[-0.03em]">{group.title[locale]}</h3>
                <StatusBadge status={group.status} labels={dict.editorial.status} />
              </div>
              <p className="leading-[1.7] text-fg-muted">{group.problem[locale]}</p>
              <ul aria-label={dict.expertise.techLabel} className="mt-auto flex flex-wrap gap-2 pt-2">
                {group.tech.map((tech) => (
                  <li key={tech} className="rounded-[6px] border border-line-strong px-2.5 py-1.5 font-mono text-xs text-fg-muted">
                    {tech}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : preview ? (
        <EditorialNotice>{dict.editorial.sectionPending}</EditorialNotice>
      ) : null}
    </Section>
  );
}
