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
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { FormattedNumberInput } from "@/components/workspace/FormattedNumberInput";
import { StressSliderPanel } from "@/components/workspace/StressSliderPanel";
import { VerdictCard } from "@/components/workspace/VerdictCard";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import type {
  BusinessAuditInput,
  CashflowAuditInput,
  TradeAuditInput,
} from "@/lib/calculators";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const TRACKS: readonly AuditTrack[] = ["trading", "business", "cashflow"];

const QUICK_TICKERS = ["BBCA.JK", "BBRI.JK", "BTC-USD", "GC=F"] as const;

const SAMPLE_TRADING: TradeAuditInput = {
  asset_symbol: "BBCA.JK",
  direction: "LONG",
  total_capital: 25_000_000,
  position_size_pct: 40,
  entry_price: 9_800,
  take_profit: 10_300,
  stop_loss: 9_150,
  rationale: "FOMO mengejar pantulan teknikal saat IHSG sedang koreksi tajam.",
};

const SAMPLE_BUSINESS: BusinessAuditInput = {
  initial_capital: 30_000_000,
  monthly_fixed_cost: 14_500_000,
  selling_price: 220_000,
  unit_cogs: 155_000,
  target_monthly_units: 210,
  business_concept: "Ekspansi booth ritel batik modern dengan sewa tetap mal Rp14,5 jt/bulan.",
};

