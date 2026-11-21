import assert from "node:assert/strict";
import {
  calculateTradeAudit,
  simulateTradeStress,
  calculateBusinessAudit,
  simulateBusinessStress,
  calculateCashflowAudit,
  simulateCashflowStress,
} from "./index";

// 1. TRADE AUDIT SCENARIOS
const tradeHealthy = calculateTradeAudit({
  asset_symbol: "BBCA.JK",
  direction: "LONG",
  total_capital: 100_000_000,
  position_size_pct: 20,
  entry_price: 10_000,
  take_profit: 11_500,
  stop_loss: 9_500,
  rationale: "Support bounce with volume confirmation",
});
assert.equal(tradeHealthy.rr_ratio, 3);
assert.equal(tradeHealthy.risk_per_trade_pct, 1);
assert.equal(tradeHealthy.deterministic_flags.length, 0);
assert.equal(tradeHealthy.baseline_score, 100);

const tradeHealthyStressed = simulateTradeStress(
  {
    asset_symbol: "BBCA.JK",
    direction: "LONG",
    total_capital: 100_000_000,
    position_size_pct: 20,
    entry_price: 10_000,
    take_profit: 11_500,
    stop_loss: 9_500,
    rationale: "Support bounce with volume confirmation",
  },
  50
);
assert.equal(tradeHealthyStressed.rr_ratio, 2);
assert.equal(tradeHealthyStressed.risk_per_trade_pct, 1.5);

const tradeRisky = calculateTradeAudit({
  asset_symbol: "BTCUSDT",
  direction: "LONG",
  total_capital: 50_000_000,
  position_size_pct: 80,
  entry_price: 100_000,
  take_profit: 105_000,
  stop_loss: 95_000,
  rationale: "Breakout FOMO",
});
assert.equal(tradeRisky.rr_ratio, 1);
assert.equal(tradeRisky.risk_per_trade_pct, 4);
assert.ok(tradeRisky.deterministic_flags.includes("LOW_RR_RATIO"));
assert.ok(tradeRisky.deterministic_flags.includes("OVEREXPOSED_RISK"));

// 2. BUSINESS AUDIT SCENARIOS
const bizHealthy = calculateBusinessAudit({
  initial_capital: 120_000_000,
  monthly_fixed_cost: 15_000_000,
  selling_price: 50_000,
  unit_cogs: 20_000,
  target_monthly_units: 1_200,
  business_concept: "Specialty coffee kiosk in transit hub",
});
assert.equal(bizHealthy.unit_margin_amount, 30_000);
assert.equal(bizHealthy.unit_margin_pct, 60);
assert.equal(bizHealthy.bep_units, 500);
assert.equal(bizHealthy.projected_monthly_profit, 21_000_000);
assert.equal(bizHealthy.deterministic_flags.length, 0);

const bizRisky = calculateBusinessAudit({
  initial_capital: 20_000_000,
  monthly_fixed_cost: 25_000_000,
  selling_price: 40_000,
  unit_cogs: 35_000,
  target_monthly_units: 3_000,
  business_concept: "Low-margin cloud kitchen",
});
assert.equal(bizRisky.bep_units, 5_000);
assert.ok(bizRisky.deterministic_flags.includes("THIN_CONTRIBUTION_MARGIN"));
assert.ok(bizRisky.deterministic_flags.includes("BELOW_BEP_TARGET"));
assert.ok(bizRisky.deterministic_flags.includes("FRAGILE_RUNWAY"));

const bizStressed = simulateBusinessStress(
  {
    initial_capital: 120_000_000,
    monthly_fixed_cost: 15_000_000,
    selling_price: 50_000,
    unit_cogs: 20_000,
    target_monthly_units: 1_200,
    business_concept: "Specialty coffee kiosk in transit hub",
  },
  50
);
assert.equal(bizStressed.projected_monthly_profit, 3_000_000);

// 3. CASHFLOW AUDIT SCENARIOS
const cashHealthy = calculateCashflowAudit({
  monthly_net_income: 20_000_000,
  current_monthly_expenses: 8_000_000,
  new_monthly_installment: 3_000_000,
  installment_months: 24,
  liquid_emergency_fund: 80_000_000,
  decision_purpose: "Workstation upgrade installment",
});
assert.equal(cashHealthy.dsr_pct, 15);
assert.equal(cashHealthy.free_cashflow, 9_000_000);
assert.equal(cashHealthy.emergency_fund_months, 7.27);
assert.equal(cashHealthy.deterministic_flags.length, 0);

const cashRisky = calculateCashflowAudit({
  monthly_net_income: 10_000_000,
  current_monthly_expenses: 7_000_000,
  new_monthly_installment: 4_000_000,
  installment_months: 36,
  liquid_emergency_fund: 10_000_000,
  decision_purpose: "Vehicle financing",
});
assert.equal(cashRisky.dsr_pct, 40);
assert.equal(cashRisky.free_cashflow, -1_000_000);
assert.ok(cashRisky.deterministic_flags.includes("HIGH_DEBT_SERVICE_RATIO"));
assert.ok(cashRisky.deterministic_flags.includes("DEFICIT_CASHFLOW"));
assert.ok(cashRisky.deterministic_flags.includes("THIN_EMERGENCY_BUFFER"));
assert.ok(cashRisky.deterministic_flags.includes("HIGH_TOTAL_COMMITMENT"));

const cashStressed = simulateCashflowStress(
  {
    monthly_net_income: 20_000_000,
    current_monthly_expenses: 8_000_000,
    new_monthly_installment: 3_000_000,
    installment_months: 24,
    liquid_emergency_fund: 80_000_000,
    decision_purpose: "Workstation upgrade installment",
  },
  25
);
assert.equal(cashStressed.dsr_pct, 20);
assert.equal(cashStressed.free_cashflow, 4_000_000);

console.log(
  JSON.stringify(
    {
      trade: { healthy: tradeHealthy, stressed: tradeHealthyStressed, risky: tradeRisky },
      business: { healthy: bizHealthy, stressed: bizStressed, risky: bizRisky },
      cashflow: { healthy: cashHealthy, stressed: cashStressed, risky: cashRisky },
    },
    null,
    2
  )
);
