"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RotateCcw,
  Flame,
  ArrowRight,
  AlertCircle,
  Gauge,
  Sparkles,
  Crosshair,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { PrecisionSlider } from "@/components/ui/PrecisionSlider";
import { AuditHistoryPanel } from "@/components/workspace/AuditHistoryPanel";
import { FormattedNumberInput } from "@/components/workspace/FormattedNumberInput";
import { LivePreAuditPanel } from "@/components/workspace/LivePreAuditPanel";
import { StressSliderPanel } from "@/components/workspace/StressSliderPanel";
import { TickerSearchCombobox } from "@/components/workspace/TickerSearchCombobox";
import { TradingPriceChart } from "@/components/workspace/TradingPriceChart";
import { VerdictCard } from "@/components/workspace/VerdictCard";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { getDemoPresetByTrack } from "@/lib/agents/demoPresets";
import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import {
  appendAuditHistory,
  clearAuditHistory,
  loadAuditHistory,
  type AuditHistoryEntry,
} from "@/lib/auditHistory";
import type {
  BusinessAuditInput,
  CashflowAuditInput,
  TradeAuditInput,
} from "@/lib/calculators";
import type { MarketTechnicals } from "@/lib/quant/technicalIndicators";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const TRACKS: readonly AuditTrack[] = ["trading", "business", "cashflow"];

const SAMPLE_TRADING: TradeAuditInput = {
  asset_symbol: "BBCA.JK",
  direction: "LONG",
  total_capital: 25_000_000,
  position_size_pct: 40,
  entry_price: 5_550,
  take_profit: 5_850,
  stop_loss: 5_200,
  round_trip_fee_pct: 0.4,
  rationale: "FOMO mengejar pantulan teknikal saat IHSG sedang koreksi tajam.",
};

function roundPriceForScale(price: number): number {
  if (price >= 1000) return Math.round(price / 5) * 5;
  if (price >= 100) return Math.round(price);
  return Number(price.toFixed(2));
}

const SAMPLE_BUSINESS: BusinessAuditInput = {
  initial_capital: 30_000_000,
  monthly_fixed_cost: 14_500_000,
  selling_price: 220_000,
  unit_cogs: 155_000,
  target_monthly_units: 210,
  platform_commission_pct: 0,
  include_umkm_tax: true,
  business_concept:
    "Ekspansi booth ritel batik modern dengan sewa tetap mal Rp14,5 jt/bulan.",
};

const SAMPLE_CASHFLOW: CashflowAuditInput = {
  monthly_net_income: 12_000_000,
  current_monthly_expenses: 7_500_000,
  existing_debt_installment: 0,
  new_monthly_installment: 4_200_000,
  installment_months: 12,
  flat_interest_pct_per_month: 1.5,
  liquid_emergency_fund: 15_000_000,
  decision_purpose: "Cicilan laptop kerja dan perangkat produksi selama 12 bulan.",
};

const DEMO_PRESET_MAP: Record<AuditTrack, string> = {
  trading: "demo_trading_bbca",
  business: "demo_business_batik",
  cashflow: "demo_cashflow_gadget",
};

const TRAP_PRESETS: readonly {
  track: AuditTrack;
  conviction: number;
}[] = [
  { track: "trading", conviction: 80 },
  { track: "business", conviction: 85 },
  { track: "cashflow", conviction: 80 },
];

type MobilePaneTab = "input" | "telemetry" | "verdict";

export interface AuditWorkspaceProps {
  variant?: "default" | "terminal";
  initialTrack?: AuditTrack;
  initialSymbol?: string;
  autoRunDemo?: boolean;
}

/**
 * Interactive 3-track Pre-Mortem Audit Workspace connected to POST /api/audit.
 * Supports both stacked layout and resizable institutional terminal split-pane layout.
 */
