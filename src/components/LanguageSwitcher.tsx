"use client";

import { LOCALE_META, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

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
      className="inline-flex items-center rounded-sm border border-hairline bg-surface p-0.5 font-mono text-xs"
    >
      {SUPPORTED_LOCALES.map((code, index) => {
        const isActive = locale === code;
        const meta = LOCALE_META[code];

        return (
          <div key={code} className="inline-flex items-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className="mx-0.5 h-4 w-px bg-hairline"
              />
            )}
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={isActive}
              title={meta.label}
              className={cn(
                "min-h-[44px] min-w-[44px] rounded-sm px-3 tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
                isActive
                  ? "bg-elevated font-semibold text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {meta.code}
            </button>
          </div>
        );
      })}
    </div>
  );
}
