import Decimal from "decimal.js";
import { z } from "zod";

export const CashflowAuditInputSchema = z.object({
  monthly_net_income: z.number().positive(),
  current_monthly_expenses: z.number().min(0),
  new_monthly_installment: z.number().min(0),
  installment_months: z.number().int().min(1),
  liquid_emergency_fund: z.number().min(0),
  decision_purpose: z.string().trim().min(1),
});

export type CashflowAuditInput = z.infer<typeof CashflowAuditInputSchema>;

export type CashflowFlag =
  | "HIGH_DEBT_SERVICE_RATIO"
  | "DEFICIT_CASHFLOW"
  | "THIN_EMERGENCY_BUFFER"
  | "HIGH_TOTAL_COMMITMENT";

export interface CashflowAuditResult {
  dsr_pct: number;
  total_commitment_pct: number;
  free_cashflow: number;
  emergency_fund_months: number;
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
 * Pure deterministic calculator for Personal Cashflow Audit powered by Decimal.js.
 */
export function calculateCashflowAudit(
  input: CashflowAuditInput
): CashflowAuditResult {
  const flags: CashflowFlag[] = [];

  const income = new Decimal(input.monthly_net_income);
  const expenses = new Decimal(input.current_monthly_expenses);
  const installment = new Decimal(input.new_monthly_installment);
  const emergencyFund = new Decimal(input.liquid_emergency_fund);

  const dsrPct = round2(installment.div(income).times(100));
  const totalCommitment = expenses.plus(installment);
  const totalCommitmentPct = round2(totalCommitment.div(income).times(100));
  const freeCashflow = round2(income.minus(totalCommitment));
  const emergencyFundMonths = totalCommitment.gt(0)
    ? round2(emergencyFund.div(totalCommitment))
    : 99;

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

  let score = 100;
  if (dsrPct > 45) score -= 40;
  else if (dsrPct > 30) score -= 25;

  if (freeCashflow < 0) score -= 40;
  if (emergencyFundMonths < 3) score -= 25;
  else if (emergencyFundMonths < 6) score -= 10;

  if (totalCommitmentPct > 80) score -= 15;

  return {
    dsr_pct: dsrPct,
    total_commitment_pct: totalCommitmentPct,
    free_cashflow: freeCashflow,
    emergency_fund_months: emergencyFundMonths,
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
