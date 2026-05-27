import * as SecureStore from 'expo-secure-store';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { bg } from './bg';
import { en } from './en';

export const translations = {
  bg,
  en,
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof en;

export const defaultLocale: Locale = 'bg';
const LOCALE_STORAGE_KEY = 'taskly_mobile_locale';

let currentLocale: Locale = defaultLocale;

export function t(key: TranslationKey, locale: Locale = currentLocale) {
  return translations[locale][key] ?? translations.en[key];
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => Promise<void>;
  toggleLocale: () => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return value === 'bg' || value === 'en';
}

async function loadStoredLocale() {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return null;
    return await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function saveStoredLocale(locale: Locale) {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return;
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Locale persistence is best-effort; the in-memory choice still applies.
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);

  useEffect(() => {
    let mounted = true;

    async function restoreLocale() {
      const stored = await loadStoredLocale();
      if (!mounted || !isLocale(stored)) return;
      currentLocale = stored;
      setLocaleState(stored);
    }

    void restoreLocale();

    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    currentLocale = nextLocale;
    setLocaleState(nextLocale);
    await saveStoredLocale(nextLocale);
  }, []);

  const toggleLocale = useCallback(async () => {
    await setLocale(currentLocale === 'bg' ? 'en' : 'bg');
  }, [setLocale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    return {
      locale: currentLocale,
      setLocale: async (nextLocale: Locale) => {
        currentLocale = nextLocale;
        await saveStoredLocale(nextLocale);
      },
      toggleLocale: async () => {
        const nextLocale = currentLocale === 'bg' ? 'en' : 'bg';
        currentLocale = nextLocale;
        await saveStoredLocale(nextLocale);
      },
    };
  }

  return context;
}
