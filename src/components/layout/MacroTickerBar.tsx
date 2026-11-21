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
 * Compact live macro strip displaying Hermes daily indicators,
 * market regime badge, and localized macro summary.
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
    <div className="w-full border-b border-hairline bg-surface/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2.5 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* 4 Indicators */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-5">
          {items.map((item) => {
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
                className="flex items-baseline gap-1.5 font-mono text-xs tabular-nums"
              >
                <span className="text-[11px] uppercase tracking-wider text-text-muted">
                  {item.label}
                </span>
                <span className="font-medium text-text-primary">
                  {formatPrice(item.key, item.data.price)}
                </span>
                <span className={cn("text-[11px]", pctColor)}>
                  {formatChange(pct)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Regime Badge + Daily Macro Summary */}
        <div className="flex flex-wrap items-center gap-2.5 border-t border-hairline/70 pt-2 lg:border-t-0 lg:pt-0">
          <span
            className={cn(
              "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
              REGIME_STYLES[regime]
            )}
          >
            {regime}
          </span>
          <p className="font-sans text-xs leading-snug text-text-secondary line-clamp-2 lg:max-w-md lg:truncate">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
