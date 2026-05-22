import { bg } from './bg';
import { en } from './en';

export const translations = {
  bg,
  en,
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof en;

export const defaultLocale: Locale = 'bg';

export function t(key: TranslationKey, locale: Locale = defaultLocale) {
  return translations[locale][key] ?? translations.en[key];
}
