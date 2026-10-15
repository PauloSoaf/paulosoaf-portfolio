/** POC routes are absent from a normal public build. No editorial approval is implied. */
export function workstationAvailable(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "development" || (env.PORTFOLIO_CONTENT_PREVIEW === "1" && env.EXPERIMENTAL_WORKSTATION === "1");
}
