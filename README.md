# TesisLab

**Financial Decision Audit Simulator** berbasis metode **Pre-Mortem Analysis** untuk menguji ketahanan rencana keuangan sebelum modal dikeluarkan — mencakup jalur **Market & Trading**, **Business & UMKM**, dan **Personal Cashflow**.

Dibangun dengan pendekatan **Deterministic-First AI**, desain **Swiss Editorial Terminal** (obsidian `#0B0D10`, tipografi `Newsreader` + `Plus Jakarta Sans` + `JetBrains Mono`), dukungan bilingual modular (**ID / EN**), dan arsitektur biaya operasional **\$0**.

---

## Sorotan Arsitektur Sistem

```text
+-------------------------------------------------------------------------+
|                    AUTONOMOUS MACRO PIPELINE (07:00 WIB)                |
|  GitHub Actions (cron 00:00 UTC) -> skills/macro_harvester/harvest.py   |
|  [Frankfurter, TradingView, Gold-API, CoinGecko, RSS] -> branch:data-feed|
+------------------------------------+------------------------------------+
                                     | (30m ISR cache / 4s timeout + fallback)
                                     v
+-------------------------------------------------------------------------+
|                  NEXT.JS APP ROUTER + SWISS EDITORIAL UI                |
|                                                                         |
|  [User Plan Input] ---> [1. Deterministic TS Calculators]               |
|         |               (R:R, BEP, Runway, DSR, Flags, Baseline Score)  |
|         |                               |                               |
|         |                               v                               |
|         |               [2. POST /api/audit (Rate Limited 10/m, 40/d)]  |
|         |                   |-- Tier 1: Zero-API Demo Presets           |
|         |                   |-- Tier 2: Gemini 2.5 Flash (Free Tier)    |
|         |                   |-- Tier 3: OpenRouter (:free)              |
|         |                   +-- Tier 4: Deterministic Fallback Verdict  |
|         |                               |                               |
|         v                               v                               |
|  [What-If Stress Slider] <---- [Zod-Validated VerdictCard + PNG Export] |
|  (100% Client-Side, $0 API)    [X-Ray Architecture Inspector Drawer]    |
+-------------------------------------------------------------------------+
```

### 1. Deterministic-First AI (Anti-Halusinasi Angka)
Seluruh rasio finansial dihitung lebih dulu secara deterministik menggunakan TypeScript murni di `src/lib/calculators/` sebelum menyentuh LLM:
- **Trading**: Risk-to-Reward (`rr_ratio`), risiko per transaksi (`risk_per_trade_pct`), dan validasi arah Stop Loss.
- **Business & UMKM**: Margin kontribusi unit, Break-Even Point (`bep_units`), dan proyeksi *cash runway* pada kondisi penjualan turun 50%.
- **Personal Cashflow**: Debt Service Ratio (`dsr_pct`), total komitmen pendapatan, arus kas bebas, dan ketahanan dana darurat dalam bulan.

### 2. Autonomous Macro Pipeline (`Hermes Agent` + `data-feed` Branch)
Skrip zero-dependency Python standar (`skills/macro_harvester/harvest.py`) berjalan terjadwal melalui `.github/workflows/daily_macro_shift.yml` setiap pukul `07:00 WIB` (`00:00 UTC`). Data indikator (`USD_IDR`, `IHSG`, `GOLD_USD`, `BTC_USD`) dan tajuk berita RSS disintesis menjadi `data/market_context.json` dan di-push ke branch terpisah **`data-feed`**, sehingga pembaruan data harian tidak memicu *rebuild* aplikasi utama di Vercel.

### 3. Single-Pass Multi-Persona & 4-Tier Resilience
Satu panggilan API menghasilkan deliberasi tiga karakter komite (`data_analyst`, `risk_manager`, `committee_chair`) dari `agents/souls/*.md` yang divalidasi ketat dengan **Zod** (`VerdictPayloadSchema`):
1. **Tier 1 (Zero-API Demo)**: Preset realistis instan (`demo_trading_bbca`, `demo_business_batik`, `demo_cashflow_gadget`).
2. **Tier 2 (Primary)**: Google Gemini Free Tier (`gemini-2.5-flash`).
3. **Tier 3 (Secondary)**: OpenRouter Free Tier (`openrouter/free` → `meta-llama/llama-3.3-70b-instruct:free`).
4. **Tier 4 (Emergency)**: Generator vonis deterministik lokal agar aplikasi tidak pernah crash.

Permintaan live non-demo dilindungi oleh *in-memory sliding window rate limiter* (`src/lib/rateLimit.ts`: maks 10 permintaan/menit dan 40 permintaan/hari per IP).

### 4. Zero-Cost "What-If" Stress Slider & X-Ray Architecture Mode
- **What-If Stress Slider**: Menghitung ulang skor ketahanan dan metrik tertekan secara real-time di browser menggunakan kalkulator TypeScript tanpa memanggil ulang `/api/audit`.
- **X-Ray Architecture Mode**: Sakelar inspeksi teknis di Navbar untuk membedah latensi kalkulator vs LLM (`calc_ms`, `llm_ms`), asal data makro, `fallback_reason`, serta kontrak JSON `verdict` dan `metrics`.
- **Verdict Card PNG Export**: Renderer HTML5 Canvas `1200x675` (`2x` Retina) untuk mengunduh kartu putusan resmi tanpa dependensi eksternal berat.

---

## Struktur Direktori Proyek

```text
.
├── .github/workflows/        # Jadwal harian Hermes Macro Shift -> branch data-feed
├── agents/
│   ├── schemas/              # Kontrak JSON Schema resmi (verdict_schema.json)
│   └── souls/                # Persona Markdown 3 agen komite (hermes-agent convention)
├── data/                     # Snapshot lokal market_context.json
├── locales/                  # Kamus terpusat bilingual (id.json & en.json)
├── skills/                   # Dokumentasi AgentSkills (SKILL.md) & macro_harvester/harvest.py
└── src/
    ├── app/                  # Next.js App Router (page.tsx, layout.tsx, api/audit/route.ts)
    ├── components/           # UI Primitives, Navbar, MacroTicker, AgentStage, Workspace, X-Ray
    ├── context/              # LanguageContext (SSR-safe) & AuditUIContext
    └── lib/                  # Calculators, Zod schemas, soulLoader, orchestrator, macroFeed, rateLimit
```

---

## Menjalankan Secara Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Variabel Lingkungan
Salin `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Daftar variabel di `.env.example`:
- `GOOGLE_API_KEY=` — API key Google Gemini Free Tier (opsional; tanpa key ini sistem otomatis fallback ke OpenRouter atau mode deterministik).
- `OPENROUTER_API_KEY=` — API key OpenRouter untuk model `:free` cadangan (opsional).
- `NEXT_PUBLIC_MACRO_FEED_URL=` — URL raw JSON dari branch `data-feed` GitHub (opsional saat lokal; jika kosong otomatis membaca `data/market_context.json`).

### 3. Perbarui Snapshot Makro (Opsional) & Jalankan Server
```bash
python3 skills/macro_harvester/harvest.py
npm run dev
```

Buka `http://localhost:3000` di browser.

---

> **Disclaimer**: TesisLab adalah alat bantu simulasi risiko dan kalkulasi deterministik, bukan penasihat keuangan berlisensi. Keputusan finansial akhir sepenuhnya menjadi tanggung jawab pengguna.
