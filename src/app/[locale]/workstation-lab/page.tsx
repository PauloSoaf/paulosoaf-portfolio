import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingContent } from "@/components/layout/LandingContent";
import { workstationAvailable } from "@/features/workstation/config";
import { workstationLabels } from "@/features/workstation/labels";
import { isLocale } from "@/i18n/config";
export const metadata: Metadata = { title: "Obsidian Workstation · P01", robots: { index: false, follow: false } };
export default async function WorkstationLab({ params }: PageProps<"/[locale]/workstation-lab">) {
  const { locale } = await params;
  if (!isLocale(locale) || !workstationAvailable()) notFound();
  return <><div className="workstation-lab-bar"><span>{workstationLabels[locale].lab}</span><a href={`/${locale}?experience=recovery`}>{workstationLabels[locale].returnPortfolio} ↗</a></div><LandingContent locale={locale} workstation /></>;
}
