# TesisLab

**Pre-Mortem Financial Decision Audit Simulator** built with a **Deterministic-First AI** architecture, **Swiss Editorial Terminal** design system, and **\$0 operational cost**.

TesisLab stress-tests high-stakes financial decisions *before* capital leaves the user's account across three dedicated audit tracks — **Market & Trading**, **Business & SME (UMKM)**, and **Personal Cashflow** — with full bilingual support (**Indonesian & English**).

---

## Executive Summary & Value Proposition

Most financial AI wrappers let LLMs hallucinate arithmetic and give generic encouragement. **TesisLab** inverts that pattern:

1. **Math Before Narrative**: Every ratio (`R:R`, position drawdown, contribution margin, `BEP`, 50%-shock `cash runway`, `DSR`, and emergency reserve coverage) is computed deterministically in pure TypeScript *before* any LLM is called.
2. **Pre-Mortem Committee Deliberation**: Three specialized divisions (`DIV-01 Quantitative Data Analyst`, `DIV-02 Pre-Mortem Risk Officer`, `DIV-03 Audit Committee Chair`) assume the plan failed 6 months ahead and expose 3 concrete blind spots plus 1 mandatory mitigation fix.
3. **Real Daily Macro Grounding**: Decisions are cross-checked against live daily market indicators (`USD/IDR`, `IHSG`, `Gold`, `BTC`) harvested autonomously every morning at `07:00 WIB` (`00:00 UTC`).
4. **Zero-Cost Interactive Stress Testing**: After receiving a verdict, users drag a real-time **What-If Stress Slider** (100% client-side, zero API calls) and inspect the full execution trace via **X-Ray Architecture Mode**.

---

## System Architecture

```text
+-----------------------------------------------------------------------------+
|                HERMES AUTONOMOUS MACRO PIPELINE (07:00 WIB)                 |
|  GitHub Actions (cron 00:00 UTC) -> skills/macro_harvester/harvest.py       |
|  [Frankfurter · TradingView · Gold-API · CoinGecko · RSS] -> data-feed      |
+--------------------------------------+--------------------------------------+
                                       | 30m ISR Cache · 4s Timeout · 3-Tier Fallback
                                       v
+-----------------------------------------------------------------------------+
|                NEXT.JS APP ROUTER · SWISS EDITORIAL WAR-ROOM                |
|                                                                             |
|  [User Input] -> [1. Zod Validation] -> [2. Deterministic TS Calculators]   |
|         |                                (R:R, BEP, Runway, DSR, Flags)     |
|         |                                             |                     |
|         |                                             v                     |
|         |        [3. POST /api/audit · Sliding-Window Rate Limit 10/m 40/d] |
|         |            |-- Tier 1: Zero-API Demo Presets                      |
|         |            |-- Tier 2: Google Gemini 2.5 Flash (Free Tier)        |
|         |            |-- Tier 3: OpenRouter (:free auto-router + Llama 3.3) |
|         |            +-- Tier 4: Deterministic Fallback Verdict             |
|         |                                             |                     |
|         v                                             v                     |
|  [What-If Stress Slider] <---- [Deliberation Transcript + VerdictCard]      |
|  (100% Client-Side, $0)        [1200x675 Canvas PNG · X-Ray Inspector]      |
+-----------------------------------------------------------------------------+
```

---

## Engineering Highlights

