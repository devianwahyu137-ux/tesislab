import { mean, quantile, standardDeviation } from "simple-statistics";

export interface AssetSeriesInput {
  symbol: string;
  weightPct: number; // 0..100
  closes: number[];
}

export interface PortfolioCorrelationPair {
  assetA: string;
  assetB: string;
  correlation: number;
}

export interface AssetRiskProfile {
  symbol: string;
  normalizedWeightPct: number;
  annualizedVolPct: number;
  suggestedRiskParityWeightPct: number;
}

export interface PortfolioRiskReport {
  symbols: string[];
  matrix: number[][]; // N x N Pearson correlation (-1..+1)
  highCorrelationPairs: PortfolioCorrelationPair[];
  portfolioAnnualizedVolPct: number;
  undiversifiedVolPct: number;
  diversificationBenefitPct: number;
  parametricVar95DailyPct: number;
  parametricVar95DailyRp: number;
  historicalVar95DailyPct: number;
  historicalCvar95DailyPct: number;
  historicalCvar95DailyRp: number;
  monthlyVar95Rp: number;
  concentrationFlag: boolean;
  assetProfiles: AssetRiskProfile[];
}

function computeLogReturns(closes: number[]): number[] {
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1] ?? 0;
    const curr = closes[i] ?? 0;
    if (prev > 0 && curr > 0) {
      rets.push(Math.log(curr / prev));
    }
  }
  return rets;
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const sliceA = a.slice(a.length - n);
  const sliceB = b.slice(b.length - n);
  const meanA = mean(sliceA);
  const meanB = mean(sliceB);
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i += 1) {
    const da = (sliceA[i] ?? 0) - meanA;
    const db = (sliceB[i] ?? 0) - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  const denom = Math.sqrt(varA * varB);
  if (denom <= 1e-12) return 0;
  return Math.max(-1, Math.min(1, Number((cov / denom).toFixed(3))));
}

/**
 * Generates deterministic synthetic 90-day close series seeded by ticker string
 * as a zero-crash offline fallback when external Yahoo Finance quotes are unreachable.
 */
export function buildDeterministicFallbackCloses(symbol: string): number[] {
  const clean = symbol.trim().toUpperCase();
  let seed = 2166136261;
  for (let i = 0; i < clean.length; i += 1) {
    seed ^= clean.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const isBank = /BBCA|BMRI|BBRI|BBNI/.test(clean);
  const isCrypto = /BTC|ETH|SOL/.test(clean);
  const isGold = /GC=F|GOLD|XAU/.test(clean);

  const dailyVol = isCrypto ? 0.032 : isGold ? 0.009 : 0.015;
  const closes: number[] = [1000];
  let s = seed >>> 0;
  const nextRand = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let d = 1; d < 90; d += 1) {
    // Shared market factor so banking tickers naturally exhibit realistic positive correlation
    const commonFactor = Math.sin(d * 0.27) * (isBank ? 0.012 : isGold ? -0.003 : 0.005);
    const idio = (nextRand() - 0.5) * 2 * dailyVol;
    const prev = closes[d - 1] ?? 1000;
    closes.push(Math.max(10, prev * Math.exp(commonFactor + idio)));
  }
  return closes;
}

/**
 * Pure TypeScript Multi-Asset Correlation, Covariance Volatility, Value-at-Risk (95% VaR),
 * Conditional VaR (Expected Shortfall), and Inverse-Volatility Risk Parity engine.
 */
