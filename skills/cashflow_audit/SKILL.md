---
name: cashflow_audit
description: Deterministic pre-mortem audit rules for personal cashflow and new debt commitments. Use when evaluating Debt Service Ratio (DSR), emergency fund coverage in months, and monthly free cashflow under income shock.
license: MIT
metadata:
  author: TesisLab
  version: "1.0"
  tags: [cashflow, personal-finance, dsr, emergency-fund, pre-mortem]
---

# Personal Cashflow Audit Skill

Evaluate household liquidity resilience before taking on a new recurring installment or major financial commitment.

## Core Thresholds
1. **Debt Service Ratio (`dsr_pct`)**: `new_monthly_installment / monthly_net_income * 100`. Safe ceiling is `<= 30%`. Exceeding `30%` triggers `HIGH_DEBT_SERVICE_RATIO`.
2. **Free Cashflow (`free_cashflow`)**: `monthly_net_income - (current_monthly_expenses + new_monthly_installment)`. Negative free cashflow triggers `DEFICIT_CASHFLOW`.
3. **Emergency Fund Coverage (`emergency_fund_months`)**: `liquid_emergency_fund / total_monthly_commitment`. Minimum safe buffer is `3` to `6` months. Below `3` months triggers `THIN_EMERGENCY_BUFFER`.
4. **Total Commitment Ratio (`total_commitment_pct`)**: Exceeding `80%` of net income triggers `HIGH_TOTAL_COMMITMENT`.

## Stress Simulation Protocol
- Use `simulateCashflowStress(input, incomeDropPct)` to simulate income contraction client-side without external API calls.
