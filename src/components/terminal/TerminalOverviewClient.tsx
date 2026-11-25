"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookMarked,
  Boxes,
  Briefcase,
  CheckCircle2,
  Compass,
  FileSpreadsheet,
  Flame,
  GitCompare,
  Globe2,
  Network,
  Orbit,
  Play,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { SpotlightCard, type SpotlightTone } from "@/components/ui/SpotlightCard";
import { AuditHistoryPanel } from "@/components/workspace/AuditHistoryPanel";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  clearAuditHistory,
  computeCalibrationMetrics,
  loadAuditHistory,
  type AuditHistoryEntry,
} from "@/lib/auditHistory";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const MacroRegime3DRadar = dynamic(
  () => import("@/components/terminal/MacroRegime3DRadar"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[242px] w-full items-center justify-center">
        <span className="font-mono text-xs tracking-wider text-text-muted">
          Memuat Tensor 3D...
        </span>
      </div>
    ),
  }
);

const HermesMacroGlobe = dynamic(
  () => import("@/components/terminal/HermesMacroGlobe"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[296px] w-full items-center justify-center">
        <span className="font-mono text-xs tracking-wider text-text-muted">
          Memuat Globe Makro 3D...
        </span>
      </div>
    ),
  }
);

export interface TerminalOverviewClientProps {
  macroContext: MarketContext;
}

interface QuickPlaybook {
  id: string;
  track: AuditTrack;
  badgeId: string;
  badgeEn: string;
  expectedBadge: string;
  titleId: string;
  titleEn: string;
  summaryId: string;
  summaryEn: string;
  tone: SpotlightTone;
  payload: Record<string, unknown>;
}

const QUICK_PLAYBOOKS: readonly QuickPlaybook[] = [
  {
    id: "fomo-idx",
    track: "trading",
    badgeId: "Trading Saham BEI",
    badgeEn: "IDX Stock Setup",
    expectedBadge: "~42/100 · Jebakan FOMO",
    titleId: "FOMO Tangkap Pisau Jatuh Saat IHSG Merah",
    titleEn: "FOMO Buying Dip During IDX Sell-Off",
    summaryId:
      "Modal Rp25 Juta, masuk 45% posisi dengan R:R terbalik 1:0,85 tanpa menghitung fee sekuritas.",
    summaryEn:
      "Rp25M capital, 45% position size with inverted 1:0.85 R:R ignoring round-trip broker fees.",
    tone: "crimson",
    payload: {
      asset_symbol: "BBCA.JK",
      direction: "LONG",
      total_capital: 25_000_000,
      position_size_pct: 45,
      entry_price: 9_150,
      take_profit: 9_450,
      stop_loss: 8_800,
      round_trip_fee_pct: 0.4,
      rationale: "Mengejar pantulan cepat saham perbankan saat IHSG terkoreksi.",
    },
  },
  {
    id: "ruko-kopi",
    track: "business",
    badgeId: "Ekspansi UMKM",
    badgeEn: "SME Expansion",
    expectedBadge: "~50/100 · Uji BEP",
    titleId: "Sewa Ruko Kedai Kopi Rp14,5 Juta / Bulan",
    titleEn: "Rp14.5M/Mo Coffee Shop Retail Lease",
    summaryId:
      "Uji apakah modal Rp65 Juta sanggup bertahan melewati 3 bulan pembukaan yang masih sepi pembeli.",
    summaryEn:
      "Test whether Rp65M capital survives the 3-month opening ramp-up burn before break-even.",
    tone: "amber",
    payload: {
      initial_capital: 65_000_000,
      monthly_fixed_cost: 14_500_000,
      selling_price: 28_000,
      unit_cogs: 11_500,
      target_monthly_units: 950,
      platform_commission_pct: 18,
      include_umkm_tax: true,
      business_concept: "Kedai Kopi & Pastry Sewa Ruko + Aplikasi Delivery 18%",
    },
  },
  {
    id: "paylater-apr",
    track: "cashflow",
    badgeId: "Utang & Arus Kas",
    badgeEn: "Household Debt",
    expectedBadge: "~20/100 · APR ~37%",
    titleId: "Cicilan Gadget / PayLater Bunga Flat 1,75%/Bln",
    titleEn: "1.75%/Mo Flat-Rate PayLater Installment",
    summaryId:
      "Bongkar konversi bunga flat bulanan menjadi Bunga Efektif ~37%/thn dan cek batas aman DSR OJK 30%.",
    summaryEn:
      "Expose how 1.75%/mo flat interest translates to ~37% Effective APR against OJK's 30% DSR cap.",
    tone: "crimson",
    payload: {
      monthly_net_income: 12_500_000,
      current_monthly_expenses: 7_200_000,
      existing_debt_installment: 1_800_000,
      new_monthly_installment: 2_450_000,
      installment_months: 12,
      flat_interest_pct_per_month: 1.75,
      liquid_emergency_fund: 15_000_000,
      decision_purpose: "Cicilan Laptop & Gadget Kerja via PayLater 12 Bulan",
    },
  },
  {
    id: "swing-disiplin",
    track: "trading",
    badgeId: "Benchmark Sehat",
    badgeEn: "Healthy Benchmark",
    expectedBadge: "~95/100 · Lolos Veto",
    titleId: "Swing Saham Disiplin Aturan Risiko 1,5% Modal",
    titleEn: "Disciplined 1.5% Risk-Capped Swing Setup",
    summaryId:
      "Contoh struktur sehat: R:R bersih > 1:2,2 setelah fee broker dan jarak Stop-Loss aman di luar noise.",
    summaryEn:
      "Reference institutional setup: Net R:R > 1:2.2 after fees with Stop-Loss safely outside noise.",
    tone: "emerald",
    payload: {
      asset_symbol: "BMRI.JK",
      direction: "LONG",
      total_capital: 50_000_000,
      position_size_pct: 22,
      entry_price: 6_200,
      take_profit: 6_950,
      stop_loss: 5_850,
      round_trip_fee_pct: 0.4,
      rationale: "Akumulasi bertahap di area support mingguan dengan batas risiko ketat.",
    },
  },
];