export function computePortfolioRisk(
  assets: AssetSeriesInput[],
  totalCapitalRp: number
): PortfolioRiskReport {
  const valid = assets.filter((a) => a.closes.length >= 5);
  const n = valid.length;
  if (n === 0) {
    return {
      symbols: [],
      matrix: [],
      highCorrelationPairs: [],
      portfolioAnnualizedVolPct: 0,
      undiversifiedVolPct: 0,
      diversificationBenefitPct: 0,
      parametricVar95DailyPct: 0,
      parametricVar95DailyRp: 0,
      historicalVar95DailyPct: 0,
      historicalCvar95DailyPct: 0,
      historicalCvar95DailyRp: 0,
      monthlyVar95Rp: 0,
      concentrationFlag: false,
      assetProfiles: [],
    };
  }

  const rawWeightSum = valid.reduce((acc, a) => acc + Math.max(0, a.weightPct), 0);
  const weights = valid.map((a) =>
    rawWeightSum > 0 ? Math.max(0, a.weightPct) / rawWeightSum : 1 / n
  );

  const returnSeries = valid.map((a) => computeLogReturns(a.closes));
  const dailyVols = returnSeries.map((r) =>
    r.length >= 2 ? standardDeviation(r) : 0.015
  );
  const annualVols = dailyVols.map((v) => v * Math.sqrt(252) * 100);

  // Build N x N correlation matrix & portfolio variance w^T * Sigma * w
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 1)
  );
  const highCorrelationPairs: PortfolioCorrelationPair[] = [];

  let portfolioDailyVar = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const corr =
        i === j
          ? 1
          : pearsonCorrelation(returnSeries[i] ?? [], returnSeries[j] ?? []);
      matrix[i]![j] = corr;
      if (j > i && corr >= 0.68) {
        highCorrelationPairs.push({
          assetA: valid[i]!.symbol,
          assetB: valid[j]!.symbol,
          correlation: corr,
        });
      }
      portfolioDailyVar +=
        (weights[i] ?? 0) *
        (weights[j] ?? 0) *
        (dailyVols[i] ?? 0) *
        (dailyVols[j] ?? 0) *
        corr;
    }
  }

  const portfolioDailyVol = Math.sqrt(Math.max(0, portfolioDailyVar));
  const portfolioAnnualizedVolPct = Number(
    (portfolioDailyVol * Math.sqrt(252) * 100).toFixed(2)
  );

  const undiversifiedDailyVol = weights.reduce(
    (acc, w, idx) => acc + w * (dailyVols[idx] ?? 0),
    0
  );
  const undiversifiedVolPct = Number(
    (undiversifiedDailyVol * Math.sqrt(252) * 100).toFixed(2)
  );
  const diversificationBenefitPct =
    undiversifiedVolPct > 0
      ? Number(
          Math.max(
            0,
            ((undiversifiedVolPct - portfolioAnnualizedVolPct) /
              undiversifiedVolPct) *
              100
          ).toFixed(1)
        )
      : 0;

  // Parametric 95% 1-day VaR (z = 1.64485)
  const z95 = 1.64485;
  const parametricVar95DailyPct = Number(
    (portfolioDailyVol * z95 * 100).toFixed(2)
  );
  const parametricVar95DailyRp = Math.round(
    totalCapitalRp * (parametricVar95DailyPct / 100)
  );
  const monthlyVar95Rp = Math.round(parametricVar95DailyRp * Math.sqrt(20));

  // Historical Portfolio Daily Return Series (aligned to shortest common length)
  const minLen = Math.min(...returnSeries.map((r) => r.length));
  const portDailyRets: number[] = [];
  for (let t = 0; t < minLen; t += 1) {
    let dayRet = 0;
    for (let i = 0; i < n; i += 1) {
      const series = returnSeries[i]!;
      dayRet += (weights[i] ?? 0) * (series[series.length - minLen + t] ?? 0);
    }
    portDailyRets.push(dayRet);
  }

  const p5Ret =
    portDailyRets.length >= 5 ? quantile(portDailyRets, 0.05) : -portfolioDailyVol * z95;
  const historicalVar95DailyPct = Number(
    (Math.abs(Math.min(0, p5Ret)) * 100).toFixed(2)
  );

  const tailLosses = portDailyRets.filter((r) => r <= p5Ret);
  const avgTailLoss =
    tailLosses.length > 0 ? mean(tailLosses) : p5Ret * 1.25;
  const historicalCvar95DailyPct = Number(
    (Math.abs(Math.min(0, avgTailLoss)) * 100).toFixed(2)
  );
  const historicalCvar95DailyRp = Math.round(
    totalCapitalRp * (historicalCvar95DailyPct / 100)
  );

  // Inverse-volatility Risk Parity weights
  const invVols = dailyVols.map((v) => 1 / Math.max(0.002, v));
  const invVolSum = invVols.reduce((a, b) => a + b, 0);

  const assetProfiles: AssetRiskProfile[] = valid.map((a, idx) => ({
    symbol: a.symbol,
    normalizedWeightPct: Number(((weights[idx] ?? 0) * 100).toFixed(1)),
    annualizedVolPct: Number((annualVols[idx] ?? 0).toFixed(2)),
    suggestedRiskParityWeightPct: Number(
      (((invVols[idx] ?? 0) / Math.max(1e-9, invVolSum)) * 100).toFixed(1)
    ),
  }));

  return {
    symbols: valid.map((a) => a.symbol),
    matrix,
    highCorrelationPairs,
    portfolioAnnualizedVolPct,
    undiversifiedVolPct,
    diversificationBenefitPct,
    parametricVar95DailyPct,
    parametricVar95DailyRp,
    historicalVar95DailyPct,
    historicalCvar95DailyPct,
    historicalCvar95DailyRp,
    monthlyVar95Rp,
    concentrationFlag:
      highCorrelationPairs.length > 0 ||
      weights.some((w) => w > 0.55),
    assetProfiles,
  };
}
