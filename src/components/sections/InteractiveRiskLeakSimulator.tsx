"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import NumberFlow from "@number-flow/react";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { PrecisionSlider } from "@/components/ui/PrecisionSlider";
import { useTranslation } from "@/context/LanguageContext";
import { convertFlatMonthlyToEffectiveApr } from "@/lib/calculators";
import { cn } from "@/lib/utils";

type LawMode = "drawdown" | "flat_apr" | "commission";

/**
 * Interactive Mathematical Law Simulator on the Marketing Landing Page (`/`).
 * Lets visitors drag a single precision lever to experience non-linear financial traps
 * in real time before entering the full Terminal.
 */
export function InteractiveRiskLeakSimulator() {
  const { locale } = useTranslation();
  const [mode, setMode] = useState<LawMode>("drawdown");
  const [drawdownPct, setDrawdownPct] = useState(50);
  const [flatRateMo, setFlatRateMo] = useState(1.75);
  const [commissionPct, setCommissionPct] = useState(20);

  const isId = locale === "id";

  const calc = useMemo(() => {
    if (mode === "drawdown") {
      const clamped = Math.min(90, Math.max(5, drawdownPct));
      const recoveryPct = (clamped / (100 - clamped)) * 100;
      const remainingRp = 100_000_000 * (1 - clamped / 100);
      return {
        sliderLabel: isId
          ? "Simulasi Kerugian Modal (Drawdown)"
          : "Simulated Capital Drawdown",
        sliderDisplay: `-${clamped}%`,
        min: 5,
        max: 85,
        step: 5,
        value: clamped,
        primaryLabel: isId
          ? "Imbal Hasil Wajib Hanya untuk Impas"
          : "Gain Required Just to Break Even",
        primaryVal: recoveryPct,
        primaryPrefix: "+",
        primarySuffix: "%",
        secondaryLabel: isId
          ? "Sisa Ekuitas dari Rp100 Juta"
          : "Remaining Equity from IDR 100M",
        secondaryText: `Rp ${Math.round(remainingRp).toLocaleString("id-ID")}`,
        verdictText: isId
          ? clamped >= 50
            ? "ZONA ASIMETRI MEMATIKAN: Kerugian mulai menuntut profit eksponensial untuk sekadar balik modal."
            : "ZONA TERKENDALI: Disiplin Stop-Loss 2% menjaga pemulihan tetap realistis."
          : clamped >= 50
            ? "LETHAL ASYMMETRY ZONE: Losses now demand exponential gains simply to recover principal."
            : "CONTAINED ZONE: Strict 2% stop-loss discipline keeps recovery mathematically tractable.",
        danger: clamped >= 35,
        href: "/terminal/audit?track=trading",
      };
    }

    if (mode === "flat_apr") {
      const apr = convertFlatMonthlyToEffectiveApr(flatRateMo, 12);
      const principal = 15_000_000;
      const totalInterest = principal * (flatRateMo / 100) * 12;
      return {
        sliderLabel: isId
          ? "Bunga Promosi Flat Bulanan (Tenor 12 Bln)"
          : "Stated Monthly Flat Interest (12-Mo Tenor)",
        sliderDisplay: `${flatRateMo.toFixed(2)}% / ${isId ? "bln" : "mo"}`,
        min: 0.5,
        max: 3.0,
        step: 0.25,
        value: flatRateMo,
        primaryLabel: isId
          ? "Bunga Efektif Tahunan Sebenarnya (True APR)"
          : "True Effective Annual Interest (APR)",
        primaryVal: apr,
        primaryPrefix: "",
        primarySuffix: "% / yr",
        secondaryLabel: isId
          ? "Total Bunga Dibayar di Atas Pokok Rp15 Jt"
          : "Total Interest Paid Above IDR 15M Principal",
        secondaryText: `Rp ${Math.round(totalInterest).toLocaleString("id-ID")}`,
        verdictText: isId
          ? apr > 24
            ? "PERINGATAN BUNGA PREDATORIS: Bunga efektif riil hampir dua kali lipat angka promosi bulanan."
            : "BUNGA MODERAT: Pastikan cicilan tetap menjaga Total DSR OJK <= 30%."
          : apr > 24
            ? "PREDATORY APR ALERT: True annuity interest is nearly double the advertised monthly rate."
            : "MODERATE FINANCING: Ensure combined OJK Debt Service Ratio stays <= 30%.",
        danger: apr > 24,
        href: "/terminal/audit?track=cashflow",
      };
    }

    // Commission squeeze on UMKM (Price Rp50k, COGS Rp32k = 36% gross margin, Fixed Cost Rp9M)
    const price = 50_000;
    const cogs = 32_000;
    const fixed = 9_000_000;
    const netMarginUnit = Math.max(
      500,
      price - cogs - price * ((commissionPct + 0.5) / 100)
    );
    const bepUnits = Math.ceil(fixed / netMarginUnit);
    const baseBep = Math.ceil(fixed / (price - cogs));
    return {
      sliderLabel: isId
        ? "Komisi Aplikasi Pesan-Antar / Marketplace (+0,5% Pajak UMKM)"
        : "Delivery App / Marketplace Commission (+0.5% SME Tax)",
      sliderDisplay: `${commissionPct}%`,
      min: 0,
      max: 30,
      step: 2,
      value: commissionPct,
      primaryLabel: isId
        ? "Target Unit Wajib Terjual / Bulan untuk Impas (BEP)"
        : "Monthly Units Required to Break Even (BEP)",
      primaryVal: bepUnits,
      primaryPrefix: "",
      primarySuffix: " unit",
      secondaryLabel: isId
        ? `Margin Bersih / Porsi (BEP Tanpa Aplikasi: ${baseBep} unit)`
        : `Net Margin / Unit (Zero-Fee BEP: ${baseBep} units)`,
      secondaryText: `Rp ${Math.round(netMarginUnit).toLocaleString("id-ID")} / unit`,
      verdictText: isId
        ? bepUnits > baseBep * 1.8
          ? "MARGIN TERGERUS KOMISI: Volume penjualan wajib melonjak drastis hanya untuk membayar sewa tetap."
          : "STRUKTUR SEHAT: Margin per unit masih menyisakan ruang bernapas operasional."
        : bepUnits > baseBep * 1.8
          ? "COMMISSION SQUEEZE: Required unit volume surges dramatically just to cover fixed rent."
          : "HEALTHY MARGIN: Unit economics retain sufficient operational breathing room.",
      danger: bepUnits > baseBep * 1.8,
      href: "/terminal/audit?track=business",
    };
  }, [mode, drawdownPct, flatRateMo, commissionPct, isId]);

  return (
    <section className="mx-auto w-full max-w-6xl border-t border-hairline py-10 sm:py-14 md:py-16">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left Editorial Narrative */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cleared sm:text-[11px]">
            {isId
              ? "SIMULATOR HUKUM MATEMATIKA INTERAKTIF"
              : "INTERACTIVE MATHEMATICAL LAW SIMULATOR"}
          </span>
          <h2 className="font-editorial text-2xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-3xl md:text-4xl">
            {isId
              ? "Geser Satu Tuas. Lihat Bagaimana Asumsi Kecil Membesar Jadi Risiko."
              : "Drag One Lever. Watch Small Assumptions Compound Into Ruin."}
          </h2>
          <p className="font-sans text-xs leading-relaxed text-text-secondary sm:text-sm">
            {isId
              ? "Otak manusia berpikir secara linear, sedangkan kebangkrutan finansial bekerja secara non-linear. Uji langsung tiga jebakan matematis paling umum sebelum membuka workstation penuh."
              : "Human intuition thinks linearly, while financial ruin compounds non-linearly. Test the three most common mathematical traps live before launching the full workstation."}
          </p>

          <div className="flex flex-col gap-1.5 pt-1">
            {(
              [
                {
                  id: "drawdown",
                  title: isId
                    ? "01 · Hukum Asimetri Drawdown Trading"
                    : "01 · Drawdown Recovery Asymmetry",
                },
                {
                  id: "flat_apr",
                  title: isId
                    ? "02 · Jebakan Bunga Flat vs. Bunga Efektif (APR)"
                    : "02 · Flat-Rate Illusion vs. True Annual APR",
                },
                {
                  id: "commission",
                  title: isId
                    ? "03 · Efek Gerusan Komisi Aplikasi UMKM"
                    : "03 · Marketplace Commission BEP Squeeze",
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={cn(
                  "flex items-center justify-between rounded-sm border px-3.5 py-2.5 text-left font-mono text-xs transition-colors",
                  mode === tab.id
                    ? "border-cleared/50 bg-cleared/10 font-semibold text-cleared"
                    : "border-hairline bg-obsidian text-text-secondary hover:text-text-primary"
                )}
              >
                <span>{tab.title}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Tactile Calculator Console */}
        <div className="terminal-panel flex flex-col gap-5 rounded-md p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3">
            <span className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-primary">
              <SlidersHorizontal
                className="h-3.5 w-3.5 text-cleared"
                aria-hidden="true"
              />
              <span>{calc.sliderLabel}</span>
            </span>
            <span className="rounded-xs border border-hairline bg-obsidian px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-text-primary">
              {calc.sliderDisplay}
            </span>
          </div>

          <PrecisionSlider
            id="landing-law-slider"
            min={calc.min}
            max={calc.max}
            step={calc.step}
            value={calc.value}
            onValueChange={(val) => {
              if (mode === "drawdown") setDrawdownPct(val);
              else if (mode === "flat_apr") setFlatRateMo(val);
              else setCommissionPct(val);
            }}
            tone={calc.danger ? "rejected" : "cleared"}
            ariaLabel={calc.sliderLabel}
          />

          <div className="grid grid-cols-1 gap-4 border-y border-hairline py-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs text-text-secondary">
                {calc.primaryLabel}
              </span>
              <span
                className={cn(
                  "font-mono text-3xl font-bold tabular-nums sm:text-4xl",
                  calc.danger ? "text-rejected" : "text-cleared"
                )}
              >
                <NumberFlow
                  value={Number(calc.primaryVal.toFixed(1))}
                  prefix={calc.primaryPrefix}
                  suffix={calc.primarySuffix}
                />
              </span>
            </div>

            <div className="flex flex-col justify-between gap-1 border-t border-hairline pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
              <span className="font-sans text-xs text-text-secondary">
                {calc.secondaryLabel}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums text-text-primary">
                {calc.secondaryText}
              </span>
            </div>
          </div>

          {/* Real Mathematical Risk Escalation Meter */}
          {(() => {
            const metricPct =
              mode === "drawdown"
                ? Math.min(100, Math.round((calc.primaryVal / 300) * 100))
                : mode === "flat_apr"
                  ? Math.min(100, Math.round((calc.primaryVal / 65) * 100))
                  : Math.min(100, Math.round(((calc.primaryVal - 500) / 1400) * 100));
            const barWidth = Math.max(8, Math.min(100, metricPct));
            const metricBadge =
              mode === "drawdown"
                ? `${(calc.primaryVal / 100).toFixed(1)}× modal tersisa`
                : mode === "flat_apr"
                  ? `${calc.primaryVal.toFixed(1)}% APR`
                  : `+${calc.primaryVal.toLocaleString("id-ID")} unit BEP`;
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[10.5px] text-text-muted">
                  <span>{isId ? "Zona Aman" : "Safe Zone"}</span>
                  <span>
                    {isId ? "Beban Matematis:" : "Math Burden:"}{" "}
                    <strong className={calc.danger ? "text-rejected" : "text-cleared"}>
                      {metricBadge}
                    </strong>
                  </span>
                  <span>{isId ? "Zona Bahaya" : "Danger Zone"}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-obsidian">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      calc.danger
                        ? "bg-gradient-to-r from-amber-500 to-rose-500"
                        : "bg-gradient-to-r from-emerald-500 to-amber-400"
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p
              className={cn(
                "font-mono text-[11px] leading-relaxed",
                calc.danger ? "text-conditional" : "text-cleared"
              )}
            >
              {calc.verdictText}
            </p>

            <Link
              href={calc.href}
              className="cta-primary-polish inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-sm bg-cleared px-4 font-mono text-[11px] font-semibold whitespace-nowrap uppercase tracking-wider text-on-cleared"
            >
              <span>{isId ? "Uji Rencana Asli" : "Audit Real Plan"}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
