import type { SVGProps } from "react";

const paths = {
  "arrow-up-right": "M7 17 17 7M8.5 7H17v8.5",
  "arrow-down-right": "M7 7l10 10M17 8.5V17H8.5",
  "arrow-down": "M12 5v14M5.5 12.5 12 19l6.5-6.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  sun: "M12 4V2.5M12 21.5V20M4 12H2.5M21.5 12H20M6.3 6.3 5.2 5.2M18.8 18.8l-1.1-1.1M6.3 17.7l-1.1 1.1M18.8 5.2l-1.1 1.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
} as const;

export type IconName = keyof typeof paths;

/** Decorative stroke icon; the accessible name always comes from the surrounding control. */
export function Icon({
  name,
  size = 16,
  ...props
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "children">) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-direction={name.startsWith("arrow-") ? name : undefined}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
