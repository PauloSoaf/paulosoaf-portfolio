/**
 * Public origin used for canonical/hreflang/Open Graph URLs. Set `SITE_URL` (https) for any real
 * deployment; the release gate refuses to publish without it.
 */
export function getSiteUrl(): URL {
  return new URL(process.env.SITE_URL ?? "http://localhost:1010");
}
