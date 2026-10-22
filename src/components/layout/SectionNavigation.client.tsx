"use client";

import { useEffect } from "react";
import { useVisibleSection } from "@/features/navigation/visible-section";

/** The URL is a destination, not a scroll spy. Keep stale fragments out of the active nav. */
export function SectionNavigation() {
  const section = useVisibleSection();
  useEffect(() => {
    document.documentElement.dataset.sectionTracking = "true";
    for (const link of document.querySelectorAll<HTMLAnchorElement>('header nav a[href*="#"]')) {
      if (link.hash === `#${section}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }, [section]);
  useEffect(() => () => {
    delete document.documentElement.dataset.sectionTracking;
    document.querySelectorAll('header nav a[aria-current="location"]').forEach(link => link.removeAttribute("aria-current"));
  }, []);
  return null;
}
