import Link from "next/link";

/** `PS.` wordmark linking home; the accessible name spells out the owner's name. */
export function Logo({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center font-display text-[1.6875rem] leading-none font-bold tracking-[-0.085em] text-fg"
    >
      <span aria-hidden="true">
        PS<span className="text-accent">.</span>
      </span>
      <span className="sr-only">{label}</span>
    </Link>
  );
}
