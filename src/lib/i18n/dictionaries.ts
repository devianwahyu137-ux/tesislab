import id from "../../../locales/id.json";
import en from "../../../locales/en.json";
import type { Locale } from "./config";

export type Dictionary = typeof id;

/**
 * Compile-time guarantee that every supported locale dictionary
 * implements the exact same key structure as the canonical `id` dictionary.
 */
export const DICTIONARIES: Record<Locale, Dictionary> = {
  id,
  en,
};

type Primitive = string | number | boolean;

type DotNestedKeys<T> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? K
    : T[K] extends Record<string, unknown>
      ? `${K}.${DotNestedKeys<T[K]>}`
      : never;
}[keyof T & string];

export type DictionaryKey = DotNestedKeys<Dictionary>;

/** Retrieve the full dictionary object for a given locale. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/**
 * Type-safe dot-notation lookup helper with full TypeScript autocomplete.
 */
export function t(dict: Dictionary, key: DictionaryKey): string {
  const segments = key.split(".");
  let current: unknown = dict;

  for (const segment of segments) {
    if (
      current === null ||
      typeof current !== "object" ||
      !(segment in current)
    ) {
      return key;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : key;
}
