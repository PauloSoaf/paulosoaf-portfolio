import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { siteContent } from "@/features/content/site-content";
import { validateSiteContent } from "@/features/content/validate-site-content";
import { getReleaseBlockers } from "@/features/content/release-gate";

it("permits publication only after editorial review and contact validation", () => {
  const issues = validateSiteContent(siteContent, {
    today: new Date(),
    publicAssetExists: (path) => existsSync(join(process.cwd(), "public", path)),
  });
  const blockers = getReleaseBlockers(siteContent, {
    issues, siteUrl: process.env.SITE_URL,
    preview: process.env.PORTFOLIO_CONTENT_PREVIEW === "1",
  });
  expect(blockers, blockers.join("\n")).toEqual([]);
});
