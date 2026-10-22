"use client";
import Link from "next/link";
import type { ComponentProps } from "react";

/** Canonical links are shared by the only portfolio experience and its no-JS HTML. */
export function PageLink({ href, ...props }: ComponentProps<typeof Link>) {
  return <Link href={href} {...props} />;
}
