import Link from "next/link";
import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

type Variant = "primary" | "outline" | "text";

const variants: Record<Variant, string> = {
  // Green-on-black primary CTA (design-system.md "Botões"); text colour flips per theme via tokens.
  primary:
    "min-h-12 justify-between gap-6 rounded-sm bg-accent px-5 py-3.5 text-sm font-bold text-on-accent shadow-[0_10px_35px_var(--oo-glow)] hover:bg-accent-hover",
  outline:
    "min-h-11 gap-2 rounded-sm border border-line-strong bg-accent-wash px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-fg hover:border-accent",
  // Link-styled CTA: underline on hover so the state never relies on colour alone.
  text: "min-h-12 gap-3 px-4 py-3.5 text-sm font-semibold text-fg underline-offset-4 hover:text-accent hover:underline",
};

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cx(
        "ui-cta inline-flex max-w-full items-center",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