function MacroSparkline({
  points,
  positive,
}: {
  points: readonly number[];
  positive: boolean;
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 64;
      const y = 18 - ((v - min) / span) * 14;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 64 22"
      aria-hidden="true"
      className={cn(
        "h-5 w-16 shrink-0",
        positive ? "text-cleared" : "text-rejected"
      )}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export function TerminalOverviewClient({
  macroContext,
}: TerminalOverviewClientProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const { liveRiskSnapshot, queuePrefillInput } = useAuditUI();
  const [entries, setEntries] = useState<AuditHistoryEntry[]>([]);
  const [visualMode, setVisualMode] = useState<"globe" | "tensor">("globe");

  useEffect(() => {
    const tId = setTimeout(() => setEntries(loadAuditHistory()), 0);
    return () => clearTimeout(tId);
  }, []);

  const calibration = useMemo(
    () => computeCalibrationMetrics(entries),
    [entries]
  );

  const isId = locale === "id";
  const regime = macroContext.synthesis.macro_regime;
  const macroSummary =
    locale === "en"
      ? macroContext.synthesis.summary_en
      : macroContext.synthesis.summary_id;
  const macroAlert =
    locale === "en"
      ? macroContext.synthesis.key_risk_alert_en
      : macroContext.synthesis.key_risk_alert_id;

  const regimeCardTone: SpotlightTone =
    regime === "RISK_OFF"
      ? "crimson"
      : regime === "CAUTIOUS"
        ? "amber"
        : "emerald";

  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;

  const macroCards = [
    {
      label: "USD / IDR",
      sub: isId ? "Kurs Rupiah" : "FX Spot",
      value: `Rp ${Math.round(USD_IDR.price).toLocaleString("id-ID")}`,
      delta:
        USD_IDR.change_pct === 0 &&
        (USD_IDR.source === "frankfurter" || USD_IDR.source === "emergency")
          ? "—"
          : `${USD_IDR.change_pct >= 0 ? "+" : ""}${USD_IDR.change_pct.toFixed(2)}%`,
      positive: USD_IDR.change_pct <= 0.25,
      tone:
        USD_IDR.change_pct > 0.3 ? "text-conditional" : "text-text-primary",
      spark: [18120, 18175, 18210, 18205, 18240, 18263],
      auditHref: "/terminal/audit?track=business",
      auditLabel: isId ? "Uji HPP Impor" : "Test COGS",
    },
    {
      label: "IHSG (IDX)",
      sub: isId ? "Bursa Indonesia" : "Jakarta Comp.",
      value: IHSG.price.toLocaleString("id-ID", { maximumFractionDigits: 2 }),
      delta: `${IHSG.change_pct >= 0 ? "+" : ""}${IHSG.change_pct.toFixed(2)}%`,
      positive: IHSG.change_pct >= 0,
      tone: IHSG.change_pct >= 0 ? "text-cleared" : "text-rejected",
      spark: [5240, 5215, 5202, 5185, 5168, 5146],
      auditHref: "/terminal/audit?track=trading&symbol=BBCA.JK",
      auditLabel: isId ? "Cek BBCA.JK" : "Audit BBCA.JK",
    },
    {
      label: "EMAS (XAU)",
      sub: isId ? "Lindung Nilai" : "Safe-Haven",
      value: `$${Math.round(GOLD_USD.price).toLocaleString("en-US")}`,
      delta:
        GOLD_USD.change_pct === 0 &&
        (GOLD_USD.source === "gold-api" || GOLD_USD.source === "emergency")
          ? "—"
          : `${GOLD_USD.change_pct >= 0 ? "+" : ""}${GOLD_USD.change_pct.toFixed(2)}%`,
      positive: GOLD_USD.change_pct >= 0,
      tone: GOLD_USD.change_pct >= 0 ? "text-cleared" : "text-text-primary",
      spark: [3490, 3505, 3518, 3524, 3531, 3539],
      auditHref: "/terminal/audit?track=trading&symbol=GC=F",
      auditLabel: isId ? "Cek Emas GC=F" : "Audit Gold",
    },
    {
      label: "BTC / USD",
      sub: isId ? "Aset Berisiko" : "Risk Proxy",
      value: `$${Math.round(BTC_USD.price).toLocaleString("en-US")}`,
      delta: `${BTC_USD.change_pct >= 0 ? "+" : ""}${BTC_USD.change_pct.toFixed(2)}%`,
      positive: BTC_USD.change_pct >= 0,
      tone: BTC_USD.change_pct >= 0 ? "text-cleared" : "text-rejected",
      spark: [62100, 61200, 59800, 59100, 58300, 57751],
      auditHref: "/terminal/audit?track=trading&symbol=BTC-USD",
      auditLabel: isId ? "Cek BTC-USD" : "Audit BTC",
    },
  ] as const;

  const sectorImpacts = [
    {
      domain: isId ? "Saham BEI & Kripto" : "IDX Equities & Crypto",
      href: "/terminal/audit?track=trading",
      posture:
        regime === "RISK_OFF"
          ? isId
            ? "Pasar rawan guncangan: pasang Stop-Loss >= 1,5× ATR-14 & batasi risiko <= 1,5% modal."
            : "Elevated chop: set Stop-Loss >= 1.5x ATR-14 & cap max loss at <= 1.5% capital."
          : isId
            ? "Jaga disiplin risiko maksimal 2% modal per transaksi dengan target R:R bersih >= 1:1,5."
            : "Maintain strict 2% risk cap per trade with Net R:R >= 1:1.5 after fees.",
    },
    {
      domain: isId ? "Bisnis Ritel & UMKM" : "SME & Retail Ventures",
      href: "/terminal/audit?track=business",
      posture: isId
        ? `Kurs Rp${Math.round(USD_IDR.price).toLocaleString("id-ID")} menuntut bantalan HPP bahan baku +10% & kas minimal 6 bulan.`
        : `USD/IDR at Rp${Math.round(USD_IDR.price).toLocaleString("id-ID")} requires +10% COGS buffer & >= 6 months cash runway.`,
    },
    {
      domain: isId ? "Gaji & Cicilan Keluarga" : "Household Cashflow",
      href: "/terminal/audit?track=cashflow",
      posture: isId
        ? "Jaga total cicilan maksimal 30% gaji bersih (aturan OJK) & hindari bunga flat tinggi."
        : "Keep combined monthly debt <= 30% net income (OJK cap) & avoid high flat-rate credit.",
    },
  ] as const;

  const primaryTracks = [
    {
      id: "trading" as const,
      href: "/terminal/audit?track=trading",
      demoHref: "/terminal/audit?track=trading&demo=1",
      Icon: Activity,
      tone: "emerald" as SpotlightTone,
      badge: isId ? "Saham · Kripto · Emas" : "Stocks · Crypto · Gold",
      outputPreview: isId
        ? "Output: R:R Bersih · Lot BEI · Half-Kelly · ATR-14"
        : "Outputs: Net R:R · IDX Lots · Half-Kelly · ATR-14",
      bullets: isId
        ? [
            "Hitung otomatis R:R bersih setelah potongan fee sekuritas",
            "Konversi modal ke jumlah Lot BEI & ukuran aman Half-Kelly",
            "Deteksi apakah Stop-Loss terlalu sempit terhadap volatilitas ATR-14",
          ]
        : [
            "Exact Net Risk:Reward after round-trip brokerage fees",
            "Automatic IDX 100-share lot sizing & Half-Kelly cap",
            "Detects Stop-Loss placement inside daily ATR-14 noise",
          ],
    },
    {
      id: "business" as const,
      href: "/terminal/audit?track=business",
      demoHref: "/terminal/audit?track=business&demo=1",
      Icon: Briefcase,
      tone: "sky" as SpotlightTone,
      badge: isId ? "Kuliner · Ritel · Ekspansi" : "F&B · Retail · Ventures",
      outputPreview: isId
        ? "Output: Titik Impas BEP · Kas Ramp-Up · PPh 0,5%"
        : "Outputs: BEP Units · 3-Mo Burn · 0.5% SME Tax",
      bullets: isId
        ? [
            "Hitung titik impas (BEP) unit & rupiah secara eksak",
            "Uji ketahanan kas di 3 bulan pertama saat toko masih sepi",
            "Bongkar gerusan komisi aplikasi (GoFood/Shopee) & PPh 0,5%",
          ]
        : [
            "Exact unit & revenue Break-Even Point (BEP) ceiling",
            "Simulates 3-month opening ramp-up cash burn survival",
            "Factors delivery app commissions & 0.5% SME final tax",
          ],
    },
    {
      id: "cashflow" as const,
      href: "/terminal/audit?track=cashflow",
      demoHref: "/terminal/audit?track=cashflow&demo=1",
      Icon: Wallet,
      tone: "amber" as SpotlightTone,
      badge: isId ? "KPR · Kendaraan · PayLater" : "Mortgage · Auto · Credit",
      outputPreview: isId
        ? "Output: Total DSR OJK · Bunga Efektif APR · Runway"
        : "Outputs: Combined OJK DSR · True APR · Reserve",
      bullets: isId
        ? [
            "Evaluasi gabungan cicilan lama + baru terhadap batas aman 30% OJK",
            "Ubah jebakan Bunga Flat bulanan menjadi Bunga Efektif Tahunan (APR)",
            "Ukur sisa dana darurat jika penghasilan tiba-tiba turun",
          ]
        : [
            "Evaluates combined old + new debt against OJK's 30% DSR limit",
            "Converts deceptive monthly flat interest into True Effective APR",
            "Tests emergency reserve survival under sudden income drops",
          ],
    },
  ];

  // Asymmetric 2 + 3 Bento Grid on Desktop (`xl:grid-cols-6`) — Zero narrow 5-col squeezing!
  const suiteModules = [
    {
      href: "/terminal/war-room",
      title: t("terminal.nav_warroom"),
      metric: isId ? "Kantor Eksekutif 3D · 5 Sudut Kamera" : "3D Quant Studio · 5 Camera Angles",
      desc: isId
        ? "Pantau langsung empat agen berjas membedah data di ruang sidang 3D dan ajukan pertanyaan uji silang secara interaktif."
        : "Inspect four executive AI agents inside the 3D War-Room studio and run interactive cross-examinations.",
      Icon: Boxes,
      tone: "emerald" as SpotlightTone,
      spanCls: "xl:col-span-3",
    },
    {
      href: "/terminal/compare",
      title: t("terminal.nav_compare"),
      metric: isId ? "Arena Adu Skenario A vs B · Guncangan 0–60%" : "A vs B Stress Arena · 0–60% Shock",
      desc: isId
        ? "Bandingkan dua pilihan sulit (misal: sewa ruko vs cloud kitchen, atau DP besar vs cicilan ringan) beserta titik patah 3D-nya."
        : "Pit Option A against Option B side-by-side (e.g., Retail Lease vs Cloud Kitchen) on a 3D stress stage.",
      Icon: GitCompare,
      tone: "sky" as SpotlightTone,
      spanCls: "xl:col-span-3",
    },
    {
      href: "/terminal/import",
      title: t("terminal.nav_import"),
      metric: isId ? "100% Privasi Lokal Browser" : "100% In-Browser Privacy",
      desc: isId
        ? "Unggah mutasi rekening bank atau buku kas UMKM (.CSV) untuk mendeteksi pos bocor terbesar tanpa kirim data ke server."
        : "Drop bank/SME .CSV files locally in your browser to uncover major cash leaks with zero server upload.",
      Icon: FileSpreadsheet,
      tone: "emerald" as SpotlightTone,
      spanCls: "xl:col-span-2",
    },
    {
      href: "/terminal/portfolio",
      title: t("terminal.nav_portfolio"),
      metric: "Pearson 90H · VaR 95% · Crash Test",
      desc: isId
        ? "Deteksi saham/aset yang jatuh bersamaan, simulasikan krisis pasar, dan seimbangkan bobot otomatis (Risk Parity)."
        : "Expose lockstep asset concentration, run crash tests, and apply automatic Risk-Parity weighting.",
      Icon: Network,
      tone: "amber" as SpotlightTone,
      spanCls: "xl:col-span-2",
    },
    {
      href: "/terminal/journal",
      title: t("terminal.nav_journal"),
      metric:
        entries.length > 0
          ? isId
            ? `${entries.length} Keputusan · Pelacak Brier 3D`
            : `${entries.length} Logs · 3D Brier Tracker`
          : isId
            ? "Arsip Keputusan & Brier Score 3D"
            : "Decision Ledger & 3D Brier Score",
      desc: isId
        ? "Catat hasil nyata keputusan Anda, baca diagnosis bias psikologis, serta bagikan link Dossier publik terkompresi."
        : "Log post-mortem outcomes, uncover overconfidence biases, and share compressed public Dossier links.",
      Icon: BookMarked,
      tone: "sky" as SpotlightTone,
      spanCls: "xl:col-span-2",
    },
  ] as const;

  const handleLaunchPlaybook = (pb: QuickPlaybook) => {
    queuePrefillInput(pb.track, pb.payload);
    router.push(`/terminal/audit?track=${pb.track}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7 p-4 pb-8 sm:p-6 lg:p-8">
      {/* 1. Aligned Executive Command Header + Unified Pulse Strip */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cleared/40 bg-cleared/12 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared shadow-[0_0_20px_-5px_rgba(16,185,129,0.45)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("terminal.overview_eyebrow")}</span>
            </span>
            <h2 className="mt-2.5 font-editorial text-2xl font-medium tracking-tight text-text-primary sm:text-4xl">
              {t("terminal.overview_title")}
            </h2>
            <p className="mt-1.5 font-sans text-[13.5px] leading-relaxed text-text-secondary sm:text-[15px]">
              {t("terminal.overview_subtitle")}
            </p>
          </div>

          {/* Crisp Single-Row Action Pair + Quick Status on xl */}
          <div className="flex flex-wrap items-center gap-2.5 xl:shrink-0">
            <Link
              href="/terminal/audit?demo=1"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-active-border bg-surface px-4 font-sans text-[13px] font-semibold whitespace-nowrap text-text-primary transition-colors hover:border-cleared/50 hover:text-cleared"
            >
              <Play className="h-3.5 w-3.5 fill-current text-cleared" aria-hidden="true" />
              <span>{isId ? "Simulasi Demo Cepat" : "Instant Demo Run"}</span>
            </Link>

            <Link
              href="/terminal/audit"
              className="cta-primary-polish inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-cleared px-5 font-sans text-[13px] font-bold whitespace-nowrap text-on-cleared transition-all hover:brightness-105"
            >
              <span>
                {isId ? "Mulai Audit Rencana" : "Start Pre-Mortem Audit"}
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* 4-Column Quick Command Status Strip (Zero Duplicate Header Crowding!) */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link href="/terminal/audit" className="group block">
            <div className="terminal-panel flex items-center justify-between gap-2 rounded-lg px-4 py-3 transition-colors group-hover:border-cleared/50">
              <div>
                <span className="block font-sans text-xs text-text-muted">
                  {isId ? "Skor Rencana Aktif" : "Active Plan Score"}
                </span>
                <span
                  className={cn(
                    "font-mono text-base font-bold tabular-nums",
                    liveRiskSnapshot
                      ? liveRiskSnapshot.score >= 75
                        ? "text-cleared"
                        : liveRiskSnapshot.score >= 50
                          ? "text-conditional"
                          : "text-rejected"
                      : "text-text-primary"
                  )}
                >
                  {liveRiskSnapshot
                    ? `${liveRiskSnapshot.score}/100`
                    : isId
                      ? "Siap Diuji"
                      : "Ready"}
                </span>
              </div>
              <Activity className="h-4 w-4 text-cleared opacity-80" aria-hidden="true" />
            </div>
          </Link>

          <Link href="/terminal/war-room" className="group block">
            <div className="terminal-panel flex items-center justify-between gap-2 rounded-lg px-4 py-3 transition-colors group-hover:border-cleared/50">
              <div>
                <span className="block font-sans text-xs text-text-muted">
                  {isId ? "Rezim Makro Hermes" : "Hermes Regime"}
                </span>
                <span
                  className={cn(
                    "font-mono text-base font-bold",
                    regime === "RISK_OFF"
                      ? "text-rejected"
                      : regime === "RISK_ON"
                        ? "text-cleared"
                        : "text-conditional"
                  )}
                >
                  {regime}
                </span>
              </div>
              <Radio className="h-4 w-4 text-conditional opacity-80" aria-hidden="true" />
            </div>
          </Link>

          <Link href="/terminal/journal" className="group block">
            <div className="terminal-panel flex items-center justify-between gap-2 rounded-lg px-4 py-3 transition-colors group-hover:border-cleared/50">
              <div>
                <span className="block font-sans text-xs text-text-muted">
                  {isId ? "Jurnal & Skor Brier" : "Journal & Brier"}
                </span>
                <span className="font-mono text-base font-bold tabular-nums text-cleared">
                  {calibration.userBrierScore !== null
                    ? `${calibration.userBrierScore.toFixed(3)} Brier`
                    : entries.length > 0
                      ? `${entries.length} ${isId ? "Keputusan" : "Logged"}`
                      : isId
                        ? "0 Catatan"
                        : "0 Logs"}
                </span>
              </div>
              <BookMarked className="h-4 w-4 text-sky-400 opacity-80" aria-hidden="true" />
            </div>
          </Link>

          <div className="terminal-panel flex items-center justify-between gap-2 rounded-lg px-4 py-3">
            <div>
              <span className="block font-sans text-xs text-text-muted">
                {isId ? "Kesiapan Sistem" : "System Readiness"}
              </span>
              <span className="font-mono text-base font-bold text-cleared">
                7/7 {isId ? "Modul Live" : "Live"}
              </span>
            </div>
            <ShieldCheck className="h-4 w-4 text-cleared opacity-80" aria-hidden="true" />
          </div>
        </div>

        {/* 2. Hermes Macro Command Deck (8-col) + Strictly Centered 3D Globe/Tensor (4-col) */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <SpotlightCard
            tone={regimeCardTone}
            className="justify-between p-5 sm:p-6 xl:col-span-8"
          >
            <div className="flex flex-col gap-4">
              {/* Crisp 1-Row Macro Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-cleared/40 bg-cleared/12 text-cleared">
                    <Radio className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-sans text-sm font-bold text-text-primary sm:text-[15px]">
                    {isId
                      ? "Radar Makro Harian Hermes"
                      : "Hermes Daily Macro Intelligence"}
                  </h3>
                  <span
                    className={cn(
                      "rounded-sm border px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase",
                      regime === "RISK_OFF"
                        ? "border-rejected/45 bg-rejected/14 text-rejected"
                        : regime === "RISK_ON"
                          ? "border-cleared/45 bg-cleared/14 text-cleared"
                          : "border-conditional/45 bg-conditional/14 text-conditional"
                    )}
                  >
                    {regime}
                  </span>
                </div>

                <span className="font-mono text-[11px] font-medium whitespace-nowrap text-text-muted">
                  UPDATE 07:00 WIB · AUTO-CALIBRATED
                </span>
              </div>

              {/* Concise Single-Block Alert + Macro Context (Zero Duplicate Copy!) */}
              <div
                className={cn(
                  "rounded-lg border border-hairline border-l-4 bg-obsidian/80 px-4 py-3",
                  regime === "RISK_OFF"
                    ? "border-l-rejected"
                    : regime === "RISK_ON"
                      ? "border-l-cleared"
                      : "border-l-conditional"
                )}
              >
                <p className="font-sans text-[13px] font-semibold text-conditional">
                  {macroAlert}
                </p>
                <p className="mt-1 font-sans text-[13px] leading-relaxed text-text-secondary">
                  {macroSummary}
                </p>
              </div>

              {/* 4 High-Contrast Interactive Indicator Cards with Sparklines */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {macroCards.map((card) => (
                  <Link
                    key={card.label}
                    href={card.auditHref}
                    className="group flex flex-col justify-between gap-2 rounded-lg border border-hairline bg-obsidian/92 p-3.5 transition-all hover:border-cleared/50 hover:bg-surface"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] font-bold text-text-primary">
                        {card.label}
                      </span>
                      {card.positive ? (
                        <TrendingUp
                          className="h-3.5 w-3.5 text-cleared"
                          aria-hidden="true"
                        />
                      ) : (
                        <TrendingDown
                          className="h-3.5 w-3.5 text-rejected"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="font-mono tabular-nums">
                      <span className="block text-base font-bold text-text-primary sm:text-[17px]">
                        {card.value}
                      </span>
                      <span className={cn("text-xs font-bold", card.tone)}>
                        {card.delta}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-1 border-t border-hairline/70 pt-2">
                      <span className="font-sans text-[11px] font-medium text-text-muted group-hover:text-cleared">
                        {card.auditLabel} →
                      </span>
                      <MacroSparkline
                        points={card.spark}
                        positive={card.positive}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3 Clickable Domain Guardrails */}
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-hairline pt-4 md:grid-cols-3">
              {sectorImpacts.map((item) => (
                <Link
                  key={item.domain}
                  href={item.href}
                  className="group flex flex-col gap-1.5 rounded-lg border border-hairline/80 bg-obsidian/80 p-3.5 transition-colors hover:border-cleared/50"
                >
                  <span className="inline-flex items-center justify-between gap-1.5 font-sans text-xs font-bold text-cleared">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldAlert
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item.domain}</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </span>
                  <p className="font-sans text-xs leading-relaxed text-text-secondary">
                    {item.posture}
                  </p>
                </Link>
              ))}
            </div>
          </SpotlightCard>

          {/* Interactive Dual-Mode 3D Stage: Global Liquidity Globe (`cobe`) + Regime Tensor (`three`) */}
          <SpotlightCard
            tone={regimeCardTone}
            className="justify-between overflow-hidden xl:col-span-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-hairline bg-obsidian/88 px-4 py-3">
              <div className="min-w-0">
                <span className="block truncate font-sans text-xs font-bold text-text-primary">
                  {visualMode === "globe"
                    ? isId
                      ? "Koridor Likuiditas Global 3D"
                      : "3D Global Liquidity Corridors"
                    : isId
                      ? "Tensor Rezim Makro 3D"
                      : "3D Macro Regime Tensor"}
                </span>
                <span className="block truncate font-sans text-[11px] text-text-muted">
                  {isId ? "Geser 360° · Klik jalur" : "Drag 360° · Select flow"}
                </span>
              </div>

              <div className="inline-flex shrink-0 items-center gap-1 rounded-md border border-hairline bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setVisualMode("globe")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xs px-2 py-1 font-mono text-[10.5px] font-semibold transition-colors",
                    visualMode === "globe"
                      ? "bg-cleared/16 text-cleared"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <Globe2 className="h-3 w-3" aria-hidden="true" />
                  <span>GLOBE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisualMode("tensor")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xs px-2 py-1 font-mono text-[10.5px] font-semibold transition-colors",
                    visualMode === "tensor"
                      ? "bg-cleared/16 text-cleared"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <Orbit className="h-3 w-3" aria-hidden="true" />
                  <span>TENSOR</span>
                </button>
              </div>
            </div>

            <div className="bg-blueprint-grid flex flex-1 items-center justify-center">
              {visualMode === "globe" ? (
                <HermesMacroGlobe macroContext={macroContext} />
              ) : (
                <MacroRegime3DRadar macroContext={macroContext} />
              )}
            </div>

            {visualMode === "tensor" && (
              <div className="border-t border-hairline bg-obsidian/88 px-4 py-2.5 text-center font-sans text-xs text-text-secondary">
                {isId
                  ? "Inti oktahedral berubah warna & kecepatan rotasi mengikuti ketegangan rezim makro."
                  : "Octahedral core shifts color & spin cadence according to live macro regime stress."}
              </div>
            )}
          </SpotlightCard>
        </div>
      </section>

      {/* 3. Primary 3-Track Audit Workstations */}
      <section className="flex flex-col gap-3.5">
        <div>
          <h3 className="font-sans text-base font-bold text-text-primary sm:text-lg">
            {isId
              ? "1. Pilih Jalur Audit Utama"
              : "1. Choose Your Primary Audit Track"}
          </h3>
          <p className="font-sans text-[13px] text-text-secondary">
            {isId
              ? "Tiga mesin kalkulasi presisi sesuai jenis keputusan uang yang sedang Anda hadapi."
              : "Three specialized deterministic engines tailored to the financial decision in front of you."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {primaryTracks.map(
            ({ id, href, demoHref, Icon, tone, badge, outputPreview, bullets }) => (
              <SpotlightCard
                key={id}
                tone={tone}
                className="justify-between gap-5 p-5 sm:p-6"
              >
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cleared/40 bg-cleared/12 text-cleared shadow-[0_0_16px_-4px_rgba(16,185,129,0.4)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-hairline bg-obsidian px-3 py-1 font-sans text-xs font-medium text-text-secondary">
                      {badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-sans text-base font-bold text-text-primary sm:text-[17px]">
                      {t(`tracks.${id}.name`)}
                    </h4>
                    <p className="mt-1 font-sans text-[13px] leading-relaxed text-text-secondary">
                      {t(`tracks.${id}.description`)}
                    </p>
                    <span className="mt-2 inline-block rounded-md border border-hairline/80 bg-obsidian/90 px-2.5 py-1 font-mono text-[11px] font-medium text-sky-400">
                      {outputPreview}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2 border-t border-hairline/80 pt-3">
                    {bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 font-sans text-[12.5px] leading-snug text-text-secondary"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cleared"
                          aria-hidden="true"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2.5 border-t border-hairline pt-4">
                  <Link
                    href={href}
                    className="cta-primary-polish inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md bg-cleared px-4 font-sans text-[13px] font-bold text-on-cleared transition-all hover:brightness-105"
                  >
                    <span>{t("terminal.launch_module")}</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={demoHref}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border border-hairline bg-obsidian px-3.5 font-sans text-xs font-semibold text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
                  >
                    <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                    <span>Demo</span>
                  </Link>
                </div>
              </SpotlightCard>
            )
          )}
        </div>
      </section>

      {/* 4. Real-World Guided Scenarios (1-Click Auto-Fill with Expected Outcome Badges) */}
      <section className="flex flex-col gap-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-conditional" aria-hidden="true" />
            <h3 className="font-sans text-base font-bold text-text-primary sm:text-lg">
              {isId
                ? "2. Skenario Kasus Nyata Siap Uji (1-Klik Isi Otomatis)"
                : "2. Real-World Financial Dilemmas (1-Click Auto-Fill)"}
            </h3>
          </div>
          <p className="font-sans text-[13px] text-text-secondary">
            {isId
              ? "Tidak perlu mengetik dari nol. Klik salah satu studi kasus populer di bawah untuk langsung membedah angkanya di Workstation."
              : "Skip typing from scratch. Select a real Indonesian financial scenario below to load its exact parameters straight into the Audit Workstation."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_PLAYBOOKS.map((pb) => (
            <SpotlightCard
              key={pb.id}
              tone={pb.tone}
              onClick={() => handleLaunchPlaybook(pb)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLaunchPlaybook(pb);
                }
              }}
              className="cursor-pointer justify-between gap-3.5 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-sm border px-2 py-0.5 font-sans text-[11px] font-semibold",
                      pb.tone === "crimson"
                        ? "border-rejected/45 bg-rejected/12 text-rejected"
                        : pb.tone === "amber"
                          ? "border-conditional/45 bg-conditional/12 text-conditional"
                          : "border-cleared/45 bg-cleared/12 text-cleared"
                    )}
                  >
                    {isId ? pb.badgeId : pb.badgeEn}
                  </span>
                  <Compass
                    className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover/spot:translate-x-0.5 group-hover/spot:text-cleared"
                    aria-hidden="true"
                  />
                </div>

                <h4 className="font-sans text-sm font-bold leading-snug text-text-primary">
                  {isId ? pb.titleId : pb.titleEn}
                </h4>

                <p className="font-sans text-[12.5px] leading-relaxed text-text-secondary">
                  {isId ? pb.summaryId : pb.summaryEn}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-hairline/75 pt-3">
                <span className="font-mono text-[11px] font-semibold text-text-muted">
                  {pb.expectedBadge}
                </span>
                <div className="flex items-center justify-between font-sans text-xs font-bold text-cleared">
                  <span>
                    {isId ? "Muat & Bedah Sekarang" : "Load & Inspect Now"}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* 5. Asymmetric 2+3 Bento Grid for the 5 Specialized Intelligence & Lab Modules */}
      <section className="flex flex-col gap-3.5">
        <div>
          <h3 className="font-sans text-base font-bold text-text-primary sm:text-lg">
            {isId
              ? "3. Laboratorium Intelijen & Analisis Lanjutan"
              : "3. Specialized Risk Intelligence & Lab Modules"}
          </h3>
          <p className="font-sans text-[13px] text-text-secondary">
            {isId
              ? "Lima ruang kerja pendamping untuk simulasi komite 3D, adu skenario, pemindaian CSV bank, matriks korelasi, dan kalibrasi Brier."
              : "Five companion workstations for 3D committee deliberation, A vs B comparisons, local CSV ingestion, portfolio VaR, and Brier calibration."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          {suiteModules.map(
            ({ href, title, metric, desc, Icon, tone, spanCls }) => (
              <Link
                key={href}
                href={href}
                className={cn("group block h-full", spanCls)}
              >
                <SpotlightCard
                  tone={tone}
                  className="h-full justify-between gap-4 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cleared/40 bg-cleared/12 text-cleared">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="rounded-full border border-cleared/40 bg-cleared/12 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-cleared">
                        LIVE
                      </span>
                    </div>

                    <div>
                      <h4 className="font-sans text-[15.5px] font-bold text-text-primary transition-colors group-hover:text-cleared">
                        {title}
                      </h4>
                      <span className="mt-0.5 block font-mono text-xs font-medium text-sky-400">
                        {metric}
                      </span>
                    </div>

                    <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
                      {desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline/75 pt-3.5 font-sans text-xs font-bold text-text-secondary transition-colors group-hover:text-cleared">
                    <span>
                      {isId ? "Buka Ruang Kerja" : "Open Workstation"}
                    </span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </SpotlightCard>
              </Link>
            )
          )}
        </div>
      </section>

      {/* 6. Session Audit Ledger */}
      <AuditHistoryPanel
        entries={entries}
        showEmptyState
        onClear={() => {
          clearAuditHistory();
          setEntries([]);
        }}
      />
    </div>
  );
}
