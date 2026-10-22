/** Owner-supplied URLs. Server-selected editorial visibility also governs the notebook. */
export const workstationSites = {
  // Smallest audited NutriOpus viewport with all navbar actions inside the display (21/10/2026).
  nutriopus: { title: "NutriOpus", url: "https://www.nutriopus.com.br/", preferredWidth: 1024, status: "verified-local" as "verified-local" | "unverified" },
  // The real two-column hero includes the portrait at this viewport.
  deborah: { title: "Déborah Lima", url: "https://www.xn--advogadadborahlima-jwb.com.br/", preferredWidth: 1200, status: "verified-local" as "verified-local" | "unverified" },
} as const;
export type CommercialSiteId = keyof typeof workstationSites;
export type WorkstationAccess = { sites: readonly CommercialSiteId[]; fixture: boolean };
/** Server-selected editorial visibility applies to every opening path, including the Terminal. */
export function canOpenSite(access: WorkstationAccess, id: unknown): boolean {
  return id === "fixture" ? access.fixture : access.sites.some(site => site === id);
}
export function siteForProject(slug: unknown): CommercialSiteId | null {
  return slug === "nutriopus" ? "nutriopus" : slug === "deborah-lima" ? "deborah" : null;
}
export const PROJECT_REQUEST = "portfolio:workstation-project";
