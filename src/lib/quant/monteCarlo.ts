import { quantile } from "simple-statistics";
import type {
  BusinessAuditInput,
  BusinessAuditResult,
  CashflowAuditInput,
  CashflowAuditResult,
  TradeAuditInput,
  TradeAuditResult,
} from "@/lib/calculators";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export interface MonteCarloBucket {
  bin_label: string;
  midpoint: number;
  count: number;
  is_loss: boolean;
}

export interface MonteCarloSummary {
  simulations: number;
  horizon_label: string;
  ruin_probability_pct: number;
  p5_ending_value: number;
  p50_ending_value: number;
  p95_ending_value: number;
  starting_value: number;
  ruin_definition: string;
  histogram: MonteCarloBucket[];
}

function formatShortRp(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

function buildHistogram(
  values: number[],
  lossThreshold: number,
  bins = 14
): MonteCarloBucket[] {
  if (values.length === 0) return [];
  let minVal = values[0];
  let maxVal = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < minVal) minVal = values[i];
    if (values[i] > maxVal) maxVal = values[i];
  }
  const span = Math.max(1, maxVal - minVal);
  const step = span / bins;
  const counts = new Array<number>(bins).fill(0);

  for (let i = 0; i < values.length; i++) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((values[i] - minVal) / step)));
    counts[idx]++;
  }

  return counts.map((count, i) => {
    const midpoint = Math.round(minVal + (i + 0.5) * step);
    return {
      bin_label: formatShortRp(midpoint),
      midpoint,
      count,
      is_loss: midpoint < lossThreshold,
    };
  });
}

/**
 * Deterministic Mulberry32 PRNG so Monte Carlo results are reproducible,
 * auditable in X-Ray Mode, and free of hydration/flicker jitter.
 */