const SAMPLE_CASHFLOW: CashflowAuditInput = {
  monthly_net_income: 12_000_000,
  current_monthly_expenses: 7_500_000,
  new_monthly_installment: 4_200_000,
  installment_months: 12,
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

/**
 * Interactive 3-track Pre-Mortem Audit Workspace connected to POST /api/audit.
 */
export function AuditWorkspace() {
  const { locale, t } = useTranslation();
  const {
    activeTrack,
    setActiveTrack,
    demoTriggerCount,
    setAuditPhase,
    setActiveAgent,
    userConviction,
    setUserConviction,
    auditResponse,
    setAuditOutcome,
    resetAudit,
  } = useAuditUI();

  const [tradingInput, setTradingInput] =
    useState<TradeAuditInput>(SAMPLE_TRADING);
  const [businessInput, setBusinessInput] =
    useState<BusinessAuditInput>(SAMPLE_BUSINESS);
  const [cashflowInput, setCashflowInput] =
    useState<CashflowAuditInput>(SAMPLE_CASHFLOW);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [liveQuote, setLiveQuote] = useState<{
    symbol: string;
    price: number;
    change_pct: number;
    currency: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDemoCountRef = useRef(0);

  const clearPhaseTimer = () => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  };

  useEffect(() => clearPhaseTimer, []);

  const getActiveInput = useCallback(
    (track: AuditTrack): Record<string, unknown> => {
      if (track === "trading") return { ...tradingInput };
      if (track === "business") return { ...businessInput };
      return { ...cashflowInput };
    },
    [tradingInput, businessInput, cashflowInput]
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

  const handleApplyTrap = useCallback(
    (track: AuditTrack, conviction: number) => {
      setActiveTrack(track);
      handleLoadSample(track);
      setUserConviction(conviction);
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

        setTradingInput((prev) => ({
          ...prev,
          asset_symbol: resolvedSymbol,
          entry_price: nextEntry,
        }));
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

  const executeAudit = useCallback(
    async (opts: {
      mode: "live" | "demo";
      track: AuditTrack;
      convictionOverride?: number;
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

      const inputPayload = getActiveInput(opts.track);
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

        setAuditOutcome(data, inputPayload, opts.track, convictionUsed);
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
    ]
  );

  // Listen for Hero "Run Instant Demo" trigger
  useEffect(() => {
    if (
      demoTriggerCount > 0 &&
      demoTriggerCount !== lastDemoCountRef.current
    ) {
      lastDemoCountRef.current = demoTriggerCount;
      const presetConviction =
        TRAP_PRESETS.find((p) => p.track === activeTrack)?.conviction ?? 85;
      handleLoadSample(activeTrack);
      setUserConviction(presetConviction);
      void executeAudit({
        mode: "demo",
        track: activeTrack,
        convictionOverride: presetConviction,
      });
    }
  }, [
    demoTriggerCount,
    activeTrack,
    handleLoadSample,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Clean Segmented Control for 3 Audit Tracks */}
          <div className="flex flex-col gap-3 border-b border-hairline pb-4">
            <div
              role="tablist"
              aria-label={t("form.select_track_label")}
              className="grid grid-cols-1 gap-1.5 rounded-sm border border-hairline bg-canvas p-1 sm:grid-cols-3"
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
                      "relative min-h-[42px] rounded-xs px-3 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
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
                      "inline-flex min-h-[34px] items-center gap-1.5 rounded-xs border px-2.5 py-1 font-sans text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
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

          {/* Track 1: Trading Inputs */}
          {activeTrack === "trading" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-symbol"
                  className="font-sans text-xs font-medium text-text-secondary"
                >
                  {t("form.trading.asset_symbol")}
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="trade-symbol"
                    type="text"
                    required
                    value={tradingInput.asset_symbol}
                    onChange={(e) =>
                      setTradingInput({
                        ...tradingInput,
                        asset_symbol: e.target.value,
                      })
                    }
                    placeholder={t("form.trading.asset_symbol_ph")}
                    className="min-h-[44px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-mono text-sm uppercase text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
                  />
                  <button
                    type="button"
                    onClick={() => void handleFetchLiveQuote()}
                    disabled={isFetchingQuote || !tradingInput.asset_symbol.trim()}
                    title={t("quote.fetch_btn")}
                    className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-sm border border-active-border bg-surface px-3 font-mono text-[11px] uppercase tracking-wider text-text-secondary transition-colors hover:border-cleared/60 hover:text-cleared disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isFetchingQuote && "animate-spin"
                      )}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">
                      {isFetchingQuote
                        ? t("quote.fetching_btn")
                        : t("quote.fetch_btn")}
                    </span>
                  </button>
                </div>

                {/* Quick Live Tickers + Rolling Price Badge */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {t("quote.quick_tickers")}:
                  </span>
                  {QUICK_TICKERS.map((sym) => {
                    const isActiveSym =
                      tradingInput.asset_symbol.trim().toUpperCase() === sym;
                    return (
                      <button
                        key={sym}
                        type="button"
                        disabled={isFetchingQuote}
                        onClick={() => {
                          setTradingInput((prev) => ({
                            ...prev,
                            asset_symbol: sym,
                          }));
                          void handleFetchLiveQuote(sym);
                        }}
                        className={cn(
                          "rounded-xs border px-2 py-0.5 font-mono text-[10px] transition-colors disabled:opacity-50",
                          isActiveSym
                            ? "border-cleared/60 bg-cleared/10 text-cleared"
                            : "border-hairline bg-surface text-text-secondary hover:border-active-border hover:text-text-primary"
                        )}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>

                {liveQuote && (
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xs border border-cleared/35 bg-cleared/8 px-2.5 py-1.5 font-mono text-[11px] tabular-nums">
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
                      onClick={() =>
                        setTradingInput({ ...tradingInput, direction: dir })
                      }
                      className={cn(
                        "min-h-[44px] rounded-sm border font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
                        tradingInput.direction === dir
                          ? dir === "LONG"
                            ? "border-cleared/60 bg-cleared/15 text-cleared"
                            : "border-rejected/60 bg-rejected/15 text-rejected"
                          : "border-hairline bg-obsidian text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {dir}
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

              <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-1">
                <label
                  htmlFor="trade-entry"
                  className="font-sans text-xs font-medium text-text-secondary"
                >
                  {t("form.trading.entry_price")}
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

              <div className="grid grid-cols-2 gap-3 sm:col-span-2 md:col-span-1">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="trade-tp"
                    className="font-sans text-xs font-medium text-text-secondary"
                  >
                    {t("form.trading.take_profit")}
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
                    className="font-sans text-xs font-medium text-text-secondary"
                  >
                    {t("form.trading.stop_loss")}
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

              <div className="flex flex-col gap-1.5 sm:col-span-2">
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
                  className="min-h-[44px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
                />
              </div>
            </div>
          )}

          {/* Track 2: Business Inputs */}
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
                  className="min-h-[44px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
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

              <div className="flex flex-col gap-1.5 sm:col-span-2">
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
                  className="min-h-[44px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
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
          <div className="rounded-sm border border-active-border/80 bg-obsidian p-4">
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

            <div className="flex min-h-[44px] items-center">
              <input
                id="initial-conviction-slider"
                type="range"
                min={10}
                max={100}
                step={5}
                value={userConviction}
                onChange={(e) => setUserConviction(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-sm bg-elevated accent-emerald-500"
              />
            </div>

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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-hairline bg-obsidian px-4 font-mono text-xs uppercase tracking-wider text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("form.clear_btn")}</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-cleared px-6 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <span>
                {isSubmitting
                  ? t("form.submitting_btn")
                  : t("form.submit_audit_btn")}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>

      {/* Single-Source Committee Deliberation Transcript + Official Verdict Card + Stress Slider */}
      <AnimatePresence mode="wait">
        {auditResponse && (
          <motion.div
            key={auditResponse.verdict.audit_id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                      <AgentAvatar role={role} phase="verdict" isActive size={32} />
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
    </div>
  );
}
