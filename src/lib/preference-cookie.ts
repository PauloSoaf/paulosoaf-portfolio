const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * First-party preference cookie (theme/locale). Set only after an explicit user choice;
 * no tracking, no personal data (goals-and-kpis.md, data governance).
 */
export function serializePreferenceCookie(name: string, value: string, secure: boolean): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${ONE_YEAR_IN_SECONDS}`,
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function writePreferenceCookie(name: string, value: string): void {
  document.cookie = serializePreferenceCookie(name, value, window.location.protocol === "https:");
}
