import Image from "next/image";

import { cx } from "@/lib/cx";

/**
 * Decorative server SVG preserves the sculpture's silhouette without WebGL/JavaScript.
 * Original orb images remain available to the classic comparison. The host reserves the
 * shared aspect ratio before either artwork loads; all editorial content is independent.
 */
export function HeroFallback({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("hero-art-fade pointer-events-none select-none", className)}>
      <svg className="recovery-art h-auto w-full" viewBox="0 0 820 760" fill="none">
        <defs>
          <linearGradient id="atlas-metal" x1="180" y1="150" x2="620" y2="610" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--oo-fg-secondary)" /><stop offset=".32" stopColor="var(--oo-bg-elevated)" />
            <stop offset=".7" stopColor="var(--oo-fg-tertiary)" /><stop offset="1" stopColor="var(--oo-bg-sunken)" />
          </linearGradient>
        </defs>
        <g stroke="var(--oo-border-strong)" opacity=".7">
          <ellipse cx="415" cy="370" rx="280" ry="210" transform="rotate(-30 415 370)" strokeDasharray="1 16" />
          <ellipse cx="415" cy="370" rx="300" ry="185" transform="rotate(55 415 370)" strokeDasharray="1 25" />
        </g>
        <g fill="url(#atlas-metal)" stroke="var(--oo-fg-tertiary)">
          <path d="M205 237C345 78 652 174 650 360C649 532 417 620 259 513L292 468C430 550 594 463 591 360C588 230 371 175 243 271Z" />
          <path d="M329 154C511 141 674 423 527 554C397 669 178 476 190 295L245 293C240 439 401 586 484 504C594 395 470 206 333 207Z" />
          <path d="M172 399C179 216 523 161 615 335C688 473 405 600 248 499L279 462C401 531 603 428 568 355C493 218 231 275 225 401Z" />
        </g>
        <path d="m407 358 13 17-13 18-13-18z" fill="var(--oo-accent-primary)" />
        <circle cx="655" cy="272" r="4" fill="var(--oo-fg-secondary)" />
      </svg>
      <div className="classic-art">
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
    </div>
  );
}
