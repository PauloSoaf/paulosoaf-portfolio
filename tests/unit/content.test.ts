import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { siteContent } from "@/features/content/site-content";
import { validateSiteContent } from "@/features/content/validate-site-content";
import { getReleaseBlockers } from "@/features/content/release-gate";
import { isEditorialPreview, visibleItems } from "@/features/content/visibility";
import { checkIsoDate } from "@/features/content/validation";
import type { ContentIssue } from "@/features/content/types";

const today = new Date("2026-10-10T23:59:59Z");
const options = { today, publicAssetExists: (path: string) => existsSync(join(process.cwd(), "public", path)) };

describe("editorial safety", () => {
  it("validates all candidate content, translations and local artwork", () => {
    expect(validateSiteContent(siteContent, options)).toEqual([]);
  });
  it("only publishes approved content and leaves candidates intact", () => {
    const items = [{ status: "draft" as const }, { status: "review" as const }, { status: "approved" as const }];
    expect(visibleItems(items, false)).toEqual([items[2]]);
    expect(visibleItems(items, true)).toEqual(items);
    expect(items).toHaveLength(3);
  });
  it("requires explicit preview mode in a production build", () => {
    expect(isEditorialPreview({ NODE_ENV: "production" })).toBe(false);
    expect(isEditorialPreview({ NODE_ENV: "production", PORTFOLIO_CONTENT_PREVIEW: "1" })).toBe(true);
    expect(isEditorialPreview({ NODE_ENV: "development" })).toBe(true);
  });
  it("blocks release with missing approvals and contact information", () => {
    const blockers = getReleaseBlockers(siteContent, { issues: [], siteUrl: undefined, preview: false });
    expect(blockers).toEqual(expect.arrayContaining([
      expect.stringContaining("Perfil"), expect.stringContaining("Projetos aprovados: 0"),
      expect.stringContaining('Contato "email"'), expect.stringContaining('Contato "linkedin"'),
      expect.stringContaining('Contato "cv"'), expect.stringContaining("SITE_URL"),
    ]));
  });
  it("rejects accidental public editorial preview even with a valid site origin", () => {
    expect(getReleaseBlockers(siteContent, { issues: [], siteUrl: "https://example.org", preview: true }))
      .toContainEqual(expect.stringContaining("prévia editorial"));
  });
  it("rejects missing Spanish content, missing media and unverified demos", () => {
    const content = structuredClone(siteContent);
    const index = content.projects.findIndex((project) => project.slug === "dr-manaus");
    const project = content.projects[index]!;
    project.summary.es = "";
    project.demo = { href: "javascript:alert(1)", verifiedAt: "2026-10-11" };
    const issues = validateSiteContent(content, { today, publicAssetExists: () => false });
    expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
      `projects[${index}:dr-manaus].summary.es`, `projects[${index}:dr-manaus].image.src`,
      `projects[${index}:dr-manaus].demo.href`, `projects[${index}:dr-manaus].demo.verifiedAt`,
    ]));
  });
  it.each(["2026-02-30", "2026-13-01", "2026-10-11", "10/10/2026"])("rejects invalid verification date %s", (value) => {
    const issues: ContentIssue[] = [];
    checkIsoDate(value, "verifiedAt", issues, today);
    expect(issues).not.toHaveLength(0);
  });
});
