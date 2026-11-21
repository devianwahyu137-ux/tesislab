"use client";

import { ScanLine } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  macroOrigin: MacroFeedOrigin;
}

/**
 * Sticky Swiss Editorial Terminal top bar with brand mark, macro feed status,
 * X-Ray Architecture Mode toggle, and bilingual switcher.
 */
export function Navbar({ macroOrigin }: NavbarProps) {
  const { t } = useTranslation();
  const { isXrayMode, toggleXrayMode } = useAuditUI();

  const isRemoteLive = macroOrigin === "remote_data_feed";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-obsidian/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
        {/* Brand + Macro Connection Badge */}
        <div className="flex items-center gap-3">
          <span className="font-editorial text-xl font-medium tracking-tight text-text-primary md:text-2xl">
            TesisLab.
          </span>
          <StatusStamp
            variant={isRemoteLive ? "CLEARED" : "CONDITIONAL"}
            label={isRemoteLive ? t("nav.macro_live") : t("nav.macro_fallback")}
            className="hidden sm:inline-flex"
          />
        </div>

        {/* Right Controls: X-Ray Toggle + Language Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleXrayMode}
            aria-pressed={isXrayMode}
            title={t("nav.xray_hint")}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-sm border px-3 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
              isXrayMode
                ? "border-cleared/60 bg-cleared/10 text-cleared"
                : "border-hairline bg-surface text-text-secondary hover:border-active-border hover:text-text-primary"
            )}
          >
            <ScanLine className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t("nav.xray_label")}</span>
          </button>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
