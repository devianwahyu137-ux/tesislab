"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BookMarked,
  Boxes,
  FileSpreadsheet,
  GitCompare,
  Network,
  SlidersHorizontal,
} from "lucide-react";
import type { SuiteModuleId } from "@/components/sections/Terminal3DPreviewCanvas";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const Terminal3DPreviewCanvas = dynamic(
  () => import("@/components/sections/Terminal3DPreviewCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[230px] w-full items-center justify-center sm:h-[300px] lg:h-[360px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          INITIALIZING 3D TOPOLOGY STAGE...
        </span>
      </div>
    ),
  }
);

interface SuiteSpec {
  id: SuiteModuleId;
  code: string;
  href: string;
  Icon: typeof SlidersHorizontal;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  telemetryTag: string;
}

const SUITE_MODULES: readonly SuiteSpec[] = [
  {
    id: "audit",
    code: "01",
    href: "/terminal/audit",
    Icon: SlidersHorizontal,
    titleId: "Workstation Audit 3 Jalur",
    titleEn: "3-Track Audit Workstation",
    descId:
      "Panel split-pane dapat digeser untuk membedah Trading (Lot BEI, Fee Broker, ATR-14, Half-Kelly), UMKM (Ramp-Up 3 Bulan, PPh 0,5%), dan Cashflow (Total DSR OJK & Bunga Efektif APR).",
    descEn:
      "Resizable split-pane workstation dissecting Trading (IDX Lots, Broker Fees, ATR-14, Half-Kelly), SME (3-Mo Ramp-Up, 0.5% Tax), and Cashflow (OJK DSR & Effective APR).",
    telemetryTag: "DECIMAL.JS · SPLIT-PANE · 1,000 MONTE CARLO",
  },
  {
    id: "compare",
    code: "02",
    href: "/terminal/compare",
    Icon: GitCompare,
    titleId: "Arena Komparasi Skenario A vs. B",
    titleEn: "Scenario A vs. B Comparison Arena",
    descId:
      "Adu dua pilihan keputusan finansial secara berdampingan—seperti sewa ruko mal vs. cloud kitchen—lengkap dengan selisih skor ketahanan dan kurva Stress Test ganda.",
    descEn:
      "Pit Option A against Option B side-by-side—such as mall retail lease vs. cloud kitchen—complete with deterministic delta scoring and dual resilience curves.",
    telemetryTag: "HEAD-TO-HEAD DIFF · DUAL STRESS CURVE",
  },
  {
    id: "import",
    code: "03",
    href: "/terminal/import",
    Icon: FileSpreadsheet,
    titleId: "Smart CSV Mutasi & Kas UMKM Lokal",
    titleEn: "Zero-Server Smart CSV Scanner",
    descId:
      "Ekstraksi file CSV mutasi bank atau laporan pengeluaran 100% lokal di browser (PapaParse) tanpa pernah mengunggah data rekening pribadi ke server.",
    descEn:
      "100% in-browser CSV bank statement and SME expense extraction powered by PapaParse with zero server data uploads.",
    telemetryTag: "LOCAL PAPAPARSE · PRIVACY-FIRST",
  },
  {
    id: "portfolio",
    code: "04",
    href: "/terminal/portfolio",
    Icon: Network,
    titleId: "Matriks Korelasi Multi-Aset & VaR",
    titleEn: "Multi-Asset Correlation & VaR Matrix",
    descId:
      "Ukur korelasi Pearson historis antar saham BEI, kripto, dan emas untuk membongkar diversifikasi palsu beserta Value-at-Risk (VaR 95%) portofolio.",
    descEn:
      "Compute historical Pearson correlation matrices across IDX stocks, crypto, and gold to expose false diversification alongside 95% Value-at-Risk.",
    telemetryTag: "PEARSON 90D · VAR 95% · HALF-KELLY",
  },
  {
    id: "journal",
    code: "05",
    href: "/terminal/journal",
    Icon: BookMarked,
    titleId: "Buku Besar Keputusan & Brier Score",
    titleEn: "Decision Ledger & Brier Calibration",
    descId:
      "Buka kembali arsip vonis lama dan catat hasil nyata 30 hari kemudian untuk menghitung skor kalibrasi probabilitas Brier pribadi Anda.",
    descEn:
      "Replay historical audit dossiers and log real-world post-mortem outcomes to track your personal probabilistic Brier Score calibration.",
    telemetryTag: "DOSSIER ARCHIVE · BRIER CALIBRATION",
  },
  {
    id: "warroom",
    code: "06",
    href: "/terminal/war-room",
    Icon: Boxes,
    titleId: "Ruang Sidang 3D & Radar Makro Hermes",
    titleEn: "3D Committee War-Room & Hermes Radar",
    descId:
      "Simulasi spasial 3D ruang komite 4 stasiun (Hermes, Quant, Risk, Chair) yang tersinkronisasi langsung dengan rezim makro harian.",
    descEn:
      "Interactive 3D spatial simulation of the 4-station audit committee (Hermes, Quant, Risk, Chair) synced live with daily macro regimes.",
    telemetryTag: "THREE.JS STUDIO · LIVE HERMES BUS",
  },
];

