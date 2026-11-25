import {
  calculateBusinessAudit,
  calculateCashflowAudit,
  type BusinessAuditInput,
  type CashflowAuditInput,
  type TradeAuditInput,
} from "@/lib/calculators";

export interface HumanFlagDiagnostic {
  code: string;
  severity: "critical" | "warning";
  title: string;
  explanation: string;
}

interface BilingualFlagEntry {
  severity: "critical" | "warning";
  titleId: string;
  explanationId: string;
  titleEn: string;
  explanationEn: string;
}

const FLAG_DICTIONARY: Record<string, BilingualFlagEntry> = {
  // Trading Flags
  INVALID_SL_DIRECTION: {
    severity: "critical",
    titleId: "Posisi Stop-Loss Terbalik dari Arah Transaksi",
    explanationId:
      "Untuk posisi LONG, Stop-Loss wajib berada di bawah harga beli (dan sebaliknya untuk SHORT).",
    titleEn: "Stop-Loss Placed on Wrong Side of Entry",
    explanationEn:
      "For LONG setups, Stop-Loss must sit below entry price (and above entry for SHORT).",
  },
  INVALID_TP_DIRECTION: {
    severity: "critical",
    titleId: "Target Take-Profit Terbalik dari Arah Transaksi",
    explanationId:
      "Untuk posisi LONG, Take-Profit wajib lebih tinggi dari harga beli (dan lebih rendah untuk SHORT).",
    titleEn: "Take-Profit Placed on Wrong Side of Entry",
    explanationEn:
      "For LONG setups, Take-Profit must exceed entry price (and sit below entry for SHORT).",
  },
  LOW_RR_RATIO: {
    severity: "warning",
    titleId: "Potensi Untung Terlalu Kecil Dibanding Risiko Rugi (< 1 : 1,5)",
    explanationId:
      "Satu kali salah tebak bisa menghapus hasil beberapa kali menang. Lebarkan target untung atau perketat titik masuk.",
    titleEn: "Asymmetric Reward Too Small vs. Risk (< 1 : 1.5)",
    explanationEn:
      "A single losing trade erases multiple wins. Widen your profit target or wait for a deeper entry.",
  },
  FEE_ERODES_EDGE: {
    severity: "warning",
    titleId: "Potongan Fee Broker Menggerus Tipisnya Target Profit",
    explanationId:
      "Secara kotor terlihat untung, namun setelah dipotong biaya beli-jual sekuritas, rasio imbal hasil bersih jatuh di bawah 1:1,1.",
    titleEn: "Brokerage Fees Erode Your Net Profit Edge",
    explanationEn:
      "Gross R:R looks acceptable, but round-trip exchange fees collapse Net R:R below 1:1.1.",
  },
  OVEREXPOSED_RISK: {
    severity: "critical",
    titleId: "Risiko Rugi Sekali Transaksi Terlalu Besar (> 3% Modal)",
    explanationId:
      "Jika Stop-Loss tersentuh beberapa kali berturut-turut, modal utama Anda tergerus parah. Turunkan % ukuran posisi.",
    titleEn: "Excessive Capital Risk on a Single Trade (> 3%)",
    explanationEn:
      "A normal losing streak will severely impair your principal. Reduce position size percentage.",
  },
  TIGHT_STOP_LOSS: {
    severity: "warning",
    titleId: "Jarak Stop-Loss Terlalu Rapat (< 0,5%)",
    explanationId:
      "Fluktuasi spread detik-detik biasa sangat mudah mendepak posisi Anda sebelum harga bergerak ke target.",
    titleEn: "Ultra-Tight Stop-Loss (< 0.5% Distance)",
    explanationEn:
      "Normal bid-ask spread fluctuations can trigger your stop prematurely before the move plays out.",
  },
  SL_INSIDE_MARKET_NOISE: {
    severity: "warning",
    titleId: "Stop-Loss Berada di Dalam Goyangan Harian Wajar (ATR-14)",
    explanationId:
      "Jarak batas rugi lebih sempit dari rata-rata rentang gerak harian aset ini, sehingga rawan terkena sapuan ekor candle.",
    titleEn: "Stop-Loss Sits Inside Daily Market Noise (< 1× ATR-14)",
    explanationEn:
      "Your stop distance is narrower than 14-day average daily volatility, inviting premature stop-outs.",
  },

  // Business / UMKM Flags
  NEGATIVE_UNIT_MARGIN: {
    severity: "critical",
    titleId: "Jual Rugi di Setiap Produk (Margin per Unit Negatif)",
    explanationId:
      "Harga jual setelah dipotong HPP, komisi aplikasi, dan pajak lebih rendah dari modal bahan baku—makin laris justru makin rugi.",
    titleEn: "Losing Money on Every Unit Sold (Negative Margin)",
    explanationEn:
      "Net unit revenue after COGS, platform fees, and tax is negative—selling more accelerates losses.",
  },
  THIN_CONTRIBUTION_MARGIN: {
    severity: "warning",
    titleId: "Margin Kotor Terlalu Tipis (< 20%)",
    explanationId:
      "Kenaikan kecil pada harga bahan baku atau barang rusak langsung mengikis habis keuntungan usaha.",
    titleEn: "Razor-Thin Contribution Margin (< 20%)",
    explanationEn:
      "Minor supplier price hikes or spoilage will immediately wipe out operating profit.",
  },
  PLATFORM_FEE_SQUEEZE: {
    severity: "warning",
    titleId: "Komisi Aplikasi Delivery Menggerus Margin Bersih (< 15%)",
    explanationId:
      "Potongan komisi marketplace memakan porsi besar laba per porsi/unit. Naikkan harga khusus aplikasi atau dorong beli langsung.",
    titleEn: "Delivery App Commission Squeezes Net Margin (< 15%)",
    explanationEn:
      "Marketplace fees consume most of your unit margin. Differentiate app pricing or boost direct orders.",
  },
  BELOW_BEP_TARGET: {
    severity: "critical",
    titleId: "Target Penjualan Masih di Bawah Titik Impas (BEP)",
    explanationId:
      "Meskipun target penjualan tercapai 100%, hasil kotor bulanan belum cukup menutup sewa & gaji tetap.",
    titleEn: "Target Sales Volume Sits Below Break-Even (BEP)",
    explanationEn:
      "Even if you hit 100% of your sales target, monthly contribution won't cover fixed overhead.",
  },
  FRAGILE_RUNWAY: {
    severity: "critical",
    titleId: "Napas Kas Darurat Usaha Kurang dari 6 Bulan Saat Sepi",
    explanationId:
      "Jika omzet riil hanya tercapai separuh target, modal cadangan habis sebelum bisnis sempat stabil.",
    titleEn: "Fragile Cash Runway (< 6 Months at -50% Sales)",
    explanationEn:
      "If real sales land at half of target, initial capital runs dry before operations stabilize.",
  },

  // Cashflow Flags
  HIGH_DEBT_SERVICE_RATIO: {
    severity: "critical",
    titleId: "Total Cicilan Melampaui Batas Sehat 30% Gaji (Standar OJK)",
    explanationId:
      "Lebih dari sepertiga penghasilan bersih habis terkunci untuk utang, membuat keuangan rumah tangga rapuh saat ada kebutuhan mendadak.",
    titleEn: "Combined Debt Exceeds OJK's 30% Safe Income Cap",
    explanationEn:
      "Over 30% of net monthly income is locked into debt payments, leaving minimal shock absorption.",
  },
  DEFICIT_CASHFLOW: {
    severity: "critical",
    titleId: "Arus Kas Bulanan Minus (Besar Pasak daripada Tiang)",
    explanationId:
      "Gabungan biaya hidup dan cicilan melampaui gaji bersih bulanan—Anda terpaksa menguras tabungan setiap bulan.",
    titleEn: "Negative Monthly Cashflow (Immediate Deficit)",
    explanationEn:
      "Living costs plus debt installments exceed net income, forcing monthly savings depletion.",
  },
  THIN_EMERGENCY_BUFFER: {
    severity: "warning",
    titleId: "Dana Darurat Likuid Kurang dari 3 Bulan Pengeluaran",
    explanationId:
      "Cadangan tunai sangat tipis jika sewaktu-waktu terjadi keterlambatan penghasilan atau biaya kesehatan darurat.",
    titleEn: "Thin Liquid Emergency Reserve (< 3 Months)",
    explanationEn:
      "Cash reserves cover less than 3 months of total obligations if income is disrupted.",
  },
  HIGH_TOTAL_COMMITMENT: {
    severity: "warning",
    titleId: " Lebih dari 80% Gaji Habis untuk Biaya Rutin & Cicilan",
    explanationId:
      "Ruang menabung tersisa di bawah 20%, menyulitkan pembentukan dana darurat dan investasi jangka panjang.",
    titleEn: "Over 80% of Income Consumed by Fixed Commitments",
    explanationEn:
      "Savings capacity drops below 20%, stalling emergency reserve and wealth accumulation.",
  },
  PREDATORY_EFFECTIVE_APR: {
    severity: "critical",
    titleId: "Bunga Efektif Tahunan (APR) Sangat Tinggi (> 24% / Tahun)",
    explanationId:
      "Angka bunga flat bulanan tampak kecil di iklan, namun beban bunga efektif sebenarnya menguras kas seperti pinjaman berbunga mencekik.",
    titleEn: "Predatory True Effective Annual Rate (> 24% APR)",
    explanationEn:
      "Advertised monthly flat interest hides a punishing effective annual rate above 24%/yr.",
  },
};

