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
  baseline_score: number;
  deterministic_flags: BusinessFlag[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Pure deterministic calculator for Business & SME Audit.
 */
export function calculateBusinessAudit(
  input: BusinessAuditInput
): BusinessAuditResult {
  const flags: BusinessFlag[] = [];

  const unitMarginAmount = round2(input.selling_price - input.unit_cogs);
  const unitMarginPct = round2((unitMarginAmount / input.selling_price) * 100);

  const hasPositiveMargin = unitMarginAmount > 0;
  const bepUnits = hasPositiveMargin
    ? Math.ceil(input.monthly_fixed_cost / unitMarginAmount)
    : 0;
  const bepRevenue = round2(bepUnits * input.selling_price);

  const projectedMonthlyProfit = round2(
    input.target_monthly_units * unitMarginAmount - input.monthly_fixed_cost
  );

  // Stressed scenario: real sales only reach 50% of target_monthly_units
  const stressedUnits = input.target_monthly_units * 0.5;
  const stressedMonthlyProfit =
    stressedUnits * unitMarginAmount - input.monthly_fixed_cost;

  const stressedRunwayMonths =
    stressedMonthlyProfit >= 0
      ? 99
      : input.initial_capital > 0
        ? round2(input.initial_capital / Math.abs(stressedMonthlyProfit))
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
  const clampedDrop = Math.max(0, Math.min(100, salesDropPct));
  const stressedTargetUnits = Math.max(
    0,
    input.target_monthly_units * (1 - clampedDrop / 100)
  );

  return calculateBusinessAudit({
    ...input,
    target_monthly_units: stressedTargetUnits,
  });
}
