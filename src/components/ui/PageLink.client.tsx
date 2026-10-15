"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/** Keep native section links within the experimental page, including server/no-JS HTML. */
export function PageLink({ href, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const destination = pathname?.endsWith("/workstation-lab") && typeof href === "string" && /^\/(pt|en|es)#[a-z-]+$/.test(href)
    ? `${pathname}${href.slice(href.indexOf("#"))}` : href;
  return <Link href={destination} {...props} />;
}
