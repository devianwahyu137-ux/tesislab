"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { OhlcBar } from "@/app/api/history/route";
import type { MarketTechnicals } from "@/lib/quant/technicalIndicators";
import { cn } from "@/lib/utils";

export interface TradingPriceChartProps {
  symbol: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  onTechnicalsLoaded?: (technicals: MarketTechnicals | null) => void;
}

const CHART_THEMES = {
  dark: {
    bg: "#0B0D10",
    text: "#A8B3C5",
    grid: "#1A2029",
    border: "#1E242B",
    up: "#10B981",
    down: "#EF4444",
    entry: "#38BDF8",
  },
  light: {
    bg: "#FFFFFF",
    text: "#334155",
    grid: "#EEF2F6",
    border: "#D5DCE4",
    up: "#047857",
    down: "#BE123C",
    entry: "#0284C7",
  },
} as const;

/**
 * Interactive TradingView Lightweight Charts Candlestick View.
 * Fetches 90-day daily OHLCV from /api/history and draws real-time horizontal
 * Entry, Take Profit, and Stop Loss price lines synced with the audit form.
 */
export function TradingPriceChart({
  symbol,
  entryPrice,
  takeProfit,
  stopLoss,
  onTechnicalsLoaded,
}: TradingPriceChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const onTechRef = useRef(onTechnicalsLoaded);
  useEffect(() => {
    onTechRef.current = onTechnicalsLoaded;
  }, [onTechnicalsLoaded]);

  const [bars, setBars] = useState<OhlcBar[]>([]);
  const [technicals, setTechnicals] = useState<MarketTechnicals | null>(null);
  const [resolvedSymbol, setResolvedSymbol] = useState<string>(symbol);
  const [currency, setCurrency] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );

  // Fetch 90-day OHLCV bars whenever symbol changes (debounced)
  useEffect(() => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(
          `/api/history?symbol=${encodeURIComponent(cleanSymbol)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setBars([]);
          setTechnicals(null);
          onTechRef.current?.(null);
          setStatus("unavailable");
          return;
        }
        const data = (await res.json()) as {
          symbol?: string;
          currency?: string;
          bars?: OhlcBar[];
          technicals?: MarketTechnicals | null;
        };
        if (!data.bars || data.bars.length === 0) {
          setBars([]);
          setTechnicals(null);
          onTechRef.current?.(null);
          setStatus("unavailable");
          return;
        }
        setBars(data.bars);
        const tech = data.technicals ?? null;
        setTechnicals(tech);
        onTechRef.current?.(tech);
        setResolvedSymbol(data.symbol ?? cleanSymbol);
        setCurrency(data.currency ?? "");
        setStatus("ready");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setBars([]);
          setTechnicals(null);
          onTechRef.current?.(null);
          setStatus("unavailable");
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [symbol]);

  // Mount Lightweight Charts instance once and handle resizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pal = CHART_THEMES[theme];
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: pal.bg },
        textColor: pal.text,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: pal.grid },
        horzLines: { color: pal.grid },
      },
      rightPriceScale: {
        borderColor: pal.border,
      },
      timeScale: {
        borderColor: pal.border,
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: pal.text, labelBackgroundColor: pal.border },
        horzLine: { color: pal.text, labelBackgroundColor: pal.border },
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
      },
      handleScale: {
        mouseWheel: false,
        pinch: true,
      },
      width: container.clientWidth,
      height: 220,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: pal.up,
      downColor: pal.down,
      borderVisible: false,
      wickUpColor: pal.up,
      wickDownColor: pal.down,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (container.clientWidth > 0) {
        chart.applyOptions({ width: container.clientWidth });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      priceLinesRef.current = [];
      seriesRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
    // Theme updates handled cleanly in dedicated effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync theme changes without recreating chart
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const pal = CHART_THEMES[theme];
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: pal.bg },
        textColor: pal.text,
      },
      grid: {
        vertLines: { color: pal.grid },
        horzLines: { color: pal.grid },
      },
      rightPriceScale: { borderColor: pal.border },
      timeScale: { borderColor: pal.border },
    });
    series.applyOptions({
      upColor: pal.up,
      downColor: pal.down,
      wickUpColor: pal.up,
      wickDownColor: pal.down,
    });
  }, [theme]);

  // Sync OHLCV bars into candlestick series
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || bars.length === 0) return;

    series.setData(
      bars.map((b) => ({
        time: b.time as UTCTimestamp,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    );
    chart.timeScale().fitContent();
  }, [bars]);

  // Sync real-time Entry / TP / SL horizontal price lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || bars.length === 0) return;

    for (const line of priceLinesRef.current) {
      series.removePriceLine(line);
    }
    priceLinesRef.current = [];

    const pal = CHART_THEMES[theme];
    const nextLines: IPriceLine[] = [];

    if (Number.isFinite(takeProfit) && takeProfit > 0) {
      nextLines.push(
        series.createPriceLine({
          price: takeProfit,
          color: pal.up,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "TP",
        })
      );
    }
    if (Number.isFinite(entryPrice) && entryPrice > 0) {
      nextLines.push(
        series.createPriceLine({
          price: entryPrice,
          color: pal.entry,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: "ENTRY",
        })
      );
    }
    if (Number.isFinite(stopLoss) && stopLoss > 0) {
      nextLines.push(
        series.createPriceLine({
          price: stopLoss,
          color: pal.down,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "SL",
        })
      );
    }

    priceLinesRef.current = nextLines;
  }, [entryPrice, takeProfit, stopLoss, bars.length, theme]);

  return (
    <div className="overflow-hidden rounded-sm border border-hairline bg-obsidian">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-3.5 py-2">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="font-semibold uppercase tracking-wider text-text-primary">
            {resolvedSymbol || symbol}
          </span>
          {currency && (
            <span className="text-[10px] uppercase text-text-muted">
              {currency} · {t("chart.candles_90d")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider">
          <span className="text-cleared">TP</span>
          <span className="text-sky-400">ENTRY</span>
          <span className="text-rejected">SL</span>
        </div>
      </div>

      <div className="relative h-[220px] w-full">
        <div ref={containerRef} className="h-full w-full" />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian/80 backdrop-blur-[1px]">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              {t("chart.loading")}
            </span>
          </div>
        )}

        {status === "unavailable" && (
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian/95 px-4 text-center">
            <span className="font-mono text-[11px] text-text-muted">
              {t("chart.unavailable")}
            </span>
          </div>
        )}
      </div>

      {/* Live Quantitative Technicals Strip (simple-statistics) */}
      {technicals && status === "ready" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-surface/60 px-3.5 py-2 font-mono text-[10px] tabular-nums">
          <span className="text-text-secondary">
            ATR-14:{" "}
            <strong className="text-text-primary">
              {technicals.atr_pct.toFixed(2)}%
            </strong>
          </span>
          <span className="text-text-secondary">
            RSI-14:{" "}
            <strong
              className={cn(
                technicals.rsi_14 >= 70
                  ? "text-rejected"
                  : technicals.rsi_14 <= 30
                    ? "text-cleared"
                    : "text-text-primary"
              )}
            >
              {technicals.rsi_14.toFixed(1)}
            </strong>
          </span>
          <span className="text-text-secondary">
            TREND:{" "}
            <strong
              className={cn(
                technicals.trend_regime === "BULLISH"
                  ? "text-cleared"
                  : technicals.trend_regime === "BEARISH"
                    ? "text-rejected"
                    : "text-conditional"
              )}
            >
              {technicals.trend_regime}
            </strong>
          </span>
          <span className="text-text-secondary">
            VOL (1Y):{" "}
            <strong className="text-text-primary">
              {technicals.annualized_volatility_pct.toFixed(1)}%
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
