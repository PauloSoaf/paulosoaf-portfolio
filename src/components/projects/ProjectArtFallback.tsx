import type { ProjectArt } from "@/features/projects/project-types";

/** Abstract local art, never a fabricated screenshot. The media caption provides that distinction. */
export function ProjectArtFallback({ title, art = "space" }: { title: string; art?: ProjectArt }) {
  const monogram = title.split(/[\s-]+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div aria-hidden="true" className={`project-concept concept-${art}`} data-concept={art}>
      <svg viewBox="0 0 700 380" className="concept-lines" fill="none" xmlns="http://www.w3.org/2000/svg">
        {art === "nutrition" ? <>
          <rect x="130" y="70" width="440" height="230" rx="16" />
          <path d="M200 70v230M200 127h370M232 168h124v95H232zM388 168h150M388 205h110M388 243h140" />
          <path d="M287 238c-36-28-29-71 28-85 10 45-1 68-28 85Zm0 0 22-55" className="concept-emphasis" />
          <circle cx="477" cy="128" r="60" /><circle cx="477" cy="128" r="39" />
        </> : art === "editorial" ? <>
          <path d="M154 68h392v244H154zM192 99h316M192 280h316M352 122v133" />
          <path d="m270 125-54 119h23l13-32h44l14 32h22l-52-119Zm-10 68 14-36 14 36" className="concept-emphasis" />
          <path d="M390 140h100M390 163h74M390 215h100M390 237h60" />
        </> : art === "telemetry" ? <>
          <path d="M90 90h520M90 160h520M90 230h520M90 300h520M130 65v260M230 65v260M330 65v260M430 65v260M530 65v260" />
          <path d="m100 250 80-71 60 24 87-101 62 51 91-41 104-42" className="concept-emphasis" />
          <circle cx="480" cy="112" r="8" />
        </> : art === "chess" ? <>
          {Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, col) => <rect key={`${row}-${col}`} x={220 + col * 43} y={60 + row * 43} width="43" height="43" fill={(row + col) % 2 ? "var(--oo-media-line)" : "none"} />))}
        </> : art === "games" ? <>
          <rect x="172" y="85" width="356" height="210" rx="75" />
          <path d="M220 190h80M260 150v80" className="concept-emphasis" /><circle cx="430" cy="166" r="16" /><circle cx="469" cy="211" r="16" />
        </> : art === "academic" ? <>
          <path d="M160 84h380v218H160zM350 84v218M240 84v55h220V84M240 302v-55h220v55" />
          <circle cx="350" cy="193" r="51" className="concept-emphasis" />
        </> : <>
          <circle cx="350" cy="185" r="104" /><ellipse cx="350" cy="185" rx="242" ry="75" transform="rotate(-20 350 185)" />
          <ellipse cx="350" cy="185" rx="211" ry="96" transform="rotate(47 350 185)" className="concept-emphasis" />
        </>}
      </svg>
      <span className="concept-monogram">{monogram}</span>
    </div>
  );
}
