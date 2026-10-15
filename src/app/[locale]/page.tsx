import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LandingContent } from "@/components/layout/LandingContent";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { landingMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? landingMetadata(locale, getDictionary(locale)) : {};
}
export default async function LandingPage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (process.env.NODE_ENV === "development") {
    const { experience } = await searchParams;
    if (experience !== "recovery" && experience !== "classic") redirect(`/${locale}/workstation-lab`);
  }
  return <LandingContent locale={locale} />;
}
