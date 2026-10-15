/** Owner-supplied URLs, isolated from editorial demo approval. Release verification stays pending. */
export const workstationSites = {
  nutriopus: { title: "NutriOpus", url: "https://www.nutriopus.com.br/", status: "verified-local" as "verified-local" | "unverified" },
  deborah: { title: "Déborah Lima", url: "https://www.xn--advogadadborahlima-jwb.com.br/", status: "verified-local" as "verified-local" | "unverified" },
} as const;
export type CommercialSiteId = keyof typeof workstationSites;
export function siteForProject(slug: unknown): CommercialSiteId | null {
  return slug === "nutriopus" ? "nutriopus" : slug === "deborah-lima" ? "deborah" : null;
}
export const PROJECT_REQUEST = "portfolio:workstation-project";
