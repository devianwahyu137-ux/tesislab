"use client";

import { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { MetricReadout, type MetricTone } from "@/components/ui/MetricReadout";
import { StatusStamp, type StatusStampVariant } from "@/components/ui/StatusStamp";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  simulateBusinessStress,
  simulateCashflowStress,
  simulateTradeStress,
  type BusinessAuditInput,
  type CashflowAuditInput,
  type TradeAuditInput,
} from "@/lib/calculators";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

function getScoreTone(score: number): MetricTone {
  if (score >= 75) return "cleared";
  if (score >= 50) return "conditional";
  return "rejected";
}

function getStatusVariant(score: number): StatusStampVariant {
  if (score >= 75) return "CLEARED";
  if (score >= 50) return "CONDITIONAL";
  return "REJECTED";
}

function formatCompactMoney(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}Rp ${Math.round(abs).toLocaleString("id-ID")}`;
}

/**
 * Zero-cost client-side What-If Stress Slider Panel powered by Sprint 5
 * deterministic calculators. Never calls /api/audit when dragging.
 */
export function StressSliderPanel() {
  const { t } = useTranslation();
  const { auditResponse, lastSubmittedInput, lastTrack } = useAuditUI();
  const [sliderState, setSliderState] = useState<{
    auditId: string | undefined;
    value: number;
  }>({ auditId: undefined, value: 0 });

  const auditId = auditResponse?.verdict.audit_id;
  const sliderValue = sliderState.auditId === auditId ? sliderState.value : 0;
  const setSliderValue = (val: number) =>
    setSliderState({ auditId, value: val });

  const track: AuditTrack = lastTrack ?? "business";

  const sliderConfig =
    track === "trading"
      ? { min: 0, max: 100, step: 5, prefix: "+" }
      : track === "business"
        ? { min: 0, max: 60, step: 5, prefix: "-" }
        : { min: 0, max: 50, step: 5, prefix: "-" };

  const stressed = useMemo(() => {
    if (!auditResponse || !lastSubmittedInput) return null;

    if (track === "trading") {
      const input = lastSubmittedInput as unknown as TradeAuditInput;
      const res = simulateTradeStress(input, sliderValue);
      return {
        score: res.baseline_score,
        metrics: [
          {
            label: t("stress.trading.metric_rr"),
            value: `1 : ${res.rr_ratio.toFixed(2)}`,
            tone: (res.rr_ratio >= 1.5 ? "cleared" : "rejected") as MetricTone,
          },
          {
            label: t("stress.trading.metric_risk"),
            value: `${res.risk_per_trade_pct.toFixed(2)}%`,
            tone: (res.risk_per_trade_pct <= 2
              ? "cleared"
              : res.risk_per_trade_pct <= 3
                ? "conditional"
                : "rejected") as MetricTone,
          },
          {
            label: t("stress.trading.metric_loss"),
            value: formatCompactMoney(res.potential_loss_amount),
            tone: "neutral" as MetricTone,
          },
        ],
      };
    }

    if (track === "business") {
      const input = lastSubmittedInput as unknown as BusinessAuditInput;
      const res = simulateBusinessStress(input, sliderValue);
      const effectiveUnits = Math.round(
        input.target_monthly_units * (1 - sliderValue / 100)
      );
      return {
        score: res.baseline_score,
        metrics: [
          {
            label: t("stress.business.metric_profit"),
            value: formatCompactMoney(res.projected_monthly_profit),
            tone: (res.projected_monthly_profit >= 0
              ? "cleared"
              : "rejected") as MetricTone,
          },
          {
            label: t("stress.business.metric_runway"),
            value:
              res.stressed_runway_months >= 99
                ? "99+ MO"
                : `${res.stressed_runway_months.toFixed(1)} MO`,
            tone: (res.stressed_runway_months >= 6
              ? "cleared"
              : res.stressed_runway_months >= 3
                ? "conditional"
                : "rejected") as MetricTone,
          },
          {
            label: t("stress.business.metric_bep"),
            value: `${effectiveUnits} / ${res.bep_units}`,
            tone: (effectiveUnits >= res.bep_units
              ? "cleared"
              : "rejected") as MetricTone,
          },
        ],
      };
    }

    const input = lastSubmittedInput as unknown as CashflowAuditInput;
    const res = simulateCashflowStress(input, sliderValue);
    return {
      score: res.baseline_score,
      metrics: [
        {
          label: t("stress.cashflow.metric_dsr"),
          value: `${res.dsr_pct.toFixed(2)}%`,
          tone: (res.dsr_pct <= 30 ? "cleared" : "rejected") as MetricTone,
        },
        {
          label: t("stress.cashflow.metric_free"),
          value: formatCompactMoney(res.free_cashflow),
          tone: (res.free_cashflow >= 0 ? "cleared" : "rejected") as MetricTone,
        },
        {
          label: t("stress.cashflow.metric_efund"),
          value: `${res.emergency_fund_months.toFixed(1)} MO`,
          tone: (res.emergency_fund_months >= 6
            ? "cleared"
            : res.emergency_fund_months >= 3
              ? "conditional"
              : "rejected") as MetricTone,
        },
      ],
    };
  }, [auditResponse, lastSubmittedInput, track, sliderValue, t]);

  if (!auditResponse || !lastSubmittedInput || !stressed) {
    return null;
  }

  const baselineScore = auditResponse.metrics.baseline_score;
  const stressedStatusVariant = getStatusVariant(stressed.score);
  const stressedStatusLabel =
    stressed.score >= 75
      ? t("stress.status_survived")
      : stressed.score >= 50
        ? t("stress.status_fragile")
        : t("stress.status_broken");

  const sliderPrompt =
    track === "trading"
      ? t("stress.trading.sl_slippage_label")
      : track === "business"
        ? t("stress.business.sales_drop_label")
        : t("stress.cashflow.income_drop_label");

  return (
    <EditorialPanel title={t("stress.title")} indexCode="STR-03">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl font-sans text-xs leading-relaxed text-text-secondary">
            {t("stress.subtitle")}
          </p>

          {sliderValue > 0 && (
            <button
              type="button"
              onClick={() => setSliderValue(0)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm border border-active-border bg-obsidian px-3 font-mono text-xs uppercase tracking-wider text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("stress.reset_slider")}</span>
            </button>
          )}
        </div>

        {/* Range Slider Control */}
        <div className="rounded-sm border border-hairline bg-obsidian p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label
              htmlFor="what-if-stress-slider"
              className="flex items-center gap-2 font-sans text-xs font-medium text-text-primary"
            >
              <SlidersHorizontal
                className="h-3.5 w-3.5 text-conditional"
                aria-hidden="true"
              />
              <span>{sliderPrompt}</span>
            </label>
            <span className="rounded-sm border border-hairline bg-surface px-2.5 py-1 font-mono text-sm font-semibold tabular-nums text-conditional">
              {sliderValue === 0
                ? "0%"
                : `${sliderConfig.prefix}${sliderValue}%`}
            </span>
          </div>

          <div className="flex min-h-[44px] items-center">
            <input
              id="what-if-stress-slider"
              type="range"
              min={sliderConfig.min}
              max={sliderConfig.max}
              step={sliderConfig.step}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-sm bg-elevated accent-emerald-500"
            />
          </div>

          <div className="mt-1 flex justify-between font-mono text-[10px] text-text-muted">
            <span>0%</span>
            <span>
              {sliderConfig.prefix}
              {Math.round(sliderConfig.max / 2)}%
            </span>
            <span>
              {sliderConfig.prefix}
              {sliderConfig.max}%
            </span>
          </div>
        </div>

        {/* Baseline vs Stressed Score Comparison */}
        <div className="grid grid-cols-1 gap-3 rounded-sm border border-hairline bg-obsidian p-4 sm:grid-cols-3 sm:items-center">
          <MetricReadout
            label={t("stress.baseline_label")}
            value={`${baselineScore}/100`}
            tone={getScoreTone(baselineScore)}
          />
          <MetricReadout
            label={t("stress.stressed_label")}
            value={`${stressed.score}/100`}
            tone={getScoreTone(stressed.score)}
          />
          <div className="flex sm:justify-end">
            <StatusStamp
              variant={stressedStatusVariant}
              label={stressedStatusLabel}
            />
          </div>
        </div>

        {/* 3 Live Stressed Metrics */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {stressed.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-sm border border-hairline bg-obsidian p-4"
            >
              <MetricReadout label={m.label} value={m.value} tone={m.tone} />
            </div>
          ))}
        </div>
      </div>
    </EditorialPanel>
  );
}