- **Anti-Hallucination Math Engine (`src/lib/calculators/`)**: Pure, side-effect-free TypeScript calculators with strict Zod input validation and hard mathematical veto flags (`NEGATIVE_UNIT_MARGIN`, `DEFICIT_CASHFLOW`, `OVEREXPOSED_RISK`, `FRAGILE_RUNWAY`). Zero heavy Python/C++ runtime dependencies, keeping Vercel serverless bundles fast and lightweight.
- **Autonomous Zero-Build-Cost Macro Harvester (`skills/macro_harvester/harvest.py`)**: Written exclusively with Python's standard library (`urllib`, `json`, `xml.etree.ElementTree`). Scheduled via `.github/workflows/daily_macro_shift.yml` to commit `data/market_context.json` to an isolated **`data-feed`** branch — keeping daily macro data live without triggering unnecessary Vercel rebuilds on `main`.
- **Single-Pass Multi-Persona & 4-Tier Free Resilience (`src/lib/agents/orchestrator.ts`)**: Loads `agents/souls/*.md` (following `hermes-agent` conventions, stripping HTML comments to save tokens) into a single structured JSON pass validated by `VerdictPayloadSchema`, backed by 4 fallback tiers (Demo Presets → Gemini Free Tier → OpenRouter `:free` → Deterministic Fallback) and an in-memory sliding-window rate limiter (`src/lib/rateLimit.ts`: 10 req/min, 40 req/day per IP).
- **Deterministic Verdict PNG Canvas Exporter (`src/lib/exportVerdictPng.ts`)**: Direct HTML5 Canvas `1200x675` (`2x` Retina) renderer that generates shareable Verdict Cards (including the **Conviction vs. Reality Gap** optimism bias mirror) with zero external screenshot libraries and zero Tailwind v4 `oklab`/`oklch` CSS parsing failures.
- **Institutional Light/Dark Mode & Empirical Evidence**: Hydration-safe `useSyncExternalStore` theme switching between *Obsidian Terminal* and *Swiss Financial Paper* (`[data-theme="light"]`), paired with a 6-card peer-reviewed **Empirical Evidence** showcase (`#riset`) and transparent v1.0/v2.0 **Roadmap** (`#roadmap`).
- **Bilingual Extensible i18n (`locales/id.json`, `locales/en.json`)**: Compile-time key parity enforced via TypeScript (`Dictionary = typeof id`), dot-notation `t()` autocomplete, and hydration-safe `useSyncExternalStore` persistence.

---

## Project Structure

```text
.
├── .github/workflows/
│   └── daily_macro_shift.yml     # 07:00 WIB daily macro harvester -> branch `data-feed`
├── agents/
│   ├── schemas/                  # Standard JSON Schema contract (verdict_schema.json)
│   └── souls/                    # Committee personas (data_analyst, risk_manager, committee_chair)
├── data/
│   └── market_context.json       # Local fallback snapshot for daily macro context
├── locales/
│   ├── id.json                   # Canonical Indonesian dictionary
│   └── en.json                   # Parity-enforced English dictionary
├── skills/                       # AgentSkills (SKILL.md) + zero-dep macro_harvester/harvest.py
└── src/
    ├── app/                      # Next.js App Router (page.tsx, layout.tsx, api/audit/route.ts)
    ├── components/               # War-Room Terminal, HeroArtifacts, CommitteeShowcase, VerdictCard, StressSlider, X-Ray Drawer
    ├── context/                  # LanguageContext (SSR-safe) & AuditUIContext
    └── lib/                      # Calculators, Zod schemas, soulLoader, orchestrator, macroFeed, rateLimit, exportVerdictPng
```

---

## Local Development Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Variables defined in `.env.example`:
- `GOOGLE_API_KEY=` — Google Gemini Free Tier API key (optional; falls back automatically if unset).
- `OPENROUTER_API_KEY=` — OpenRouter API key for `:free` fallback models (optional).
- `NEXT_PUBLIC_MACRO_FEED_URL=` — Raw GitHub URL pointing to `data/market_context.json` on the `data-feed` branch (optional locally; defaults to the local snapshot).

### 3. Refresh Macro Snapshot & Start Dev Server
```bash
python3 skills/macro_harvester/harvest.py
npm run dev
```

Open `http://localhost:3000` to launch the TesisLab War-Room Terminal.

---

> **Disclaimer**: TesisLab is a deterministic risk simulation and calculation tool, not a licensed financial advisor. Final financial decisions remain solely the user's responsibility.
