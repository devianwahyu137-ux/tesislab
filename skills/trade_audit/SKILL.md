---
name: trade_audit
description: Deterministic pre-mortem audit rules for capital market and crypto trades. Use when evaluating position sizing, risk-to-reward ratio (R:R), stop-loss placement, and slippage stress scenarios before executing a trade.
license: MIT
metadata:
  author: TesisLab
  version: "1.0"
  tags: [trading, risk-management, pre-mortem, position-sizing]
---

# Trade Audit Skill

Evaluate proposed `LONG` or `SHORT` market positions using deterministic math before capital is committed.

## Core Thresholds
1. **Risk-to-Reward Ratio (`rr_ratio`)**: Minimum acceptable ratio is `1:1.5`. Any setup below `1.5` triggers `LOW_RR_RATIO`.
2. **Capital Risk per Trade (`risk_per_trade_pct`)**: Safe risk exposure is `<= 2%` of total capital (hard ceiling `3%`). Exceeding `3%` triggers `OVEREXPOSED_RISK`.
3. **Stop-Loss Direction & Distance**:
   - `LONG`: `stop_loss < entry_price < take_profit`.
   - `SHORT`: `take_profit < entry_price < stop_loss`.
   - Violations trigger `INVALID_SL_DIRECTION` or `INVALID_TP_DIRECTION`.
   - Stop-loss distance `< 0.5%` from entry triggers `TIGHT_STOP_LOSS` due to spread/wick vulnerability.

## Stress Simulation Protocol
- Use `simulateTradeStress(input, slSlippagePct)` to model execution slippage or volatility expansion widening the stop-loss distance without re-invoking LLM APIs.
