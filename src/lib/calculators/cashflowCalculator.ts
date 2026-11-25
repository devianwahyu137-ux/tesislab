import Decimal from "decimal.js";
import { z } from "zod";

export const CashflowAuditInputSchema = z.object({
  monthly_net_income: z.number().positive(),
  current_monthly_expenses: z.number().min(0),
  new_monthly_installment: z.number().min(0),
  installment_months: z.number().int().min(1),
  liquid_emergency_fund: z.number().min(0),
  decision_purpose: z.string().trim().min(1),
  existing_debt_installment: z.number().min(0).optional(),
  flat_interest_pct_per_month: z.number().min(0).max(25).optional(),
});

export type CashflowAuditInput = z.infer<typeof CashflowAuditInputSchema>;

export type CashflowFlag =
  | "HIGH_DEBT_SERVICE_RATIO"
  | "DEFICIT_CASHFLOW"
  | "THIN_EMERGENCY_BUFFER"
  | "HIGH_TOTAL_COMMITMENT"
  | "PREDATORY_EFFECTIVE_APR";

export interface CashflowAuditResult {
  dsr_pct: number;
  total_ojk_dsr_pct: number;
  effective_apr_pct: number | null;
  total_commitment_pct: number;
  free_cashflow: number;
  emergency_fund_months: number;
  savings_rate_pct: number;
  total_installment_burden: number;
  baseline_score: number;
  deterministic_flags: CashflowFlag[];
}

function round2(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Converts a stated monthly flat interest rate (common in Indonesian PayLater/KTA/KKB)
 * into True Effective Annual Percentage Rate (APR) via exact Newton-Raphson annuity IRR.
 * For unit principal P = 1 over n months at flat monthly rate r_flat:
 * Monthly payment A = (1 + n * r_flat) / n.
 * Solves A * (1 - (1 + i)^(-n)) / i = 1 for monthly effective rate i, returning 12 * i * 100.
 */
export function convertFlatMonthlyToEffectiveApr(
  flatMonthlyPct: number,
  months: number
): number {
  if (flatMonthlyPct <= 0 || months <= 0) return 0;
  const n = Math.max(1, Math.round(months));
  const rFlat = flatMonthlyPct / 100;
  if (n === 1) {
    return Number((rFlat * 12 * 100).toFixed(2));
  }
  const payment = (1 + n * rFlat) / n;
  // Initial guess from standard Nagle/actuarial approximation: i ≈ 2*n*rFlat / (n + 1)
  let i = (2 * n * rFlat) / (n + 1);

  for (let iter = 0; iter < 30; iter += 1) {
    const pow = Math.pow(1 + i, -n);
    const pv = (payment * (1 - pow)) / i;
    const f = pv - 1;
    if (Math.abs(f) < 1e-10) break;
    const df =
      payment *
      ((n * Math.pow(1 + i, -n - 1) * i - (1 - pow)) / (i * i));
    if (Math.abs(df) < 1e-12) break;
    const next = i - f / df;
    i = next > 1e-7 ? next : i * 0.5;
  }

  return Number((i * 12 * 100).toFixed(2));
}

/**
 * Pure deterministic calculator for Personal Cashflow Audit powered by Decimal.js
 * with Total OJK/BI Combined DSR, True Effective APR conversion (Flat -> Effective),
 * Savings Rate, and Total Tenor Commitment metrics.
 */
export function calculateCashflowAudit(
  input: CashflowAuditInput
): CashflowAuditResult {
  const flags: CashflowFlag[] = [];

  const income = new Decimal(input.monthly_net_income);
  const expenses = new Decimal(input.current_monthly_expenses);
  const existingDebt = new Decimal(input.existing_debt_installment ?? 0);
  const installment = new Decimal(input.new_monthly_installment);
  const months = new Decimal(input.installment_months);
  const emergencyFund = new Decimal(input.liquid_emergency_fund);

  const combinedDebt = existingDebt.plus(installment);
  const dsrPct = round2(combinedDebt.div(income).times(100));
  const totalCommitment = expenses.plus(existingDebt).plus(installment);
  const totalCommitmentPct = round2(totalCommitment.div(income).times(100));
  const freeCashflowDec = income.minus(totalCommitment);
  const freeCashflow = round2(freeCashflowDec);
  const emergencyFundMonths = totalCommitment.gt(0)
    ? round2(emergencyFund.div(totalCommitment))
    : 99;
  const savingsRatePct = round2(freeCashflowDec.div(income).times(100));
  const totalInstallmentBurden = round2(installment.times(months));

  const effectiveAprPct =
    typeof input.flat_interest_pct_per_month === "number" &&
    input.flat_interest_pct_per_month > 0
      ? convertFlatMonthlyToEffectiveApr(
          input.flat_interest_pct_per_month,
          input.installment_months
        )
      : null;

  if (dsrPct > 30) {
    flags.push("HIGH_DEBT_SERVICE_RATIO");
  }
  if (freeCashflow < 0) {
    flags.push("DEFICIT_CASHFLOW");
  }
  if (emergencyFundMonths < 3) {
    flags.push("THIN_EMERGENCY_BUFFER");
  }
  if (totalCommitmentPct > 80) {
    flags.push("HIGH_TOTAL_COMMITMENT");
  }
  if (effectiveAprPct !== null && effectiveAprPct > 24) {
    flags.push("PREDATORY_EFFECTIVE_APR");
  }

  let score = 100;
  if (dsrPct > 45) score -= 40;
  else if (dsrPct > 30) score -= 25;

  if (freeCashflow < 0) score -= 40;
  if (emergencyFundMonths < 3) score -= 25;
  else if (emergencyFundMonths < 6) score -= 10;

  if (totalCommitmentPct > 80) score -= 15;
  if (effectiveAprPct !== null && effectiveAprPct > 24) score -= 15;

  return {
    dsr_pct: dsrPct,
    total_ojk_dsr_pct: dsrPct,
    effective_apr_pct: effectiveAprPct,
    total_commitment_pct: totalCommitmentPct,
    free_cashflow: freeCashflow,
    emergency_fund_months: emergencyFundMonths,
    savings_rate_pct: savingsRatePct,
    total_installment_burden: totalInstallmentBurden,
    baseline_score: clampScore(score),
    deterministic_flags: flags,
  };
}

/**
 * Client-safe What-If stress simulation for monthly net income drops.
 */
export function simulateCashflowStress(
  input: CashflowAuditInput,
  incomeDropPct: number
): CashflowAuditResult {
  const clampedDrop = new Decimal(Math.max(0, Math.min(95, incomeDropPct)));
  const factor = new Decimal(1).minus(clampedDrop.div(100));
  const stressedIncome = Decimal.max(
    1,
    new Decimal(input.monthly_net_income).times(factor)
  ).toNumber();

  return calculateCashflowAudit({
    ...input,
    monthly_net_income: stressedIncome,
  });
}