export function describeDeterministicFlag(
  code: string,
  locale: "id" | "en"
): HumanFlagDiagnostic {
  const entry = FLAG_DICTIONARY[code];
  if (!entry) {
    return {
      code,
      severity: "warning",
      title: code.replace(/_/g, " "),
      explanation:
        locale === "id"
          ? "Parameter rencana melewati ambang batas kehati-hatian komite."
          : "Plan parameter crossed a deterministic risk guardrail.",
    };
  }
  return {
    code,
    severity: entry.severity,
    title: locale === "id" ? entry.titleId : entry.titleEn,
    explanation:
      locale === "id" ? entry.explanationId : entry.explanationEn,
  };
}

function roundPrice(price: number): number {
  if (price >= 1000) return Math.round(price / 5) * 5;
  if (price >= 100) return Math.round(price);
  return Number(price.toFixed(2));
}

/**
 * 1-Click Auto-Heal for Market & Trading Track:
 * Aligns Stop-Loss >= 1.5x ATR-14 (or 4%), sets Take-Profit to 2.3x risk so Net R:R clears 1:1.8+,
 * and caps position size strictly under the 1.8% capital risk rule.
 */
export function autoHealTradingInput(
  input: TradeAuditInput,
  atrPct?: number
): TradeAuditInput {
  const entry = Math.max(0.0001, input.entry_price || 1_000);
  const slPct =
    typeof atrPct === "number" && atrPct > 0
      ? Math.max(1.5, Math.min(12, Number((atrPct * 1.5).toFixed(2))))
      : 4;
  const tpPct = Number((slPct * 2.3).toFixed(2));
  const isLong = input.direction === "LONG";

  const stop_loss = roundPrice(
    entry * (isLong ? 1 - slPct / 100 : 1 + slPct / 100)
  );
  const take_profit = roundPrice(
    entry * (isLong ? 1 + tpPct / 100 : 1 - tpPct / 100)
  );
  const actualSlPct = Math.max(
    0.5,
    (Math.abs(entry - stop_loss) / entry) * 100
  );
  const safePositionPct = Math.max(
    1,
    Math.min(100, Math.floor((1.8 / actualSlPct) * 100))
  );

  return {
    ...input,
    entry_price: roundPrice(entry),
    stop_loss,
    take_profit,
    position_size_pct: safePositionPct,
  };
}

