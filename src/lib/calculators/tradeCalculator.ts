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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Pure deterministic calculator for Market & Trading Audit.
 */
export function calculateTradeAudit(input: TradeAuditInput): TradeAuditResult {
  const flags: TradeFlag[] = [];
  const isLong = input.direction === "LONG";

  const isSlValid = isLong
    ? input.stop_loss < input.entry_price
    : input.stop_loss > input.entry_price;
  const isTpValid = isLong
    ? input.take_profit > input.entry_price
    : input.take_profit < input.entry_price;

  if (!isSlValid) flags.push("INVALID_SL_DIRECTION");
  if (!isTpValid) flags.push("INVALID_TP_DIRECTION");

  const rewardDistance = isTpValid
    ? Math.abs(input.take_profit - input.entry_price)
    : 0;
  const riskDistance = isSlValid
    ? Math.abs(input.entry_price - input.stop_loss)
    : 0;

  const stopLossDistancePct = round2((riskDistance / input.entry_price) * 100);
  const positionValue = input.total_capital * (input.position_size_pct / 100);

  const potentialProfitAmount = round2(
    positionValue * (rewardDistance / input.entry_price)
  );
  const potentialLossAmount = round2(
    positionValue * (riskDistance / input.entry_price)
  );

  const riskPerTradePct = round2(
    (potentialLossAmount / input.total_capital) * 100
  );
  const rrRatio =
    riskDistance > 0 ? round2(rewardDistance / riskDistance) : 0;

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
  const safeSlippage = Math.max(0, slSlippagePct);
  const multiplier = 1 + safeSlippage / 100;
  const slDelta = Math.abs(input.entry_price - input.stop_loss) * multiplier;
  const stressedStopLoss =
    input.direction === "LONG"
      ? Math.max(0.000001, input.entry_price - slDelta)
      : input.entry_price + slDelta;

  return calculateTradeAudit({
    ...input,
    stop_loss: stressedStopLoss,
  });
}
