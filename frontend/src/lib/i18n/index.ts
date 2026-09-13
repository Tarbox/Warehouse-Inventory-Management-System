import { en } from "./en";
import { cs } from "./cs";

export type Locale = "en" | "cs";

type TranslationValue<T> = {
  [K in keyof T]: T[K] extends object
    ? TranslationValue<T[K]>
    : string;
};

export type Translation = TranslationValue<typeof en>;

export const translations: Record<Locale, Translation> = {
  en,
  cs,
};

export function getTranslations(
  locale: Locale,
): Translation {
  return translations[locale];
}