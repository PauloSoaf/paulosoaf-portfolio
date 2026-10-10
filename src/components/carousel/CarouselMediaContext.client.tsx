"use client";

import { createContext } from "react";

/** null is the complete no-JS catalog. Enhanced mode loads only active/adjacent project media. */
export const CarouselMediaContext = createContext<{
  allowedSlugs: ReadonlySet<string>; activeSlug: string; visible: boolean;
} | null>(null);
