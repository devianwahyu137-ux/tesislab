---
name: business_audit
description: Deterministic pre-mortem audit rules for SME and business plans. Use when evaluating unit contribution margin, break-even point (BEP), monthly profit projections, and cash runway resilience under a 50% sales drop.
license: MIT
metadata:
  author: TesisLab
  version: "1.0"
  tags: [business, umkm, bep, cash-runway, pre-mortem]
---

# Business & SME Audit Skill

Evaluate operational viability and cash survival for small business or expansion plans before capital deployment.

## Core Thresholds
1. **Unit Contribution Margin (`unit_margin_amount`, `unit_margin_pct`)**: `selling_price - unit_cogs` must be strictly positive. Zero or negative margin triggers `NEGATIVE_UNIT_MARGIN`. Margins below `20%` trigger `THIN_CONTRIBUTION_MARGIN`.
2. **Break-Even Point (`bep_units`)**: Computed as `ceil(monthly_fixed_cost / unit_margin_amount)`. If `target_monthly_units < bep_units`, trigger `BELOW_BEP_TARGET`.
3. **Stressed Cash Runway (`stressed_runway_months`)**: Model a 50% revenue shock (`target_monthly_units * 0.5`). If operating at a loss under 50% sales, `initial_capital / abs(stressed_monthly_profit)` must be `>= 6` months; otherwise trigger `FRAGILE_RUNWAY`.

## Stress Simulation Protocol
- Use `simulateBusinessStress(input, salesDropPct)` to test revenue contraction from `0%` down to `-50%` client-side in real time.
