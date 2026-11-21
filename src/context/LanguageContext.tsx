"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
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
const listeners = new Set<() => void>();

function subscribeLocale(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCALE_STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getClientLocaleSnapshot(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isSupportedLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

/**
 * Provides active locale state and translation helpers.
 * Uses useSyncExternalStore so SSR/initial hydration always uses DEFAULT_LOCALE
 * without triggering React Hydration Mismatches or effect-based setState.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getClientLocaleSnapshot,
    getServerLocaleSnapshot
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }
    listeners.forEach((listener) => listener());
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
