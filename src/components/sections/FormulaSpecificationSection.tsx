"use client";

import { useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

interface FormulaItem {
  code: string;
  nameId: string;
  nameEn: string;
  expression: string;
  threshold: string;
  noteId: string;
  noteEn: string;
}

const FORMULA_SPECS: Record<AuditTrack, readonly FormulaItem[]> = {
  trading: [
    {
      code: "TRD-01",
      nameId: "Rasio Risk:Reward Bersih (Setelah Fee BEI)",
      nameEn: "Net Risk:Reward Ratio (After Exchange Fees)",
      expression: "Net R:R = max(0, GrossProfit - Fee) / (GrossLoss + Fee)",
      threshold: "Net R:R >= 1.10 && Gross R:R >= 1.50",
      noteId:
        "Memperhitungkan biaya sekuritas beli-jual (~0,40% di BEI) agar strategi scalping tipis tidak lolos semu.",
      noteEn:
        "Accounts for round-trip brokerage and exchange levies (~0.40% on IDX) so thin scalps cannot pass falsely.",
    },
    {
      code: "TRD-02",
      nameId: "Ukuran Posisi Maksimum Aturan 2% & Lot BEI",
      nameEn: "2%-Rule Max Position & IDX Lot Sizing",
      expression: "MaxSize% = min(100, (2 / StopDistance%) * 100) · Lots = floor(Shares / 100)",
      threshold: "RiskPerTrade <= 2.00% (Hard Veto > 3.00%)",
      noteId:
        "Membatasi kerugian tunggal maksimal 2% ekuitas total dan membulatkan lembar ke kelipatan 100 lembar (1 lot BEI).",
      noteEn:
        "Caps single-trade equity loss at 2% and normalizes IDX equity sizing into integer 100-share lots.",
    },
    {
      code: "TRD-03",
      nameId: "Alokasi Optimal Half-Kelly & Gerbang ATR-14",
      nameEn: "Half-Kelly Optimal Sizing & ATR-14 Noise Gate",
      expression: "f_half = 0.5 * max(0, p - (1 - p) / NetRR) · NoiseRatio = SLDist% / ATR14%",
      threshold: "SLDist >= 1.0x ATR-14",
      noteId:
        "Mencegah overbetting lewat pecahan Half-Kelly dan menolak Stop-Loss yang berada di dalam fluktuasi harian normal.",
      noteEn:
        "Prevents overbetting via Half-Kelly scaling and flags stop-losses placed inside daily ATR-14 noise.",
    },
  ],
  business: [
    {
      code: "BIZ-01",
      nameId: "Margin Unit Efektif (Komisi Aplikasi & PPh UMKM 0,5%)",
      nameEn: "Effective Unit Margin (App Fee & 0.5% SME Tax)",
      expression: "NetMargin = Price - COGS - Price * (Commission% + 0.5%)",
      threshold: "NetMargin% >= 15.0% && GrossMargin% >= 20.0%",
      noteId:
        "Memotong langsung komisi platform pesan-antar serta PPh Final UMKM PP 55/2022 dari setiap unit terjual.",
      noteEn:
        "Deducts marketplace delivery commissions and Indonesia's 0.5% SME final revenue tax per unit sold.",
    },
    {
      code: "BIZ-02",
      nameId: "Titik Impas (BEP) & Beban Kas Ramp-Up 3 Bulan",
      nameEn: "Break-Even Ceiling & 3-Month Ramp-Up Burn",
      expression: "BEP = ceil(FixedCost / NetMargin) · Burn3M = sum_m max(0, FixedCost - Units*r_m*NetMargin)",
      threshold: "TargetUnits >= BEP · r = [0.40, 0.65, 0.85]",
      noteId:
        "Menghitung defisit kas kumulatif selama 3 bulan pembukaan awal sebelum pelanggan stabil.",
      noteEn:
        "Quantifies cumulative opening cash deficit across months 1–3 before foot traffic matures.",
    },
    {
      code: "BIZ-03",
      nameId: "Runway Kas Tertekan (-50% Omzet)",
      nameEn: "Stressed Cash Runway (-50% Volume Shock)",
      expression: "RunwayMo = InitialCapital / abs(0.5 * TargetUnits * NetMargin - FixedCost)",
      threshold: "StressedRunway >= 6.0 Months",
      noteId:
        "Mengukur berapa bulan modal awal sanggup bertahan apabila realisasi penjualan meleset separuh.",
      noteEn:
        "Measures how many months initial capital survives if actual unit sales miss projections by 50%.",
    },
  ],
  cashflow: [
    {
      code: "CSH-01",
      nameId: "Total Debt Service Ratio (DSR) Gabungan OJK",
      nameEn: "Combined OJK / BI Debt Service Ratio",
      expression: "TotalDSR% = ((ExistingDebt + NewInstallment) / NetIncome) * 100",
      threshold: "TotalDSR <= 30.0% (Severe > 45.0%)",
      noteId:
        "Menjumlahkan seluruh kewajiban cicilan lama dan cicilan baru terhadap penghasilan bersih bulanan.",
      noteEn:
        "Aggregates existing debt obligations with the proposed new installment against net monthly income.",
    },
    {
      code: "CSH-02",
      nameId: "Konversi Bunga Flat ke Bunga Efektif Tahunan (True APR)",
      nameEn: "Newton-Raphson Flat-to-Effective Annual APR",
      expression: "Solve ((1 + n*r_flat)/n) * (1 - (1 + i)^(-n)) / i = 1 -> APR = 12 * i * 100%",
      threshold: "EffectiveAPR <= 24.0% / Year",
      noteId:
        "Membongkar bunga efektif tahunan sebenarnya dari penawaran cicilan/PayLater berbunga flat bulanan.",
      noteEn:
        "Solves the exact annuity IRR to expose the true annual cost of monthly flat-rate financing.",
    },
    {
      code: "CSH-03",
      nameId: "Ketahanan Dana Darurat Likuid",
      nameEn: "Liquid Emergency Buffer Coverage",
      expression: "ReserveMonths = EmergencyFund / (LivingExpenses + ExistingDebt + NewInstallment)",
      threshold: "ReserveMonths >= 6.0 Months (Warn < 3.0)",
      noteId:
        "Memastikan dana likuid tetap menutup minimal 3–6 bulan komitmen penuh setelah cicilan baru masuk.",
      noteEn:
        "Verifies liquid reserves still cover 3–6 months of total household obligations post-commitment.",
    },
  ],
};

export function FormulaSpecificationSection() {
  const { locale, t } = useTranslation();
  const [track, setTrack] = useState<AuditTrack>("trading");

  const items = FORMULA_SPECS[track];

  return (
    <section
      id="spesifikasi-rumus"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-10 sm:py-14"
    >
      <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cleared sm:text-[11px]">
            {t("methodology_page.spec_eyebrow")}
          </span>
          <h2 className="mt-2 font-editorial text-2xl font-medium tracking-tight text-text-primary sm:text-3xl md:text-4xl">
            {t("methodology_page.spec_title")}
          </h2>
          <p className="editorial-measure mt-2 font-sans text-xs leading-relaxed text-text-secondary sm:text-sm">
            {t("methodology_page.spec_subtitle")}
          </p>
        </div>

        <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-sm border border-hairline bg-obsidian p-1">
          {(["trading", "business", "cashflow"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTrack(id)}
              className={cn(
                "min-h-[34px] rounded-xs px-3 font-mono text-[10.5px] font-semibold uppercase tracking-wider transition-colors",
                track === id
                  ? "bg-surface text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {t(`tracks.${id}.name`)}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Hairline Specification Rows */}
      <div className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-surface">
        {items.map((f) => (
          <div
            key={f.code}
            className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-12 lg:items-center lg:gap-6"
          >
            <div className="lg:col-span-4">
              <span className="font-mono text-[10px] font-bold tracking-widest text-cleared">
                {f.code}
              </span>
              <h3 className="mt-0.5 font-sans text-sm font-semibold text-text-primary">
                {locale === "id" ? f.nameId : f.nameEn}
              </h3>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {locale === "id" ? f.noteId : f.noteEn}
              </p>
            </div>

            <div className="rounded-sm border border-hairline bg-obsidian px-3.5 py-2.5 font-mono text-[11px] text-sky-400 lg:col-span-5">
              {f.expression}
            </div>

            <div className="flex flex-col gap-1 lg:col-span-3">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-text-muted">
                HARD GATE THRESHOLD
              </span>
              <span className="font-mono text-xs font-semibold text-cleared">
                {f.threshold}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
