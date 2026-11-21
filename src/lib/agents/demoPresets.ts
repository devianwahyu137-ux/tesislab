import { randomBytes } from "node:crypto";
import type {
  BusinessAuditInput,
  BusinessAuditResult,
  CashflowAuditInput,
  CashflowAuditResult,
  TradeAuditInput,
  TradeAuditResult,
} from "@/lib/calculators";
import type { Locale } from "@/lib/i18n/config";
import type { MonteCarloSummary } from "@/lib/quant/monteCarlo";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import type {
  AuditTrack,
  VerdictPayload,
  VerdictStatus,
} from "@/lib/schemas/verdictSchema";

export type DemoPreset =
  | {
      preset_id: "demo_trading_bbca";
      track: "trading";
      input: TradeAuditInput;
      verdict_id: VerdictPayload;
      verdict_en: VerdictPayload;
    }
  | {
      preset_id: "demo_business_batik";
      track: "business";
      input: BusinessAuditInput;
      verdict_id: VerdictPayload;
      verdict_en: VerdictPayload;
    }
  | {
      preset_id: "demo_cashflow_gadget";
      track: "cashflow";
      input: CashflowAuditInput;
      verdict_id: VerdictPayload;
      verdict_en: VerdictPayload;
    };

export const DEMO_PRESETS: readonly DemoPreset[] = [
  {
    preset_id: "demo_trading_bbca",
    track: "trading",
    input: {
      asset_symbol: "BBCA.JK",
      direction: "LONG",
      total_capital: 100_000_000,
      position_size_pct: 25,
      entry_price: 9_800,
      take_profit: 10_780,
      stop_loss: 9_310,
      rationale: "Rebound di area support mingguan dengan target konsolidasi atas.",
    },
    verdict_id: {
      audit_id: "TL-2026-DM01",
      verdict_status: "CLEARED",
      score: 88,
      headline_verdict:
        "Posisi LONG BBCA.JK layak dengan R:R 1:2.00 dan risiko modal terjaga di 1.25%.",
      agent_deliberation: {
        data_analyst:
          "Rasio Risk/Reward tercatat 1:2.00 dengan jarak Stop Loss 5.00% dan eksposur risiko 1.25% dari total modal Rp100 jt.",
        risk_manager:
          "Jika tekanan jual asing berlanjut dan USD/IDR melemah, gap-down pembukaan berpotensi memicu slippage melewati level 9.310.",
        committee_chair:
          "Rencana transaksi memenuhi disiplin batas risiko. Eksekusi diperbolehkan selama Stop Loss dipasang sebagai order otomatis.",
      },
      premortem_blind_spots: [
        "Gap-down pembukaan pasar akibat sentimen suku bunga global menembus Stop Loss tanpa likuiditas keluar.",
        "Ukuran posisi 25% terlalu berat jika Anda juga memegang saham perbankan lain secara bersamaan.",
        "Tidak ada rencana keluar parsial apabila harga tertahan di area psikologis 10.200.",
      ],
      actionable_fix:
        "Pasang Stop Loss otomatis di 9.310 segera setelah entry terisi dan hindari menambah posisi pada sektor perbankan lain.",
      xray_trace: {
        macro_factors_used: ["USD_IDR", "IHSG"],
        deterministic_flags: [],
        reasoning_summary:
          "R:R >= 1.5 dan risiko per transaksi <= 2%; simulasi pre-mortem fokus pada risiko gap pembukaan.",
      },
    },
    verdict_en: {
      audit_id: "TL-2026-DM01",
      verdict_status: "CLEARED",
      score: 88,
      headline_verdict:
        "LONG BBCA.JK cleared with 1:2.00 R:R and capital risk contained at 1.25%.",
      agent_deliberation: {
        data_analyst:
          "Risk/Reward stands at 1:2.00 with a 5.00% stop-loss distance and 1.25% total capital exposure on IDR 100M.",
        risk_manager:
          "Continued foreign outflows and USD/IDR pressure could trigger an opening gap-down past 9,310 with execution slippage.",
        committee_chair:
          "Position sizing respects capital preservation limits. Execution is cleared provided an automated stop-loss is active.",
      },
      premortem_blind_spots: [
        "Overnight macro shock causes an opening gap-down below stop-loss without exit liquidity.",
        "25% allocation creates hidden sector concentration if paired with other banking holdings.",
        "No partial take-profit rule if price stalls near the 10,200 psychological resistance.",
      ],
      actionable_fix:
        "Place an automated stop-loss order at 9,310 immediately upon entry and cap total banking sector exposure.",
      xray_trace: {
        macro_factors_used: ["USD_IDR", "IHSG"],
        deterministic_flags: [],
        reasoning_summary:
          "R:R >= 1.5 and risk per trade <= 2%; pre-mortem focuses on overnight gap risk.",
      },
    },
  },
  {
    preset_id: "demo_business_batik",
    track: "business",
    input: {
      initial_capital: 45_000_000,
      monthly_fixed_cost: 12_000_000,
      selling_price: 250_000,
      unit_cogs: 165_000,
      target_monthly_units: 180,
      business_concept: "Ekspansi booth ritel batik modern di pusat perbelanjaan.",
    },
    verdict_id: {
      audit_id: "TL-2026-DM02",
      verdict_status: "CONDITIONAL",
      score: 64,
      headline_verdict:
        "Ekspansi booth berisiko tipis: runway kas hanya 3.75 bulan jika penjualan turun 50%.",
      agent_deliberation: {
        data_analyst:
          "Margin kontribusi Rp85.000/unit (34%), BEP di 142 unit/bulan. Target 180 unit hanya memberi bantalan 26.8% di atas titik impas.",
        risk_manager:
          "Bila penjualan riil hanya 90 unit (turun 50%), usaha merugi Rp4.35 jt/bulan dan modal Rp45 jt habis sebelum bulan keempat.",
        committee_chair:
          "Ekspansi hanya layak dijalankan jika biaya tetap sewa diturunkan atau kontrak sewa awal dibatasi maksimal 3 bulan.",
      },
      premortem_blind_spots: [
        "Traffic mal melambat di luar musim liburan membuat penjualan tertahan di bawah 142 unit BEP.",
        "Kenaikan biaya bahan baku kain sebesar 10% langsung menggerus margin kontribusi bersih.",
        "Dana Rp45 jt terkunci pada deposit sewa dan stok awal sehingga kas operasional kering di bulan ke-3.",
      ],
      actionable_fix:
        "Negosiasikan skema sewa bagi hasil atau kontrak uji coba 3 bulan agar biaya tetap turun di bawah Rp9 jt/bulan.",
      xray_trace: {
        macro_factors_used: ["USD_IDR", "IHSG"],
        deterministic_flags: ["FRAGILE_RUNWAY"],
        reasoning_summary:
          "Unit margin sehat (34%), namun stressed_runway_months < 6 bulan memicu status CONDITIONAL.",
      },
    },
    verdict_en: {
      audit_id: "TL-2026-DM02",
      verdict_status: "CONDITIONAL",
      score: 64,
      headline_verdict:
        "Retail expansion carries thin buffer: cash runway drops to 3.75 months at 50% sales.",
      agent_deliberation: {
        data_analyst:
          "Unit margin is IDR 85,000 (34%) with BEP at 142 units/month. Target of 180 units leaves a narrow 26.8% buffer.",
        risk_manager:
          "At 50% sales (90 units), monthly loss hits IDR 4.35M, exhausting the IDR 45M capital before month four.",
        committee_chair:
          "Proceed only if fixed rent is lowered or the initial lease commitment is capped at a 3-month trial.",
      },
      premortem_blind_spots: [
        "Off-peak mall foot traffic stalls sales below the 142-unit monthly break-even threshold.",
        "A 10% fabric input cost spike immediately compresses contribution margin.",
        "Upfront lease deposits lock liquidity, leaving zero operating cash by month three.",
      ],
      actionable_fix:
        "Negotiate revenue-share rent or a 3-month pilot lease to bring fixed costs below IDR 9M/month.",
      xray_trace: {
        macro_factors_used: ["USD_IDR", "IHSG"],
        deterministic_flags: ["FRAGILE_RUNWAY"],
        reasoning_summary:
          "Contribution margin is healthy (34%), but stressed runway under 6 months requires conditional guardrails.",
      },
    },
  },
  {
    preset_id: "demo_cashflow_gadget",
    track: "cashflow",
    input: {
      monthly_net_income: 12_000_000,
      current_monthly_expenses: 7_500_000,
      new_monthly_installment: 4_200_000,
      installment_months: 12,
      liquid_emergency_fund: 15_000_000,
      decision_purpose: "Cicilan laptop kerja dan perangkat produksi selama 12 bulan.",
    },
    verdict_id: {
      audit_id: "TL-2026-DM03",
      verdict_status: "REJECTED",
      score: 28,
      headline_verdict:
        "Ditolak: cicilan baru mendorong DSR ke 35% dan menyisakan arus kas bebas hanya Rp300 rb.",
      agent_deliberation: {
        data_analyst:
          "DSR tercatat 35.00% (melewati batas aman 30%), komitmen total 97.50% dari gaji, dan dana darurat hanya cukup 1.28 bulan.",
        risk_manager:
          "Sisa kas Rp300 rb/bulan berarti satu tagihan medis atau perbaikan kendaraan langsung memaksa Anda berutang baru.",
        committee_chair:
          "Tunda pembelian kredit ini. Beban cicilan Rp4.2 jt terlalu berbahaya bagi ketahanan likuiditas rumah tangga Anda.",
      },
      premortem_blind_spots: [
        "Pengeluaran tak terduga sekecil Rp1 jt langsung membuat arus kas bulanan defisit.",
        "Dana darurat 1.28 bulan habis seketika bila terjadi penundaan gaji atau bonus.",
        "Total komitmen 97.5% menghilangkan ruang menabung selama 12 bulan penuh.",
      ],
      actionable_fix:
        "Tunda pembelian 6 bulan untuk menabung DP lebih besar hingga cicilan maksimal Rp2.4 jt/bulan (DSR <= 20%).",
      xray_trace: {
        macro_factors_used: ["USD_IDR"],
        deterministic_flags: [
          "HIGH_DEBT_SERVICE_RATIO",
          "THIN_EMERGENCY_BUFFER",
          "HIGH_TOTAL_COMMITMENT",
        ],
        reasoning_summary:
          "Kombinasi DSR > 30%, total komitmen > 80%, dan dana darurat < 3 bulan menghasilkan vonis REJECTED.",
      },
    },
    verdict_en: {
      audit_id: "TL-2026-DM03",
      verdict_status: "REJECTED",
      score: 28,
      headline_verdict:
        "Rejected: new installment pushes DSR to 35% and leaves only IDR 300k free cashflow.",
      agent_deliberation: {
        data_analyst:
          "DSR reaches 35.00% (above 30% ceiling), total commitment hits 97.50% of net income, and emergency fund covers just 1.28 months.",
        risk_manager:
          "A slim IDR 300k monthly buffer means any minor medical or vehicle expense forces immediate high-interest borrowing.",
        committee_chair:
          "Hold off on this financing. A IDR 4.2M monthly obligation severely compromises household liquidity.",
      },
      premortem_blind_spots: [
        "Any unexpected IDR 1M expense immediately pushes monthly household cashflow into deficit.",
        "1.28 months of emergency reserves vanish rapidly if income is delayed.",
        "97.5% income commitment eliminates all savings capacity for 12 consecutive months.",
      ],
      actionable_fix:
        "Delay purchase by 6 months to save a larger down payment and keep installment <= IDR 2.4M/month (DSR <= 20%).",
      xray_trace: {
        macro_factors_used: ["USD_IDR"],
        deterministic_flags: [
          "HIGH_DEBT_SERVICE_RATIO",
          "THIN_EMERGENCY_BUFFER",
          "HIGH_TOTAL_COMMITMENT",
        ],
        reasoning_summary:
          "DSR > 30%, total commitment > 80%, and emergency reserve < 3 months trigger REJECTED.",
      },
    },
  },
];

