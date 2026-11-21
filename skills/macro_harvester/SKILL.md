---
name: macro_harvester
description: Daily macroeconomic harvester that collects public market indicators (USD/IDR, IHSG, Gold, BTC) and financial RSS headlines, then synthesizes a bilingual macro regime snapshot into data/market_context.json for TesisLab Pre-Mortem audits.
license: MIT
metadata:
  author: TesisLab
  version: "1.0"
  tags: [macro, harvester, data-feed, pre-mortem, market-context]
---

# Macro Harvester Skill

Collects daily quantitative market benchmarks and financial headlines using zero-dependency Python standard library scripts, producing `data/market_context.json` for committee deliberation.

## Execution
```bash
python3 skills/macro_harvester/harvest.py
```

## Pipeline Stages
1. **Quantitative Indicators**: Queries Yahoo Finance public chart endpoints (`IDR=X`, `^JKSE`, `GC=F`, `BTC-USD`) with a 10-second timeout and per-asset fallback values.
2. **RSS Headlines**: Extracts up to 5 recent market headlines via `xml.etree.ElementTree`.
3. **Regime Synthesis**: Uses `GOOGLE_API_KEY` (Gemini Free Tier) or `OPENROUTER_API_KEY` (`:free` model) when configured, with deterministic rule-based fallback when offline or rate-limited.
4. **Output Contract**: Writes valid, non-null JSON to `data/market_context.json` with `updated_at`, `source_status` (`live` | `fallback`), `indicators`, `headlines`, and `synthesis`.
