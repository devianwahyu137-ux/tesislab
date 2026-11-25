import { describe, expect, it } from "vitest";
import {
  calculateBusinessAudit,
  calculateCashflowAudit,
  calculateTradeAudit,
  convertFlatMonthlyToEffectiveApr,
  simulateBusinessStress,
  simulateCashflowStress,
  simulateTradeStress,
} from "@/lib/calculators";
import { DEMO_PRESETS, getDemoPresetByTrack } from "@/lib/agents/demoPresets";
import {
  computeCalibrationMetrics,
  SAMPLE_JOURNAL_ENTRIES,
} from "@/lib/auditHistory";
import { analyzeFinancialCsv, SAMPLE_CSV_DATASETS } from "@/lib/csvAnalyzer";
import { decodeSharedDossier, encodeSharedDossier } from "@/lib/dossierShare";
import { runMonteCarloSimulation } from "@/lib/quant/monteCarlo";
import {
  buildDeterministicFallbackCloses,
  computePortfolioRisk,
} from "@/lib/quant/portfolioRisk";
import { computeMarketTechnicals } from "@/lib/quant/technicalIndicators";

describe("Trade Calculator (Decimal.js + IDX Lots, Fees, Kelly & ATR Gate)", () => {
  it("computes exact R:R, IDX lots, net R:R after broker fees, Half-Kelly, and max safe size", () => {
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
    expect(res.is_idx_asset).toBe(true);
    expect(res.idx_lots).toBe(16); // Rp10M / 6,250 = 1,600 shares = 16 lots
    expect(res.applied_fee_pct).toBe(0.4);
    expect(res.net_rr_ratio).toBeGreaterThan(1.7);
    expect(res.half_kelly_position_pct).toBeGreaterThan(0);
    expect(res.risk_per_trade_pct).toBe(2);
    expect(res.breakeven_win_rate_pct).toBe(33.33);
    expect(res.max_safe_position_pct).toBe(40);
    expect(res.sl_to_atr_ratio).toBe(2.5);
    expect(res.deterministic_flags).toEqual([]);
    expect(res.baseline_score).toBe(100);
  });

  it("flags FEE_ERODES_EDGE when round-trip broker fees destroy tight scalping R:R", () => {
    const res = calculateTradeAudit({
      asset_symbol: "BBRI.JK",
      direction: "LONG",
      total_capital: 20_000_000,
      position_size_pct: 25,
      entry_price: 5_000,
      take_profit: 5_045, // +0.9%
      stop_loss: 4_970, // -0.6% -> gross R:R = 1.5
      rationale: "Tight scalp",
      round_trip_fee_pct: 0.4, // Net reward +0.5% vs net loss -1.0% -> net R:R = 0.50
    });

    expect(res.rr_ratio).toBe(1.5);
    expect(res.net_rr_ratio).toBe(0.5);
    expect(res.deterministic_flags).toContain("FEE_ERODES_EDGE");
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

    expect(res.is_idx_asset).toBe(false);
    expect(res.idx_lots).toBeNull();
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

describe("Business Calculator (Decimal.js + UMKM Tax, Platform Fee & Ramp-Up Burn)", () => {
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
    expect(res.ramp_up_burn_3m).toBe(2_000_000); // Month 1 @ 80 units (-2M), Month 2 @ 130 (+3M), Month 3 @ 170 (+7M)
    expect(res.stressed_runway_months).toBe(99);
    expect(res.baseline_score).toBe(100);
  });

  it("flags PLATFORM_FEE_SQUEEZE when delivery marketplace commission crushes net margin", () => {
    const res = calculateBusinessAudit({
      initial_capital: 35_000_000,
      monthly_fixed_cost: 8_000_000,
      selling_price: 50_000,
      unit_cogs: 35_000, // 30% gross margin
      target_monthly_units: 900,
      business_concept: "Cloud kitchen F&B",
      platform_commission_pct: 20, // -10,000/unit -> net margin drops to 9.5% with UMKM tax
      include_umkm_tax: true,
    });

    expect(res.net_unit_margin_pct).toBe(9.5);
    expect(res.umkm_tax_monthly).toBe(225_000);
    expect(res.deterministic_flags).toContain("PLATFORM_FEE_SQUEEZE");
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

describe("Cashflow Calculator (Decimal.js + Combined OJK DSR & True Effective APR)", () => {
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

  it("converts monthly flat PayLater interest into exact effective annual APR and flags predatory rates", () => {
    const apr = convertFlatMonthlyToEffectiveApr(1.5, 12);
    expect(apr).toBeGreaterThan(31);
    expect(apr).toBeLessThan(34);

    const res = calculateCashflowAudit({
      monthly_net_income: 15_000_000,
      current_monthly_expenses: 6_000_000,
      existing_debt_installment: 3_000_000,
      new_monthly_installment: 2_250_000,
      installment_months: 12,
      liquid_emergency_fund: 40_000_000,
      decision_purpose: "PayLater gadget",
      flat_interest_pct_per_month: 1.75,
    });

    expect(res.total_ojk_dsr_pct).toBe(35); // (3M + 2.25M) / 15M = 35%
    expect(res.deterministic_flags).toContain("HIGH_DEBT_SERVICE_RATIO");
    expect(res.deterministic_flags).toContain("PREDATORY_EFFECTIVE_APR");
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

describe("Demo Presets Parity & 1,000-Path Monte Carlo Engine", () => {
  it("keeps client-shared demo presets aligned with deterministic verdict statuses", () => {
    expect(DEMO_PRESETS).toHaveLength(3);
    const tradePreset = getDemoPresetByTrack("trading");
    expect(tradePreset.track).toBe("trading");
    if (tradePreset.track === "trading") {
      const calc = calculateTradeAudit(tradePreset.input);
      expect(calc.baseline_score).toBeGreaterThanOrEqual(75);
      expect(calc.deterministic_flags).toEqual([]);
    }
  });

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
    expect(run1.histogram.length).toBe(14);
    expect(run1.p5_ending_value).toBeLessThanOrEqual(run1.p50_ending_value);
    expect(run1.p50_ending_value).toBeLessThanOrEqual(run1.p95_ending_value);
    expect(run1.ruin_probability_pct).toBeGreaterThanOrEqual(0);
    expect(run1.ruin_probability_pct).toBeLessThanOrEqual(100);
  });

  it("parses Indonesian CSV bank statements locally and computes active OJK DSR", () => {
    const res = analyzeFinancialCsv(SAMPLE_CSV_DATASETS.household.csv);
    expect(res.rows.length).toBeGreaterThanOrEqual(8);
    expect(res.totalInflow).toBe(16_500_000);
    expect(res.debtOutflow).toBe(5_000_000);
    expect(res.ojkDsrPct).toBeCloseTo(30.3, 1);
  });

  it("computes multi-asset Pearson correlation matrix, 95% VaR, and Risk Parity weights", () => {
    const assets = ["BBCA.JK", "BMRI.JK", "GC=F"].map((sym, idx) => ({
      symbol: sym,
      weightPct: idx === 0 ? 45 : idx === 1 ? 35 : 20,
      closes: buildDeterministicFallbackCloses(sym),
    }));
    const report = computePortfolioRisk(assets, 100_000_000);
    expect(report.matrix).toHaveLength(3);
    expect(report.matrix[0]![0]).toBe(1);
    expect(report.parametricVar95DailyRp).toBeGreaterThan(0);
    expect(report.historicalCvar95DailyRp).toBeGreaterThanOrEqual(
      report.parametricVar95DailyRp * 0.5
    );
    expect(report.assetProfiles).toHaveLength(3);
  });

  it("computes probabilistic Brier calibration scores across resolved post-mortem entries", () => {
    const cal = computeCalibrationMetrics(SAMPLE_JOURNAL_ENTRIES);
    expect(cal.totalAudits).toBe(3);
    expect(cal.resolvedCount).toBe(3);
    expect(cal.userBrierScore).not.toBeNull();
    expect(cal.engineBrierScore).not.toBeNull();
    // Engine scores (88%, 52%, 28%) match outcomes (1, 0, 0) much closer than overconfident user (80%, 85%, 75%)
    expect(cal.engineBrierScore!).toBeLessThan(cal.userBrierScore!);
  });

  it("round-trips shareable dossier payloads cleanly via lz-string URL compression", () => {
    const token = encodeSharedDossier({
      audit_id: "TL-2026-SH01",
      track: "trading",
      verdict_status: "CLEARED",
      score: 86,
      submitted_conviction: 75,
      ruin_probability_pct: 2.4,
      p5_ending_value: 92_500_000,
      macro_regime: "CAUTIOUS",
      headline_verdict: "Setup LONG terverifikasi dengan batas risiko ketat.",
      blind_spots: ["Vektor 1", "Vektor 2", "Vektor 3"],
      actionable_fix: "Pasang SL otomatis sebelum eksekusi.",
      timestamp: "2026-11-25",
    });
    const decoded = decodeSharedDossier(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe("TL-2026-SH01");
    expect(decoded!.sc).toBe(86);
    expect(decoded!.st).toBe("CLEARED");
    expect(decoded!.bs).toEqual(["Vektor 1", "Vektor 2", "Vektor 3"]);
  });
});
