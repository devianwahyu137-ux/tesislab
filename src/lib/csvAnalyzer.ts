import Decimal from "decimal.js";
import Papa from "papaparse";
import type {
  BusinessAuditInput,
  CashflowAuditInput,
} from "@/lib/calculators";

export type LedgerCategory =
  | "INCOME"
  | "FIXED_COST"
  | "VARIABLE_COGS"
  | "DEBT_INSTALLMENT"
  | "DISCRETIONARY";

export interface ParsedLedgerRow {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = inflow, negative = outflow
  category: LedgerCategory;
}

export interface CsvAnalysisSummary {
  rows: ParsedLedgerRow[];
  totalInflow: number;
  fixedOutflow: number;
  variableCogsOutflow: number;
  debtOutflow: number;
  discretionaryOutflow: number;
  netCashflow: number;
  ojkDsrPct: number;
  leakagePct: number;
  suggestedCashflowInput: CashflowAuditInput;
  suggestedBusinessInput: BusinessAuditInput;
}

const DEBT_KEYWORDS =
  /cicilan|kpr|kkb|kta|paylater|kredivo|akulaku|spaylater|shopeepaylater|kartu kredit|angsuran|leasing|pinjol|loan|installment|mortgage/i;
const FIXED_KEYWORDS =
  /sewa|rent|kontrak|listrik|pln|pdam|internet|indihome|wifi|gaji karyawan|payroll staff|bpjs|asuransi|insurance|iuran|ipl/i;
const COGS_KEYWORDS =
  /hpp|bahan baku|supplier|kulakan|kemasan|packaging|stok|inventory|grosir|produksi|raw material|cogs/i;
const INCOME_KEYWORDS =
  /gaji|salary|payroll|pendapatan|omzet|settlement|qris|gofood|grabfood|shopeefood|invoice|transfer masuk|dividen/i;

export function classifyTransaction(
  description: string,
  signedAmount: number
): LedgerCategory {
  if (signedAmount > 0) return "INCOME";
  const desc = description.trim();
  if (DEBT_KEYWORDS.test(desc)) return "DEBT_INSTALLMENT";
  if (COGS_KEYWORDS.test(desc)) return "VARIABLE_COGS";
  if (FIXED_KEYWORDS.test(desc)) return "FIXED_COST";
  return "DISCRETIONARY";
}

