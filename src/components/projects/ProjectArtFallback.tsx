/**
 * Local, per-project placeholder art for projects without an approved image (screen-states.md
 * "Erro de mídia: fallback local por projeto"). Pure CSS: orbit rings plus the project monogram.
 */
export function ProjectArtFallback({ title }: { title: string }) {
  const monogram = title
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <span className="absolute h-[44%] w-[78%] -rotate-[14deg] rounded-[50%] border border-(--oo-media-line)" />
      <span className="absolute h-[58%] w-[56%] rotate-[24deg] rounded-[50%] border border-(--oo-media-line)" />
      <span className="absolute size-[30%] rounded-full bg-[radial-gradient(circle_at_32%_28%,var(--oo-media-line),transparent_72%)]" />
      <span className="relative font-display text-5xl font-bold tracking-[-0.06em] text-(--oo-media-fg)">
        {monogram}
      </span>
    </div>
  );
}