export function getDemoPresetById(presetId: string): DemoPreset | undefined {
  return DEMO_PRESETS.find((preset) => preset.preset_id === presetId);
}

function clamp(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3).trimEnd()}...`;
}

/**
 * Deterministic quantitative verdict generator when external LLM providers
 * are unavailable or unconfigured. Synthesizes exact calculator ratios,
 * Monte Carlo ruin metrics, and daily macro regime into sharp Pre-Mortem prose.
 */
export function buildDeterministicFallbackVerdict(params: {
  track: AuditTrack;
  locale: Locale;
  calcResult: TradeAuditResult | BusinessAuditResult | CashflowAuditResult;
  macroContext: MarketContext;
  monteCarlo?: MonteCarloSummary;
}): VerdictPayload {
  const { track, locale, calcResult, macroContext, monteCarlo } = params;
  const year = new Date().getUTCFullYear();
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  const auditId = `TL-${year}-${suffix}`;

  const flags: string[] = calcResult.deterministic_flags;
  const score = calcResult.baseline_score;
  const regime = macroContext.synthesis.macro_regime;
  const ruinPct = monteCarlo ? monteCarlo.ruin_probability_pct.toFixed(1) : null;
  const p5Formatted = monteCarlo
    ? `Rp${Math.round(monteCarlo.p5_ending_value).toLocaleString("id-ID")}`
    : null;

  let status: VerdictStatus = "CLEARED";
  if (
    score < 45 ||
    flags.includes("NEGATIVE_UNIT_MARGIN") ||
    flags.includes("DEFICIT_CASHFLOW") ||
    flags.includes("INVALID_SL_DIRECTION") ||
    flags.includes("INVALID_TP_DIRECTION")
  ) {
    status = "REJECTED";
  } else if (score < 75 || flags.length > 0) {
    status = "CONDITIONAL";
  }

  const isId = locale === "id";
  const flagsSummary =
    flags.length > 0 ? flags.join(", ") : isId ? "NIHIL" : "NONE";

  let headline: string;
  let dataAnalyst: string;
  let riskManager: string;
  let committeeChair: string;
  let blindSpots: [string, string, string];
  let actionableFix: string;

  if (track === "trading" && "rr_ratio" in calcResult) {
    const r = calcResult;
    const lossRp = `Rp${Math.round(r.potential_loss_amount).toLocaleString("id-ID")}`;
    const profitRp = `Rp${Math.round(r.potential_profit_amount).toLocaleString("id-ID")}`;
    const atrNote =
      r.sl_to_atr_ratio !== null
        ? isId
          ? ` Jarak SL ${r.sl_to_atr_ratio.toFixed(2)}× ATR-14.`
          : ` SL distance is ${r.sl_to_atr_ratio.toFixed(2)}× ATR-14.`
        : "";

    headline = isId
      ? status === "CLEARED"
        ? `Struktur trading solid: R:R 1:${r.rr_ratio.toFixed(2)} dengan risiko ${r.risk_per_trade_pct.toFixed(2)}% per transaksi.`
        : status === "CONDITIONAL"
          ? `R:R 1:${r.rr_ratio.toFixed(2)} & risiko ${r.risk_per_trade_pct.toFixed(2)}% perlu kalibrasi sebelum entry (Skor ${score}/100).`
          : `Veto risiko aktif: R:R 1:${r.rr_ratio.toFixed(2)} dan potensi rugi ${lossRp} melewati ambang aman.`
      : status === "CLEARED"
        ? `Trading structure cleared: 1:${r.rr_ratio.toFixed(2)} R:R with ${r.risk_per_trade_pct.toFixed(2)}% risk per trade.`
        : status === "CONDITIONAL"
          ? `1:${r.rr_ratio.toFixed(2)} R:R and ${r.risk_per_trade_pct.toFixed(2)}% risk require calibration before entry (${score}/100).`
          : `Risk veto triggered: 1:${r.rr_ratio.toFixed(2)} R:R and ${lossRp} loss exceed safe thresholds.`;

    dataAnalyst = isId
      ? `R:R tercatat 1:${r.rr_ratio.toFixed(2)} (impas butuh win-rate ${r.breakeven_win_rate_pct.toFixed(1)}%), risiko ${r.risk_per_trade_pct.toFixed(2)}% (${lossRp}) vs target ${profitRp}.${atrNote} Rezim makro: ${regime}.`
      : `R:R is 1:${r.rr_ratio.toFixed(2)} (breakeven WR ${r.breakeven_win_rate_pct.toFixed(1)}%), risking ${r.risk_per_trade_pct.toFixed(2)}% (${lossRp}) for ${profitRp}.${atrNote} Macro regime: ${regime}.`;

    riskManager = isId
      ? `Simulasi 1.000 jalur mencatat risiko ruin ${ruinPct ?? "N/A"}% (ekor terburuk P5: ${p5Formatted ?? "N/A"}). Batas ukuran aman aturan 2% berada di ≤ ${r.max_safe_position_pct.toFixed(1)}% modal.`
      : `1,000-path simulation flags ${ruinPct ?? "N/A"}% ruin risk (P5 tail: ${p5Formatted ?? "N/A"}). The 2% rule caps safe position size at ≤ ${r.max_safe_position_pct.toFixed(1)}% of capital.`;

    committeeChair = isId
      ? status === "CLEARED"
        ? `Putusan LAYAK dengan skor ${score}/100. Pertahankan order Stop-Loss otomatis dan jangan menambah ukuran di tengah rezim ${regime}.`
        : `Putusan ${status} (skor ${score}/100, flag: ${flagsSummary}). Kalibrasi ulang TP/SL minimal 1:1.5 dan batasi ukuran ≤ ${r.max_safe_position_pct.toFixed(1)}% sebelum modal masuk.`
      : status === "CLEARED"
        ? `Verdict CLEARED (${score}/100). Enforce automated stop-loss orders and avoid scaling up during ${regime} conditions.`
        : `Verdict ${status} (${score}/100, flags: ${flagsSummary}). Recalibrate TP/SL to at least 1:1.5 and cap sizing ≤ ${r.max_safe_position_pct.toFixed(1)}% before execution.`;

    blindSpots = isId
      ? [
          `Win-rate impas ${r.breakeven_win_rate_pct.toFixed(1)}% membuat seri 4–5 kali rugi beruntun langsung menekan ekuitas ke area P5 (${p5Formatted ?? lossRp}).`,
          r.sl_to_atr_ratio !== null && r.sl_to_atr_ratio < 1.2
            ? `Stop-Loss (${r.sl_to_atr_ratio.toFixed(2)}× ATR-14) berada di dalam fluktuasi harian normal sehingga rentan tersapu noise sebelum tren berjalan.`
            : `Rezim makro ${regime} dapat memicu gap pembukaan atau slippage melebar melampaui jarak Stop-Loss ${r.stop_loss_distance_pct.toFixed(2)}%.`,
          `Eksposur rugi ${r.risk_per_trade_pct.toFixed(2)}% per transaksi akan berlipat jika Anda membuka posisi berkorelasi di sektor yang sama.`,
        ]
      : [
          `A ${r.breakeven_win_rate_pct.toFixed(1)}% breakeven win-rate means a 4–5 trade losing streak quickly drags equity toward P5 (${p5Formatted ?? lossRp}).`,
          r.sl_to_atr_ratio !== null && r.sl_to_atr_ratio < 1.2
            ? `Stop-Loss (${r.sl_to_atr_ratio.toFixed(2)}× ATR-14) sits inside normal daily noise, risking premature stop-outs.`
            : `${regime} macro volatility can trigger opening gaps or slippage beyond your ${r.stop_loss_distance_pct.toFixed(2)}% Stop-Loss distance.`,
          `Risking ${r.risk_per_trade_pct.toFixed(2)}% per trade compounds rapidly if paired with correlated positions in the same sector.`,
        ];

    actionableFix = isId
      ? `Terapkan setup 1:2.0 (SL ≥ 1.5× ATR-14) dan turunkan ukuran posisi ke ≤ ${r.max_safe_position_pct.toFixed(1)}% modal agar risiko terkunci di bawah 2%.`
      : `Apply a 1:2.0 setup (SL ≥ 1.5× ATR-14) and cap position size at ≤ ${r.max_safe_position_pct.toFixed(1)}% of capital to lock risk under 2%.`;
  } else if (track === "business" && "bep_units" in calcResult) {
    const b = calcResult;
    const profitRp = `Rp${Math.round(b.projected_monthly_profit).toLocaleString("id-ID")}`;

    headline = isId
      ? `BEP ${b.bep_units} unit/bln dengan margin ${b.unit_margin_pct.toFixed(1)}% & runway stres ${b.stressed_runway_months.toFixed(1)} bln (${status}).`
      : `BEP ${b.bep_units} units/mo at ${b.unit_margin_pct.toFixed(1)}% margin & ${b.stressed_runway_months.toFixed(1)} mo stressed runway (${status}).`;

    dataAnalyst = isId
      ? `Margin kontribusi ${b.unit_margin_pct.toFixed(1)}%, titik impas ${b.bep_units} unit/bln, proyeksi laba ${profitRp}/bln, Margin of Safety ${b.margin_of_safety_pct.toFixed(1)}%. Rezim makro: ${regime}.`
      : `Contribution margin ${b.unit_margin_pct.toFixed(1)}%, BEP ${b.bep_units} units/mo, projected profit ${profitRp}/mo, Margin of Safety ${b.margin_of_safety_pct.toFixed(1)}%. Macro: ${regime}.`;

    riskManager = isId
      ? `Bila penjualan turun 50%, runway kas tersisa ${b.stressed_runway_months.toFixed(1)} bulan. Simulasi 1.000 skenario mencatat peluang defisit ${ruinPct ?? "N/A"}% (P5: ${p5Formatted ?? "N/A"}).`
      : `Under a 50% sales shock, cash runway shrinks to ${b.stressed_runway_months.toFixed(1)} months. 1,000-path simulation flags ${ruinPct ?? "N/A"}% ruin risk (P5: ${p5Formatted ?? "N/A"}).`;

    committeeChair = isId
      ? `Status ${status} (skor ${score}/100, flag: ${flagsSummary}). Pastikan kontrak biaya tetap fleksibel sebelum mengunci modal awal.`
      : `Verdict ${status} (score ${score}/100, flags: ${flagsSummary}). Secure flexible fixed-cost terms before deploying initial capital.`;

    blindSpots = isId
      ? [
          `Margin of Safety ${b.margin_of_safety_pct.toFixed(1)}% berarti penurunan omzet musiman langsung mendorong operasi di bawah BEP ${b.bep_units} unit.`,
          `Runway kas ${b.stressed_runway_months.toFixed(1)} bulan di skenario -50% omzet tidak menyisakan ruang untuk keterlambatan pembayaran atau stok macet.`,
          `Kenaikan HPP bahan baku 10% di rezim ${regime} langsung menggerus margin kontribusi ${b.unit_margin_pct.toFixed(1)}%.`,
        ]
      : [
          `A ${b.margin_of_safety_pct.toFixed(1)}% Margin of Safety leaves thin protection if off-peak demand drops below the ${b.bep_units}-unit BEP.`,
          `${b.stressed_runway_months.toFixed(1)} months of stressed runway leaves minimal cushion for slow inventory turnover or delayed receivables.`,
          `A 10% input cost spike under ${regime} conditions directly erodes your ${b.unit_margin_pct.toFixed(1)}% contribution margin.`,
        ];

    actionableFix = isId
      ? "Negosiasikan sewa berbasis bagi hasil atau pangkas biaya tetap bulanan minimal 20% hingga runway stres melampaui 6 bulan."
      : "Negotiate revenue-share lease terms or trim monthly fixed costs by at least 20% until stressed runway exceeds 6 months.";
  } else if (track === "cashflow" && "dsr_pct" in calcResult) {
    const c = calcResult;
    const freeRp = `Rp${Math.round(c.free_cashflow).toLocaleString("id-ID")}`;

    headline = isId
      ? `DSR ${c.dsr_pct.toFixed(1)}% dengan arus kas bebas ${freeRp}/bln & dana darurat ${c.emergency_fund_months.toFixed(1)} bln (${status}).`
      : `DSR at ${c.dsr_pct.toFixed(1)}% with ${freeRp}/mo free cashflow & ${c.emergency_fund_months.toFixed(1)} mo reserve (${status}).`;

    dataAnalyst = isId
      ? `DSR tercatat ${c.dsr_pct.toFixed(1)}%, total komitmen ${c.total_commitment_pct.toFixed(1)}%, rasio tabungan ${c.savings_rate_pct.toFixed(1)}%, dan dana darurat ${c.emergency_fund_months.toFixed(1)} bulan.`
      : `DSR is ${c.dsr_pct.toFixed(1)}%, total commitment ${c.total_commitment_pct.toFixed(1)}%, savings rate ${c.savings_rate_pct.toFixed(1)}%, and emergency reserve ${c.emergency_fund_months.toFixed(1)} months.`;

    riskManager = isId
      ? `Sisa arus kas bebas ${freeRp}/bln dengan peluang defisit 12 bulan sebesar ${ruinPct ?? "N/A"}% (P5: ${p5Formatted ?? "N/A"}) di tengah rezim ${regime}.`
      : `Monthly free cashflow stands at ${freeRp} with a ${ruinPct ?? "N/A"}% 12-month deficit probability (P5: ${p5Formatted ?? "N/A"}) under ${regime} conditions.`;

    committeeChair = isId
      ? `Status ${status} (skor ${score}/100, flag: ${flagsSummary}). Jangan mengunci cicilan baru jika DSR melampaui 30% atau dana darurat < 3 bulan.`
      : `Verdict ${status} (score ${score}/100, flags: ${flagsSummary}). Do not lock in new debt while DSR exceeds 30% or reserves sit under 3 months.`;

    blindSpots = isId
      ? [
          `Total komitmen ${c.total_commitment_pct.toFixed(1)}% membuat satu pengeluaran medis atau darurat tak terduga langsung memicu defisit kas.`,
          `Dana darurat ${c.emergency_fund_months.toFixed(1)} bulan cepat terkuras apabila terjadi keterlambatan gaji atau pemotongan bonus.`,
          `Rasio tabungan ${c.savings_rate_pct.toFixed(1)}% memperlambat pemulihan likuiditas selama seluruh tenor cicilan berjalan.`,
        ]
      : [
          `A ${c.total_commitment_pct.toFixed(1)}% total income commitment means one unexpected medical or repair bill triggers an immediate cash deficit.`,
          `${c.emergency_fund_months.toFixed(1)} months of liquid reserves deplete rapidly if income or bonuses are delayed.`,
          `A ${c.savings_rate_pct.toFixed(1)}% savings rate stalls liquidity rebuilding throughout the entire installment tenor.`,
        ];

    actionableFix = isId
      ? "Perbesar DP atau tunda cicilan hingga DSR turun di bawah 25% dan dana darurat likuid menutup minimal 6 bulan pengeluaran."
      : "Increase your down payment or delay financing until DSR falls below 25% and liquid reserves cover at least 6 months of expenses.";
  } else {
    headline = isId
      ? `Audit ${track.toUpperCase()} selesai (${status}) — Skor ketahanan ${score}/100.`
      : `${track.toUpperCase()} audit complete (${status}) — Resilience score ${score}/100.`;
    dataAnalyst = isId
      ? `Kalkulasi deterministik mencatat skor ${score}/100 dengan flag: ${flagsSummary}. Rezim makro: ${regime}.`
      : `Deterministic math scored ${score}/100 with flags: ${flagsSummary}. Macro regime: ${regime}.`;
    riskManager = isId
      ? `Prioritaskan mitigasi pada flag (${flagsSummary}) dan lindungi likuiditas dari gejolak ${regime}.`
      : `Prioritize mitigating flags (${flagsSummary}) and protect liquidity against ${regime} volatility.`;
    committeeChair = isId
      ? `Status ${status} ditetapkan berdasarkan ambang matematis. Selesaikan seluruh peringatan risiko sebelum modal dikeluarkan.`
      : `Verdict ${status} issued from deterministic thresholds. Resolve all flagged constraints prior to capital commitment.`;
    blindSpots = isId
      ? [
          `Sensitivitas terhadap rezim makro ${regime} belum teruji penuh di skenario ekstrem.`,
          `Peringatan deterministik (${flagsSummary}) dapat mempercepat penyusutan kas jika asumsi meleset.`,
          "Eksekusi tanpa batas berhenti otomatis berisiko memperlebar kerugian saat likuiditas menipis.",
        ]
      : [
          `Exposure to ${regime} macro shifts may amplify downside beyond baseline.`,
          `Active deterministic flags (${flagsSummary}) accelerate capital burn if assumptions slip.`,
          "Executing without automated stop limits risks compounding losses during thin liquidity.",
        ];
    actionableFix = isId
      ? "Gunakan Stress Slider di bawah untuk menurunkan eksposur risiko hingga skor deterministik mencapai >= 75."
      : "Use the Stress Slider below to reduce risk exposure until the deterministic score reaches >= 75.";
  }

  return {
    audit_id: auditId,
    verdict_status: status,
    score,
    headline_verdict: clamp(headline, 140),
    agent_deliberation: {
      data_analyst: clamp(dataAnalyst, 280),
      risk_manager: clamp(riskManager, 280),
      committee_chair: clamp(committeeChair, 280),
    },
    premortem_blind_spots: [
      clamp(blindSpots[0], 160),
      clamp(blindSpots[1], 160),
      clamp(blindSpots[2], 160),
    ],
    actionable_fix: clamp(actionableFix, 220),
    xray_trace: {
      macro_factors_used: ["USD_IDR", "IHSG", "GOLD_USD", "BTC_USD"],
      deterministic_flags: flags,
      reasoning_summary: clamp(
        `Deterministic quantitative synthesis (${status}, score=${score}, ruin=${ruinPct ?? "N/A"}%, regime=${regime}).`,
        240
      ),
    },
  };
}
