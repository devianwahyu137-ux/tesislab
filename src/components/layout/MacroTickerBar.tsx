"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface MacroTickerBarProps {
  macroContext: MarketContext;
}

const REGIME_STYLES: Record<MarketContext["synthesis"]["macro_regime"], string> =
  {
    RISK_ON: "border-cleared/40 bg-cleared/12 text-cleared",
    CAUTIOUS: "border-conditional/40 bg-conditional/12 text-conditional",
    RISK_OFF: "border-rejected/45 bg-rejected/12 text-rejected",
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

function formatChange(changePct: number, source?: string): string {
  if (
    changePct === 0 &&
    (source === "frankfurter" || source === "gold-api" || source === "emergency")
  ) {
    return "—";
  }
  const sign = changePct > 0 ? "+" : "";
  return `${sign}${changePct.toFixed(2)}%`;
}

function formatSnapshotDate(updatedAt: string, locale: string): string {
  const parsed = Date.parse(updatedAt);
  if (Number.isNaN(parsed)) {
    return "Snapshot";
  }
  return new Date(parsed).toLocaleDateString(
    locale === "en" ? "en-US" : "id-ID",
    { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }
  );
}

/**
 * Live scrolling institutional market ticker tape.
 * Pins the active macro regime badge on the left while indicators and the full
 * daily synthesis glide smoothly across desktop, iPad, and mobile (pauses on hover).
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

  const renderSegment = (prefix: string) => (
    <div className="flex shrink-0 items-center gap-6 pr-6">
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
            key={`${prefix}-${item.key}`}
            className="flex items-baseline gap-1.5 whitespace-nowrap font-mono text-[11px] tabular-nums sm:text-xs"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              {item.label}
            </span>
            <span className="font-semibold text-text-primary">
              {formatPrice(item.key, item.data.price)}
            </span>
            <span className={cn("text-[10px] font-semibold", pctColor)}>
              {formatChange(pct, item.data.source)}
            </span>
          </div>
        );
      })}

      <span className="h-3 w-px bg-hairline" aria-hidden="true" />

      <span className="whitespace-nowrap font-sans text-xs font-medium text-text-secondary">
        {summary}
      </span>

      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared/60"
        aria-hidden="true"
      />
    </div>
  );

  const dateLabel = formatSnapshotDate(macroContext.updated_at, locale);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const parsed = Date.parse(macroContext.updated_at);
    const stale = Number.isNaN(parsed) || (Date.now() - parsed) / 3_600_000 > 24;
    const tId = setTimeout(() => setIsStale(stale), 0);
    return () => clearTimeout(tId);
  }, [macroContext.updated_at]);

  return (
    <div className="w-full border-b border-hairline bg-obsidian/95">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-5 sm:py-2 md:px-8">
        {/* Pinned Macro Regime Pill + Honest Snapshot Age */}
        <div className="flex shrink-0 items-center gap-1.5 border-r border-hairline pr-2 sm:gap-2 sm:pr-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] sm:gap-1.5 sm:px-2 sm:text-[10px]",
              REGIME_STYLES[regime]
            )}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
            />
            <span>{regime}</span>
          </span>
          <span
            suppressHydrationWarning
            className={cn(
              "hidden font-mono text-[10px] md:inline",
              isStale ? "text-conditional" : "text-text-muted"
            )}
            title={macroContext.updated_at}
          >
            {isStale
              ? `${dateLabel} (${locale === "en" ? "snapshot" : "arsip"})`
              : dateLabel}
          </span>
        </div>

        {/* Continuous Scrolling Ticker Tape (pauses on hover, full untruncated summary) */}
        <div className="ticker-fade-mask relative min-w-0 flex-1 overflow-hidden">
          <div className="animate-ticker-tape flex w-max items-center">
            {renderSegment("a")}
            {renderSegment("b")}
          </div>
        </div>
      </div>
    </div>
  );
}