/**
 * Asymmetric Editorial Split Showcase (`#platform-suite`) following `pbakaus/impeccable`:
 * Zero nested card grids — hairline ledger list on the left paired with a live morphing
 * Three.js PBR topology stage on the right.
 */
export function PlatformSuiteShowcase() {
  const { locale, t } = useTranslation();
  const [activeId, setActiveId] = useState<SuiteModuleId>("audit");

  const activeSpec =
    SUITE_MODULES.find((m) => m.id === activeId) ?? SUITE_MODULES[0];

  return (
    <section
      id="platform-suite"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-10 sm:py-14 md:py-16"
    >
      {/* Left-Aligned Asymmetric Editorial Header (Breaks monotonous centered headers) */}
      <div className="mb-8 flex flex-col justify-between gap-4 lg:mb-10 lg:flex-row lg:items-end">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cleared sm:text-[11px]">
            {t("landing_suite.eyebrow")}
          </span>
          <h2 className="mt-2 max-w-2xl font-editorial text-2xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-3xl md:text-4xl">
            {t("landing_suite.title")}
          </h2>
        </div>

        <p className="max-w-md font-sans text-xs leading-relaxed text-text-secondary sm:text-sm">
          {t("landing_suite.subtitle")}
        </p>
      </div>

      {/* Asymmetric 12-Column Split: Hairline Ledger Accordion (Left) + Live 3D Topology Stage (Right) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left: Clean Hairline Ledger List (Zero card-in-card nesting) */}
        <div className="flex flex-col border-t border-hairline lg:col-span-5">
          {SUITE_MODULES.map((mod) => {
            const isSelected = mod.id === activeId;
            const Icon = mod.Icon;
            const title = locale === "id" ? mod.titleId : mod.titleEn;
            const desc = locale === "id" ? mod.descId : mod.descEn;

            return (
              <div
                key={mod.id}
                className={cn(
                  "border-b border-hairline transition-colors",
                  isSelected ? "bg-surface/60" : "hover:bg-surface/30"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(mod.id)}
                  aria-expanded={isSelected}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3.5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-mono text-[11px] font-semibold tabular-nums",
                        isSelected ? "text-cleared" : "text-text-muted"
                      )}
                    >
                      {mod.code}
                    </span>
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-cleared" : "text-text-muted"
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "font-sans text-sm font-semibold",
                        isSelected ? "text-text-primary" : "text-text-secondary"
                      )}
                    >
                      {title}
                    </span>
                  </div>
                </button>

                {isSelected && (
                  <div className="flex flex-col gap-3 px-3 pb-4 pl-10">
                    <p className="font-sans text-xs leading-relaxed text-text-secondary">
                      {desc}
                    </p>
                    <Link
                      href={mod.href}
                      className="inline-flex w-fit items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared hover:underline"
                    >
                      <span>{t("landing_suite.open_in_terminal")}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Three.js 3D Quantitative Topology Stage */}
        <div className="terminal-panel bg-blueprint-grid relative overflow-hidden rounded-md lg:col-span-7">
          {/* Top Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-obsidian/90 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-cleared"
                aria-hidden="true"
              />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-primary">
                MOD-{activeSpec.code} · {activeSpec.telemetryTag}
              </span>
            </div>

            <Link
              href={activeSpec.href}
              className="inline-flex items-center gap-1 rounded-xs border border-cleared/40 bg-cleared/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/20"
            >
              <span>{activeSpec.href}</span>
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          <Terminal3DPreviewCanvas activeModule={activeId} />

          {/* Bottom Interactive Caption */}
          <div className="flex items-center justify-between gap-2 border-t border-hairline bg-obsidian/90 px-4 py-2 font-mono text-[10px] text-text-muted">
            <span>{t("landing_suite.interact_3d_hint")}</span>
            <span className="shrink-0 uppercase text-cleared">WEBGL PBR</span>
          </div>
        </div>
      </div>
    </section>
  );
}
