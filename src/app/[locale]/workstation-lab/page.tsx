import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
/** Compatibility for saved links. There is only one portfolio experience now. */
export default async function WorkstationLab({ params, searchParams }: PageProps<"/[locale]/workstation-lab">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (key === "experience" || value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) query.append(key, entry);
  }
  redirect(`/${locale}${query.size ? `?${query}` : ""}`);
}
