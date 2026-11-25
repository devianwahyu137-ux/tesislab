"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

interface LedgerCase {
  id: AuditTrack;
  promptId: string;
  promptEn: string;
  rows: readonly {
    dimId: string;
    dimEn: string;
    genericId: string;
    genericEn: string;
    tesislabId: string;
    tesislabEn: string;
  }[];
}

const CASES: readonly LedgerCase[] = [
  {
    id: "trading",
    promptId:
      "“Saya mau beli BBCA di 5.550 pakai 40% modal Rp25 juta, TP 5.850, SL 5.200 saat IHSG koreksi. Bagus kan?”",
    promptEn:
      "“I want to buy BBCA at 5,550 with 40% of IDR 25M capital, TP 5,850, SL 5,200 during an IDX pullback. Good setup?”",
    rows: [
      {
        dimId: "Akurasi Aritmetika & Fee",
        dimEn: "Arithmetic & Broker Fees",
        genericId:
          "Memuji potensi rebound blue-chip tanpa menghitung R:R terbalik (1:0,86) atau potongan fee sekuritas BEI 0,40%.",
        genericEn:
          "Praises blue-chip rebound potential while missing inverted 1:0.86 R:R and 0.40% IDX round-trip broker fees.",
        tesislabId:
          "Decimal.js mengunci R:R Bersih di 1:0,75 (setelah fee Rp40.000), Lot BEI 18 lot, dan memicu bendera LOW_RR_RATIO dalam 0,8 ms.",
        tesislabEn:
          "Decimal.js locks Net R:R at 1:0.75 (after IDR 40k broker fees), 18 IDX lots, and flags LOW_RR_RATIO in 0.8 ms.",
      },
      {
        dimId: "Konteks Volatilitas & ATR-14",
        dimEn: "ATR-14 Noise & Volatility",
        genericId:
          "Buta terhadap data harga pasar harian; tidak tahu apakah SL berada di dalam noise harian.",
        genericEn:
          "Blind to live OHLCV market data; cannot tell if your stop-loss sits inside normal daily volatility.",
        tesislabId:
          "Menarik OHLCV 90 hari nyata untuk mengukur rasio jarak SL terhadap ATR-14 serta probabilitas ruin 1.000 jalur Monte Carlo.",
        tesislabEn:
          "Pulls real 90-day OHLCV bars to verify SL vs. ATR-14 noise ratio and 1,000-path Monte Carlo ruin probability.",
      },
      {
        dimId: "Disiplin Ukuran Posisi",
        dimEn: "Position Sizing Discipline",
        genericId:
          "Mengiyakan alokasi 40% modal dengan kalimat normatif “tetap gunakan manajemen risiko”.",
        genericEn:
          "Validates 40% capital exposure with vague boilerplate like “remember to manage your risk”.",
        tesislabId:
          "Menghitung batas maksimum aturan 2% (≤ 31,7% modal) dan alokasi optimal Half-Kelly (13,7%) secara eksak.",
        tesislabEn:
          "Computes exact 2%-rule ceiling (≤ 31.7% capital) and Half-Kelly optimal allocation (13.7%).",
      },
    ],
  },
  {
    id: "business",
    promptId:
      "“Saya buka booth kuliner mal modal Rp35 juta, sewa tetap Rp8 juta/bln, harga Rp50 rb, HPP Rp35 rb, jual via aplikasi komisi 20%.”",
    promptEn:
      "“Opening a mall food kiosk with IDR 35M capital, IDR 8M fixed rent, IDR 50k price, IDR 35k COGS, 20% delivery app fee.”",
    rows: [
      {
        dimId: "Margin Bersih vs. Komisi",
        dimEn: "Net Margin vs. App Fees",
        genericId:
          "Melihat margin kotor 30% (Rp15 rb/porsi) dan langsung menyebut bisnis sangat menjanjikan.",
        genericEn:
          "Sees 30% gross margin (IDR 15k/unit) and declares the food concept highly promising.",
        tesislabId:
          "Memotong komisi aplikasi 20% + PPh Final UMKM 0,5% → margin bersih jatuh ke 9,5% (Rp4.750/unit) & memicu PLATFORM_FEE_SQUEEZE.",
        tesislabEn:
          "Deducts 20% app fee + 0.5% SME tax → net margin collapses to 9.5% (IDR 4,750/unit), triggering PLATFORM_FEE_SQUEEZE.",
      },
      {
        dimId: "Realitas Ramp-Up 3 Bulan Awal",
        dimEn: "3-Month Opening Ramp-Up",
        genericId:
          "Mengasumsikan target penjualan 100% langsung tercapai sejak hari pertama buka.",
        genericEn:
          "Assumes 100% target sales volume from opening day with zero ramp-up friction.",
        tesislabId:
          "Mensimulasikan kurva pembukaan realistis (40% → 65% → 85%) dan menghitung kas awal yang terbakar di 3 bulan pertama.",
        tesislabEn:
          "Simulates realistic opening ramp-up (40% → 65% → 85%) and quantifies exact 3-month cumulative cash burn.",
      },
      {
        dimId: "Titik Impas (BEP) Sebenarnya",
        dimEn: "True Break-Even Ceiling",
        genericId:
          "Salah menghitung BEP di 534 porsi karena lupa memperhitungkan potongan komisi platform.",
        genericEn:
          "Miscalculates BEP at 534 units by ignoring platform commission deductions.",
        tesislabId:
          "Mengunci BEP riil di 1.685 porsi/bulan (56 porsi/hari tanpa libur) sebelum menyetujui sewa tempat.",
        tesislabEn:
          "Locks true BEP at 1,685 units/month (56 units/day nonstop) before you sign the lease.",
      },
    ],
  },
  {
    id: "cashflow",
    promptId:
      "“Gaji Rp15 juta, ada cicilan motor Rp3 juta, mau ambil cicilan gadget Rp2,25 juta selama 12 bulan ‘bunga ringan 1,75% flat/bulan’.”",
    promptEn:
      "“Net income IDR 15M, existing IDR 3M loan, adding IDR 2.25M 12-month gadget installment at ‘low 1.75% monthly flat rate’.”",
    rows: [
      {
        dimId: "Bunga Flat vs. Bunga Efektif (APR)",
        dimEn: "Flat Rate vs. True APR",
        genericId:
          "Tertipu istilah marketing ‘1,75% per bulan’ dan menganggap bunganya rendah.",
        genericEn:
          "Accepts the ‘1.75% monthly’ marketing framing at face value without computing annuity IRR.",
        tesislabId:
          "Iterasi Newton-Raphson membongkar bunga efektif sebenarnya: ~37,6% APR/tahun → langsung memicu PREDATORY_EFFECTIVE_APR.",
        tesislabEn:
          "Newton-Raphson IRR exposes the true effective cost: ~37.6% annual APR → immediately flags PREDATORY_EFFECTIVE_APR.",
      },
      {
        dimId: "Total DSR Standar OJK / BI",
        dimEn: "Combined OJK / BI DSR",
        genericId:
          "Hanya membagi cicilan baru (Rp2,25 jt / Rp15 jt = 15%) dan menyatakan masih aman.",
        genericEn:
          "Only divides the new loan (IDR 2.25M / 15M = 15%) and falsely pronounces it safe.",
        tesislabId:
          "Menggabungkan cicilan lama + baru ((Rp3 jt + Rp2,25 jt) / Rp15 jt = 35,0% DSR) → melampaui batas sehat 30% OJK.",
        tesislabEn:
          "Combines existing + new debt ((3M + 2.25M) / 15M = 35.0% DSR) → breaching the 30% prudence ceiling.",
      },
      {
        dimId: "Uji Guncangan Pendapatan",
        dimEn: "Income Shock Resilience",
        genericId:
          "Tidak menguji apa yang terjadi bila penghasilan atau insentif turun 20%.",
        genericEn:
          "Never stress-tests what happens if monthly income or bonuses drop by 20%.",
        tesislabId:
          "Menyediakan tuas What-If instan di browser untuk memetakan titik defisit kas tanpa panggil ulang API.",
        tesislabEn:
          "Provides an instant client-side What-If slider mapping exact household deficit thresholds at $0 API cost.",
      },
    ],
  },
];

