"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
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

const SAMPLE_TRADING: TradeAuditInput = {
  asset_symbol: "BBCA.JK",
  direction: "LONG",
  total_capital: 100_000_000,
  position_size_pct: 25,
  entry_price: 9_800,
  take_profit: 10_780,
  stop_loss: 9_310,
  rationale: "Rebound di area support mingguan dengan target konsolidasi atas.",
};

const SAMPLE_BUSINESS: BusinessAuditInput = {
  initial_capital: 45_000_000,
  monthly_fixed_cost: 12_000_000,
  selling_price: 250_000,
  unit_cogs: 165_000,
  target_monthly_units: 180,
  business_concept: "Ekspansi booth ritel batik modern di pusat perbelanjaan.",
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

  const executeAudit = useCallback(
    async (opts: { mode: "live" | "demo"; track: AuditTrack }) => {
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

        setAuditOutcome(data, inputPayload, opts.track);
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
    ]
  );

  // Listen for Hero "Run Instant Demo" trigger
  useEffect(() => {
    if (
      demoTriggerCount > 0 &&
      demoTriggerCount !== lastDemoCountRef.current
    ) {
      lastDemoCountRef.current = demoTriggerCount;
      handleLoadSample(activeTrack);
      void executeAudit({ mode: "demo", track: activeTrack });
    }
  }, [demoTriggerCount, activeTrack, handleLoadSample, executeAudit]);

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
      <EditorialPanel
        title={t("form.select_track_label")}
        indexCode="WRK-02"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Track Tabs + Sample Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
            <div
              role="tablist"
              aria-label={t("form.select_track_label")}
              className="flex flex-wrap gap-2"
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
                      "min-h-[44px] rounded-sm border px-3.5 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
                      isSelected
                        ? "border-cleared/60 bg-cleared/10 font-semibold text-cleared"
                        : "border-hairline bg-obsidian text-text-secondary hover:border-active-border hover:text-text-primary"
                    )}
                  >
                    {t(`tracks.${track}.name`)}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleLoadSample(activeTrack)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm border border-active-border bg-obsidian px-3 font-mono text-xs uppercase tracking-wider text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
            >
              <Sparkles className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
              <span>{t("form.load_sample_btn")}</span>
            </button>
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-cleared/50 bg-cleared/15 px-6 font-mono text-xs font-semibold uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/25 disabled:opacity-60"
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
      </EditorialPanel>

      {/* Official Verdict Card & Zero-Cost Stress Slider */}
      {auditResponse && (
        <>
          <VerdictCard />
          <div id="stress-slider-slot">
            <StressSliderPanel />
          </div>
        </>
      )}
    </div>
  );
}
