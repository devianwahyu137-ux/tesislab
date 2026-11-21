"use client";

import { useTranslation } from "@/context/LanguageContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface MacroTickerBarProps {
  macroContext: MarketContext;
}

const REGIME_STYLES: Record<MarketContext["synthesis"]["macro_regime"], string> =
  {
    RISK_ON: "border-cleared/40 bg-cleared/10 text-cleared",
    CAUTIOUS: "border-conditional/40 bg-conditional/10 text-conditional",
    RISK_OFF: "border-rejected/40 bg-rejected/10 text-rejected",
  };

function formatPrice(key: string, price: number): string {
  if (key === "USD_IDR") {
    return `Rp ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (key === "IHSG") {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatChange(changePct: number): string {
  const sign = changePct > 0 ? "+" : "";
  return `${sign}${changePct.toFixed(2)}%`;
}

/**
 * Institutional macro ticker strip with hairline vertical separators,
 * sharp tabular-nums contrast, and localized daily regime summary.
 */
export function MacroTickerBar({ macroContext }: MacroTickerBarProps) {
  const { locale } = useTranslation();

  const items = [
    { key: "USD_IDR", label: "USD/IDR", data: macroContext.indicators.USD_IDR },
    { key: "IHSG", label: "IHSG", data: macroContext.indicators.IHSG },
    { key: "GOLD_USD", label: "GOLD", data: macroContext.indicators.GOLD_USD },
    { key: "BTC_USD", label: "BTC", data: macroContext.indicators.BTC_USD },
  ] as const;

  const regime = macroContext.synthesis.macro_regime;
  const summary =
    locale === "en"
      ? macroContext.synthesis.summary_en
      : macroContext.synthesis.summary_id;

  return (
    <div className="w-full border-b border-hairline bg-obsidian/80 backdrop-blur-xs">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-3 py-2 sm:px-4 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        {/* 4 Macro Indicators with thin vertical dividers on sm+ */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-0">
          {items.map((item, idx) => {
            const pct = item.data.change_pct;
            const pctColor =
              pct > 0
                ? "text-cleared"
                : pct < 0
                  ? "text-rejected"
                  : "text-text-muted";

            return (
              <div
                key={item.key}
                className={cn(
                  "flex items-baseline gap-1.5 font-mono text-[11px] tabular-nums sm:text-xs",
                  idx > 0 && "sm:border-l sm:border-hairline sm:pl-4",
                  idx < items.length - 1 && "sm:pr-4"
                )}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {item.label}
                </span>
                <span className="font-semibold text-text-primary">
                  {formatPrice(item.key, item.data.price)}
                </span>
                <span className={cn("text-[10px] font-medium", pctColor)}>
                  {formatChange(pct)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Regime Badge + Daily Summary */}
        <div className="flex items-center gap-2.5 border-t border-hairline/70 pt-1.5 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <span
            className={cn(
              "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
              REGIME_STYLES[regime]
            )}
          >
            {regime}
          </span>
          <p className="min-w-0 font-sans text-xs leading-snug text-text-secondary line-clamp-1 lg:max-w-sm">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