function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard normal sample N(0, 1) */
function sampleNormal(rng: () => number): number {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const SIMULATIONS = 1000;

/**
 * Runs a 1,000-path seeded Monte Carlo Risk of Ruin simulation (< 8ms)
 * tailored to Trading (30 trades), Business (12 months), or Cashflow (12 months).
 */
export function runMonteCarloSimulation(
  track: AuditTrack,
  input: unknown,
  metrics: TradeAuditResult | BusinessAuditResult | CashflowAuditResult
): MonteCarloSummary {
  const rng = createSeededRng(20261121);
  const endingValues: number[] = new Array(SIMULATIONS);
  let ruinCount = 0;

  if (track === "trading") {
    const tInput = input as TradeAuditInput;
    const tMetrics = metrics as TradeAuditResult;
    const startCap = Math.max(1, tInput.total_capital || 1);
    const riskFrac = Math.min(0.95, Math.max(0, tMetrics.risk_per_trade_pct / 100));
    const rr = Math.max(0, tMetrics.rr_ratio);
    const ruinFloor = startCap * 0.75; // >25% drawdown threshold
    const winProb = 0.45; // Conservative retail baseline win-rate

    for (let s = 0; s < SIMULATIONS; s++) {
      let equity = startCap;
      let hitRuin = false;
      for (let step = 0; step < 30; step++) {
        const won = rng() < winProb;
        // Include subtle execution slippage noise
        const slip = 1 + Math.max(0, sampleNormal(rng) * 0.08);
        if (won) {
          equity += equity * riskFrac * rr;
        } else {
          equity -= equity * riskFrac * slip;
        }
        if (equity <= ruinFloor) {
          hitRuin = true;
        }
        if (equity <= 0) {
          equity = 0;
          break;
        }
      }
      if (hitRuin) ruinCount++;
      endingValues[s] = Math.round(equity);
    }

    return {
      simulations: SIMULATIONS,
      horizon_label: "30 trades",
      ruin_probability_pct: round1((ruinCount / SIMULATIONS) * 100),
      p5_ending_value: Math.round(quantile(endingValues, 0.05)),
      p50_ending_value: Math.round(quantile(endingValues, 0.5)),
      p95_ending_value: Math.round(quantile(endingValues, 0.95)),
      starting_value: Math.round(startCap),
      ruin_definition: "Drawdown > 25% within 30 trades (45% baseline WR)",
      histogram: buildHistogram(endingValues, startCap),
    };
  }

  if (track === "business") {
    const bInput = input as BusinessAuditInput;
    const bMetrics = metrics as BusinessAuditResult;
    const startCash = Math.max(0, bInput.initial_capital || 0);
    const fixedCost = Math.max(0, bInput.monthly_fixed_cost || 0);
    const unitMargin = bMetrics.unit_margin_amount;
    const targetUnits = Math.max(0, bInput.target_monthly_units || 0);

    for (let s = 0; s < SIMULATIONS; s++) {
      let cash = startCash;
      let hitRuin = cash <= 0;
      for (let m = 0; m < 12; m++) {
        // Monthly demand volatility (mean 0.92x target to account for ramp-up, sigma 0.28)
        const demandFactor = Math.max(
          0.2,
          Math.min(1.45, 0.92 + sampleNormal(rng) * 0.28)
        );
        const monthlyProfit = targetUnits * demandFactor * unitMargin - fixedCost;
        cash += monthlyProfit;
        if (cash <= 0) {
          hitRuin = true;
        }
      }
      if (hitRuin) ruinCount++;
      endingValues[s] = Math.round(cash);
    }

    return {
      simulations: SIMULATIONS,
      horizon_label: "12 months",
      ruin_probability_pct: round1((ruinCount / SIMULATIONS) * 100),
      p5_ending_value: Math.round(quantile(endingValues, 0.05)),
      p50_ending_value: Math.round(quantile(endingValues, 0.5)),
      p95_ending_value: Math.round(quantile(endingValues, 0.95)),
      starting_value: Math.round(startCash),
      ruin_definition: "Cash balance <= 0 within 12 months",
      histogram: buildHistogram(endingValues, 0),
    };
  }

  // Track 3: Personal Cashflow (12-month liquidity stress with random income/expense shocks)
  const cInput = input as CashflowAuditInput;
  const startReserve = Math.max(0, cInput.liquid_emergency_fund || 0);
  const income = Math.max(1, cInput.monthly_net_income || 1);
  const expenses = Math.max(0, cInput.current_monthly_expenses || 0);
  const installment = Math.max(0, cInput.new_monthly_installment || 0);
  const tenor = Math.max(1, cInput.installment_months || 1);

  for (let s = 0; s < SIMULATIONS; s++) {
    let reserve = startReserve;
    let hitRuin = reserve <= 0;
    for (let m = 0; m < 12; m++) {
      // 10% monthly chance of income disruption (-25% to -50%) or emergency expense
      const shockRoll = rng();
      const effectiveIncome =
        shockRoll < 0.08 ? income * (0.55 + rng() * 0.2) : income;
      const unexpectedExpense =
        shockRoll > 0.9 ? expenses * (0.35 + rng() * 0.4) : 0;
      const activeInstallment = m < tenor ? installment : 0;
      const netFlow =
        effectiveIncome - expenses - activeInstallment - unexpectedExpense;
      reserve += netFlow;
      if (reserve <= 0) {
        hitRuin = true;
      }
    }
    if (hitRuin) ruinCount++;
    endingValues[s] = Math.round(reserve);
  }

  return {
    simulations: SIMULATIONS,
    horizon_label: "12 months",
    ruin_probability_pct: round1((ruinCount / SIMULATIONS) * 100),
    p5_ending_value: Math.round(quantile(endingValues, 0.05)),
    p50_ending_value: Math.round(quantile(endingValues, 0.5)),
    p95_ending_value: Math.round(quantile(endingValues, 0.95)),
    starting_value: Math.round(startReserve),
    ruin_definition: "Liquid reserve <= 0 within 12 months under random shocks",
    histogram: buildHistogram(endingValues, 0),
  };
}