function parseNumericAmount(raw: string | number | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  const trimmed = String(raw).trim();
  if (!trimmed) return 0;

  const isParenNeg = /^\(.*\)$/.test(trimmed);
  const hasMinus = trimmed.includes("-") || /\b(db|debit|cr_out|keluar)\b/i.test(trimmed);

  // Strip currency symbols and spaces
  let cleaned = trimmed.replace(/[Rp$€£\s()A-Za-z]/g, "");
  // Handle Indonesian thousand dots vs decimal comma (e.g. 12.500.000,00 or 12,500,000.00)
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  if (lastDot > -1 && lastComma > -1) {
    if (lastComma > lastDot) {
      // 12.500.000,50 -> remove dots, comma -> dot
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // 12,500,000.50 -> remove commas
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (lastDot > -1) {
    // Check if multiple dots or 3 digits after dot (Indonesian thousands: 4.200.000 or 500.000)
    const parts = cleaned.split(".");
    if (parts.length > 2 || (parts.length === 2 && parts[1]?.length === 3)) {
      cleaned = cleaned.replace(/\./g, "");
    }
  } else if (lastComma > -1) {
    const parts = cleaned.split(",");
    if (parts.length > 2 || (parts.length === 2 && parts[1]?.length === 3)) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(",", ".");
    }
  }

  cleaned = cleaned.replace(/[^0-9.]/g, "");
  const val = Number.parseFloat(cleaned);
  if (!Number.isFinite(val)) return 0;
  return isParenNeg || hasMinus ? -Math.abs(val) : val;
}

/**
 * Parses raw CSV bank statement / SME cash ledger strings locally via PapaParse
 * and synthesizes exact Decimal.js inputs for Cashflow & Business audits.
 */
export function analyzeFinancialCsv(csvText: string): CsvAnalysisSummary {
  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const rows: ParsedLedgerRow[] = [];

  parsed.data.forEach((record, idx) => {
    const keys = Object.keys(record);
    const dateKey = keys.find((k) => /tanggal|date|tgl|waktu/i.test(k)) ?? keys[0];
    const descKey =
      keys.find((k) => /keterangan|deskripsi|description|uraian|memo|catatan/i.test(k)) ??
      keys[1];
    const typeKey = keys.find((k) => /tipe|type|arus|mutasi|dc/i.test(k));
    const amountKey = keys.find((k) =>
      /nominal|jumlah|amount|nilai|mutasi_rp|saldo_mutasi/i.test(k)
    );
    const debitKey = keys.find((k) => /debit|keluar|outflow/i.test(k));
    const creditKey = keys.find((k) => /kredit|credit|masuk|inflow/i.test(k));

    const dateVal = (dateKey ? record[dateKey] : "")?.trim() || `2026-11-${String((idx % 28) + 1).padStart(2, "0")}`;
    const descVal = (descKey ? record[descKey] : "")?.trim() || `Transaksi #${idx + 1}`;

    let signedAmount = 0;
    if (creditKey && debitKey && (record[creditKey] || record[debitKey])) {
      const cr = Math.abs(parseNumericAmount(record[creditKey]));
      const db = Math.abs(parseNumericAmount(record[debitKey]));
      signedAmount = cr > 0 ? cr : -db;
    } else {
      const rawAmt = parseNumericAmount(
        amountKey ? record[amountKey] : record[keys[2] ?? ""]
      );
      const rawType = (typeKey ? record[typeKey] : "")?.trim().toUpperCase() ?? "";
      if (/^(DB|DEBIT|OUT|EXPENSE|KELUAR)$/.test(rawType)) {
        signedAmount = -Math.abs(rawAmt);
      } else if (/^(CR|CREDIT|IN|INCOME|MASUK)$/.test(rawType)) {
        signedAmount = Math.abs(rawAmt);
      } else if (rawAmt > 0 && !INCOME_KEYWORDS.test(descVal) && (DEBT_KEYWORDS.test(descVal) || FIXED_KEYWORDS.test(descVal) || COGS_KEYWORDS.test(descVal))) {
        signedAmount = -Math.abs(rawAmt);
      } else {
        signedAmount = rawAmt;
      }
    }

    if (signedAmount === 0) return;

    const category = classifyTransaction(descVal, signedAmount);
    rows.push({
      id: `row-${idx}`,
      date: dateVal,
      description: descVal,
      amount: signedAmount,
      category,
    });
  });

  let inflow = new Decimal(0);
  let fixed = new Decimal(0);
  let cogs = new Decimal(0);
  let debt = new Decimal(0);
  let discretionary = new Decimal(0);

  for (const r of rows) {
    const abs = new Decimal(Math.abs(r.amount));
    if (r.amount > 0 || r.category === "INCOME") {
      inflow = inflow.plus(abs);
    } else if (r.category === "FIXED_COST") {
      fixed = fixed.plus(abs);
    } else if (r.category === "VARIABLE_COGS") {
      cogs = cogs.plus(abs);
    } else if (r.category === "DEBT_INSTALLMENT") {
      debt = debt.plus(abs);
    } else {
      discretionary = discretionary.plus(abs);
    }
  }

  const totalOutflow = fixed.plus(cogs).plus(debt).plus(discretionary);
  const netCashflow = inflow.minus(totalOutflow);
  const safeIncome = Decimal.max(new Decimal(1_000_000), inflow);

  const ojkDsrPct = debt
    .div(safeIncome)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber();
  const leakagePct = discretionary
    .div(safeIncome)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber();

  // Synthesize ready-to-audit Cashflow & Business inputs
  const routineNonDebt = fixed.plus(discretionary).toNumber();
  const suggestedCashflowInput: CashflowAuditInput = {
    monthly_net_income: Math.round(safeIncome.toNumber()),
    current_monthly_expenses: Math.round(routineNonDebt),
    existing_debt_installment: Math.round(debt.toNumber()),
    new_monthly_installment: 2_000_000,
    installment_months: 12,
    flat_interest_pct_per_month: 1.5,
    liquid_emergency_fund: Math.round(
      Decimal.max(new Decimal(10_000_000), netCashflow.times(4)).toNumber()
    ),
    decision_purpose:
      "Simulasi komitmen baru berdasarkan ekstraksi mutasi rekening aktual.",
  };

  const estUnits = 250;
  const estSellingPrice = Math.max(
    25_000,
    Math.round(safeIncome.div(estUnits).toNumber() / 1000) * 1000
  );
  const estUnitCogs =
    cogs.gt(0)
      ? Math.round(cogs.div(estUnits).toNumber() / 500) * 500
      : Math.round(estSellingPrice * 0.6);

  const suggestedBusinessInput: BusinessAuditInput = {
    initial_capital: Math.round(
      Decimal.max(new Decimal(30_000_000), fixed.times(3)).toNumber()
    ),
    monthly_fixed_cost: Math.round(
      Decimal.max(new Decimal(3_000_000), fixed.plus(debt)).toNumber()
    ),
    selling_price: estSellingPrice,
    unit_cogs: Math.min(estSellingPrice - 1000, estUnitCogs),
    target_monthly_units: estUnits,
    platform_commission_pct: 15,
    include_umkm_tax: true,
    business_concept:
      "Audit ketahanan operasional UMKM dari buku kas CSV aktual.",
  };

  return {
    rows,
    totalInflow: inflow.toNumber(),
    fixedOutflow: fixed.toNumber(),
    variableCogsOutflow: cogs.toNumber(),
    debtOutflow: debt.toNumber(),
    discretionaryOutflow: discretionary.toNumber(),
    netCashflow: netCashflow.toNumber(),
    ojkDsrPct,
    leakagePct,
    suggestedCashflowInput,
    suggestedBusinessInput,
  };
}

export const SAMPLE_CSV_DATASETS: Record<
  "household" | "umkm",
  { labelId: string; labelEn: string; csv: string }
> = {
  household: {
    labelId: "Mutasi Gaji & PayLater Rumah Tangga",
    labelEn: "Household Payroll & PayLater Statement",
    csv: `Tanggal,Keterangan,Tipe,Nominal
2026-11-01,Gaji Bulanan PT Nusantara Digital,CR,16500000
2026-11-02,Sewa Apartemen & IPL Bulanan,DB,4200000
2026-11-03,Tagihan Listrik PLN & Internet WiFi,DB,950000
2026-11-05,Cicilan KKB Mobil Tahap 14,DB,3150000
2026-11-07,Tagihan ShopeePayLater & Kredivo,DB,1850000
2026-11-10,Belanja Groceries Mingguan,DB,1450000
2026-11-14,Kopi, Langganan Streaming & Dining Out,DB,1650000
2026-11-18,Asuransi Kesehatan & BPJS,DB,650000
2026-11-22,Belanja Impulsif Flash Sale,DB,1100000`,
  },
  umkm: {
    labelId: "Buku Kas Booth Kuliner UMKM (QRIS & GoFood)",
    labelEn: "SME Culinary Kiosk Ledger (QRIS & Delivery)",
    csv: `Tanggal,Keterangan,Tipe,Nominal
2026-11-02,Settlement QRIS Penjualan Minggu 1,CR,14800000
2026-11-09,Pencairan GoFood & GrabFood Minggu 2,CR,16200000
2026-11-16,Settlement QRIS Penjualan Minggu 3,CR,13900000
2026-11-23,Pencairan GoFood & GrabFood Minggu 4,CR,15600000
2026-11-03,Sewa Booth Mal Bulanan,DB,11500000
2026-11-04,Gaji Karyawan 3 Barista/Kru,DB,9600000
2026-11-06,Kulakan Bahan Baku Kopi, Susu & Syrup,DB,18400000
2026-11-12,Pembelian Kemasan Cup & Paperbag,DB,4200000
2026-11-15,Listrik Komersial, Air & Internet Kasir,DB,2150000
2026-11-19,Cicilan Mesin Espresso Komersial,DB,2400000
2026-11-25,Biaya Promosi Iklan Sosial Media,DB,1750000`,
  },
};
