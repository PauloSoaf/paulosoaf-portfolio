interface SectionHeadingProps {
  headingId: string;
  kicker: string;
  titleLead: string;
  titleEmphasis: string;
  description?: string;
}

/** POC section title block: mono kicker, display heading with accent emphasis, side description, rule. */
export function SectionHeading({
  headingId,
  kicker,
  titleLead,
  titleEmphasis,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mb-10 lg:mb-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div>
          <p className="text-kicker mb-5 text-accent lg:mb-6">{kicker}</p>
          <h2
            id={headingId}
            className="text-[2.75rem] leading-none font-bold tracking-[-0.05em] break-words sm:text-[clamp(2.75rem,6vw,5.5rem)]"
          >
            {titleLead} <em className="heading-em">{titleEmphasis}</em>
          </h2>
        </div>
        {description ? (
          <p className="max-w-[22.5rem] text-sm leading-[1.7] text-fg-muted lg:mb-1.5">{description}</p>
        ) : null}
      </div>
      <div aria-hidden="true" className="mt-9 h-px bg-line" />
    </div>
  );
}
