"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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
  exampleId: string;
  exampleEn: string;
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
      exampleId:
        "Contoh: Target untung +Rp500rb, risiko -Rp400rb, fee Rp40rb → R:R Bersih = (500-40)/(400+40) = 1 : 1.05 (Ditolak jika < 1.10).",
      exampleEn:
        "Example: +500k profit, -400k loss, 40k fee → Net R:R = 1:1.05 (Flagged < 1.10).",
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
      exampleId:
        "Contoh: Jarak Stop-Loss 5% → Ukuran posisi aman maksimal = (2 / 5) × 100 = 40% modal.",
      exampleEn:
        "Example: 5% stop distance → Max safe position = (2 / 5) × 100 = 40% of capital.",
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
      exampleId:
        "Contoh: Jika saham bergerak rata-rata 2,5%/hari (ATR-14), Stop-Loss 1,5% terlalu sempit (0,6× ATR) dan rawan tersapu.",
      exampleEn:
        "Example: If daily ATR-14 is 2.5%, a 1.5% SL is 0.6× ATR and easily stopped out by noise.",
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
      exampleId:
        "Contoh: Harga Rp40rb, HPP Rp18rb, Komisi GoFood 20% + PPh 0,5% (Rp8,2rb) → Margin bersih sisa Rp13,8rb/porsi.",
      exampleEn:
        "Example: Rp40k price, Rp18k COGS, 20.5% fees (Rp8.2k) → Net margin is Rp13.8k/unit.",
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
      exampleId:
        "Contoh: Sewa tetap Rp12jt/bln, margin Rp15rb → Minimal wajib jual 800 porsi/bln sekadar untuk balik modal operasional.",
      exampleEn:
        "Example: Rp12M fixed cost, Rp15k net margin → Must sell 800 units/mo just to break even.",
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
      exampleId:
        "Contoh: Jika sepi 50% dan rugi Rp5jt/bln, modal Rp20jt habis dalam 4 bulan (di bawah ambang aman 6 bulan).",
      exampleEn:
        "Example: Under -50% sales losing Rp5M/mo, Rp20M reserve runs out in 4 months (< 6 mo safe).",
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
      exampleId:
        "Contoh: Gaji Rp10jt, cicilan lama Rp1,5jt + cicilan baru Rp2jt = Total DSR 35% (melewati batas sehat 30% OJK).",
      exampleEn:
        "Example: Rp10M income, Rp3.5M combined debt = 35% DSR (exceeds OJK 30% safe cap).",
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
      exampleId:
        "Contoh: Iklan 'bunga ringan flat 1,75%/bulan' selama 12 bulan ternyata setara bunga efektif 37,1% per tahun!",
      exampleEn:
        "Example: '1.75%/mo flat' for 12 months equals 37.1% True Effective APR per year!",
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
      exampleId:
        "Contoh: Pengeluaran + cicilan Rp9jt/bln, tabungan darurat Rp18jt → Napas kas hanya 2 bulan (rawan jika PHK/sakit).",
      exampleEn:
        "Example: Rp9M/mo total obligations, Rp18M reserve → Only 2 months buffer.",
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

        <div className="no-scrollbar inline-flex max-w-full shrink-0 items-center gap-1 overflow-x-auto rounded-md border border-hairline bg-obsidian p-1">
          {(
            [
              { id: "trading", labelId: "Trading", labelEn: "Trading" },
              { id: "business", labelId: "Bisnis UMKM", labelEn: "SME Business" },
              { id: "cashflow", labelId: "Cashflow", labelEn: "Cashflow" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTrack(item.id)}
              className={cn(
                "min-h-[34px] shrink-0 rounded-xs px-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
                track === item.id
                  ? "bg-surface text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {locale === "id" ? item.labelId : item.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Hairline Specification Rows with Layperson Examples */}
      <div className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-surface">
        {items.map((f) => (
          <div
            key={f.code}
            className="grid grid-cols-1 gap-3.5 p-4 sm:p-5 lg:grid-cols-12 lg:items-center lg:gap-6"
          >
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] font-bold tracking-widest text-cleared">
                  {f.code}
                </span>
                <InfoTooltip
                  content={locale === "id" ? f.exampleId : f.exampleEn}
                />
              </div>
              <h3 className="mt-0.5 font-sans text-sm font-bold text-text-primary">
                {locale === "id" ? f.nameId : f.nameEn}
              </h3>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {locale === "id" ? f.noteId : f.noteEn}
              </p>
              <p className="mt-2 rounded-xs border border-hairline/70 bg-obsidian/70 px-2.5 py-1.5 font-sans text-[11.5px] leading-snug text-cleared">
                {locale === "id" ? f.exampleId : f.exampleEn}
              </p>
            </div>

            <div className="overflow-x-auto rounded-md border border-hairline bg-obsidian px-3.5 py-2.5 font-mono text-[11px] text-sky-400 lg:col-span-4">
              {f.expression}
            </div>

            <div className="flex flex-col gap-1.5 lg:col-span-3 lg:items-end lg:text-right">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-text-muted">
                HARD GATE THRESHOLD
              </span>
              <span className="font-mono text-xs font-semibold text-cleared">
                {f.threshold}
              </span>
              <Link
                href={`/terminal/audit?track=${track}`}
                className="mt-1 inline-flex w-fit items-center gap-1 font-sans text-[11px] font-semibold text-text-secondary transition-colors hover:text-cleared"
              >
                <span>
                  {locale === "id" ? "Uji di Terminal" : "Test in Terminal"}
                </span>
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