/**
 * Wide Editorial Comparison Table contrasting Generic "Yes-Man" Chatbots against
 * TesisLab's Deterministic Engine. Uses crisp hairline table structure (zero nested cards).
 */
export function AntiYesManLedgerSection() {
  const { locale, t } = useTranslation();
  const [selectedCase, setSelectedCase] = useState<AuditTrack>("trading");

  const activeCase =
    CASES.find((c) => c.id === selectedCase) ?? CASES[0];

  return (
    <section className="mx-auto w-full max-w-6xl border-t border-hairline py-10 sm:py-14 md:py-16">
      <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-conditional sm:text-[11px]">
            {t("anti_yesman.eyebrow")}
          </span>
          <h2 className="mt-2 max-w-2xl font-editorial text-2xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-3xl md:text-4xl">
            {t("anti_yesman.title")}
          </h2>
          <p className="editorial-measure mt-2 font-sans text-xs leading-relaxed text-text-secondary sm:text-sm">
            {t("anti_yesman.subtitle")}
          </p>
        </div>

        {/* Case Study Selector Pills */}
        <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-sm border border-hairline bg-obsidian p-1">
          {(
            [
              { id: "trading", label: t("anti_yesman.case_trading") },
              { id: "business", label: t("anti_yesman.case_umkm") },
              { id: "cashflow", label: t("anti_yesman.case_debt") },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedCase(item.id)}
              className={cn(
                "min-h-[34px] rounded-xs px-3 font-mono text-[10.5px] font-semibold uppercase tracking-wider transition-colors",
                selectedCase === item.id
                  ? "bg-surface text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Quote Strip */}
      <div className="mb-4 flex flex-col justify-between gap-3 border-y border-hairline bg-obsidian/55 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <p className="font-editorial text-sm italic text-text-primary sm:text-base">
          {locale === "id" ? activeCase.promptId : activeCase.promptEn}
        </p>

        <Link
          href={`/terminal/audit?track=${activeCase.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-cleared hover:underline"
        >
          <span>{t("landing_suite.launcher_cta")}</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Clean Architectural Ledger Table (Responsive stacked rows on mobile, 12-col ledger on desktop) */}
      <div className="overflow-hidden rounded-md border border-hairline bg-surface">
        <div className="hidden grid-cols-12 border-b border-hairline bg-obsidian px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted md:grid">
          <div className="col-span-3">{t("anti_yesman.col_dimension")}</div>
          <div className="col-span-4 text-rejected/90">
            {t("anti_yesman.col_generic")}
          </div>
          <div className="col-span-5 text-cleared">
            {t("anti_yesman.col_tesislab")}
          </div>
        </div>

        <div className="divide-y divide-hairline">
          {activeCase.rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 gap-3 px-4 py-4 sm:px-5 md:grid-cols-12 md:gap-5 md:py-4.5"
            >
              <div className="font-sans text-xs font-semibold text-text-primary md:col-span-3">
                {locale === "id" ? row.dimId : row.dimEn}
              </div>

              <div className="flex items-start gap-2 font-sans text-xs leading-relaxed text-text-muted md:col-span-4">
                <X
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rejected"
                  aria-hidden="true"
                />
                <span>{locale === "id" ? row.genericId : row.genericEn}</span>
              </div>

              <div className="flex items-start gap-2 font-sans text-xs leading-relaxed text-text-primary md:col-span-5">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cleared"
                  aria-hidden="true"
                />
                <span>{locale === "id" ? row.tesislabId : row.tesislabEn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
