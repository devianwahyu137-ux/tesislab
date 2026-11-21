"use client";

import { useEffect, useMemo } from "react";
import NumberFlow from "@number-flow/react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { StatusStamp, type StatusStampVariant } from "@/components/ui/StatusStamp";
import { MonteCarloHistogram } from "@/components/workspace/MonteCarloHistogram";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  calculateBusinessAudit,
  calculateCashflowAudit,
  calculateTradeAudit,
  type BusinessAuditInput,
  type CashflowAuditInput,
  type TradeAuditInput,
} from "@/lib/calculators";
import { runMonteCarloSimulation } from "@/lib/quant/monteCarlo";
import type { MarketTechnicals } from "@/lib/quant/technicalIndicators";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

export interface LivePreAuditPanelProps {
  activeTrack: AuditTrack;
  tradingInput: TradeAuditInput;
  businessInput: BusinessAuditInput;
  cashflowInput: CashflowAuditInput;
  userConviction: number;
  marketTechnicals?: MarketTechnicals | null;
}

function getScoreTone(score: number): string {
  if (score >= 75) return "text-cleared";
  if (score >= 50) return "text-conditional";
  return "text-rejected";
}

function getBarTone(score: number): string {
  if (score >= 75) return "bg-cleared";
  if (score >= 50) return "bg-conditional";
  return "bg-rejected";
}

function getStatusVariant(
  score: number,
  flagCount: number
): StatusStampVariant {
  if (score < 45) return "REJECTED";
  if (score >= 75 && flagCount === 0) return "CLEARED";
  return "CONDITIONAL";
}

/**
 * Real-time client-side Pre-Audit Telemetry Panel powered by Decimal.js calculators
 * and @number-flow/react. Reacts instantaneously to every keystroke with zero API calls.
 */
