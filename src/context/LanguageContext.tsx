"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isSupportedLocale,
  type Locale,
} from "@/lib/i18n/config";
import {
  getDictionary,
  t as translateKey,
  type Dictionary,
  type DictionaryKey,
} from "@/lib/i18n/dictionaries";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  dict: Dictionary;
  t: (key: DictionaryKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Provides active locale state and translation helpers.
 * Initial render uses DEFAULT_LOCALE to guarantee SSR/client hydration parity,
 * then syncs with localStorage inside useEffect.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isSupportedLocale(stored) && stored !== DEFAULT_LOCALE) {
        setLocaleState(stored);
      }
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = getDictionary(locale);
    return {
      locale,
      setLocale,
      dict,
      t: (key: DictionaryKey) => translateKey(dict, key),
    };
  }, [locale, setLocale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook to access the active locale, dictionary, and `t()` helper. */
export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}
