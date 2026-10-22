/** Synthetic test fixtures stay absent from public builds. The notebook itself is public. */
export function workstationAvailable(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "development" || (env.PORTFOLIO_CONTENT_PREVIEW === "1" && env.EXPERIMENTAL_WORKSTATION === "1");
}
