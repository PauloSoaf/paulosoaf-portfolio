export const themes = ["dark", "light"] as const;

export type Theme = (typeof themes)[number];

/** Dark is the Obsidian Orbit v0.1 reference and the first-visit default (ADDENDUM-001 §4.2). */
export const defaultTheme: Theme = "dark";

export const THEME_COOKIE = "ps-theme";

/** Browser UI color per theme; mirrors `--oo-bg-base` in tokens.css. */
export const themeColor: Record<Theme, string> = {
  dark: "#090D11",
  light: "#F7F8FA",
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (themes as readonly string[]).includes(value);
}

/** Only `dark`/`light` are honoured; anything else read from storage falls back to the default. */
export function parseTheme(value: unknown): Theme {
  return isTheme(value) ? value : defaultTheme;
}
