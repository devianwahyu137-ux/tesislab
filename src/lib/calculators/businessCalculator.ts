import Decimal from "decimal.js";
import { z } from "zod";

export const BusinessAuditInputSchema = z.object({
  initial_capital: z.number().min(0),
  monthly_fixed_cost: z.number().min(0),
  selling_price: z.number().positive(),
  unit_cogs: z.number().min(0),
  target_monthly_units: z.number().min(0),
  business_concept: z.string().trim().min(1),
  platform_commission_pct: z.number().min(0).max(50).optional(),
  include_umkm_tax: z.boolean().optional(),
});

export type BusinessAuditInput = z.infer<typeof BusinessAuditInputSchema>;

export type BusinessFlag =
  | "NEGATIVE_UNIT_MARGIN"
  | "THIN_CONTRIBUTION_MARGIN"
  | "BELOW_BEP_TARGET"
  | "FRAGILE_RUNWAY"
  | "PLATFORM_FEE_SQUEEZE";

export interface BusinessAuditResult {
  unit_margin_amount: number;
  unit_margin_pct: number;
  net_unit_margin_amount: number;
  net_unit_margin_pct: number;
  bep_units: number;
  bep_revenue: number;
  projected_monthly_profit: number;
  umkm_tax_monthly: number;
  platform_fee_monthly: number;
  ramp_up_burn_3m: number;
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
 * with Indonesian UMKM Final Tax (PP 55/2022 0.5%), Marketplace Commission squeeze,
 * 3-Month Ramp-Up Cash Burn (40% -> 65% -> 85% realistic opening curve),
 * Payback Period, and Margin of Safety metrics.
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
  const commissionPct = new Decimal(input.platform_commission_pct ?? 0);
  const taxPct = new Decimal(input.include_umkm_tax ? 0.5 : 0);

  const grossUnitMarginDec = sellingPrice.minus(unitCogs);
  const unitDeductionDec = sellingPrice.times(commissionPct.plus(taxPct).div(100));
  const effectiveUnitMarginDec = grossUnitMarginDec.minus(unitDeductionDec);

  const useNetMargin = commissionPct.gt(0) || Boolean(input.include_umkm_tax);
  const activeUnitMarginDec = useNetMargin
    ? effectiveUnitMarginDec
    : grossUnitMarginDec;

  const unitMarginAmount = round2(activeUnitMarginDec);
  const unitMarginPct = round2(activeUnitMarginDec.div(sellingPrice).times(100));
  const netUnitMarginAmount = round2(effectiveUnitMarginDec);
  const netUnitMarginPct = round2(
    effectiveUnitMarginDec.div(sellingPrice).times(100)
  );

  const grossMonthlyRevenue = targetUnits.times(sellingPrice);
  const umkmTaxMonthly = round2(grossMonthlyRevenue.times("0.005"));
  const platformFeeMonthly = round2(
    grossMonthlyRevenue.times(commissionPct.div(100))
  );

  const hasPositiveMargin = activeUnitMarginDec.gt(0);
  const bepUnits = hasPositiveMargin
    ? fixedCost.div(activeUnitMarginDec).ceil().toNumber()
    : 0;
  const bepRevenue = round2(new Decimal(bepUnits).times(sellingPrice));

  const projectedProfitDec = targetUnits
    .times(activeUnitMarginDec)
    .minus(fixedCost);
  const projectedMonthlyProfit = round2(projectedProfitDec);

  // Realistic 3-month opening ramp-up burn (Month 1: 40%, Month 2: 65%, Month 3: 85% of target units)
  const rampFactors = ["0.40", "0.65", "0.85"] as const;
  let cumulativeRampDeficit = new Decimal(0);
  for (const factor of rampFactors) {
    const monthPnl = targetUnits
      .times(factor)
      .times(activeUnitMarginDec)
      .minus(fixedCost);
    if (monthPnl.lt(0)) {
      cumulativeRampDeficit = cumulativeRampDeficit.plus(monthPnl.abs());
    }
  }
  const rampUpBurn3m = round2(cumulativeRampDeficit);

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
    .times(activeUnitMarginDec)
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

  if (
    commissionPct.gt(0) &&
    grossUnitMarginDec.div(sellingPrice).times(100).gte(20) &&
    netUnitMarginPct < 15
  ) {
    flags.push("PLATFORM_FEE_SQUEEZE");
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
    if (flags.includes("PLATFORM_FEE_SQUEEZE")) score -= 12;
    if (input.target_monthly_units < bepUnits) score -= 30;
  }

  if (stressedRunwayMonths < 3) score -= 35;
  else if (stressedRunwayMonths < 6) score -= 20;

  return {
    unit_margin_amount: unitMarginAmount,
    unit_margin_pct: unitMarginPct,
    net_unit_margin_amount: netUnitMarginAmount,
    net_unit_margin_pct: netUnitMarginPct,
    bep_units: bepUnits,
    bep_revenue: bepRevenue,
    projected_monthly_profit: projectedMonthlyProfit,
    umkm_tax_monthly: umkmTaxMonthly,
    platform_fee_monthly: platformFeeMonthly,
    ramp_up_burn_3m: rampUpBurn3m,
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
