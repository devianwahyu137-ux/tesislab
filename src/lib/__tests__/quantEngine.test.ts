import { describe, expect, it } from "vitest";
import {
  calculateBusinessAudit,
  calculateCashflowAudit,
  calculateTradeAudit,
  simulateBusinessStress,
  simulateCashflowStress,
  simulateTradeStress,
} from "@/lib/calculators";
import { runMonteCarloSimulation } from "@/lib/quant/monteCarlo";
import { computeMarketTechnicals } from "@/lib/quant/technicalIndicators";

describe("Trade Calculator (Decimal.js + ATR Noise Gate)", () => {
  it("computes exact R:R, breakeven win-rate, and max safe position size", () => {
    const res = calculateTradeAudit({
      asset_symbol: "BBCA.JK",
      direction: "LONG",
      total_capital: 25_000_000,
      position_size_pct: 40,
      entry_price: 6_250,
      take_profit: 6_875, // +10%
      stop_loss: 5_937.5, // -5%
      rationale: "Support bounce",
      atr_pct: 2.0,
    });

    expect(res.rr_ratio).toBe(2);
    expect(res.risk_per_trade_pct).toBe(2);
    expect(res.breakeven_win_rate_pct).toBe(33.33);
    expect(res.max_safe_position_pct).toBe(40);
    expect(res.sl_to_atr_ratio).toBe(2.5);
    expect(res.deterministic_flags).toEqual([]);
    expect(res.baseline_score).toBe(100);
  });

  it("flags SL_INSIDE_MARKET_NOISE when SL distance is narrower than 1x ATR", () => {
    const res = calculateTradeAudit({
      asset_symbol: "BTC-USD",
      direction: "LONG",
      total_capital: 10_000_000,
      position_size_pct: 20,
      entry_price: 60_000,
      take_profit: 66_000,
      stop_loss: 59_100, // 1.5% SL
      rationale: "Breakout",
      atr_pct: 3.0, // 1.5% < 3.0% => 0.5x ATR
    });

    expect(res.sl_to_atr_ratio).toBe(0.5);
    expect(res.deterministic_flags).toContain("SL_INSIDE_MARKET_NOISE");
  });

  it("widens stop loss under stress simulation", () => {
    const base = {
      asset_symbol: "BBCA.JK",
      direction: "LONG" as const,
      total_capital: 25_000_000,
      position_size_pct: 40,
      entry_price: 6_250,
      take_profit: 6_600,
      stop_loss: 5_850,
      rationale: "Test",
    };
    const normal = calculateTradeAudit(base);
    const stressed = simulateTradeStress(base, 50);
    expect(stressed.potential_loss_amount).toBeGreaterThan(
      normal.potential_loss_amount
    );
  });
});

describe("Business Calculator (Decimal.js + Payback & Margin of Safety)", () => {
  it("computes exact BEP ceiling, payback period, and margin of safety", () => {
    const res = calculateBusinessAudit({
      initial_capital: 60_000_000,
      monthly_fixed_cost: 10_000_000,
      selling_price: 200_000,
      unit_cogs: 100_000,
      target_monthly_units: 200,
      business_concept: "Coffee kiosk",
    });

    expect(res.unit_margin_amount).toBe(100_000);
    expect(res.unit_margin_pct).toBe(50);
    expect(res.bep_units).toBe(100);
    expect(res.projected_monthly_profit).toBe(10_000_000);
    expect(res.payback_period_months).toBe(6);
    expect(res.margin_of_safety_pct).toBe(50);
    expect(res.stressed_runway_months).toBe(99);
    expect(res.baseline_score).toBe(100);
  });

  it("reduces profit under sales drop stress", () => {
    const base = {
      initial_capital: 30_000_000,
      monthly_fixed_cost: 14_500_000,
      selling_price: 220_000,
      unit_cogs: 155_000,
      target_monthly_units: 300,
      business_concept: "Retail booth",
    };
    const stressed = simulateBusinessStress(base, 40);
    expect(stressed.projected_monthly_profit).toBeLessThan(
      calculateBusinessAudit(base).projected_monthly_profit
    );
  });
});

describe("Cashflow Calculator (Decimal.js + Savings Rate & Tenor Burden)", () => {
  it("computes exact DSR, savings rate, and total tenor burden", () => {
    const res = calculateCashflowAudit({
      monthly_net_income: 20_000_000,
      current_monthly_expenses: 9_000_000,
      new_monthly_installment: 3_000_000,
      installment_months: 12,
      liquid_emergency_fund: 80_000_000,
      decision_purpose: "Workstation",
    });

    expect(res.dsr_pct).toBe(15);
    expect(res.free_cashflow).toBe(8_000_000);
    expect(res.savings_rate_pct).toBe(40);
    expect(res.total_installment_burden).toBe(36_000_000);
    expect(res.baseline_score).toBe(100);
  });

  it("flags deficit cashflow under severe income drop", () => {
    const stressed = simulateCashflowStress(
      {
        monthly_net_income: 12_000_000,
        current_monthly_expenses: 7_500_000,
        new_monthly_installment: 4_200_000,
        installment_months: 12,
        liquid_emergency_fund: 15_000_000,
        decision_purpose: "Laptop",
      },
      30
    );
    expect(stressed.deterministic_flags).toContain("DEFICIT_CASHFLOW");
  });
});

describe("Technical Indicators & 1,000-Path Monte Carlo Engine", () => {
  it("computes ATR-14, SMA, RSI-14, and annualized volatility from OHLCV bars", () => {
    const bars = Array.from({ length: 60 }, (_, idx) => {
      const base = 1000 + idx * 10;
      return {
        time: 1700000000 + idx * 86400,
        open: base - 5,
        high: base + 15,
        low: base - 15,
        close: base,
      };
    });

    const tech = computeMarketTechnicals(bars);
    expect(tech).not.toBeNull();
    expect(tech!.trend_regime).toBe("BULLISH");
    expect(tech!.atr_14).toBeGreaterThan(0);
    expect(tech!.rsi_14).toBeGreaterThan(70);
    expect(tech!.annualized_volatility_pct).toBeGreaterThan(0);
  });

  it("produces deterministic 1,000-path Monte Carlo percentiles (P5 <= P50 <= P95)", () => {
    const input = {
      asset_symbol: "BBCA.JK",
      direction: "LONG" as const,
      total_capital: 25_000_000,
      position_size_pct: 40,
      entry_price: 6_250,
      take_profit: 6_600,
      stop_loss: 5_850,
      rationale: "FOMO",
    };
    const metrics = calculateTradeAudit(input);
    const run1 = runMonteCarloSimulation("trading", input, metrics);
    const run2 = runMonteCarloSimulation("trading", input, metrics);

    expect(run1).toEqual(run2);
    expect(run1.simulations).toBe(1000);
    expect(run1.p5_ending_value).toBeLessThanOrEqual(run1.p50_ending_value);
    expect(run1.p50_ending_value).toBeLessThanOrEqual(run1.p95_ending_value);
    expect(run1.ruin_probability_pct).toBeGreaterThanOrEqual(0);
    expect(run1.ruin_probability_pct).toBeLessThanOrEqual(100);
  });
});
