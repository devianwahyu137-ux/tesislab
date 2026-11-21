"use client";

import { LOCALE_META, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Compact segmented language switcher styled for the Swiss Editorial Terminal.
 * Enforces >= 44px touch targets for tablet and mobile ergonomics.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("nav.language_label")}
      className="inline-flex items-center border border-[#1E242B] bg-[#12161B] p-0.5 font-mono text-xs"
    >
      {SUPPORTED_LOCALES.map((code, index) => {
        const isActive = locale === code;
        const meta = LOCALE_META[code];

        return (
          <div key={code} className="inline-flex items-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className="mx-0.5 h-4 w-px bg-[#1E242B]"
              />
            )}
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={isActive}
              title={meta.label}
              className={`min-h-[44px] min-w-[44px] px-3 tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 ${
                isActive
                  ? "bg-[#1E242B] font-semibold text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {meta.code}
            </button>
          </div>
        );
      })}
    </div>
  );
}