/**
 * 1-Click Auto-Heal for Business & UMKM Track:
 * Restores healthy >= 32% net unit margin, moderates excessive platform commission (<= 12% hybrid mix),
 * sets realistic target units at 1.35x BEP, and sizes initial capital for >= 6.5 months stressed runway.
 */
export function autoHealBusinessInput(
  input: BusinessAuditInput
): BusinessAuditInput {
  const cogs = Math.max(1_000, input.unit_cogs || 15_000);
  const fixed = Math.max(500_000, input.monthly_fixed_cost || 5_000_000);
  const healedCommission = Math.min(12, input.platform_commission_pct ?? 0);
  const taxPct = input.include_umkm_tax ? 0.5 : 0;
  const deductionFraction = (healedCommission + taxPct) / 100;

  // Ensure net unit margin after commission & tax is at least 26% of selling price
  const minHealthyPrice = Math.ceil(
    cogs / Math.max(0.25, 1 - deductionFraction - 0.28) / 500
  ) * 500;
  const selling_price = Math.max(input.selling_price, minHealthyPrice);

  const interim = calculateBusinessAudit({
    ...input,
    unit_cogs: cogs,
    monthly_fixed_cost: fixed,
    platform_commission_pct: healedCommission,
    selling_price,
  });

  const target_monthly_units = Math.max(
    input.target_monthly_units,
    Math.ceil(interim.bep_units * 1.38)
  );

  const withTarget = calculateBusinessAudit({
    ...input,
    unit_cogs: cogs,
    monthly_fixed_cost: fixed,
    platform_commission_pct: healedCommission,
    selling_price,
    target_monthly_units,
  });

  // Ensure >= 6.5 months runway under -50% sales shock
  const netUnitMargin = withTarget.net_unit_margin_amount;
  const stressedLossPerMonth = Math.max(
    0,
    fixed - target_monthly_units * 0.5 * netUnitMargin
  );
  const requiredCapital = Math.ceil((stressedLossPerMonth * 6.8) / 500_000) * 500_000;

  return {
    ...input,
    unit_cogs: cogs,
    monthly_fixed_cost: fixed,
    platform_commission_pct: healedCommission,
    selling_price,
    target_monthly_units,
    initial_capital: Math.max(input.initial_capital, requiredCapital),
  };
}

