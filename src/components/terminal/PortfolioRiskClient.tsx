"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Flame,
  Info,
  Network,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { FormattedNumberInput } from "@/components/workspace/FormattedNumberInput";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  buildDeterministicFallbackCloses,
  computePortfolioRisk,
} from "@/lib/quant/portfolioRisk";
import { cn } from "@/lib/utils";

const Portfolio3DSurface = dynamic(
  () => import("@/components/terminal/Portfolio3DSurface"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] w-full items-center justify-center sm:h-[260px]">
        <span className="font-mono text-xs tracking-wider text-text-muted">
          Memuat Permukaan Kovariansi 3D...
        </span>
      </div>
    ),
  }
);

interface HoldingRow {
  symbol: string;
  weightPct: number;
}

const PORTFOLIO_TEMPLATES: readonly {
  id: string;
  labelId: string;
  labelEn: string;
  rows: HoldingRow[];
}[] = [
  {
    id: "balanced-id",
    labelId: "Barbell Saham + Emas + BTC",
    labelEn: "IDX + Gold + BTC Barbell",
    rows: [
      { symbol: "BBCA.JK", weightPct: 30 },
      { symbol: "BMRI.JK", weightPct: 25 },
      { symbol: "TLKM.JK", weightPct: 20 },
      { symbol: "BTC-USD", weightPct: 15 },
      { symbol: "GC=F", weightPct: 10 },
    ],
  },
  {
    id: "banking-heavy",
    labelId: "Konsentrasi Bank Big-4 BEI",
    labelEn: "IDX Big-4 Banks (High Corr)",
    rows: [
      { symbol: "BBCA.JK", weightPct: 35 },
      { symbol: "BBRI.JK", weightPct: 30 },
      { symbol: "BMRI.JK", weightPct: 25 },
      { symbol: "ASII.JK", weightPct: 10 },
    ],
  },
  {
    id: "defensive",
    labelId: "Defensif Lindung Nilai",
    labelEn: "Defensive Safe-Haven",
    rows: [
      { symbol: "GC=F", weightPct: 45 },
      { symbol: "BBCA.JK", weightPct: 35 },
      { symbol: "TLKM.JK", weightPct: 20 },
    ],
  },
];

const CRASH_SCENARIOS = [
  { id: "normal", labelId: "Kondisi Normal", labelEn: "Normal Market", shockMult: 1 },
  { id: "ihsg-dip", labelId: "IHSG Koreksi (2× VaR)", labelEn: "IDX Selloff (2× VaR)", shockMult: 2 },
  { id: "liquidity-crisis", labelId: "Krisis Likuiditas (3,5× VaR)", labelEn: "Liquidity Crisis (3.5× VaR)", shockMult: 3.5 },
] as const;

const QUICK_ADD_SYMBOLS = [
  "BBRI.JK",
  "ASII.JK",
  "NVDA",
  "ETH-USD",
] as const;

