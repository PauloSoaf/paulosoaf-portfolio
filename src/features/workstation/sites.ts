/** Owner-supplied URLs, isolated from editorial demo approval. Release verification stays pending. */
export const workstationSites = {
  // Smallest audited NutriOpus viewport with all navbar actions inside the display (21/10/2026).
  nutriopus: { title: "NutriOpus", url: "https://www.nutriopus.com.br/", preferredWidth: 1024, status: "verified-local" as "verified-local" | "unverified" },
  // The real two-column hero includes the portrait at this viewport.
  deborah: { title: "Déborah Lima", url: "https://www.xn--advogadadborahlima-jwb.com.br/", preferredWidth: 1200, status: "verified-local" as "verified-local" | "unverified" },
} as const;
export type CommercialSiteId = keyof typeof workstationSites;
export function siteForProject(slug: unknown): CommercialSiteId | null {
  return slug === "nutriopus" ? "nutriopus" : slug === "deborah-lima" ? "deborah" : null;
}
export const PROJECT_REQUEST = "portfolio:workstation-project";
