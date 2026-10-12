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
            <li key={group.id} data-motion="rise" data-motion-delay={index * 120} data-spotlight className="spotlight-card ui-card motion-expertise flex flex-col gap-4 rounded-md border border-line bg-surface p-6 lg:p-8">
              <svg className="expertise-symbol" aria-hidden="true" viewBox="0 0 180 70" fill="none">
                {index % 3 === 0 ? <><rect x="8" y="12" width="75" height="46" rx="7" /><rect x="98" y="12" width="74" height="46" rx="7" /><path d="m35 25-10 10 10 10m20-20 10 10-10 10m57-10h40m-32-10h30" /></> : index % 3 === 1 ? <><path d="M15 35h150M45 15v40m90-40v40" /><circle cx="45" cy="15" r="7" /><circle cx="90" cy="35" r="12" /><circle cx="135" cy="55" r="7" /></> : <><ellipse cx="90" cy="35" rx="67" ry="21" transform="rotate(-17 90 35)" /><ellipse cx="90" cy="35" rx="50" ry="21" transform="rotate(38 90 35)" /><path d="m90 23 11 12-11 12-11-12z" /></>}
              </svg>
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
