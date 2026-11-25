"use client";

import { useEffect, useMemo } from "react";
import NumberFlow from "@number-flow/react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SpotlightCard, type SpotlightTone } from "@/components/ui/SpotlightCard";
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
import { describeDeterministicFlag } from "@/lib/quant/flagDiagnostics";
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
  onAutoHeal?: () => void;
  compactHeader?: boolean;
}

function getScoreTone(score: number): string {
  if (score >= 75) return "text-cleared text-glow-emerald";
  if (score >= 50) return "text-conditional text-glow-amber";
  return "text-rejected text-glow-crimson";
}

function getBarTone(score: number): string {
  if (score >= 75) return "bg-cleared";
  if (score >= 50) return "bg-conditional";
  return "bg-rejected";
}

function getCardTone(score: number): SpotlightTone {
  if (score >= 75) return "emerald";
  if (score >= 50) return "amber";
  return "crimson";
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
 * Luminous Real-Time Pre-Audit Telemetry Panel powered by Decimal.js calculators,
 * plain-language risk diagnostics, and 1-Click Auto-Heal across all 3 tracks.
 */
export function LivePreAuditPanel({
  activeTrack,
  tradingInput,
  businessInput,
  cashflowInput,
  userConviction,
  marketTechnicals,
  onAutoHeal,
  compactHeader = false,
}: LivePreAuditPanelProps) {
  const { locale, t } = useTranslation();
  const { setLiveRiskSnapshot } = useAuditUI();
  const isId = locale === "id";

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
        autoHealTitle: isId
          ? "Kalibrasi Otomatis R:R 1:2,3 + Aturan Risiko < 2%"
          : "Auto-Calibrate 1:2.3 R:R + < 2% Risk Rule",
        autoHealBody: isId
          ? "Sesuaikan jarak Stop-Loss ke luar area noise harian, lebarkan target untung, dan kunci ukuran lot agar modal utama terlindungi."
          : "Align Stop-Loss outside daily market noise, set asymmetric profit target, and cap lot size within safe risk limits.",
        quantRows: [
          {
            label: t("live_preview.trading_net_rr"),
            tooltip: undefined as string | undefined,
            value: `1 : ${res.net_rr_ratio.toFixed(2)} (${res.applied_fee_pct.toFixed(2)}% fee)`,
            tone:
              res.net_rr_ratio >= 1.5
                ? "text-cleared"
                : res.net_rr_ratio >= 1.1
                  ? "text-conditional"
                  : "text-rejected",
          },
          ...(res.idx_lots !== null
            ? [
                {
                  label: t("live_preview.trading_lots"),
                  tooltip: undefined as string | undefined,
                  value: `${res.idx_lots.toLocaleString("id-ID")} lot`,
                  tone: "text-text-primary",
                },
              ]
            : []),
          {
            label: t("live_preview.trading_half_kelly"),
            tooltip: undefined as string | undefined,
            value: `${res.half_kelly_position_pct.toFixed(1)}%`,
            tone: "text-cleared",
          },
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
        autoHealTitle: isId
          ? "Kalibrasi Otomatis Margin Sehat, Target BEP & Napas Kas 6 Bulan"
          : "Auto-Calibrate Healthy Margin, BEP Buffer & 6-Mo Runway",
        autoHealBody: isId
          ? "Sesuaikan harga jual bersih, target penjualan 38% di atas BEP, dan cadangan modal agar usaha tahan melewati masa sepi."
          : "Adjust net unit pricing, set target volume 38% above BEP, and size capital reserve for >= 6 months stressed survival.",
        quantRows: [
          {
            label: t("live_preview.business_payback"),
            tooltip: t("live_preview.tip_payback"),
            value:
              res.payback_period_months !== null
                ? `${res.payback_period_months.toFixed(1)} ${isId ? "bln" : "mo"}`
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
          {
            label: t("live_preview.business_ramp_burn"),
            tooltip: undefined as string | undefined,
            value:
              res.ramp_up_burn_3m > 0
                ? `-Rp ${Math.round(res.ramp_up_burn_3m).toLocaleString("id-ID")}`
                : "Rp 0",
            tone:
              res.ramp_up_burn_3m === 0
                ? "text-cleared"
                : res.ramp_up_burn_3m <= safeInput.initial_capital * 0.4
                  ? "text-conditional"
                  : "text-rejected",
          },
          ...(safeInput.include_umkm_tax
            ? [
                {
                  label: t("live_preview.business_umkm_tax"),
                  tooltip: undefined as string | undefined,
                  value: `Rp ${Math.round(res.umkm_tax_monthly).toLocaleString("id-ID")}/${isId ? "bln" : "mo"}`,
                  tone: "text-text-secondary",
                },
              ]
            : []),
        ],
        metrics: [
          {
            label: t("live_preview.business_margin"),
            tone:
              res.net_unit_margin_pct >= 20
                ? "text-cleared"
                : res.net_unit_margin_pct > 0
                  ? "text-conditional"
                  : "text-rejected",
            node: (
              <NumberFlow
                value={res.net_unit_margin_pct}
                suffix="%"
                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              />
            ),
          },
          {
            label: t("live_preview.business_bep"),
            tone:
              safeInput.target_monthly_units >= res.bep_units &&
              res.bep_units > 0
                ? "text-cleared"
                : "text-rejected",
            node: (
              <span>
                {safeInput.target_monthly_units.toLocaleString("id-ID")} /{" "}
                {res.bep_units === Number.POSITIVE_INFINITY
                  ? "∞"
                  : res.bep_units.toLocaleString("id-ID")}
              </span>
            ),
          },
          {
            label: t("live_preview.business_profit"),
            tone:
              res.projected_monthly_profit > 0
                ? "text-cleared"
                : "text-rejected",
            node: (
              <NumberFlow
                value={Math.round(res.projected_monthly_profit)}
                prefix={res.projected_monthly_profit < 0 ? "-Rp " : "+Rp "}
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
                <span>99+ {isId ? "bln" : "mo"}</span>
              ) : (
                <NumberFlow
                  value={res.stressed_runway_months}
                  suffix={isId ? " bln" : " mo"}
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
      autoHealTitle: isId
        ? "Kalibrasi Otomatis Batas Cicilan Sehat OJK (≤ 28% Gaji)"
        : "Auto-Calibrate Safe OJK Debt Cap (≤ 28% Income)",
      autoHealBody: isId
        ? "Sesuaikan cicilan bulanan, bunga ke standar bank sehat, dan dana darurat 6 bulan agar kas keluarga bebas defisit."
        : "Cap monthly installment within OJK safe limits, normalize interest rate, and size a 6-month emergency reserve.",
      quantRows: [
        {
          label: t("live_preview.cashflow_savings"),
          tooltip: t("live_preview.tip_savings"),
          value: `${res.savings_rate_pct.toFixed(1)}%`,
          tone:
            res.savings_rate_pct >= 20
              ? "text-cleared"
              : res.savings_rate_pct >= 5
                ? "text-conditional"
                : "text-rejected",
        },
        ...(res.effective_apr_pct !== null
          ? [
              {
                label: t("live_preview.cashflow_effective_apr"),
                tooltip: undefined as string | undefined,
                value: `${res.effective_apr_pct.toFixed(1)}% / yr`,
                tone:
                  res.effective_apr_pct <= 14
                    ? "text-cleared"
                    : res.effective_apr_pct <= 24
                      ? "text-conditional"
                      : "text-rejected",
              },
            ]
          : []),
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
              : res.dsr_pct <= 40
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
              prefix={res.free_cashflow < 0 ? "-Rp " : "+Rp "}
              locales="id-ID"
              format={{ signDisplay: "never" }}
            />
          ),
        },
        {
          label: t("live_preview.cashflow_commit"),
          tone:
            res.total_commitment_pct <= 75
              ? "text-cleared"
              : res.total_commitment_pct <= 85
                ? "text-conditional"
                : "text-rejected",
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
          node:
            res.emergency_fund_months >= 99 ? (
              <span>99+ {isId ? "bln" : "mo"}</span>
            ) : (
              <NumberFlow
                value={res.emergency_fund_months}
                suffix={isId ? " bln" : " mo"}
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
    isId,
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

  const humanDiagnostics = useMemo(
    () =>
      preview.flags.map((code) => describeDeterministicFlag(code, locale)),
    [preview.flags, locale]
  );

  return (
    <SpotlightCard
      tone={getCardTone(preview.score)}
      aria-label={t("live_preview.title")}
      className="@container min-w-0 gap-4 p-4 sm:gap-5 sm:p-5"
    >
      {!compactHeader && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              />
              <span className="font-sans text-xs font-bold tracking-tight text-text-primary">
                {t("live_preview.title")}
              </span>
            </div>
            <span className="font-mono text-[11px] text-text-muted">
              {t("live_preview.engine_tag")}
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-xs font-medium text-text-secondary">
                {t("live_preview.score_label")}
              </span>
              <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                <span
                  className={cn(
                    "text-4xl font-bold tracking-tight",
                    getScoreTone(preview.score)
                  )}
                >
                  <NumberFlow value={preview.score} />
                </span>
                <span className="text-sm text-text-muted">/ 100</span>
              </div>
            </div>

            <StatusStamp
              variant={statusVariant}
              label={t(`verdict.status.${statusKey}`)}
            />
          </div>
        </>
      )}

      {/* 1. Plain-Language Risk Diagnosis + Universal 1-Click Auto-Heal FIRST when warnings exist! */}
      {humanDiagnostics.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-rejected/40 bg-rejected/8 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-sans text-xs font-bold text-rejected sm:text-[13px]">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {isId
                  ? `${humanDiagnostics.length} Celah Risiko Terdeteksi pada Angka Anda`
                  : `${humanDiagnostics.length} Structural Risk Issue(s) Detected`}
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {humanDiagnostics.map((diag) => (
              <div
                key={diag.code}
                className="flex flex-col gap-1 rounded-md border border-hairline bg-obsidian/92 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-sans text-xs font-bold sm:text-[13px]",
                      diag.severity === "critical"
                        ? "text-rejected"
                        : "text-conditional"
                    )}
                  >
                    <AlertTriangle
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{diag.title}</span>
                  </span>
                  <span className="rounded-xs border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[9.5px] text-text-muted">
                    {diag.code}
                  </span>
                </div>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {diag.explanation}
                </p>
              </div>
            ))}
          </div>

          {onAutoHeal && (
            <div className="mt-1 flex flex-col gap-2.5 rounded-md border border-cleared/45 bg-cleared/10 p-3">
              <div className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
                  aria-hidden="true"
                />
                <div>
                  <span className="block font-sans text-xs font-bold text-cleared">
                    {preview.autoHealTitle}
                  </span>
                  <p className="mt-0.5 font-sans text-xs leading-relaxed text-text-secondary">
                    {preview.autoHealBody}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onAutoHeal}
                className="cta-primary-polish inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-md bg-cleared px-3.5 font-sans text-xs font-bold text-on-cleared transition-all hover:brightness-105"
              >
                <WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isId
                    ? "Perbaiki Otomatis ke Ambang Aman (1-Klik)"
                    : "Auto-Heal Parameters to Safe Threshold (1-Click)"}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg border border-cleared/40 bg-cleared/10 px-3.5 py-3">
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-cleared"
            aria-hidden="true"
          />
          <p className="font-sans text-xs font-medium text-cleared sm:text-[13px]">
            {isId
              ? "Seluruh rasio dasar lulus gerbang keamanan matematis. Siap diajukan ke sidang komite."
              : "All baseline ratios clear mathematical guardrails. Ready for full committee deliberation."}
          </p>
        </div>
      )}

      {/* 2. Four Core Rolling KPI Cards */}
      <div className="grid grid-cols-1 gap-3 @[340px]:grid-cols-2">
        {preview.metrics.map((m) => (
          <div
            key={m.label}
            className="flex min-w-0 flex-col justify-between gap-1.5 overflow-hidden rounded-lg border border-hairline bg-obsidian/90 p-3.5"
          >
            <span className="font-sans text-xs font-medium text-text-secondary">
              {m.label}
            </span>
            <span
              className={cn(
                "min-w-0 truncate font-mono text-base font-bold tabular-nums @[420px]:text-[17px]",
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
          <div className="flex justify-between font-mono text-[11px] font-semibold">
            <span className="text-rejected">
              {isId ? "Porsi Risiko" : "Risk"} {preview.lossSharePct}%
            </span>
            <span className="text-cleared">
              {isId ? "Porsi Imbal Hasil" : "Reward"}{" "}
              {100 - preview.lossSharePct}%
            </span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-elevated">
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

      {/* 3. Conviction vs. Mathematical Reality Mirror */}
      <div className="flex flex-col gap-2.5 rounded-lg border border-hairline bg-obsidian/85 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs font-semibold text-text-secondary">
            {isId
              ? "Cermin Keyakinan Anda vs. Ketahanan Angka"
              : "Your Conviction vs. Mathematical Reality"}
          </span>
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums",
              convictionGap >= 20
                ? "border-rejected/45 bg-rejected/12 text-rejected"
                : convictionGap <= -15
                  ? "border-conditional/45 bg-conditional/12 text-conditional"
                  : "border-cleared/45 bg-cleared/12 text-cleared"
            )}
          >
            {convictionGap >= 0 ? `+${convictionGap}%` : `${convictionGap}%`}{" "}
            {convictionGap >= 20 ? (isId ? "Terlalu Pede" : "Overconfident") : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 @[420px]:grid-cols-2">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-sans text-xs text-text-secondary">
              <span>{t("hero.preview_strip.conviction_label")}</span>
              <span className="font-mono font-semibold text-text-primary">
                {userConviction}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full bg-sky-400 transition-all duration-200"
                style={{ width: `${userConviction}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-sans text-xs text-text-secondary">
              <span>{t("hero.preview_strip.reality_label")}</span>
              <span className="font-mono font-semibold text-text-primary">
                {preview.score}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
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

      {/* 4. Deep Quantitative Metrics */}
      <div className="flex flex-col gap-2.5 rounded-lg border border-hairline bg-obsidian/85 p-3.5">
        <span className="font-sans text-xs font-bold text-text-primary">
          {isId ? "Rincian Rasio Teknis Lanjutan" : t("live_preview.quant_title")}
        </span>
        <div className="divide-y divide-hairline/60">
          {preview.quantRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-2 py-2 text-[12.5px] tabular-nums first:pt-0.5 last:pb-0"
            >
              <span className="inline-flex items-center gap-1.5 font-sans text-text-secondary">
                <span>{row.label}</span>
                {row.tooltip && <InfoTooltip content={row.tooltip} />}
              </span>
              <span className={cn("font-mono font-bold", row.tone)}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Real-Time 1,000-Path Monte Carlo Risk of Ruin */}
      <div className="flex flex-col gap-2.5 rounded-lg border border-hairline bg-obsidian/90 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-text-primary">
            <span>
              {isId ? "Simulasi 1.000 Skenario Acak" : "1,000-Path Monte Carlo"} ·{" "}
              {preview.monteCarlo.horizon_label}
            </span>
            <InfoTooltip content={t("live_preview.tip_mc")} />
          </span>
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 font-mono text-xs font-bold tabular-nums",
              preview.monteCarlo.ruin_probability_pct <= 15
                ? "border-cleared/40 bg-cleared/12 text-cleared"
                : preview.monteCarlo.ruin_probability_pct <= 35
                  ? "border-conditional/40 bg-conditional/12 text-conditional"
                  : "border-rejected/40 bg-rejected/12 text-rejected"
            )}
          >
            Ruin{" "}
            <NumberFlow
              value={preview.monteCarlo.ruin_probability_pct}
              suffix="%"
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          </span>
        </div>

        <MonteCarloHistogram
          buckets={preview.monteCarlo.histogram}
          height={82}
        />

        <div className="grid grid-cols-1 gap-2 border-t border-hairline pt-2.5 font-mono text-xs tabular-nums @[420px]:grid-cols-3">
          <div className="flex items-center justify-between gap-2 @[420px]:flex-col @[420px]:items-start @[420px]:gap-0.5">
            <span className="font-sans text-[11px] text-text-muted">
              {t("live_preview.mc_p5_label")}
            </span>
            <span className="min-w-0 truncate font-bold text-rejected">
              Rp {preview.monteCarlo.p5_ending_value.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 @[420px]:flex-col @[420px]:items-start @[420px]:gap-0.5">
            <span className="font-sans text-[11px] text-text-muted">
              {t("live_preview.mc_p50_label")}
            </span>
            <span className="min-w-0 truncate font-bold text-text-primary">
              Rp {preview.monteCarlo.p50_ending_value.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 @[420px]:flex-col @[420px]:items-start @[420px]:gap-0.5">
            <span className="font-sans text-[11px] text-text-muted">
              {t("live_preview.mc_p95_label")}
            </span>
            <span className="min-w-0 truncate font-bold text-cleared">
              Rp {preview.monteCarlo.p95_ending_value.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      <p className="font-sans text-xs leading-relaxed text-text-muted">
        {t("live_preview.footer_hint")}
      </p>
    </SpotlightCard>
  );
}
