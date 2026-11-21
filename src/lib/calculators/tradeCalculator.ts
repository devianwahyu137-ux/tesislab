import Decimal from "decimal.js";
import { z } from "zod";

export const TradeDirectionSchema = z.enum(["LONG", "SHORT"]);
export type TradeDirection = z.infer<typeof TradeDirectionSchema>;

export const TradeAuditInputSchema = z.object({
  asset_symbol: z.string().trim().min(1),
  direction: TradeDirectionSchema,
  total_capital: z.number().positive(),
  position_size_pct: z.number().min(1).max(100),
  entry_price: z.number().positive(),
  take_profit: z.number().positive(),
  stop_loss: z.number().positive(),
  rationale: z.string().trim().min(1),
});

export type TradeAuditInput = z.infer<typeof TradeAuditInputSchema>;

export type TradeFlag =
  | "INVALID_SL_DIRECTION"
  | "INVALID_TP_DIRECTION"
  | "LOW_RR_RATIO"
  | "OVEREXPOSED_RISK"
  | "TIGHT_STOP_LOSS";

export interface TradeAuditResult {
  rr_ratio: number;
  risk_per_trade_pct: number;
  potential_profit_amount: number;
  potential_loss_amount: number;
  stop_loss_distance_pct: number;
  baseline_score: number;
  deterministic_flags: TradeFlag[];
}

function round2(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Pure deterministic calculator for Market & Trading Audit powered by Decimal.js
 * for exact financial arithmetic free of IEEE 754 floating-point drift.
 */
export function calculateTradeAudit(input: TradeAuditInput): TradeAuditResult {
  const flags: TradeFlag[] = [];
  const isLong = input.direction === "LONG";

  const entry = new Decimal(input.entry_price);
  const tp = new Decimal(input.take_profit);
  const sl = new Decimal(input.stop_loss);
  const capital = new Decimal(input.total_capital);
  const sizePct = new Decimal(input.position_size_pct);

  const isSlValid = isLong ? sl.lt(entry) : sl.gt(entry);
  const isTpValid = isLong ? tp.gt(entry) : tp.lt(entry);

  if (!isSlValid) flags.push("INVALID_SL_DIRECTION");
  if (!isTpValid) flags.push("INVALID_TP_DIRECTION");

  const rewardDistance = isTpValid ? tp.minus(entry).abs() : new Decimal(0);
  const riskDistance = isSlValid ? entry.minus(sl).abs() : new Decimal(0);

  const stopLossDistancePct = round2(riskDistance.div(entry).times(100));
  const positionValue = capital.times(sizePct.div(100));

  const potentialProfitDec = positionValue.times(rewardDistance.div(entry));
  const potentialLossDec = positionValue.times(riskDistance.div(entry));

  const potentialProfitAmount = round2(potentialProfitDec);
  const potentialLossAmount = round2(potentialLossDec);

  const riskPerTradePct = round2(potentialLossDec.div(capital).times(100));
  const rrRatio = riskDistance.gt(0)
    ? round2(rewardDistance.div(riskDistance))
    : 0;

  if (isSlValid && isTpValid && rrRatio < 1.5) {
    flags.push("LOW_RR_RATIO");
  }
  if (riskPerTradePct > 3) {
    flags.push("OVEREXPOSED_RISK");
  }
  if (isSlValid && stopLossDistancePct < 0.5) {
    flags.push("TIGHT_STOP_LOSS");
  }

  let score = 100;
  if (!isSlValid || !isTpValid) {
    score -= 75;
  } else {
    if (rrRatio < 1.0) score -= 35;
    else if (rrRatio < 1.5) score -= 25;

    if (riskPerTradePct > 5) score -= 45;
    else if (riskPerTradePct > 3) score -= 30;
    else if (riskPerTradePct > 2) score -= 10;

    if (stopLossDistancePct < 0.5) score -= 10;
  }

  return {
    rr_ratio: rrRatio,
    risk_per_trade_pct: riskPerTradePct,
    potential_profit_amount: potentialProfitAmount,
    potential_loss_amount: potentialLossAmount,
    stop_loss_distance_pct: stopLossDistancePct,
    baseline_score: clampScore(score),
    deterministic_flags: flags,
  };
}

/**
 * Client-safe What-If stress simulation for stop-loss slippage widening.
 */
export function simulateTradeStress(
  input: TradeAuditInput,
  slSlippagePct: number
): TradeAuditResult {
  const safeSlippage = new Decimal(Math.max(0, slSlippagePct));
  const multiplier = new Decimal(1).plus(safeSlippage.div(100));
  const entry = new Decimal(input.entry_price);
  const sl = new Decimal(input.stop_loss);
  const slDelta = entry.minus(sl).abs().times(multiplier);

  const stressedStopLoss =
    input.direction === "LONG"
      ? Decimal.max(new Decimal("0.000001"), entry.minus(slDelta)).toNumber()
      : entry.plus(slDelta).toNumber();

  return calculateTradeAudit({
    ...input,
    stop_loss: stressedStopLoss,
  });
}