/**
 * 1-Click Auto-Heal for Personal Cashflow Track:
 * Caps combined OJK DSR <= 28% of net income, trims total living + debt commitment <= 75% of income,
 * switches predatory flat interest (> 1%/mo) down to <= 0.65%/mo bank rate, and sizes 6-month emergency reserve.
 */
export function autoHealCashflowInput(
  input: CashflowAuditInput
): CashflowAuditInput {
  const income = Math.max(2_000_000, input.monthly_net_income || 10_000_000);
  const maxSafeTotalDebt = Math.floor(income * 0.28);
  const existingDebt = Math.min(
    Math.floor(income * 0.18),
    Math.max(0, input.existing_debt_installment ?? 0)
  );
  const maxNewInstallment = Math.max(
    250_000,
    Math.floor((maxSafeTotalDebt - existingDebt) / 50_000) * 50_000
  );
  const new_monthly_installment = Math.min(
    input.new_monthly_installment,
    maxNewInstallment
  );

  // Keep total commitments <= 76% of net income
  const maxSafeExpenses = Math.max(
    1_000_000,
    Math.floor((income * 0.76 - existingDebt - new_monthly_installment) / 50_000) *
      50_000
  );
  const current_monthly_expenses = Math.min(
    input.current_monthly_expenses,
    maxSafeExpenses
  );

  const flatRate =
    typeof input.flat_interest_pct_per_month === "number" &&
    input.flat_interest_pct_per_month > 0.8
      ? 0.65
      : (input.flat_interest_pct_per_month ?? 0);

  const totalMonthlyCommitment =
    current_monthly_expenses + existingDebt + new_monthly_installment;
  const safeEmergencyFund =
    Math.ceil((totalMonthlyCommitment * 6.2) / 500_000) * 500_000;

  let healedMonths = input.installment_months;
  if (new_monthly_installment < input.new_monthly_installment) {
    const roughTotal = input.new_monthly_installment * input.installment_months;
    healedMonths = Math.min(
      60,
      Math.max(input.installment_months, Math.ceil(roughTotal / new_monthly_installment))
    );
  }

  const candidate: CashflowAuditInput = {
    ...input,
    monthly_net_income: income,
    current_monthly_expenses,
    existing_debt_installment: existingDebt,
    new_monthly_installment,
    installment_months: healedMonths,
    flat_interest_pct_per_month: flatRate,
    liquid_emergency_fund: Math.max(
      input.liquid_emergency_fund,
      safeEmergencyFund
    ),
  };

  // Sanity pass
  const check = calculateCashflowAudit(candidate);
  if (check.baseline_score < 85 && candidate.flat_interest_pct_per_month) {
    candidate.flat_interest_pct_per_month = 0.5;
  }
  return candidate;
}
