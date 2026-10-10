import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { pt, type Dictionary } from "./dictionaries/pt";

export type { Dictionary };

/** Server-side only by convention: client islands receive just the strings they need as props. */
export const dictionaries: Record<Locale, Dictionary> = { pt, en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