export function PortfolioRiskClient() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { queuePrefillInput } = useAuditUI();
  const isId = locale === "id";

  const [totalCapitalRp, setTotalCapitalRp] = useState<number>(100_000_000);
  const [holdings, setHoldings] = useState<HoldingRow[]>(
    PORTFOLIO_TEMPLATES[0]!.rows
  );
  const [crashId, setCrashId] = useState<string>("normal");
  const [newTicker, setNewTicker] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [seriesMap, setSeriesMap] = useState<
    Record<
      string,
      { closes: number[]; timestamps?: number[]; source: "live" | "fallback" }
    >
  >(() => {
    const init: Record<
      string,
      { closes: number[]; timestamps?: number[]; source: "live" | "fallback" }
    > = {};
    for (const h of PORTFOLIO_TEMPLATES[0]!.rows) {
      init[h.symbol] = {
        closes: buildDeterministicFallbackCloses(h.symbol),
        source: "fallback",
      };
    }
    return init;
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const syncHistoricalCloses = useCallback(async (symbols: string[]) => {
    setIsSyncing(true);
    const updates: Record<
      string,
      { closes: number[]; timestamps?: number[]; source: "live" | "fallback" }
    > = {};
    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(
            `/api/history?symbol=${encodeURIComponent(sym)}`
          );
          if (!res.ok) {
            updates[sym] = {
              closes: buildDeterministicFallbackCloses(sym),
              source: "fallback",
            };
            return;
          }
          const data = (await res.json()) as {
            bars?: { time: number; close: number }[];
          };
          if (data.bars && data.bars.length >= 10) {
            updates[sym] = {
              closes: data.bars.map((b) => b.close),
              timestamps: data.bars.map((b) => b.time),
              source: "live",
            };
          } else {
            updates[sym] = {
              closes: buildDeterministicFallbackCloses(sym),
              source: "fallback",
            };
          }
        } catch {
          updates[sym] = {
            closes: buildDeterministicFallbackCloses(sym),
            source: "fallback",
          };
        }
      })
    );
    setSeriesMap((prev) => ({ ...prev, ...updates }));
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const tId = setTimeout(() => {
      void syncHistoricalCloses(
        PORTFOLIO_TEMPLATES[0]!.rows.map((h) => h.symbol)
      );
    }, 0);
    return () => clearTimeout(tId);
  }, [syncHistoricalCloses]);

  const report = useMemo(() => {
    const inputs = holdings.map((h) => {
      const entry = seriesMap[h.symbol];
      return {
        symbol: h.symbol,
        weightPct: h.weightPct,
        closes: entry?.closes ?? buildDeterministicFallbackCloses(h.symbol),
        timestamps: entry?.timestamps,
        isSimulated: !entry || entry.source === "fallback",
      };
    });
    return computePortfolioRisk(inputs, totalCapitalRp);
  }, [holdings, seriesMap, totalCapitalRp]);

  const activeCrash =
    CRASH_SCENARIOS.find((c) => c.id === crashId) ?? CRASH_SCENARIOS[0];
  const stressedLossRp = Math.min(
    totalCapitalRp,
    Math.round(report.monthlyVar95Rp * activeCrash.shockMult)
  );
  const survivingCapitalRp = Math.max(0, totalCapitalRp - stressedLossRp);

  const handleApplyTemplate = (tpl: (typeof PORTFOLIO_TEMPLATES)[number]) => {
    setHoldings(tpl.rows);
    void syncHistoricalCloses(tpl.rows.map((r) => r.symbol));
    toast.info(
      isId ? `Template "${tpl.labelId}" dimuat.` : `Loaded "${tpl.labelEn}".`
    );
  };

  const handleAddSymbol = (rawSym?: string) => {
    const sym = (rawSym ?? newTicker).trim().toUpperCase();
    if (!sym) return;
    if (holdings.length >= 6) {
      toast.error(isId ? "Maksimal 6 aset simultan." : "Maximum 6 assets.");
      return;
    }
    if (holdings.some((h) => h.symbol === sym)) {
      toast.info(
        isId ? "Aset sudah ada di portofolio." : "Asset already in portfolio."
      );
      return;
    }
    setHoldings((prev) => [...prev, { symbol: sym, weightPct: 15 }]);
    setNewTicker("");
    void syncHistoricalCloses([sym]);
  };

  const handleApplyRiskParity = () => {
    setHoldings((prev) =>
      prev.map((h) => {
        const found = report.assetProfiles.find((p) => p.symbol === h.symbol);
        return {
          ...h,
          weightPct: found
            ? Math.max(1, Math.round(found.suggestedRiskParityWeightPct))
            : h.weightPct,
        };
      })
    );
    toast.success(
      isId
        ? "Bobot seimbang Inverse-Volatility (Risk Parity) diterapkan!"
        : "Applied Inverse-Volatility Risk Parity weights!"
    );
  };

  const handleAuditLargestHolding = () => {
    const largest = [...holdings].sort((a, b) => b.weightPct - a.weightPct)[0];
    if (!largest) return;
    const entry = seriesMap[largest.symbol];
    const closes = entry?.closes;
    const lastPrice =
      closes && closes.length > 0 ? closes[closes.length - 1]! : 9_000;
    queuePrefillInput("trading", {
      asset_symbol: largest.symbol,
      direction: "LONG",
      total_capital: totalCapitalRp,
      position_size_pct: Math.min(100, Math.max(5, largest.weightPct)),
      entry_price: Math.round(lastPrice),
      take_profit: Math.round(lastPrice * 1.09),
      stop_loss: Math.round(lastPrice * 0.955),
      round_trip_fee_pct: largest.symbol.endsWith(".JK") ? 0.4 : 0.2,
      rationale: `Audit bobot portofolio terbesar (${largest.symbol} ${largest.weightPct}%).`,
    });
    router.push("/terminal/audit?track=trading");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cleared/40 bg-cleared/12 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared">
            <Network className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId
                ? "MATRIKS KORELASI PEARSON 90 HARI · VAR 95% · CVAR"
                : "90-DAY PEARSON CORRELATION · 95% VAR · EXPECTED SHORTFALL"}
            </span>
          </span>
          <h2 className="mt-2.5 font-editorial text-2xl font-medium text-text-primary sm:text-4xl">
            {isId
              ? "Audit Risiko Portofolio & Konsentrasi Tersembunyi."
              : "Multi-Asset Portfolio Risk & Hidden Concentration Audit."}
          </h2>
          <p className="mt-1.5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-text-secondary sm:text-[15px]">
            {isId
              ? "Banyak investor mengira sudah terdiversifikasi, padahal saham-sahamnya jatuh serempak saat koreksi. Ukur korelasi nyata dan batas rugi portofolio Anda."
              : "Uncover hidden sector lockstep across your holdings, balance weights via Risk Parity, and stress-test tail Value-at-Risk."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:shrink-0">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className={cn(
              "inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border px-3 font-sans text-xs font-semibold whitespace-nowrap transition-colors",
              showGuide
                ? "border-cleared/60 bg-cleared/16 text-cleared"
                : "border-hairline bg-surface text-text-secondary hover:border-active-border hover:text-text-primary"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? "Cara Pakai" : "Guide"}</span>
          </button>

          <button
            type="button"
            disabled={isSyncing}
            onClick={() =>
              void syncHistoricalCloses(holdings.map((h) => h.symbol))
            }
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 font-sans text-xs font-semibold whitespace-nowrap text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")}
              aria-hidden="true"
            />
            <span>{isId ? "Sinkron Pasar" : "Sync Market"}</span>
          </button>

          <button
            type="button"
            onClick={handleApplyRiskParity}
            className="cta-primary-polish inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg bg-cleared px-3.5 font-sans text-xs font-bold whitespace-nowrap text-on-cleared"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId ? "Seimbangkan Bobot" : "Auto Risk-Parity"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleAuditLargestHolding}
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-cleared/45 bg-cleared/12 px-3 font-sans text-xs font-bold whitespace-nowrap text-cleared hover:bg-cleared/20"
          >
            <span>{isId ? "Audit Terbesar" : "Audit Top"}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Collapsible Beginner Guide */}
      {showGuide && (
        <SpotlightCard tone="sky" className="gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-sky-400">
              <Info className="h-4 w-4" aria-hidden="true" />
              <span>
                {isId
                  ? "Cara Membaca Risiko Portofolio & Korelasi (Untuk Pemula)"
                  : "Beginner Guide to Portfolio Correlation & VaR"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="font-mono text-xs text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-hairline bg-obsidian/85 p-3">
              <span className="font-mono text-[11px] font-bold text-cleared">
                01 · CEK ANGKA MERAH (≥ 0.68)
              </span>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {isId
                  ? "Jika dua saham bernilai ≥ 0.68 (merah), artinya keduanya bergerak serempak. Saat satu jatuh, yang lain ikut jatuh."
                  : "Pairs >= 0.68 (red) move in lockstep—holding both gives an illusion of diversification."}
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-obsidian/85 p-3">
              <span className="font-mono text-[11px] font-bold text-sky-400">
                02 · SEIMBANGKAN BOBOT
              </span>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {isId
                  ? "Klik 'Seimbangkan Bobot' agar aset yang fluktuasinya liar (mis. Kripto) otomatis diberi porsi lebih kecil dibanding aset stabil (Emas/Blue-chip)."
                  : "Click 'Auto Risk-Parity' to size volatile assets smaller and stabilize total portfolio drawdown."}
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-obsidian/85 p-3">
              <span className="font-mono text-[11px] font-bold text-conditional">
                03 · UJI KRISIS 2× – 3,5× VAR
              </span>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {isId
                  ? "Klik tombol Uji Krisis untuk melihat berapa sisa modal Anda jika IHSG tiba-tiba koreksi tajam atau terjadi krisis likuiditas."
                  : "Use Crash Test buttons to see surviving capital under severe 2x–3.5x tail shocks."}
              </p>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* 1-Click Portfolio Templates + Market Crash Simulator */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-hairline bg-obsidian/80 p-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-xs font-bold text-text-secondary">
            {isId ? "Contoh Portofolio:" : "Templates:"}
          </span>
          {PORTFOLIO_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="rounded-md border border-hairline bg-surface px-3 py-1.5 font-sans text-xs font-semibold text-text-primary transition-colors hover:border-cleared/50 hover:text-cleared"
            >
              {isId ? tpl.labelId : tpl.labelEn}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-conditional">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? "Uji Krisis:" : "Crash Test:"}</span>
          </span>
          {CRASH_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setCrashId(sc.id)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 font-sans text-xs font-semibold transition-colors",
                crashId === sc.id
                  ? "border-conditional/55 bg-conditional/16 text-conditional"
                  : "border-hairline bg-surface text-text-secondary hover:text-text-primary"
              )}
            >
              {isId ? sc.labelId : sc.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Institutional VaR & Volatility Readouts */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <SpotlightCard tone="amber" className="p-4 sm:p-5">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary">
            <span>
              {isId ? "Batas Rugi Wajar Harian (VaR 95%)" : "Daily 95% VaR"}
            </span>
            <InfoTooltip
              content={
                isId
                  ? "Value-at-Risk 95%: estimasi kerugian maksimal dalam 1 hari bursa pada 95% kondisi pasar normal."
                  : "Daily Value-at-Risk at 95% confidence under normal market volatility."
              }
            />
          </span>
          <span className="mt-1.5 block truncate font-mono text-lg font-bold tabular-nums text-conditional sm:text-2xl">
            -Rp {report.parametricVar95DailyRp.toLocaleString("id-ID")}
          </span>
          <span className="mt-0.5 block font-mono text-xs text-text-muted">
            -{report.parametricVar95DailyPct.toFixed(2)}% / hari
          </span>
        </SpotlightCard>

        <SpotlightCard tone="crimson" className="p-4 sm:p-5">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary">
            <span>
              {isId
                ? "Rata-Rata Rugi Hari Ekstrem (CVaR 95%)"
                : "95% Tail Shortfall (CVaR)"}
            </span>
            <InfoTooltip
              content={
                isId
                  ? "Conditional VaR (Expected Shortfall): rata-rata kerugian saat pasar benar-benar mengalami 5% hari terburuk."
                  : "Average loss incurred during the worst 5% tail-risk market days."
              }
            />
          </span>
          <span className="mt-1.5 block truncate font-mono text-lg font-bold tabular-nums text-rejected sm:text-2xl">
            -Rp {report.historicalCvar95DailyRp.toLocaleString("id-ID")}
          </span>
          <span className="mt-0.5 block font-mono text-xs text-text-muted">
            -{report.historicalCvar95DailyPct.toFixed(2)}% tail avg
          </span>
        </SpotlightCard>

        <SpotlightCard
          tone={activeCrash.shockMult > 1 ? "crimson" : "sky"}
          className="p-4 sm:p-5"
        >
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary">
            <span>
              {isId
                ? `Estimasi Modal Bertahan (${activeCrash.labelId})`
                : `Surviving Capital (${activeCrash.labelEn})`}
            </span>
            <InfoTooltip
              content={
                isId
                  ? "Sisa nilai portofolio Anda setelah terkena skenario tekanan krisis yang dipilih di atas."
                  : "Estimated remaining portfolio equity under the selected crash test."
              }
            />
          </span>
          <span className="mt-1.5 block truncate font-mono text-lg font-bold tabular-nums text-text-primary sm:text-2xl">
            Rp {survivingCapitalRp.toLocaleString("id-ID")}
          </span>
          <span className="mt-0.5 block font-mono text-xs text-rejected">
            Drawdown -Rp {stressedLossRp.toLocaleString("id-ID")}
          </span>
        </SpotlightCard>

        <SpotlightCard tone="emerald" className="p-4 sm:p-5">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary">
            <span>
              {isId
                ? "Redaman Risiko berkat Diversifikasi"
                : "Diversification Benefit"}
            </span>
            <InfoTooltip
              content={
                isId
                  ? "Berapa persen gejolak portofolio Anda berkurang karena memiliki aset yang tidak bergerak searah (mis. Emas vs Saham)."
                  : "Percentage reduction in portfolio volatility achieved by combining uncorrelated assets."
              }
            />
          </span>
          <span className="mt-1.5 block truncate font-mono text-lg font-bold tabular-nums text-cleared sm:text-2xl">
            -{report.diversificationBenefitPct.toFixed(1)}% Vol
          </span>
          <span className="mt-0.5 block font-mono text-xs text-text-muted">
            Port Vol: {report.portfolioAnnualizedVolPct.toFixed(1)}% / yr
          </span>
        </SpotlightCard>
      </div>

      {/* Honest Simulated / Fallback Data Notice */}
      {report.hasSimulatedAssets && (
        <div className="flex items-start gap-3 rounded-xl border border-conditional/45 bg-conditional/10 p-3.5 font-sans text-xs text-conditional">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="text-text-secondary">
            <strong className="font-semibold text-conditional">
              {isId
                ? "Data Simulasi (Cadangan) Aktif: "
                : "Simulated Fallback Data Active: "}
            </strong>
            {isId
              ? "Sebagian atau seluruh aset sedang menggunakan seri harga simulasi cadangan karena data historis pasar belum tersedia/sedang disinkronkan. Angka korelasi & VaR bersifat ilustratif hingga aset berlabel 'Pasar Nyata'."
              : "Some or all assets are using deterministic simulated fallback series because live historical bars are unavailable or syncing. Correlation & VaR are illustrative until labeled 'Live Market'."}
          </div>
        </div>
      )}

      {/* Concentration Warning if correlated pairs >= 0.68 exist */}
      {report.highCorrelationPairs.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rejected/45 bg-rejected/12 p-4 font-sans text-[13px] text-rejected">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <strong className="font-bold">
              {report.hasSimulatedAssets
                ? isId
                  ? "Indikasi Korelasi Simulasi (Bukan Data Pasar Nyata): "
                  : "Simulated Correlation Notice (Not Live Market Data): "
                : isId
                  ? "Peringatan Konsentrasi Sektor Tersembunyi: "
                  : "Hidden Sector Concentration Alert: "}
            </strong>
            <span className="text-text-primary">
              {report.highCorrelationPairs
                .map(
                  (p) =>
                    `${p.assetA} ↔ ${p.assetB} (korelasi ρ = ${p.correlation.toFixed(2)})`
                )
                .join(", ")}
              .{" "}
              {report.hasSimulatedAssets
                ? isId
                  ? "Nilai ini berasal dari data simulasi cadangan. Klik 'Sinkron Pasar' untuk menghitung dari data historis nyata."
                  : "These figures come from simulated fallback series. Click 'Sync Market' to compute from live historical prices."
                : isId
                  ? "Aset-aset ini bergerak hampir searah sehingga jika pasar jatuh, keduanya turun bersamaan. Tambahkan aset lindung nilai seperti Emas (GC=F)."
                  : "These holdings move in lockstep during selloffs. Consider balancing with uncorrelated hedges such as Gold (GC=F)."}
            </span>
          </div>
        </div>
      )}

      {/* Split: Left Holdings Editor + Right Heatmap & 3D Surface */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <SpotlightCard tone="emerald" className="gap-4 p-5 xl:col-span-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="port-capital"
              className="font-sans text-[13px] font-semibold text-text-primary"
            >
              {isId ? "Total Nilai Portofolio (Rp)" : "Total Portfolio Value (IDR)"}
            </label>
            <FormattedNumberInput
              id="port-capital"
              prefix="Rp"
              value={totalCapitalRp}
              onChange={(v) => setTotalCapitalRp(Math.max(1_000_000, v))}
            />
          </div>

          <div className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-obsidian/90">
            {holdings.map((h, idx) => {
              const prof = report.assetProfiles[idx];
              return (
                <div
                  key={h.symbol}
                  className="flex items-center justify-between gap-3 px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-text-primary">
                        {h.symbol}
                      </span>
                      <span
                        className={cn(
                          "rounded-xs border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                          prof?.isSimulated
                            ? "border-conditional/45 bg-conditional/10 text-conditional"
                            : "border-cleared/45 bg-cleared/10 text-cleared"
                        )}
                      >
                        {prof?.isSimulated
                          ? isId
                            ? "Simulasi"
                            : "Simulated"
                          : isId
                            ? "Pasar Nyata"
                            : "Live"}
                      </span>
                    </div>
                    <span className="font-sans text-xs text-text-muted">
                      Vol {prof ? `${prof.annualizedVolPct.toFixed(1)}%` : "--"} ·{" "}
                      {isId ? "Porsi Riil" : "Actual"}{" "}
                      {prof ? `${prof.normalizedWeightPct.toFixed(0)}%` : "--"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-28">
                      <FormattedNumberInput
                        id={`port-weight-${h.symbol}`}
                        suffix="%"
                        value={h.weightPct}
                        onChange={(val) =>
                          setHoldings((prev) =>
                            prev.map((item) =>
                              item.symbol === h.symbol
                                ? { ...item, weightPct: Math.max(1, val) }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    {holdings.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setHoldings((prev) =>
                            prev.filter((item) => item.symbol !== h.symbol)
                          )
                        }
                        aria-label={`Remove ${h.symbol}`}
                        className="rounded-md p-2 text-text-muted transition-colors hover:bg-rejected/12 hover:text-rejected"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Ticker */}
          <div className="flex flex-col gap-2.5 border-t border-hairline pt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSymbol();
                  }
                }}
                placeholder={
                  isId
                    ? "Ketik kode saham / kripto (mis. BBRI.JK)"
                    : "Add ticker (e.g. BBRI.JK)"
                }
                className="min-h-[42px] flex-1 rounded-lg border border-hairline bg-input px-3.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-cleared/65 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddSymbol()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-cleared/50 bg-cleared/14 px-4 font-sans text-xs font-bold text-cleared hover:bg-cleared/22"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{isId ? "Tambah" : "Add"}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_ADD_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleAddSymbol(sym)}
                  className="rounded-md border border-hairline bg-obsidian px-2.5 py-1 font-mono text-xs font-medium text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
                >
                  + {sym}
                </button>
              ))}
            </div>
          </div>
        </SpotlightCard>

        {/* Right: N x N Heatmap + 3D Surface */}
        <div className="flex flex-col gap-5 xl:col-span-7">
          <SpotlightCard tone="sky" className="overflow-x-auto p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-sans text-sm font-bold text-text-primary">
                {isId
                  ? "Matriks Korelasi Pergerakan Harian (-1.00 s/d +1.00)"
                  : "Daily Return Correlation Matrix (-1.00 to +1.00)"}
              </span>
              <span className="font-sans text-xs text-text-muted">
                {isId
                  ? "Merah (≥ 0.68) = jatuh bareng · Hijau (≤ 0.15) = saling mengimbangi"
                  : "Red (≥ 0.68) = lockstep · Green (≤ 0.15) = true diversifier"}
              </span>
            </div>

            <table className="w-full border-collapse font-mono text-[13px] tabular-nums">
              <thead>
                <tr>
                  <th className="p-2.5 text-left font-sans text-xs text-text-muted">
                    ASET
                  </th>
                  {report.symbols.map((sym) => (
                    <th
                      key={sym}
                      className="p-2.5 text-center text-xs font-bold text-text-secondary"
                    >
                      {sym.replace(".JK", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.matrix.map((row, rIdx) => (
                  <tr key={report.symbols[rIdx]}>
                    <td className="p-2.5 font-bold text-text-primary">
                      {report.symbols[rIdx]}
                    </td>
                    {row.map((corr, cIdx) => {
                      const isDiag = rIdx === cIdx;
                      const cellCls = isDiag
                        ? "bg-sky-400/16 text-sky-400"
                        : corr >= 0.68
                          ? "bg-rejected/22 font-bold text-rejected"
                          : corr <= 0.15
                            ? "bg-cleared/16 font-semibold text-cleared"
                            : "bg-obsidian/90 text-text-secondary";
                      return (
                        <td
                          key={`${rIdx}-${cIdx}`}
                          className={cn(
                            "border border-hairline p-2.5 text-center",
                            cellCls
                          )}
                        >
                          {corr.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </SpotlightCard>

          <SpotlightCard tone="emerald" className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-hairline bg-obsidian/90 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 font-sans text-sm font-bold text-text-primary">
                <span>
                  {isId
                    ? "Topografi Kovariansi 3D (Geser 360°)"
                    : "3D Covariance Elevation Surface (Drag 360°)"}
                </span>
                <InfoTooltip
                  content={
                    isId
                      ? "Menara tinggi berwarna merah menandakan dua aset bergerak hampir identik (bahaya konsentrasi). Menara hijau rendah berarti aset saling mengimbangi."
                      : "Tall crimson towers indicate lockstep concentration; low emerald towers mean healthy diversification."
                  }
                />
              </span>
              <span className="font-mono text-xs text-cleared">THREE.JS</span>
            </div>
            <div className="bg-blueprint-grid">
              <Portfolio3DSurface
                matrix={report.matrix}
                symbols={report.symbols}
              />
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
