import Decimal from "decimal.js";
import { z } from "zod";

export const BusinessAuditInputSchema = z.object({
  initial_capital: z.number().min(0),
  monthly_fixed_cost: z.number().min(0),
  selling_price: z.number().positive(),
  unit_cogs: z.number().min(0),
  target_monthly_units: z.number().min(0),
  business_concept: z.string().trim().min(1),
});

export type BusinessAuditInput = z.infer<typeof BusinessAuditInputSchema>;

export type BusinessFlag =
  | "NEGATIVE_UNIT_MARGIN"
  | "THIN_CONTRIBUTION_MARGIN"
  | "BELOW_BEP_TARGET"
  | "FRAGILE_RUNWAY";

export interface BusinessAuditResult {
  unit_margin_amount: number;
  unit_margin_pct: number;
  bep_units: number;
  bep_revenue: number;
  projected_monthly_profit: number;
  stressed_runway_months: number;
  payback_period_months: number | null;
  margin_of_safety_pct: number;
  baseline_score: number;
  deterministic_flags: BusinessFlag[];
}

function round2(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Pure deterministic calculator for Business & SME Audit powered by Decimal.js
 * with Payback Period and Margin of Safety metrics.
 */
export function calculateBusinessAudit(
  input: BusinessAuditInput
): BusinessAuditResult {
  const flags: BusinessFlag[] = [];

  const initialCapital = new Decimal(input.initial_capital);
  const fixedCost = new Decimal(input.monthly_fixed_cost);
  const sellingPrice = new Decimal(input.selling_price);
  const unitCogs = new Decimal(input.unit_cogs);
  const targetUnits = new Decimal(input.target_monthly_units);

  const unitMarginDec = sellingPrice.minus(unitCogs);
  const unitMarginAmount = round2(unitMarginDec);
  const unitMarginPct = round2(unitMarginDec.div(sellingPrice).times(100));

  const hasPositiveMargin = unitMarginDec.gt(0);
  const bepUnits = hasPositiveMargin
    ? fixedCost.div(unitMarginDec).ceil().toNumber()
    : 0;
  const bepRevenue = round2(new Decimal(bepUnits).times(sellingPrice));

  const projectedProfitDec = targetUnits.times(unitMarginDec).minus(fixedCost);
  const projectedMonthlyProfit = round2(projectedProfitDec);

  // Payback Period (months to recover initial_capital from projected monthly profit)
  const paybackPeriodMonths =
    projectedProfitDec.gt(0) && initialCapital.gt(0)
      ? round2(initialCapital.div(projectedProfitDec))
      : null;

  // Margin of Safety (%) = (target_units - bep_units) / target_units * 100
  const marginOfSafetyPct =
    hasPositiveMargin && targetUnits.gt(0)
      ? round2(targetUnits.minus(bepUnits).div(targetUnits).times(100))
      : -100;

  // Stressed scenario: real sales only reach 50% of target_monthly_units
  const stressedUnits = targetUnits.times("0.5");
  const stressedMonthlyProfitDec = stressedUnits
    .times(unitMarginDec)
    .minus(fixedCost);

  const stressedRunwayMonths = stressedMonthlyProfitDec.gte(0)
    ? 99
    : initialCapital.gt(0)
      ? round2(initialCapital.div(stressedMonthlyProfitDec.abs()))
      : 0;

  if (!hasPositiveMargin) {
    flags.push("NEGATIVE_UNIT_MARGIN");
  } else if (unitMarginPct < 20) {
    flags.push("THIN_CONTRIBUTION_MARGIN");
  }

  if (hasPositiveMargin && input.target_monthly_units < bepUnits) {
    flags.push("BELOW_BEP_TARGET");
  }

  if (stressedRunwayMonths < 6) {
    flags.push("FRAGILE_RUNWAY");
  }

  let score = 100;
  if (!hasPositiveMargin) {
    score -= 65;
  } else {
    if (unitMarginPct < 20) score -= 10;
    if (input.target_monthly_units < bepUnits) score -= 30;
  }

  if (stressedRunwayMonths < 3) score -= 35;
  else if (stressedRunwayMonths < 6) score -= 20;

  return {
    unit_margin_amount: unitMarginAmount,
    unit_margin_pct: unitMarginPct,
    bep_units: bepUnits,
    bep_revenue: bepRevenue,
    projected_monthly_profit: projectedMonthlyProfit,
    stressed_runway_months: stressedRunwayMonths,
    payback_period_months: paybackPeriodMonths,
    margin_of_safety_pct: marginOfSafetyPct,
    baseline_score: clampScore(score),
    deterministic_flags: flags,
  };
}

/**
 * Client-safe What-If stress simulation for monthly sales volume drops (0% - 50%+).
 */
export function simulateBusinessStress(
  input: BusinessAuditInput,
  salesDropPct: number
): BusinessAuditResult {
  const clampedDrop = new Decimal(Math.max(0, Math.min(100, salesDropPct)));
  const factor = new Decimal(1).minus(clampedDrop.div(100));
  const stressedTargetUnits = Decimal.max(
    0,
    new Decimal(input.target_monthly_units).times(factor)
  ).toNumber();

  return calculateBusinessAudit({
    ...input,
    target_monthly_units: stressedTargetUnits,
  });
}
