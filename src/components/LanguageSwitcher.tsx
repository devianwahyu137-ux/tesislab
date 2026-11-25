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
      className="inline-flex h-9 items-center rounded-md border border-hairline bg-surface/85 p-0.5 font-mono text-[11px] sm:h-10"
    >
      {SUPPORTED_LOCALES.map((code, index) => {
        const isActive = locale === code;
        const meta = LOCALE_META[code];

        return (
          <div key={code} className="inline-flex h-full items-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className="mx-0.5 h-3.5 w-px bg-hairline"
              />
            )}
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={isActive}
              title={meta.label}
              className={cn(
                "inline-flex h-full items-center justify-center rounded-xs px-2 tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:px-2.5",
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