export function LivePreAuditPanel({
  activeTrack,
  tradingInput,
  businessInput,
  cashflowInput,
  userConviction,
  marketTechnicals,
}: LivePreAuditPanelProps) {
  const { t } = useTranslation();
  const { setLiveRiskSnapshot } = useAuditUI();

  const preview = useMemo(() => {
    if (activeTrack === "trading") {
      const safeInput: TradeAuditInput = {
        ...tradingInput,
        total_capital: Math.max(1, tradingInput.total_capital || 1),
        position_size_pct: Math.max(
          1,
          Math.min(100, tradingInput.position_size_pct || 1)
        ),
        entry_price: Math.max(0.0001, tradingInput.entry_price || 0.0001),
        take_profit: Math.max(0.0001, tradingInput.take_profit || 0.0001),
        stop_loss: Math.max(0.0001, tradingInput.stop_loss || 0.0001),
        atr_pct: marketTechnicals?.atr_pct,
      };
      const res = calculateTradeAudit(safeInput);
      const mc = runMonteCarloSimulation("trading", safeInput, res);
      const totalBar =
        res.potential_loss_amount + res.potential_profit_amount || 1;
      const lossSharePct = Math.round(
        (res.potential_loss_amount / totalBar) * 100
      );

      return {
        score: res.baseline_score,
        flags: res.deterministic_flags as string[],
        lossSharePct,
        monteCarlo: mc,
        quantRows: [
          {
            label: t("live_preview.trading_be_wr"),
            tooltip: t("live_preview.tip_be_wr"),
            value: `${res.breakeven_win_rate_pct.toFixed(1)}%`,
            tone:
              res.breakeven_win_rate_pct <= 40
                ? "text-cleared"
                : res.breakeven_win_rate_pct <= 50
                  ? "text-conditional"
                  : "text-rejected",
          },
          {
            label: t("live_preview.trading_safe_size"),
            tooltip: t("live_preview.tip_safe_size"),
            value: `≤ ${res.max_safe_position_pct.toFixed(1)}%`,
            tone:
              safeInput.position_size_pct <= res.max_safe_position_pct
                ? "text-cleared"
                : "text-conditional",
          },
          ...(res.sl_to_atr_ratio !== null
            ? [
                {
                  label: t("live_preview.trading_sl_atr"),
                  tooltip: t("live_preview.tip_sl_atr"),
                  value: `${res.sl_to_atr_ratio.toFixed(2)}× ATR`,
                  tone:
                    res.sl_to_atr_ratio >= 1.5
                      ? "text-cleared"
                      : res.sl_to_atr_ratio >= 1.0
                        ? "text-conditional"
                        : "text-rejected",
                },
              ]
            : []),
        ],
        metrics: [
          {
            label: t("live_preview.trading_rr"),
            tone: res.rr_ratio >= 1.5 ? "text-cleared" : "text-rejected",
            node: (
              <NumberFlow
                value={res.rr_ratio}
                prefix="1 : "
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              />
            ),
          },
          {
            label: t("live_preview.trading_risk"),
            tone:
              res.risk_per_trade_pct <= 2
                ? "text-cleared"
                : res.risk_per_trade_pct <= 3
                  ? "text-conditional"
                  : "text-rejected",
            node: (
              <NumberFlow
                value={res.risk_per_trade_pct}
                suffix="%"
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              />
            ),
          },
          {
            label: t("live_preview.trading_loss"),
            tone: "text-rejected",
            node: (
              <NumberFlow
                value={Math.round(res.potential_loss_amount)}
                prefix="-Rp "
                locales="id-ID"
              />
            ),
          },
          {
            label: t("live_preview.trading_profit"),
            tone: "text-cleared",
            node: (
              <NumberFlow
                value={Math.round(res.potential_profit_amount)}
                prefix="+Rp "
                locales="id-ID"
              />
            ),
          },
        ],
      };
    }

    if (activeTrack === "business") {
      const safeInput: BusinessAuditInput = {
        ...businessInput,
        initial_capital: Math.max(0, businessInput.initial_capital || 0),
        monthly_fixed_cost: Math.max(0, businessInput.monthly_fixed_cost || 0),
        selling_price: Math.max(1, businessInput.selling_price || 1),
        unit_cogs: Math.max(0, businessInput.unit_cogs || 0),
        target_monthly_units: Math.max(
          0,
          businessInput.target_monthly_units || 0
        ),
      };
      const res = calculateBusinessAudit(safeInput);
      const mc = runMonteCarloSimulation("business", safeInput, res);
      return {
        score: res.baseline_score,
        flags: res.deterministic_flags as string[],
        lossSharePct: null,
        monteCarlo: mc,
        quantRows: [
          {
            label: t("live_preview.business_payback"),
            tooltip: t("live_preview.tip_payback"),
            value:
              res.payback_period_months !== null
                ? `${res.payback_period_months.toFixed(1)} MO`
                : "N/A",
            tone:
              res.payback_period_months !== null &&
              res.payback_period_months <= 12
                ? "text-cleared"
                : "text-rejected",
          },
          {
            label: t("live_preview.business_mos"),
            tooltip: t("live_preview.tip_mos"),
            value: `${res.margin_of_safety_pct >= 0 ? "+" : ""}${res.margin_of_safety_pct.toFixed(1)}%`,
            tone:
              res.margin_of_safety_pct >= 25
                ? "text-cleared"
                : res.margin_of_safety_pct >= 0
                  ? "text-conditional"
                  : "text-rejected",
          },
        ],
        metrics: [
          {
            label: t("live_preview.business_margin"),
            tone:
              res.unit_margin_pct >= 20
                ? "text-cleared"
                : res.unit_margin_pct > 0
                  ? "text-conditional"
                  : "text-rejected",
            node: (
              <NumberFlow
                value={res.unit_margin_pct}
                suffix="%"
                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              />
            ),
          },
          {
            label: t("live_preview.business_bep"),
            tone:
              safeInput.target_monthly_units >= res.bep_units && res.bep_units > 0
                ? "text-cleared"
                : "text-rejected",
            node: (
              <>
                <NumberFlow value={Math.round(safeInput.target_monthly_units)} />{" "}
                / {res.bep_units}
              </>
            ),
          },
          {
            label: t("live_preview.business_profit"),
            tone:
              res.projected_monthly_profit >= 0
                ? "text-cleared"
                : "text-rejected",
            node: (
              <NumberFlow
                value={Math.round(res.projected_monthly_profit)}
                prefix={res.projected_monthly_profit < 0 ? "-Rp " : "Rp "}
                locales="id-ID"
                format={{ signDisplay: "never" }}
              />
            ),
          },
          {
            label: t("live_preview.business_runway"),
            tone:
              res.stressed_runway_months >= 6
                ? "text-cleared"
                : res.stressed_runway_months >= 3
                  ? "text-conditional"
                  : "text-rejected",
            node:
              res.stressed_runway_months >= 99 ? (
                "99+ MO"
              ) : (
                <NumberFlow
                  value={res.stressed_runway_months}
                  suffix=" MO"
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                />
              ),
          },
        ],
      };
    }

    const safeInput: CashflowAuditInput = {
      ...cashflowInput,
      monthly_net_income: Math.max(1, cashflowInput.monthly_net_income || 1),
      current_monthly_expenses: Math.max(
        0,
        cashflowInput.current_monthly_expenses || 0
      ),
      new_monthly_installment: Math.max(
        0,
        cashflowInput.new_monthly_installment || 0
      ),
      installment_months: Math.max(1, cashflowInput.installment_months || 1),
      liquid_emergency_fund: Math.max(
        0,
        cashflowInput.liquid_emergency_fund || 0
      ),
    };
    const res = calculateCashflowAudit(safeInput);
    const mc = runMonteCarloSimulation("cashflow", safeInput, res);
    return {
      score: res.baseline_score,
      flags: res.deterministic_flags as string[],
      lossSharePct: null,
      monteCarlo: mc,
      quantRows: [
        {
          label: t("live_preview.cashflow_savings"),
          tooltip: t("live_preview.tip_savings"),
          value: `${res.savings_rate_pct.toFixed(1)}%`,
          tone:
            res.savings_rate_pct >= 20
              ? "text-cleared"
              : res.savings_rate_pct > 0
                ? "text-conditional"
                : "text-rejected",
        },
        {
          label: t("live_preview.cashflow_total_debt"),
          tooltip: undefined as string | undefined,
          value: `Rp ${Math.round(res.total_installment_burden).toLocaleString("id-ID")}`,
          tone: "text-text-primary",
        },
      ],
      metrics: [
        {
          label: t("live_preview.cashflow_dsr"),
          tone:
            res.dsr_pct <= 30
              ? "text-cleared"
              : res.dsr_pct <= 45
                ? "text-conditional"
                : "text-rejected",
          node: (
            <NumberFlow
              value={res.dsr_pct}
              suffix="%"
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          ),
        },
        {
          label: t("live_preview.cashflow_free"),
          tone: res.free_cashflow >= 0 ? "text-cleared" : "text-rejected",
          node: (
            <NumberFlow
              value={Math.round(res.free_cashflow)}
              prefix={res.free_cashflow < 0 ? "-Rp " : "Rp "}
              locales="id-ID"
              format={{ signDisplay: "never" }}
            />
          ),
        },
        {
          label: t("live_preview.cashflow_commit"),
          tone:
            res.total_commitment_pct <= 80
              ? "text-cleared"
              : "text-conditional",
          node: (
            <NumberFlow
              value={res.total_commitment_pct}
              suffix="%"
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          ),
        },
        {
          label: t("live_preview.cashflow_efund"),
          tone:
            res.emergency_fund_months >= 6
              ? "text-cleared"
              : res.emergency_fund_months >= 3
                ? "text-conditional"
                : "text-rejected",
          node: (
            <NumberFlow
              value={res.emergency_fund_months}
              suffix=" MO"
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          ),
        },
      ],
    };
  }, [
    activeTrack,
    tradingInput,
    businessInput,
    cashflowInput,
    marketTechnicals,
    t,
  ]);

  const statusVariant = getStatusVariant(preview.score, preview.flags.length);
  const statusKey = statusVariant.toLowerCase() as
    | "cleared"
    | "conditional"
    | "rejected";
  const convictionGap = userConviction - preview.score;

  useEffect(() => {
    setLiveRiskSnapshot({
      track: activeTrack,
      score: preview.score,
      flags: preview.flags,
      ruinPct: preview.monteCarlo.ruin_probability_pct,
    });
  }, [
    activeTrack,
    preview.score,
    preview.flags,
    preview.monteCarlo.ruin_probability_pct,
    setLiveRiskSnapshot,
  ]);

  return (
    <aside
      aria-label={t("live_preview.title")}
      className="surface-specular flex flex-col justify-between gap-5 rounded-sm border border-active-border/80 bg-obsidian p-4 sm:p-5 lg:sticky lg:top-20"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-cleared"
            />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary">
              {t("live_preview.title")}
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-wider text-text-muted">
            {t("live_preview.engine_tag")}
          </span>
        </div>

        {/* Live Baseline Score & Projected Stamp */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {t("live_preview.score_label")}
            </span>
            <div className="flex items-baseline gap-1 font-mono tabular-nums">
              <span
                className={cn(
                  "text-4xl font-bold tracking-tight",
                  getScoreTone(preview.score)
                )}
              >
                <NumberFlow value={preview.score} />
              </span>
              <span className="text-xs text-text-muted">/ 100</span>
            </div>
          </div>

          <StatusStamp
            variant={statusVariant}
            label={t(`verdict.status.${statusKey}`)}
          />
        </div>

        {/* Conviction vs. Live Reality Mini Comparison */}
        <div className="flex flex-col gap-2 rounded-xs border border-hairline bg-surface p-3">
          <div className="flex items-center justify-between font-mono text-[10px] tabular-nums">
            <span className="uppercase tracking-wider text-text-muted">
              {t("live_preview.gap_label")}
            </span>
            <span
              className={cn(
                "font-semibold",
                convictionGap >= 20
                  ? "text-rejected"
                  : convictionGap <= -15
                    ? "text-conditional"
                    : "text-cleared"
              )}
            >
              {convictionGap >= 0 ? `+${convictionGap}%` : `${convictionGap}%`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-mono text-[10px] text-text-secondary">
                <span>{t("hero.preview_strip.conviction_label")}</span>
                <span>{userConviction}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-xs bg-elevated">
                <div
                  className="h-full bg-text-primary/75 transition-all duration-200"
                  style={{ width: `${userConviction}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-mono text-[10px] text-text-secondary">
                <span>{t("hero.preview_strip.reality_label")}</span>
                <span>{preview.score}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-xs bg-elevated">
                <div
                  className={cn(
                    "h-full transition-all duration-200",
                    getBarTone(preview.score)
                  )}
                  style={{ width: `${preview.score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Rolling Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          {preview.metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col gap-1 rounded-xs border border-hairline bg-surface p-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {m.label}
              </span>
              <span
                className={cn(
                  "font-mono text-sm font-semibold tabular-nums sm:text-base",
                  m.tone
                )}
              >
                {m.node}
              </span>
            </div>
          ))}
        </div>

        {/* Trading Risk vs Reward Split Bar */}
        {preview.lossSharePct !== null && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-text-muted">
              <span className="text-rejected">RISK {preview.lossSharePct}%</span>
              <span className="text-cleared">
                REWARD {100 - preview.lossSharePct}%
              </span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-xs bg-elevated">
              <div
                className="h-full bg-rejected transition-all duration-200"
                style={{ width: `${preview.lossSharePct}%` }}
              />
              <div
                className="h-full bg-cleared transition-all duration-200"
                style={{ width: `${100 - preview.lossSharePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Deep Quantitative Metrics */}
        <div className="flex flex-col gap-1.5 rounded-xs border border-hairline bg-surface p-3">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            {t("live_preview.quant_title")}
          </span>
          <div className="flex flex-col gap-1.5">
            {preview.quantRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums"
              >
                <span className="inline-flex items-center gap-1 text-text-secondary">
                  <span>{row.label}</span>
                  {row.tooltip && <InfoTooltip content={row.tooltip} />}
                </span>
                <span className={cn("font-semibold", row.tone)}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time 1,000-Path Monte Carlo Risk of Ruin */}
        <div className="flex flex-col gap-2 rounded-xs border border-hairline bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              <span>
                {t("live_preview.mc_title")} · {preview.monteCarlo.horizon_label}
              </span>
              <InfoTooltip content={t("live_preview.tip_mc")} />
            </span>
            <span
              className={cn(
                "font-mono text-xs font-bold tabular-nums",
                preview.monteCarlo.ruin_probability_pct <= 15
                  ? "text-cleared"
                  : preview.monteCarlo.ruin_probability_pct <= 35
                    ? "text-conditional"
                    : "text-rejected"
              )}
            >
              <NumberFlow
                value={preview.monteCarlo.ruin_probability_pct}
                suffix="%"
                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              />
            </span>
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-text-secondary">
            <span>{t("live_preview.mc_ruin_label")}</span>
          </div>

          <MonteCarloHistogram
            buckets={preview.monteCarlo.histogram}
            height={72}
          />

          <div className="grid grid-cols-3 gap-1.5 border-t border-hairline pt-2 font-mono text-[10px] tabular-nums">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted">
                {t("live_preview.mc_p5_label")}
              </span>
              <span className="truncate font-semibold text-rejected">
                Rp {preview.monteCarlo.p5_ending_value.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted">
                {t("live_preview.mc_p50_label")}
              </span>
              <span className="truncate font-semibold text-text-primary">
                Rp {preview.monteCarlo.p50_ending_value.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted">
                {t("live_preview.mc_p95_label")}
              </span>
              <span className="truncate font-semibold text-cleared">
                Rp {preview.monteCarlo.p95_ending_value.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Live Deterministic Flags */}
        <div className="flex flex-col gap-2 border-t border-hairline pt-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            {preview.flags.length > 0 ? (
              <ShieldAlert
                className="h-3.5 w-3.5 text-conditional"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                className="h-3.5 w-3.5 text-cleared"
                aria-hidden="true"
              />
            )}
            <span>{t("live_preview.flags_label")}</span>
          </div>

          {preview.flags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {preview.flags.map((flag) => (
                <span
                  key={flag}
                  className="inline-flex items-center gap-1 rounded-xs border border-rejected/45 bg-rejected/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-rejected"
                >
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                  <span>{flag}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="font-mono text-[11px] text-cleared">
              {t("live_preview.no_flags")}
            </span>
          )}
        </div>
      </div>

      {/* Footer Hint */}
      <p className="border-t border-hairline pt-3 font-sans text-[11px] leading-relaxed text-text-muted">
        {t("live_preview.footer_hint")}
      </p>
    </aside>
  );
}
