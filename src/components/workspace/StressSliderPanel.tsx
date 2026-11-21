"use client";

import { useMemo, useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { MetricReadout, type MetricTone } from "@/components/ui/MetricReadout";
import { PrecisionSlider } from "@/components/ui/PrecisionSlider";
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
            value: (
              <NumberFlow
                value={res.rr_ratio}
                prefix="1 : "
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              />
            ),
            tone: (res.rr_ratio >= 1.5 ? "cleared" : "rejected") as MetricTone,
          },
          {
            label: t("stress.trading.metric_risk"),
            value: (
              <NumberFlow
                value={res.risk_per_trade_pct}
                suffix="%"
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              />
            ),
            tone: (res.risk_per_trade_pct <= 2
              ? "cleared"
              : res.risk_per_trade_pct <= 3
                ? "conditional"
                : "rejected") as MetricTone,
          },
          {
            label: t("stress.trading.metric_loss"),
            value: (
              <NumberFlow
                value={Math.round(res.potential_loss_amount)}
                prefix="Rp "
                locales="id-ID"
              />
            ),
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
            value: (
              <NumberFlow
                value={Math.round(res.projected_monthly_profit)}
                prefix={res.projected_monthly_profit < 0 ? "-Rp " : "Rp "}
                locales="id-ID"
                format={{ signDisplay: "never" }}
              />
            ),
            tone: (res.projected_monthly_profit >= 0
              ? "cleared"
              : "rejected") as MetricTone,
          },
          {
            label: t("stress.business.metric_runway"),
            value:
              res.stressed_runway_months >= 99 ? (
                "99+ MO"
              ) : (
                <NumberFlow
                  value={res.stressed_runway_months}
                  suffix=" MO"
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                />
              ),
            tone: (res.stressed_runway_months >= 6
              ? "cleared"
              : res.stressed_runway_months >= 3
                ? "conditional"
                : "rejected") as MetricTone,
          },
          {
            label: t("stress.business.metric_bep"),
            value: (
              <>
                <NumberFlow value={effectiveUnits} /> / {res.bep_units}
              </>
            ),
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
          value: (
            <NumberFlow
              value={res.dsr_pct}
              suffix="%"
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            />
          ),
          tone: (res.dsr_pct <= 30 ? "cleared" : "rejected") as MetricTone,
        },
        {
          label: t("stress.cashflow.metric_free"),
          value: (
            <NumberFlow
              value={Math.round(res.free_cashflow)}
              prefix={res.free_cashflow < 0 ? "-Rp " : "Rp "}
              locales="id-ID"
              format={{ signDisplay: "never" }}
            />
          ),
          tone: (res.free_cashflow >= 0 ? "cleared" : "rejected") as MetricTone,
        },
        {
          label: t("stress.cashflow.metric_efund"),
          value: (
            <NumberFlow
              value={res.emergency_fund_months}
              suffix=" MO"
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          ),
          tone: (res.emergency_fund_months >= 6
            ? "cleared"
            : res.emergency_fund_months >= 3
              ? "conditional"
              : "rejected") as MetricTone,
        },
      ],
    };
  }, [auditResponse, lastSubmittedInput, track, sliderValue, t]);

  const curvePoints = useMemo(() => {
    if (!auditResponse || !lastSubmittedInput) return [];

    const verdictScore = auditResponse.verdict.score;
    const baseCalcScore = auditResponse.metrics.baseline_score;
    const points: { stress: number; score: number }[] = [];

    for (let s = sliderConfig.min; s <= sliderConfig.max; s += sliderConfig.step) {
      let rawScore = baseCalcScore;
      if (track === "trading") {
        rawScore = simulateTradeStress(
          lastSubmittedInput as unknown as TradeAuditInput,
          s
        ).baseline_score;
      } else if (track === "business") {
        rawScore = simulateBusinessStress(
          lastSubmittedInput as unknown as BusinessAuditInput,
          s
        ).baseline_score;
      } else {
        rawScore = simulateCashflowStress(
          lastSubmittedInput as unknown as CashflowAuditInput,
          s
        ).baseline_score;
      }
      const delta = Math.max(0, baseCalcScore - rawScore);
      const displayScore = Math.max(0, Math.round(verdictScore - delta));
      points.push({ stress: s, score: displayScore });
    }

    return points;
  }, [
    auditResponse,
    lastSubmittedInput,
    track,
    sliderConfig.min,
    sliderConfig.max,
    sliderConfig.step,
  ]);

  if (!auditResponse || !lastSubmittedInput || !stressed) {
    return null;
  }

  const verdictScore = auditResponse.verdict.score;
  const baseCalcScore = auditResponse.metrics.baseline_score;
  const scoreDelta = Math.max(0, baseCalcScore - stressed.score);
  const stressedDisplayScore = Math.max(0, Math.round(verdictScore - scoreDelta));

  // SVG Resilience Curve geometry
  const svgW = 420;
  const svgH = 124;
  const padL = 30;
  const padR = 14;
  const padT = 12;
  const padB = 22;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const toX = (stressVal: number) =>
    padL + (stressVal / Math.max(1, sliderConfig.max)) * plotW;
  const toY = (scoreVal: number) =>
    padT + ((100 - Math.max(0, Math.min(100, scoreVal))) / 100) * plotH;

  const polylineStr = curvePoints
    .map((p) => `${toX(p.stress).toFixed(1)},${toY(p.score).toFixed(1)}`)
    .join(" ");

  const areaPathStr =
    curvePoints.length > 0
      ? `M ${toX(curvePoints[0].stress).toFixed(1)},${(padT + plotH).toFixed(1)} ` +
        curvePoints
          .map((p) => `L ${toX(p.stress).toFixed(1)},${toY(p.score).toFixed(1)}`)
          .join(" ") +
        ` L ${toX(curvePoints[curvePoints.length - 1].stress).toFixed(1)},${(padT + plotH).toFixed(1)} Z`
      : "";

  const activeX = toX(sliderValue);
  const activeY = toY(stressedDisplayScore);
  const activeStrokeColor =
    stressedDisplayScore >= 75
      ? "var(--color-cleared)"
      : stressedDisplayScore >= 50
        ? "var(--color-conditional)"
        : "var(--color-rejected)";

  const stressedStatusVariant = getStatusVariant(stressedDisplayScore);
  const stressedStatusLabel =
    stressedDisplayScore >= 75
      ? t("stress.status_survived")
      : stressedDisplayScore >= 50
        ? t("stress.status_fragile")
        : t("stress.status_broken");

  const sliderPrompt =
    track === "trading"
      ? t("stress.trading.sl_slippage_label")
      : track === "business"
        ? t("stress.business.sales_drop_label")
        : t("stress.cashflow.income_drop_label");

  return (
    <EditorialPanel title={t("stress.title")}>
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

          <PrecisionSlider
            id="what-if-stress-slider"
            min={sliderConfig.min}
            max={sliderConfig.max}
            step={sliderConfig.step}
            value={sliderValue}
            onValueChange={setSliderValue}
            tone={
              stressedDisplayScore >= 75
                ? "cleared"
                : stressedDisplayScore >= 50
                  ? "conditional"
                  : "rejected"
            }
            ticks={[
              Math.round(sliderConfig.max * 0.25),
              Math.round(sliderConfig.max * 0.5),
              Math.round(sliderConfig.max * 0.75),
            ]}
            ariaLabel={sliderPrompt}
          />

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

        {/* Interactive Resilience Curve (SVG) */}
        {curvePoints.length > 1 && (
          <div className="rounded-sm border border-hairline bg-obsidian p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t("stress.curve_title")}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-rejected/90">
                {t("stress.danger_zone")}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="h-auto w-full overflow-visible"
              role="img"
              aria-label={t("stress.curve_title")}
            >
              {/* Danger zone band (< 50) */}
              <rect
                x={padL}
                y={toY(50)}
                width={plotW}
                height={toY(0) - toY(50)}
                fill="var(--color-rejected)"
                fillOpacity={0.07}
              />

              {/* Horizontal threshold hairlines */}
              {[100, 75, 50, 0].map((tick) => {
                const y = toY(tick);
                const stroke =
                  tick === 75
                    ? "var(--color-cleared)"
                    : tick === 50
                      ? "var(--color-rejected)"
                      : "var(--color-hairline)";
                return (
                  <g key={tick}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={padL + plotW}
                      y2={y}
                      stroke={stroke}
                      strokeOpacity={tick === 75 || tick === 50 ? 0.35 : 0.7}
                      strokeDasharray={tick === 75 || tick === 50 ? "3 3" : undefined}
                      strokeWidth={1}
                    />
                    <text
                      x={padL - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="var(--color-ink-muted)"
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* X-axis tick labels */}
              {[0, Math.round(sliderConfig.max / 2), sliderConfig.max].map(
                (xTick) => (
                  <text
                    key={xTick}
                    x={toX(xTick)}
                    y={svgH - 4}
                    textAnchor={
                      xTick === 0
                        ? "start"
                        : xTick === sliderConfig.max
                          ? "end"
                          : "middle"
                    }
                    fill="var(--color-ink-muted)"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                  >
                    {xTick === 0 ? "0%" : `${sliderConfig.prefix}${xTick}%`}
                  </text>
                )
              )}

              {/* Subtle area fill under curve */}
              <path
                d={areaPathStr}
                fill={activeStrokeColor}
                fillOpacity={0.08}
              />

              {/* Resilience curve polyline */}
              <polyline
                fill="none"
                stroke={activeStrokeColor}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={polylineStr}
              />

              {/* Active vertical drop-line */}
              <motion.line
                initial={false}
                animate={{ x1: activeX, x2: activeX, y1: activeY, y2: toY(0) }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                stroke={activeStrokeColor}
                strokeWidth={1}
                strokeDasharray="2 2"
                strokeOpacity={0.65}
              />

              {/* Active halo + core point */}
              <motion.circle
                initial={false}
                animate={{ cx: activeX, cy: activeY }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                r={7}
                fill={activeStrokeColor}
                fillOpacity={0.2}
              />
              <motion.circle
                initial={false}
                animate={{ cx: activeX, cy: activeY }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                r={3.5}
                fill={activeStrokeColor}
                stroke="var(--color-canvas)"
                strokeWidth={1.5}
              />
            </svg>
          </div>
        )}

        {/* Baseline vs Stressed Score Comparison */}
        <div className="grid grid-cols-1 gap-3 rounded-sm border border-hairline bg-obsidian p-4 sm:grid-cols-3 sm:items-center">
          <MetricReadout
            label={t("stress.baseline_label")}
            value={`${verdictScore}/100`}
            tone={getScoreTone(verdictScore)}
          />
          <MetricReadout
            label={t("stress.stressed_label")}
            value={<NumberFlow value={stressedDisplayScore} suffix="/100" />}
            tone={getScoreTone(stressedDisplayScore)}
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
