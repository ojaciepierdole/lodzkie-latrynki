export const locales = ['pl', 'en', 'de', 'es', 'uk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pl';

export const localeNames: Record<Locale, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  uk: 'Українська',
};

export const localeFlags: Record<Locale, string> = {
  pl: '🇵🇱',
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  uk: '🇺🇦',
};
