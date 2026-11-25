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
  const { locale, t } = useTranslation();
  const isId = locale === "id";
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
  const svgW = 440;
  const svgH = 138;
  const padL = 34;
  const padR = 16;
  const padT = 16;
  const padB = 26;
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

  const quickShocks =
    track === "trading"
      ? [0, 25, 50, 100]
      : track === "business"
        ? [0, 20, 40, 60]
        : [0, 15, 30, 50];

  const breakingPoint = curvePoints.find((pt) => pt.score < 50)?.stress ?? null;

  const shockPresets =
    track === "trading"
      ? [
          { value: 0, tag: "Normal (0%)" },
          { value: 25, tag: "Slippage +25%" },
          { value: 50, tag: "Gap +50%" },
          { value: 100, tag: isId ? "Krisis +100%" : "Crisis +100%" },
        ]
      : track === "business"
        ? [
            { value: 0, tag: "Normal (0%)" },
            { value: 20, tag: isId ? "Sepi -20%" : "Slow -20%" },
            { value: 40, tag: "Drop -40%" },
            { value: 60, tag: isId ? "Krisis -60%" : "Crisis -60%" },
          ]
        : [
            { value: 0, tag: "Normal (0%)" },
            { value: 15, tag: isId ? "Turun -15%" : "Dip -15%" },
            { value: 30, tag: isId ? "Pangkas -30%" : "Cut -30%" },
            { value: 50, tag: isId ? "Krisis -50%" : "Crisis -50%" },
          ];

  return (
    <EditorialPanel title={t("stress.title")}>
      <div className="@container flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <p className="max-w-xl font-sans text-xs leading-relaxed text-text-secondary">
            {t("stress.subtitle")}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                breakingPoint === null
                  ? "rounded-sm border border-cleared/40 bg-cleared/12 px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-cleared"
                  : "rounded-sm border border-rejected/45 bg-rejected/12 px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-rejected"
              }
            >
              {breakingPoint === null
                ? t("stress.breaking_point_safe")
                : `${t("stress.breaking_point_label")}: ${breakingPoint === 0 ? "0%" : `${sliderConfig.prefix}${breakingPoint}%`}`}
            </span>

            {sliderValue > 0 && (
              <button
                type="button"
                onClick={() => setSliderValue(0)}
                className="inline-flex min-h-[30px] items-center gap-1.5 rounded-md border border-active-border bg-obsidian px-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{t("stress.reset_slider")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Range Slider Control + Clean Scenario Presets (No Duplicate Tick Rows!) */}
        <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-obsidian p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="what-if-stress-slider"
              className="flex items-center gap-2 font-sans text-xs font-bold text-text-primary"
            >
              <SlidersHorizontal
                className="h-3.5 w-3.5 shrink-0 text-conditional"
                aria-hidden="true"
              />
              <span>{sliderPrompt}</span>
            </label>

            <span className="rounded-md border border-conditional/50 bg-conditional/14 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-conditional">
              {sliderValue === 0
                ? "0% (Baseline)"
                : `${sliderConfig.prefix}${sliderValue}%`}
            </span>
          </div>

          {/* 4 Scenario Shock Preset Pills */}
          <div className="grid grid-cols-2 gap-1.5 @[460px]:grid-cols-4">
            {shockPresets.map((preset) => {
              const isSelected = sliderValue === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setSliderValue(preset.value)}
                  className={
                    isSelected
                      ? "rounded-md border border-conditional/60 bg-conditional/16 px-2.5 py-1.5 font-mono text-[11px] font-bold tabular-nums text-conditional"
                      : "rounded-md border border-hairline bg-surface px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
                  }
                >
                  {preset.tag}
                </button>
              );
            })}
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
            ticks={quickShocks.slice(1, -1)}
            ariaLabel={sliderPrompt}
          />
        </div>

        {/* Interactive Resilience Curve (SVG) — Clickable Points + Breaking-Point Marker */}
        {curvePoints.length > 1 && (
          <div className="rounded-lg border border-hairline bg-obsidian p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="font-sans text-xs font-bold text-text-primary">
                {t("stress.curve_title")}
              </span>
              <span className="rounded-xs border border-rejected/35 bg-rejected/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-rejected">
                {t("stress.danger_zone")}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="h-auto w-full select-none overflow-visible"
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
                fillOpacity={0.08}
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
                      strokeOpacity={tick === 75 || tick === 50 ? 0.42 : 0.7}
                      strokeDasharray={
                        tick === 75 || tick === 50 ? "3 3" : undefined
                      }
                      strokeWidth={1}
                    />
                    <text
                      x={padL - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fill="var(--color-ink-muted)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* Breaking point vertical marker if > 0 */}
              {breakingPoint !== null && breakingPoint > 0 && (
                <g>
                  <line
                    x1={toX(breakingPoint)}
                    y1={padT}
                    x2={toX(breakingPoint)}
                    y2={padT + plotH}
                    stroke="var(--color-rejected)"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    strokeOpacity={0.65}
                  />
                </g>
              )}

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
                    fontSize="10"
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
                fillOpacity={0.1}
              />

              {/* Resilience curve polyline */}
              <polyline
                fill="none"
                stroke={activeStrokeColor}
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={polylineStr}
              />

              {/* Clickable hit targets along the curve */}
              {curvePoints.map((pt) => (
                <circle
                  key={pt.stress}
                  cx={toX(pt.stress)}
                  cy={toY(pt.score)}
                  r={8}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => setSliderValue(pt.stress)}
                />
              ))}

              {/* Active vertical drop-line */}
              <motion.line
                initial={false}
                animate={{ x1: activeX, x2: activeX, y1: activeY, y2: toY(0) }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                stroke={activeStrokeColor}
                strokeWidth={1.2}
                strokeDasharray="2 2"
                strokeOpacity={0.75}
              />

              {/* Active halo + core point */}
              <motion.circle
                initial={false}
                animate={{ cx: activeX, cy: activeY }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                r={7.5}
                fill={activeStrokeColor}
                fillOpacity={0.22}
              />
              <motion.circle
                initial={false}
                animate={{ cx: activeX, cy: activeY }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                r={4}
                fill={activeStrokeColor}
                stroke="var(--color-canvas)"
                strokeWidth={1.5}
              />
            </svg>
          </div>
        )}

        {/* Baseline vs Stressed Score Comparison */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-hairline bg-obsidian p-4 @[520px]:grid-cols-3 @[520px]:items-center">
          <MetricReadout
            label={t("stress.baseline_label")}
            value={`${verdictScore}/100`}
            tone={getScoreTone(verdictScore)}
            size="md"
          />
          <MetricReadout
            label={t("stress.stressed_label")}
            value={<NumberFlow value={stressedDisplayScore} suffix="/100" />}
            tone={getScoreTone(stressedDisplayScore)}
            size="md"
          />
          <div className="col-span-2 flex border-t border-hairline pt-3 @[520px]:col-span-1 @[520px]:justify-end @[520px]:border-t-0 @[520px]:pt-0">
            <StatusStamp
              variant={stressedStatusVariant}
              label={stressedStatusLabel}
            />
          </div>
        </div>

        {/* 3 Live Stressed Metrics — Container-Responsive (Zero Box Overflow!) */}
        <div className="grid grid-cols-1 gap-3 @[540px]:grid-cols-3">
          {stressed.metrics.map((m) => (
            <div
              key={m.label}
              className="min-w-0 overflow-hidden rounded-lg border border-hairline bg-obsidian p-3.5 @[540px]:p-4"
            >
              <MetricReadout
                label={m.label}
                value={m.value}
                tone={m.tone}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>
    </EditorialPanel>
  );
}
