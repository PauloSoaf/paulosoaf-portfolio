import type { ReactNode } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import type { SectionId } from "@/i18n/paths";
import { cx } from "@/lib/cx";

interface SectionProps {
  id: SectionId;
  heading: { kicker: string; titleLead: string; titleEmphasis: string; description: string };
  /** Alternate background band (POC: projects section). */
  band?: boolean;
  children: ReactNode;
  sceneAnchor?: ReactNode;
}

/** Landing section shell: anchor target for the nav (`#work`…), labelled by its heading. */
export function Section({ id, heading, band = false, children, sceneAnchor }: SectionProps) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className={cx("py-20 lg:py-32", band && "bg-band")}>
      <div className="container-page relative">
        <span aria-hidden="true" data-scroll-decor className="section-orbit" />
        <SectionHeading headingId={headingId} {...heading} />
        {sceneAnchor}
        <div data-motion={id === "work" || id === "contact" ? "depth" : undefined} data-motion-delay="80">{children}</div>
      </div>
    </section>
  );
}
