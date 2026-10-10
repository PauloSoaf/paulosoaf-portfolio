import { locales } from "@/i18n/config";

import type { ContentIssue, LocalizedText, VerifiedLink } from "./types";

const PLACEHOLDER_PATTERN =
  /\b(todo|tbd|lorem|ipsum|placeholder|xxx+)\b|seu-email|your-email|\[(revisar|review|pendente)\]/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function checkLocalizedText(
  value: LocalizedText | undefined,
  path: string,
  issues: ContentIssue[],
): void {
  if (!value) {
    issues.push({ path, message: "texto obrigatório ausente" });
    return;
  }
  for (const locale of locales) {
    const text = value[locale]?.trim() ?? "";
    if (text === "") {
      issues.push({ path: `${path}.${locale}`, message: "texto vazio" });
    } else if (PLACEHOLDER_PATTERN.test(text)) {
      issues.push({ path: `${path}.${locale}`, message: "contém marcador de placeholder" });
    }
  }
}

export function checkIsoDate(value: string, path: string, issues: ContentIssue[], today: Date): void {
  const time = Date.parse(`${value}T00:00:00Z`);
  if (
    !ISO_DATE_PATTERN.test(value) || Number.isNaN(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  ) {
    issues.push({ path, message: "data deve estar no formato YYYY-MM-DD" });
  } else if (time > today.getTime()) {
    issues.push({ path, message: "data de verificação no futuro" });
  }
}

export function checkVerifiedLink(
  link: VerifiedLink,
  path: string,
  issues: ContentIssue[],
  { today, protocols = ["https:"] }: { today: Date; protocols?: readonly string[] },
): void {
  let url: URL | undefined;
  try {
    url = new URL(link.href);
  } catch {
    issues.push({ path: `${path}.href`, message: "URL inválida" });
  }
  if (url && !protocols.includes(url.protocol)) {
    issues.push({ path: `${path}.href`, message: `protocolo deve ser ${protocols.join(" ou ")}` });
  }
  checkIsoDate(link.verifiedAt, `${path}.verifiedAt`, issues, today);
}

export function checkSlug(slug: string, path: string, issues: ContentIssue[]): void {
  if (!SLUG_PATTERN.test(slug)) {
    issues.push({ path, message: "slug deve ser kebab-case minúsculo (a-z, 0-9, -)" });
  }
}

export function checkUnique(values: readonly string[], path: string, issues: ContentIssue[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) issues.push({ path, message: `valor duplicado: ${value}` });
    seen.add(value);
  }
}
