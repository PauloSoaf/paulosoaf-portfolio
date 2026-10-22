"use client";
import Link from "next/link";
import type { ComponentProps } from "react";

/** Canonical links are shared by the only portfolio experience and its no-JS HTML. */
export function PageLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  return <Link href={href} {...props} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.currentTarget.target === "_blank" || event.currentTarget.hasAttribute("download")) return;
    const url = new URL(event.currentTarget.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    // Next skips an already-current fragment. Let the browser follow it even after the
    // visitor has scrolled elsewhere; native anchors also retain history and CSS offsets.
    if (!document.getElementById(decodeURIComponent(url.hash.slice(1)))) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("portfolio:section-navigate", { detail: { section: url.hash.slice(1) } }));
    location.assign(url.href);
  }} />;
}
