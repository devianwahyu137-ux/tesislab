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
  atr_pct: z.number().positive().optional(),
  round_trip_fee_pct: z.number().min(0).max(5).optional(),
  assumed_win_rate_pct: z.number().min(5).max(95).optional(),
});

export type TradeAuditInput = z.infer<typeof TradeAuditInputSchema>;

export type TradeFlag =
  | "INVALID_SL_DIRECTION"
  | "INVALID_TP_DIRECTION"
  | "LOW_RR_RATIO"
  | "OVEREXPOSED_RISK"
  | "TIGHT_STOP_LOSS"
  | "SL_INSIDE_MARKET_NOISE"
  | "FEE_ERODES_EDGE";

export interface TradeAuditResult {
  rr_ratio: number;
  net_rr_ratio: number;
  risk_per_trade_pct: number;
  potential_profit_amount: number;
  potential_loss_amount: number;
  net_profit_amount: number;
  net_loss_amount: number;
  estimated_fee_amount: number;
  applied_fee_pct: number;
  is_idx_asset: boolean;
  estimated_shares: number;
  idx_lots: number | null;
  half_kelly_position_pct: number;
  stop_loss_distance_pct: number;
  breakeven_win_rate_pct: number;
  max_safe_position_pct: number;
  sl_to_atr_ratio: number | null;
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
 * with IDX Broker/Tax Fee erosion, Lot Sizing (100 shares/lot), Half-Kelly Criterion,
 * Breakeven Win-Rate, 2%-Rule Optimal Sizing, and ATR-14 noise detection.
 */
export function calculateTradeAudit(input: TradeAuditInput): TradeAuditResult {
  const flags: TradeFlag[] = [];
  const isLong = input.direction === "LONG";
  const symbolUpper = input.asset_symbol.trim().toUpperCase();
  const isIdxAsset = symbolUpper.endsWith(".JK");

  // Default realistic round-trip fee: IDX ~0.40% (0.15% buy + 0.25% sell incl. levy/tax), Crypto/Global ~0.20%
  const defaultFeePct = isIdxAsset ? 0.4 : 0.2;
  const appliedFeeDec = new Decimal(
    typeof input.round_trip_fee_pct === "number"
      ? input.round_trip_fee_pct
      : defaultFeePct
  );

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

  const stopLossDistanceDec = riskDistance.div(entry).times(100);
  const stopLossDistancePct = round2(stopLossDistanceDec);
  const positionValue = capital.times(sizePct.div(100));

  const potentialProfitDec = positionValue.times(rewardDistance.div(entry));
  const potentialLossDec = positionValue.times(riskDistance.div(entry));

  const potentialProfitAmount = round2(potentialProfitDec);
  const potentialLossAmount = round2(potentialLossDec);

  // Broker + exchange tax round-trip cost on position notional
  const estimatedFeeDec = positionValue.times(appliedFeeDec.div(100));
  const estimatedFeeAmount = round2(estimatedFeeDec);
  const netProfitDec = Decimal.max(new Decimal(0), potentialProfitDec.minus(estimatedFeeDec));
  const netLossDec = potentialLossDec.plus(estimatedFeeDec);
  const netProfitAmount = round2(netProfitDec);
  const netLossAmount = round2(netLossDec);

  const riskPerTradePct = round2(potentialLossDec.div(capital).times(100));
  const rrDec = riskDistance.gt(0)
    ? rewardDistance.div(riskDistance)
    : new Decimal(0);
  const rrRatio = round2(rrDec);

  const netRrDec =
    isSlValid && isTpValid && netLossDec.gt(0)
      ? netProfitDec.div(netLossDec)
      : new Decimal(0);
  const netRrRatio = round2(netRrDec);

  // Share & IDX Lot sizing (1 IDX lot = 100 shares)
  const rawShares = entry.gt(0) ? positionValue.div(entry) : new Decimal(0);
  const estimatedShares = round2(rawShares);
  const idxLots = isIdxAsset ? rawShares.div(100).floor().toNumber() : null;

  // Breakeven Win-Rate = 1 / (1 + R:R) * 100
  const breakevenWinRatePct = rrDec.gt(0)
    ? round2(new Decimal(1).div(new Decimal(1).plus(rrDec)).times(100))
    : 100;

  // Max safe position size (% of capital) to keep risk <= 2%
  const maxSafePositionPct = stopLossDistanceDec.gt(0)
    ? round2(
        Decimal.min(
          new Decimal(100),
          new Decimal(2).div(stopLossDistanceDec).times(100)
        )
      )
    : 0;

  // Half-Kelly Optimal Position Size (% of capital)
  // Kelly risk fraction f* = p - (1 - p) / b, converted to position % via stopLossDistancePct
  const winProb = new Decimal(
    typeof input.assumed_win_rate_pct === "number"
      ? input.assumed_win_rate_pct
      : Math.min(58, Math.max(45, breakevenWinRatePct + 12))
  ).div(100);
  const kellyRiskFraction =
    netRrDec.gt(0)
      ? Decimal.max(
          new Decimal(0),
          winProb.minus(new Decimal(1).minus(winProb).div(netRrDec))
        )
      : new Decimal(0);
  const halfKellyRiskPct = kellyRiskFraction.div(2).times(100);
  const halfKellyPositionPct = stopLossDistanceDec.gt(0)
    ? round2(
        Decimal.min(
          new Decimal(100),
          halfKellyRiskPct.div(stopLossDistanceDec).times(100)
        )
      )
    : 0;

  // Compare Stop-Loss distance against real market ATR-14% if available
  const slToAtrRatio =
    typeof input.atr_pct === "number" &&
    input.atr_pct > 0 &&
    stopLossDistanceDec.gt(0)
      ? round2(stopLossDistanceDec.div(new Decimal(input.atr_pct)))
      : null;

  if (isSlValid && isTpValid && rrRatio < 1.5) {
    flags.push("LOW_RR_RATIO");
  }
  if (isSlValid && isTpValid && rrRatio >= 1.5 && netRrRatio < 1.1) {
    flags.push("FEE_ERODES_EDGE");
  }
  if (riskPerTradePct > 3) {
    flags.push("OVEREXPOSED_RISK");
  }
  if (isSlValid && stopLossDistancePct < 0.5) {
    flags.push("TIGHT_STOP_LOSS");
  }
  if (isSlValid && slToAtrRatio !== null && slToAtrRatio < 1.0) {
    flags.push("SL_INSIDE_MARKET_NOISE");
  }

  let score = 100;
  if (!isSlValid || !isTpValid) {
    score -= 75;
  } else {
    if (rrRatio < 1.0) score -= 35;
    else if (rrRatio < 1.5) score -= 25;
    else if (netRrRatio < 1.1) score -= 15;

    if (riskPerTradePct > 5) score -= 45;
    else if (riskPerTradePct > 3) score -= 30;
    else if (riskPerTradePct > 2) score -= 10;

    if (stopLossDistancePct < 0.5) score -= 10;
    if (slToAtrRatio !== null && slToAtrRatio < 1.0) score -= 10;
  }

  return {
    rr_ratio: rrRatio,
    net_rr_ratio: netRrRatio,
    risk_per_trade_pct: riskPerTradePct,
    potential_profit_amount: potentialProfitAmount,
    potential_loss_amount: potentialLossAmount,
    net_profit_amount: netProfitAmount,
    net_loss_amount: netLossAmount,
    estimated_fee_amount: estimatedFeeAmount,
    applied_fee_pct: round2(appliedFeeDec),
    is_idx_asset: isIdxAsset,
    estimated_shares: estimatedShares,
    idx_lots: idxLots,
    half_kelly_position_pct: halfKellyPositionPct,
    stop_loss_distance_pct: stopLossDistancePct,
    breakeven_win_rate_pct: breakevenWinRatePct,
    max_safe_position_pct: maxSafePositionPct,
    sl_to_atr_ratio: slToAtrRatio,
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
