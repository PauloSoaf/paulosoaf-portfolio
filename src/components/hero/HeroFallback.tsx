import Image from "next/image";

import { cx } from "@/lib/cx";

/**
 * Local SVG art of the procedural orb (POC-001 reference). Server-rendered and decorative, so the
 * hero is complete without WebGL or JavaScript; S01 mounts the R3F scene on top of it.
 * Dark is the default theme and likely LCP element → eager/high priority. The Light variant
 * (same geometry, `npm run art:light`) is lazy, so dark visitors never download it.
 */
export function HeroFallback({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("hero-art-fade pointer-events-none select-none", className)}>
      <Image
        data-theme-only="dark"
        src="/art/hero/orb-dark.svg"
        alt=""
        width={820}
        height={760}
        loading="eager"
        fetchPriority="high"
        draggable={false}
        className="h-auto w-full"
      />
      <Image
        data-theme-only="light"
        src="/art/hero/orb-light.svg"
        alt=""
        width={820}
        height={760}
        draggable={false}
        className="h-auto w-full"
      />
    </div>
  );
}