export function AuditWorkspace({
  variant = "default",
  initialTrack,
  initialSymbol,
  autoRunDemo = false,
}: AuditWorkspaceProps) {
  const { locale, t } = useTranslation();
  const {
    activeTrack,
    setActiveTrack,
    demoTriggerCount,
    auditPhase,
    setAuditPhase,
    setActiveAgent,
    userConviction,
    setUserConviction,
    auditResponse,
    liveRiskSnapshot,
    setAuditOutcome,
    resetAudit,
  } = useAuditUI();

  const [tradingInput, setTradingInput] = useState<TradeAuditInput>(() =>
    initialSymbol
      ? { ...SAMPLE_TRADING, asset_symbol: initialSymbol.trim().toUpperCase() }
      : SAMPLE_TRADING
  );
  const [businessInput, setBusinessInput] =
    useState<BusinessAuditInput>(SAMPLE_BUSINESS);
  const [cashflowInput, setCashflowInput] =
    useState<CashflowAuditInput>(SAMPLE_CASHFLOW);

  const [mobileTab, setMobileTab] = useState<MobilePaneTab>("input");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [liveQuote, setLiveQuote] = useState<{
    symbol: string;
    price: number;
    change_pct: number;
    currency: string;
  } | null>(null);
  const [marketTechnicals, setMarketTechnicals] =
    useState<MarketTechnicals | null>(null);
  const [historyEntries, setHistoryEntries] = useState<AuditHistoryEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDemoCountRef = useRef(0);
  const didInitParamsRef = useRef(false);

  useEffect(() => {
    const tId = setTimeout(() => setHistoryEntries(loadAuditHistory()), 0);
    return () => clearTimeout(tId);
  }, []);

  const clearPhaseTimer = () => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  };

  useEffect(() => clearPhaseTimer, []);

  const getActiveInput = useCallback(
    (track: AuditTrack): Record<string, unknown> => {
      if (track === "trading") {
        return {
          ...tradingInput,
          ...(marketTechnicals?.atr_pct
            ? { atr_pct: marketTechnicals.atr_pct }
            : {}),
        };
      }
      if (track === "business") return { ...businessInput };
      return { ...cashflowInput };
    },
    [tradingInput, businessInput, cashflowInput, marketTechnicals]
  );

  const handleLoadSample = useCallback(
    (track: AuditTrack = activeTrack) => {
      if (track === "trading") setTradingInput(SAMPLE_TRADING);
      else if (track === "business") setBusinessInput(SAMPLE_BUSINESS);
      else setCashflowInput(SAMPLE_CASHFLOW);
      setErrorMessage(null);
    },
    [activeTrack]
  );

  // Synchronizes form state with the exact server DemoPreset input so Form, Telemetry, Verdict & Stress Curve match 100%
  const applyDemoPresetInput = useCallback(
    (track: AuditTrack): Record<string, unknown> => {
      const preset = getDemoPresetByTrack(track);
      if (preset.track === "trading") {
        setTradingInput({ ...preset.input, round_trip_fee_pct: 0.4 });
      } else if (preset.track === "business") {
        setBusinessInput({ ...preset.input });
      } else {
        setCashflowInput({ ...preset.input });
      }
      setErrorMessage(null);
      return { ...preset.input };
    },
    []
  );

  const handleApplyTrap = useCallback(
    (track: AuditTrack, conviction: number) => {
      setActiveTrack(track);
      handleLoadSample(track);
      setUserConviction(conviction);
      setMobileTab("input");
      toast.info(`${t("toast.trap_loaded")}: ${t(`form.traps.${track}.label`)}`);
    },
    [handleLoadSample, setActiveTrack, setUserConviction, t]
  );

  const handleFetchLiveQuote = useCallback(
    async (overrideSymbol?: string) => {
      const symbol = (overrideSymbol ?? tradingInput.asset_symbol)
        .trim()
        .toUpperCase();
      if (!symbol) return;
      setIsFetchingQuote(true);
      try {
        const res = await fetch(
          `/api/quote?symbol=${encodeURIComponent(symbol)}`
        );
        const data = (await res.json()) as {
          symbol?: string;
          price?: number;
          change_pct?: number;
          currency?: string;
          message?: string;
        };
        if (!res.ok || typeof data.price !== "number") {
          toast.error(data.message ?? t("quote.toast_error"));
          return;
        }
        const nextEntry =
          data.price >= 100
            ? Math.round(data.price)
            : Number(data.price.toFixed(2));
        const resolvedSymbol = data.symbol ?? symbol;
        const changePct = data.change_pct ?? 0;
        const currency = data.currency ?? "USD";

        setTradingInput((prev) => {
          const isLong = prev.direction === "LONG";
          const autoTp = roundPriceForScale(
            nextEntry * (isLong ? 1.06 : 0.94)
          );
          const autoSl = roundPriceForScale(
            nextEntry * (isLong ? 0.96 : 1.04)
          );
          return {
            ...prev,
            asset_symbol: resolvedSymbol,
            entry_price: nextEntry,
            take_profit: autoTp,
            stop_loss: autoSl,
            round_trip_fee_pct: resolvedSymbol.endsWith(".JK") ? 0.4 : 0.2,
          };
        });
        setLiveQuote({
          symbol: resolvedSymbol,
          price: nextEntry,
          change_pct: changePct,
          currency,
        });
        const sign = changePct >= 0 ? "+" : "";
        toast.success(
          `${t("quote.toast_success")}: ${resolvedSymbol} @ ${nextEntry.toLocaleString("id-ID")} ${currency} (${sign}${changePct.toFixed(2)}%)`
        );
      } catch {
        toast.error(t("quote.toast_error"));
      } finally {
        setIsFetchingQuote(false);
      }
    },
    [tradingInput.asset_symbol, t]
  );

  const handleDirectionChange = useCallback((nextDir: "LONG" | "SHORT") => {
    setTradingInput((prev) => {
      if (prev.direction === nextDir) return prev;
      const entry = Math.max(0.0001, prev.entry_price || 1);
      const tpDistPct = Math.max(
        0.015,
        Math.abs(prev.take_profit - entry) / entry
      );
      const slDistPct = Math.max(
        0.01,
        Math.abs(prev.stop_loss - entry) / entry
      );
      const isLong = nextDir === "LONG";
      return {
        ...prev,
        direction: nextDir,
        take_profit: roundPriceForScale(
          entry * (isLong ? 1 + tpDistPct : 1 - tpDistPct)
        ),
        stop_loss: roundPriceForScale(
          entry * (isLong ? 1 - slDistPct : 1 + slDistPct)
        ),
      };
    });
  }, []);

  const handleApplyTradingPreset = useCallback(
    (rrMultiple: number, autoSafeSize: boolean) => {
      setTradingInput((prev) => {
        const entry = Math.max(
          0.0001,
          marketTechnicals?.last_close || prev.entry_price || 1
        );
        const slPct = marketTechnicals?.atr_pct
          ? Math.max(
              1.5,
              Math.min(12, Number((marketTechnicals.atr_pct * 1.5).toFixed(2)))
            )
          : 4;
        const tpPct = slPct * rrMultiple;
        const isLong = prev.direction === "LONG";
        const nextSl = roundPriceForScale(
          entry * (isLong ? 1 - slPct / 100 : 1 + slPct / 100)
        );
        const nextTp = roundPriceForScale(
          entry * (isLong ? 1 + tpPct / 100 : 1 - tpPct / 100)
        );
        const safeSize = autoSafeSize
          ? Math.max(1, Math.min(100, Math.floor((2 / slPct) * 100)))
          : prev.position_size_pct;

        return {
          ...prev,
          entry_price: roundPriceForScale(entry),
          take_profit: nextTp,
          stop_loss: nextSl,
          position_size_pct: safeSize,
        };
      });
      toast.success(
        autoSafeSize
          ? t("form.trading.preset_optimal_toast")
          : `${t("form.trading.preset_rr_toast")} 1:${rrMultiple.toFixed(1)}`
      );
    },
    [marketTechnicals, t]
  );

  const handleApplySafeSizeOnly = useCallback(() => {
    setTradingInput((prev) => {
      const entry = Math.max(0.0001, prev.entry_price || 1);
      const slDistPct = (Math.abs(entry - prev.stop_loss) / entry) * 100;
      if (slDistPct <= 0) return prev;
      const safeSize = Math.max(
        1,
        Math.min(100, Math.floor((2 / slDistPct) * 100))
      );
      return { ...prev, position_size_pct: safeSize };
    });
    toast.success(t("form.trading.safe_size_toast"));
  }, [t]);

  const handleSyncMarketPrice = useCallback(() => {
    const marketPrice = marketTechnicals?.last_close;
    if (!marketPrice || marketPrice <= 0) {
      void handleFetchLiveQuote();
      return;
    }
    setTradingInput((prev) => {
      const entry = Math.max(0.0001, prev.entry_price || marketPrice);
      const tpDistPct = Math.max(
        0.02,
        Math.abs(prev.take_profit - entry) / entry
      );
      const slDistPct = Math.max(
        0.015,
        Math.abs(prev.stop_loss - entry) / entry
      );
      const isLong = prev.direction === "LONG";
      const syncedEntry = roundPriceForScale(marketPrice);
      return {
        ...prev,
        entry_price: syncedEntry,
        take_profit: roundPriceForScale(
          syncedEntry * (isLong ? 1 + tpDistPct : 1 - tpDistPct)
        ),
        stop_loss: roundPriceForScale(
          syncedEntry * (isLong ? 1 - slDistPct : 1 + slDistPct)
        ),
      };
    });
    toast.success(t("form.trading.sync_price_toast"));
  }, [marketTechnicals, handleFetchLiveQuote, t]);

  const tpDeltaPct =
    tradingInput.entry_price > 0
      ? ((tradingInput.take_profit - tradingInput.entry_price) /
          tradingInput.entry_price) *
        100
      : 0;
  const slDeltaPct =
    tradingInput.entry_price > 0
      ? ((tradingInput.stop_loss - tradingInput.entry_price) /
          tradingInput.entry_price) *
        100
      : 0;

  const executeAudit = useCallback(
    async (opts: {
      mode: "live" | "demo";
      track: AuditTrack;
      convictionOverride?: number;
      inputOverride?: Record<string, unknown>;
    }) => {
      clearPhaseTimer();
      setIsSubmitting(true);
      setErrorMessage(null);
      setAuditPhase("scanning");
      setActiveAgent("data_analyst");

      phaseTimerRef.current = setTimeout(() => {
        setAuditPhase("debating");
        setActiveAgent("risk_manager");
      }, 450);

      const inputPayload = opts.inputOverride ?? getActiveInput(opts.track);
      const convictionUsed = opts.convictionOverride ?? userConviction;

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: opts.mode,
            preset_id:
              opts.mode === "demo" ? DEMO_PRESET_MAP[opts.track] : undefined,
            track: opts.track,
            locale,
            input: inputPayload,
          }),
        });

        const data = (await res.json()) as
          | CommitteeAuditResponse
          | { error?: string; message?: string };

        clearPhaseTimer();

        if (!res.ok || !("verdict" in data)) {
          setAuditPhase("idle");
          setActiveAgent(null);
          setErrorMessage(
            ("message" in data && data.message) || t("form.api_error_fallback")
          );
          return;
        }

        const authoritativeInput = data.resolved_input ?? inputPayload;
        setAuditOutcome(data, authoritativeInput, opts.track, convictionUsed);
        if (variant === "terminal") {
          setMobileTab("verdict");
        }
        setHistoryEntries(
          appendAuditHistory({
            audit_id: data.verdict.audit_id,
            track: opts.track,
            timestamp: new Date().toISOString(),
            verdict_status: data.verdict.verdict_status,
            score: data.verdict.score,
            submitted_conviction: convictionUsed,
            ruin_probability_pct: data.monte_carlo.ruin_probability_pct,
            headline_verdict: data.verdict.headline_verdict,
          })
        );
        toast.success(t("toast.audit_done"));
      } catch {
        clearPhaseTimer();
        setAuditPhase("idle");
        setActiveAgent(null);
        setErrorMessage(t("form.api_error_fallback"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      getActiveInput,
      locale,
      setActiveAgent,
      setAuditOutcome,
      setAuditPhase,
      t,
      userConviction,
      variant,
    ]
  );

  // Hydrate initial URL query params (?track=...&symbol=...&demo=1) once on mount
  useEffect(() => {
    if (didInitParamsRef.current) return;
    didInitParamsRef.current = true;
    const tId = setTimeout(() => {
      const targetTrack = initialTrack ?? activeTrack;
      if (initialTrack && initialTrack !== activeTrack) {
        setActiveTrack(initialTrack);
      }
      if (initialSymbol && targetTrack === "trading") {
        void handleFetchLiveQuote(initialSymbol);
      }
      if (autoRunDemo) {
        const syncedInput = applyDemoPresetInput(targetTrack);
        const presetConviction = 80;
        setUserConviction(presetConviction);
        void executeAudit({
          mode: "demo",
          track: targetTrack,
          convictionOverride: presetConviction,
          inputOverride: syncedInput,
        });
      }
    }, 0);
    return () => clearTimeout(tId);
  }, [
    initialTrack,
    initialSymbol,
    autoRunDemo,
    activeTrack,
    setActiveTrack,
    handleFetchLiveQuote,
    applyDemoPresetInput,
    setUserConviction,
    executeAudit,
  ]);

  // Listen for "Run Instant Demo" trigger and sync form inputs with DemoPreset
  useEffect(() => {
    if (
      demoTriggerCount > 0 &&
      demoTriggerCount !== lastDemoCountRef.current
    ) {
      lastDemoCountRef.current = demoTriggerCount;
      const tId = setTimeout(() => {
        const presetConviction =
          TRAP_PRESETS.find((p) => p.track === activeTrack)?.conviction ?? 80;
        const syncedInput = applyDemoPresetInput(activeTrack);
        setUserConviction(presetConviction);
        void executeAudit({
          mode: "demo",
          track: activeTrack,
          convictionOverride: presetConviction,
          inputOverride: syncedInput,
        });
      }, 0);
      return () => clearTimeout(tId);
    }
  }, [
    demoTriggerCount,
    activeTrack,
    applyDemoPresetInput,
    setUserConviction,
    executeAudit,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeAudit({ mode: "live", track: activeTrack });
  };

  const handleReset = () => {
    clearPhaseTimer();
    setErrorMessage(null);
    resetAudit();
  };

  const formNode = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Clean Segmented Control for 3 Audit Tracks */}
      <div className="flex flex-col gap-3 border-b border-hairline pb-4">
        <div
          role="tablist"
          aria-label={t("form.select_track_label")}
          className="grid grid-cols-3 gap-1 rounded-sm border border-hairline bg-canvas p-1"
        >
          {TRACKS.map((track) => {
            const isSelected = activeTrack === track;
            return (
              <button
                key={track}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setActiveTrack(track);
                  setErrorMessage(null);
                }}
                className={cn(
                  "relative min-h-[36px] rounded-xs px-1.5 py-1.5 font-mono text-[10px] leading-tight uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:min-h-[40px] sm:px-3 sm:text-xs sm:tracking-wider",
                  isSelected
                    ? "font-semibold text-ink-primary"
                    : "text-ink-muted hover:text-ink-primary"
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId="active-audit-track-tab"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-xs bg-surface shadow-xs"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">
                  {t(`tracks.${track}.name`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quiet Quick-Load Real-World Trap Chips */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible">
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted sm:text-[10px]">
            <Flame className="h-3 w-3 text-conditional" aria-hidden="true" />
            <span>{t("form.traps_label")}:</span>
          </span>
          {TRAP_PRESETS.map((trap) => {
            const isSelected = activeTrack === trap.track;
            return (
              <button
                key={trap.track}
                type="button"
                onClick={() => handleApplyTrap(trap.track, trap.conviction)}
                className={cn(
                  "inline-flex min-h-[26px] shrink-0 items-center gap-1 rounded-xs border px-2 py-0.5 font-sans text-[10.5px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:min-h-[28px] sm:text-[11px]",
                  isSelected
                    ? "border-active-border bg-surface-elevated font-medium text-ink-primary"
                    : "border-hairline bg-canvas text-ink-secondary hover:border-active-border hover:text-ink-primary"
                )}
              >
                <span>{t(`form.traps.${trap.track}.label`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Track 1: Trading Inputs + Live Candlestick Price Chart */}
      {activeTrack === "trading" && (
        <div className="flex flex-col gap-4">
          <TradingPriceChart
            symbol={tradingInput.asset_symbol}
            entryPrice={tradingInput.entry_price}
            takeProfit={tradingInput.take_profit}
            stopLoss={tradingInput.stop_loss}
            onTechnicalsLoaded={setMarketTechnicals}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="trade-symbol"
                className="font-sans text-xs font-medium text-text-secondary"
              >
                {t("form.trading.asset_symbol")}
              </label>

              <TickerSearchCombobox
                value={tradingInput.asset_symbol}
                onChange={(sym) =>
                  setTradingInput((prev) => ({
                    ...prev,
                    asset_symbol: sym,
                    round_trip_fee_pct: sym.trim().toUpperCase().endsWith(".JK")
                      ? 0.4
                      : 0.2,
                  }))
                }
                onSelectSymbol={(sym) => {
                  setTradingInput((prev) => ({ ...prev, asset_symbol: sym }));
                  void handleFetchLiveQuote(sym);
                }}
                onFetchLive={() => void handleFetchLiveQuote()}
                isFetchingQuote={isFetchingQuote}
              />

              {liveQuote && (
                <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2 rounded-xs border border-cleared/35 bg-cleared/8 px-2.5 py-1.5 font-mono text-[11px] tabular-nums">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cleared">
                    {t("quote.live_badge")} · {liveQuote.symbol}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      <NumberFlow
                        value={liveQuote.price}
                        locales="id-ID"
                        suffix={` ${liveQuote.currency}`}
                      />
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        liveQuote.change_pct >= 0
                          ? "text-cleared"
                          : "text-rejected"
                      )}
                    >
                      ({liveQuote.change_pct >= 0 ? "+" : ""}
                      {liveQuote.change_pct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-xs font-medium text-text-secondary">
                {t("form.trading.direction")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["LONG", "SHORT"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => handleDirectionChange(dir)}
                    className={cn(
                      "min-h-[42px] rounded-sm border font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
                      tradingInput.direction === dir
                        ? dir === "LONG"
                          ? "border-cleared/60 bg-cleared/15 text-cleared"
                          : "border-rejected/60 bg-rejected/15 text-rejected"
                        : "border-hairline bg-obsidian text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {dir === "LONG" ? "▲ LONG" : "▼ SHORT"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="trade-capital"
                className="font-sans text-xs font-medium text-text-secondary"
              >
                {t("form.trading.total_capital")}
              </label>
              <FormattedNumberInput
                id="trade-capital"
                prefix="Rp"
                value={tradingInput.total_capital}
                onChange={(val) =>
                  setTradingInput({ ...tradingInput, total_capital: val })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="trade-size"
                className="font-sans text-xs font-medium text-text-secondary"
              >
                {t("form.trading.position_size_pct")}
              </label>
              <FormattedNumberInput
                id="trade-size"
                allowDecimal
                suffix="%"
                value={tradingInput.position_size_pct}
                onChange={(val) =>
                  setTradingInput({
                    ...tradingInput,
                    position_size_pct: val,
                  })
                }
              />
            </div>

            {/* Entry / TP / SL 3-Column Precision Grid */}
            <div className="grid grid-cols-3 gap-2 sm:col-span-2 sm:gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-entry"
                  className="flex items-center justify-between font-sans text-xs font-medium text-text-secondary"
                >
                  <span>{t("form.trading.entry_price")}</span>
                  <span className="font-mono text-[10px] text-sky-400">
                    ENTRY
                  </span>
                </label>
                <FormattedNumberInput
                  id="trade-entry"
                  allowDecimal
                  value={tradingInput.entry_price}
                  onChange={(val) =>
                    setTradingInput({ ...tradingInput, entry_price: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-tp"
                  className="flex items-center justify-between font-sans text-xs font-medium text-text-secondary"
                >
                  <span>{t("form.trading.take_profit")}</span>
                  <span className="font-mono text-[10px] font-semibold tabular-nums text-cleared">
                    {tpDeltaPct >= 0 ? "+" : ""}
                    {tpDeltaPct.toFixed(1)}%
                  </span>
                </label>
                <FormattedNumberInput
                  id="trade-tp"
                  allowDecimal
                  value={tradingInput.take_profit}
                  onChange={(val) =>
                    setTradingInput({ ...tradingInput, take_profit: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-sl"
                  className="flex items-center justify-between font-sans text-xs font-medium text-text-secondary"
                >
                  <span>{t("form.trading.stop_loss")}</span>
                  <span className="font-mono text-[10px] font-semibold tabular-nums text-rejected">
                    {slDeltaPct >= 0 ? "+" : ""}
                    {slDeltaPct.toFixed(1)}%
                  </span>
                </label>
                <FormattedNumberInput
                  id="trade-sl"
                  allowDecimal
                  value={tradingInput.stop_loss}
                  onChange={(val) =>
                    setTradingInput({ ...tradingInput, stop_loss: val })
                  }
                />
              </div>
            </div>

            {/* Smart R:R & ATR-14 Calibration Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xs border border-hairline bg-obsidian/80 px-3 py-2 sm:col-span-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                <Sparkles className="h-3 w-3 text-cleared" aria-hidden="true" />
                <span>{t("form.trading.smart_calibration_label")}</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTradingPreset(1.5, false)}
                  className="rounded-xs border border-hairline bg-surface px-2 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
                >
                  1:1.5
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTradingPreset(2, true)}
                  className="inline-flex items-center gap-1 rounded-xs border border-cleared/45 bg-cleared/12 px-2.5 py-1 font-mono text-[10px] font-semibold text-cleared transition-colors hover:bg-cleared/20"
                >
                  <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>{t("form.trading.preset_optimal")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTradingPreset(3, false)}
                  className="rounded-xs border border-hairline bg-surface px-2 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
                >
                  1:3.0
                </button>
                <button
                  type="button"
                  onClick={handleApplySafeSizeOnly}
                  className="inline-flex items-center gap-1 rounded-xs border border-hairline bg-surface px-2 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
                >
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>{t("form.trading.preset_safe_size")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncMarketPrice}
                  className="inline-flex items-center gap-1 rounded-xs border border-hairline bg-surface px-2 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-sky-400/50 hover:text-sky-400"
                >
                  <Crosshair className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>{t("form.trading.preset_sync_market")}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="trade-fee"
                className="flex items-center justify-between gap-2 font-sans text-xs font-medium text-text-secondary"
              >
                <span>{t("form.trading.round_trip_fee_pct")}</span>
                <span className="font-mono text-[10px] text-text-muted">
                  IDX ~0.40%
                </span>
              </label>
              <FormattedNumberInput
                id="trade-fee"
                allowDecimal
                suffix="%"
                value={tradingInput.round_trip_fee_pct ?? 0.4}
                onChange={(val) =>
                  setTradingInput({
                    ...tradingInput,
                    round_trip_fee_pct: Math.min(5, Math.max(0, val)),
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="trade-rationale"
                className="font-sans text-xs font-medium text-text-secondary"
              >
                {t("form.trading.rationale")}
              </label>
              <input
                id="trade-rationale"
                type="text"
                required
                value={tradingInput.rationale}
                onChange={(e) =>
                  setTradingInput({
                    ...tradingInput,
                    rationale: e.target.value,
                  })
                }
                placeholder={t("form.trading.rationale_ph")}
                className="min-h-[42px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
              />
            </div>
          </div>
        </div>
      )}

      {/* Track 2: Business & UMKM Inputs */}
      {activeTrack === "business" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label
              htmlFor="biz-concept"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.business.business_concept")}
            </label>
            <input
              id="biz-concept"
              type="text"
              required
              value={businessInput.business_concept}
              onChange={(e) =>
                setBusinessInput({
                  ...businessInput,
                  business_concept: e.target.value,
                })
              }
              placeholder={t("form.business.business_concept_ph")}
              className="min-h-[42px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="biz-capital"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.business.initial_capital")}
            </label>
            <FormattedNumberInput
              id="biz-capital"
              prefix="Rp"
              value={businessInput.initial_capital}
              onChange={(val) =>
                setBusinessInput({ ...businessInput, initial_capital: val })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="biz-fixed"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.business.monthly_fixed_cost")}
            </label>
            <FormattedNumberInput
              id="biz-fixed"
              prefix="Rp"
              value={businessInput.monthly_fixed_cost}
              onChange={(val) =>
                setBusinessInput({
                  ...businessInput,
                  monthly_fixed_cost: val,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="biz-price"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.business.selling_price")}
            </label>
            <FormattedNumberInput
              id="biz-price"
              prefix="Rp"
              value={businessInput.selling_price}
              onChange={(val) =>
                setBusinessInput({ ...businessInput, selling_price: val })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="biz-cogs"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.business.unit_cogs")}
            </label>
            <FormattedNumberInput
              id="biz-cogs"
              prefix="Rp"
              value={businessInput.unit_cogs}
              onChange={(val) =>
                setBusinessInput({ ...businessInput, unit_cogs: val })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="biz-units"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.business.target_monthly_units")}
            </label>
            <FormattedNumberInput
              id="biz-units"
              suffix="unit"
              value={businessInput.target_monthly_units}
              onChange={(val) =>
                setBusinessInput({
                  ...businessInput,
                  target_monthly_units: val,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="biz-commission"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.business.platform_commission_pct")}
            </label>
            <FormattedNumberInput
              id="biz-commission"
              allowDecimal
              suffix="%"
              value={businessInput.platform_commission_pct ?? 0}
              onChange={(val) =>
                setBusinessInput({
                  ...businessInput,
                  platform_commission_pct: Math.min(50, Math.max(0, val)),
                })
              }
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-sm border border-hairline bg-obsidian px-3 py-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(businessInput.include_umkm_tax)}
              onChange={(e) =>
                setBusinessInput({
                  ...businessInput,
                  include_umkm_tax: e.target.checked,
                })
              }
              className="h-4 w-4 accent-emerald-500"
            />
            <span className="font-sans text-xs font-medium text-text-secondary">
              {t("form.business.include_umkm_tax")}
            </span>
          </label>
        </div>
      )}

      {/* Track 3: Cashflow Inputs */}
      {activeTrack === "cashflow" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label
              htmlFor="cash-purpose"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.decision_purpose")}
            </label>
            <input
              id="cash-purpose"
              type="text"
              required
              value={cashflowInput.decision_purpose}
              onChange={(e) =>
                setCashflowInput({
                  ...cashflowInput,
                  decision_purpose: e.target.value,
                })
              }
              placeholder={t("form.cashflow.decision_purpose_ph")}
              className="min-h-[42px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cash-income"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.monthly_net_income")}
            </label>
            <FormattedNumberInput
              id="cash-income"
              prefix="Rp"
              value={cashflowInput.monthly_net_income}
              onChange={(val) =>
                setCashflowInput({
                  ...cashflowInput,
                  monthly_net_income: val,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cash-expenses"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.current_monthly_expenses")}
            </label>
            <FormattedNumberInput
              id="cash-expenses"
              prefix="Rp"
              value={cashflowInput.current_monthly_expenses}
              onChange={(val) =>
                setCashflowInput({
                  ...cashflowInput,
                  current_monthly_expenses: val,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cash-existing-debt"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.existing_debt_installment")}
            </label>
            <FormattedNumberInput
              id="cash-existing-debt"
              prefix="Rp"
              value={cashflowInput.existing_debt_installment ?? 0}
              onChange={(val) =>
                setCashflowInput({
                  ...cashflowInput,
                  existing_debt_installment: val,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cash-installment"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.new_monthly_installment")}
            </label>
            <FormattedNumberInput
              id="cash-installment"
              prefix="Rp"
              value={cashflowInput.new_monthly_installment}
              onChange={(val) =>
                setCashflowInput({
                  ...cashflowInput,
                  new_monthly_installment: val,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cash-months"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.installment_months")}
            </label>
            <FormattedNumberInput
              id="cash-months"
              suffix={locale === "id" ? "bln" : "mo"}
              value={cashflowInput.installment_months}
              onChange={(val) =>
                setCashflowInput({
                  ...cashflowInput,
                  installment_months: Math.max(1, val),
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cash-flat-rate"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.flat_interest_pct")}
            </label>
            <FormattedNumberInput
              id="cash-flat-rate"
              allowDecimal
              suffix="%/bln"
              value={cashflowInput.flat_interest_pct_per_month ?? 0}
              onChange={(val) =>
                setCashflowInput({
                  ...cashflowInput,
                  flat_interest_pct_per_month: Math.min(25, Math.max(0, val)),
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label
              htmlFor="cash-emergency"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {t("form.cashflow.liquid_emergency_fund")}
            </label>
            <FormattedNumberInput
              id="cash-emergency"
              prefix="Rp"
              value={cashflowInput.liquid_emergency_fund}
              onChange={(val) =>
                setCashflowInput({
                  ...cashflowInput,
                  liquid_emergency_fund: val,
                })
              }
            />
          </div>
        </div>
      )}

      {/* Initial Conviction Calibration Slider */}
      <div className="rounded-sm border border-hairline bg-obsidian p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              <Gauge className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
              <span>{t("conviction.slider_title")}</span>
            </span>
            <label
              htmlFor="initial-conviction-slider"
              className="font-sans text-xs font-medium text-text-primary"
            >
              {t("conviction.slider_question")}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-hairline bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
              {userConviction <= 40
                ? t("conviction.level_low")
                : userConviction <= 70
                  ? t("conviction.level_mid")
                  : t("conviction.level_high")}
            </span>
            <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
              {userConviction}%
            </span>
          </div>
        </div>

        <PrecisionSlider
          id="initial-conviction-slider"
          min={10}
          max={100}
          step={5}
          value={userConviction}
          onValueChange={setUserConviction}
          tone={userConviction > 75 ? "conditional" : "cleared"}
          ticks={[25, 55, 85]}
          ariaLabel={t("conviction.slider_question")}
        />

        <div className="flex justify-between font-mono text-[10px] text-text-muted">
          <span>10%</span>
          <span>55%</span>
          <span>100%</span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-sm border border-rejected/40 bg-rejected/10 p-3 font-sans text-xs text-rejected"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-sm border border-hairline bg-obsidian px-4 font-mono text-xs uppercase tracking-wider text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("form.clear_btn")}</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="cta-primary-polish inline-flex min-h-[42px] items-center gap-2 rounded-sm bg-cleared px-6 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared transition-all hover:brightness-105 disabled:opacity-75"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          <span>
            {isSubmitting
              ? t("form.submitting_btn")
              : t("form.submit_audit_btn")}
          </span>
          {!isSubmitting && (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Live 3-Stage Committee Deliberation Stepper while Auditing */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 gap-2 rounded-sm border border-cleared/35 bg-obsidian p-3 sm:grid-cols-3"
          >
            {(
              [
                {
                  code: "DIV-01",
                  label: t("form.deliberation_step_1"),
                  active: auditPhase === "scanning",
                  done: auditPhase === "debating" || auditPhase === "verdict",
                },
                {
                  code: "DIV-02",
                  label: t("form.deliberation_step_2"),
                  active: auditPhase === "debating",
                  done: auditPhase === "verdict",
                },
                {
                  code: "DIV-03",
                  label: t("form.deliberation_step_3"),
                  active: false,
                  done: auditPhase === "verdict",
                },
              ] as const
            ).map((step) => (
              <div
                key={step.code}
                className={cn(
                  "flex items-center gap-2 rounded-xs border px-2.5 py-2 font-mono text-[10px]",
                  step.done
                    ? "border-cleared/40 bg-cleared/10 text-cleared"
                    : step.active
                      ? "border-conditional/50 bg-conditional/10 text-conditional"
                      : "border-hairline bg-surface text-text-muted"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : step.active ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-text-muted/40" />
                )}
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold tracking-widest opacity-80">
                    {step.code}
                  </span>
                  <span className="block truncate">{step.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );

  const telemetryNode = (
    <LivePreAuditPanel
      activeTrack={activeTrack}
      tradingInput={tradingInput}
      businessInput={businessInput}
      cashflowInput={cashflowInput}
      userConviction={userConviction}
      marketTechnicals={marketTechnicals}
      onApplyOptimalTrading={() => handleApplyTradingPreset(2, true)}
    />
  );

  const verdictAndLedgerNode = (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {auditResponse && (
          <motion.div
            key={auditResponse.verdict.audit_id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <EditorialPanel title={t("warroom.transcript_title")}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(
                  [
                    { role: "data_analyst", code: "DIV-01" },
                    { role: "risk_manager", code: "DIV-02" },
                    { role: "committee_chair", code: "DIV-03" },
                  ] as const
                ).map(({ role, code }) => (
                  <div
                    key={role}
                    className="flex flex-col gap-3 rounded-sm border border-hairline bg-obsidian p-4"
                  >
                    <div className="flex items-center gap-2.5 border-b border-hairline pb-2.5">
                      <AgentAvatar
                        role={role}
                        phase="verdict"
                        isActive
                        size={32}
                      />
                      <div className="min-w-0">
                        <span className="block font-mono text-[10px] tracking-widest text-text-muted">
                          {code}
                        </span>
                        <span className="block truncate font-sans text-xs font-semibold text-text-primary">
                          {t(`agents.roles.${role}.name`)}
                        </span>
                      </div>
                    </div>
                    <p className="font-sans text-xs leading-relaxed text-text-secondary">
                      {auditResponse.verdict.agent_deliberation[role]}
                    </p>
                  </div>
                ))}
              </div>
            </EditorialPanel>

            <VerdictCard />
            <div id="stress-slider-slot">
              <StressSliderPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuditHistoryPanel
        entries={historyEntries}
        onClear={() => {
          clearAuditHistory();
          setHistoryEntries([]);
        }}
      />
    </div>
  );

  // Terminal Mode: Desktop Resizable Split-Pane + Mobile/iPad Ergonomic Tab Switcher
  if (variant === "terminal") {
    return (
      <div className="flex h-full flex-col">
        {/* Mobile & iPad Segmented Pane Switcher (< 1024px) */}
        <div className="sticky top-0 z-20 border-b border-hairline bg-obsidian/95 px-3 py-2 backdrop-blur-xs lg:hidden">
          <div className="grid grid-cols-3 gap-1 rounded-sm border border-hairline bg-canvas p-1">
            {(
              [
                { id: "input", label: t("terminal.tab_input") },
                {
                  id: "telemetry",
                  label: `${t("terminal.tab_telemetry")}${liveRiskSnapshot ? ` (${liveRiskSnapshot.score})` : ""}`,
                },
                {
                  id: "verdict",
                  label: `${t("terminal.tab_verdict")}${auditResponse ? " ●" : ""}`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={cn(
                  "min-h-[34px] rounded-xs px-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors sm:text-[11px]",
                  mobileTab === tab.id
                    ? "bg-surface text-cleared shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3.5 sm:p-5 lg:hidden">
          {mobileTab === "input" && formNode}
          {mobileTab === "telemetry" && telemetryNode}
          {mobileTab === "verdict" && (
            <div className="flex flex-col gap-5">
              {!auditResponse && telemetryNode}
              {verdictAndLedgerNode}
            </div>
          )}
        </div>

        {/* Desktop Resizable Horizontal Split-Pane (>= 1024px) */}
        <div className="hidden min-h-0 flex-1 lg:block">
          <Group
            id="tesislab-audit-split"
            orientation="horizontal"
            className="h-full w-full"
          >
            <Panel
              id="audit-left-pane"
              defaultSize="56%"
              minSize="38%"
              className="h-full overflow-y-auto p-6"
            >
              {formNode}
            </Panel>

            <Separator className="group relative flex w-2 items-center justify-center bg-canvas transition-colors hover:bg-cleared/15 data-[separator=active]:bg-cleared/25">
              <div className="h-full w-px bg-hairline transition-colors group-hover:bg-cleared/60" />
              <GripVertical
                className="pointer-events-none absolute h-3.5 w-3.5 text-text-muted opacity-60 group-hover:text-cleared group-hover:opacity-100"
                aria-hidden="true"
              />
            </Separator>

            <Panel
              id="audit-right-pane"
              defaultSize="44%"
              minSize="32%"
              className="h-full overflow-y-auto bg-obsidian/40 p-6"
            >
              <div className="flex flex-col gap-6">
                {telemetryNode}
                {verdictAndLedgerNode}
              </div>
            </Panel>
          </Group>
        </div>
      </div>
    );
  }

  // Default Mode
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">{formNode}</div>
        <div className="lg:col-span-5">{telemetryNode}</div>
      </div>
      {verdictAndLedgerNode}
    </div>
  );
}
