import { mean, standardDeviation } from "simple-statistics";

export interface QuantOhlcBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TrendRegime = "BULLISH" | "BEARISH" | "SIDEWAYS";

export interface MarketTechnicals {
  last_close: number;
  atr_14: number;
  atr_pct: number;
  sma_20: number;
  sma_50: number;
  rsi_14: number;
  annualized_volatility_pct: number;
  trend_regime: TrendRegime;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Computes objective quantitative market telemetry (ATR-14, SMA-20/50, RSI-14,
 * and annualized historical volatility) from daily OHLCV bars using simple-statistics.
 */
export function computeMarketTechnicals(
  bars: QuantOhlcBar[]
): MarketTechnicals | null {
  if (bars.length < 15) return null;

  const closes = bars.map((b) => b.close);
  const lastClose = closes[closes.length - 1];
  if (!Number.isFinite(lastClose) || lastClose <= 0) return null;

  // 1. True Range & ATR-14
  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const curr = bars[i];
    const prev = bars[i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    if (Number.isFinite(tr)) trueRanges.push(tr);
  }
  const atrSlice = trueRanges.slice(-14);
  const atr14 = atrSlice.length > 0 ? mean(atrSlice) : 0;
  const atrPct = (atr14 / lastClose) * 100;

  // 2. SMA-20 & SMA-50
  const sma20Slice = closes.slice(-Math.min(20, closes.length));
  const sma50Slice = closes.slice(-Math.min(50, closes.length));
  const sma20 = mean(sma20Slice);
  const sma50 = mean(sma50Slice);

  const trendRegime: TrendRegime =
    lastClose > sma20 && sma20 >= sma50
      ? "BULLISH"
      : lastClose < sma20 && sma20 <= sma50
        ? "BEARISH"
        : "SIDEWAYS";

  // 3. RSI-14 (Wilder-style average gains/losses over trailing 14 periods)
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = Math.max(1, closes.length - 14); i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }
  const avgGain = gains.length > 0 ? mean(gains) : 0;
  const avgLoss = losses.length > 0 ? mean(losses) : 0;
  const rsi14 =
    avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / Math.max(1e-9, avgLoss));

  // 4. Annualized Historical Volatility (log returns stdDev * sqrt(252) * 100)
  const logReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      logReturns.push(Math.log(closes[i] / closes[i - 1]));
    }
  }
  const dailyVol = logReturns.length >= 2 ? standardDeviation(logReturns) : 0;
  const annualizedVolPct = dailyVol * Math.sqrt(252) * 100;

  return {
    last_close: round2(lastClose),
    atr_14: round2(atr14),
    atr_pct: round2(atrPct),
    sma_20: round2(sma20),
    sma_50: round2(sma50),
    rsi_14: round2(rsi14),
    annualized_volatility_pct: round2(annualizedVolPct),
    trend_regime: trendRegime,
  };
}
