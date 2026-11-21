export const SUPPORTED_LOCALES = ["id", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_STORAGE_KEY = "tesislab_locale";

export const LOCALE_META: Record<Locale, { code: string; label: string }> = {
  id: { code: "ID", label: "Bahasa Indonesia" },
  en: { code: "EN", label: "English" },
};

/** Type guard for validating locale values from storage or URLs. */
export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}
