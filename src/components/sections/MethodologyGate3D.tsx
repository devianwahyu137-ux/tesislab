"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  FileCheck2,
  Globe2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type SimScenarioId = "risky" | "safe";

interface GateStageSpec {
  id: number;
  code: string;
  titleId: string;
  titleEn: string;
  techTag: string;
  Icon: typeof FileCheck2;
  riskyBadgeId: string;
  riskyBadgeEn: string;
  riskyStatus: "pass" | "warn" | "veto";
  safeBadgeId: string;
  safeBadgeEn: string;
  safeStatus: "pass" | "warn" | "veto";
  detailId: string;
  detailEn: string;
}

const PIPELINE_GATES: readonly GateStageSpec[] = [
  {
    id: 0,
    code: "01",
    titleId: "Validasi Input",
    titleEn: "Input Validation",
    techTag: "ZOD SCHEMA",
    Icon: FileCheck2,
    riskyBadgeId: "✓ Format Valid",
    riskyBadgeEn: "✓ Valid Format",
    riskyStatus: "pass",
    safeBadgeId: "✓ Format Valid",
    safeBadgeEn: "✓ Valid Format",
    safeStatus: "pass",
    detailId:
      "Memastikan seluruh angka (harga beli, target untung, batas rugi, dan modal) bernilai positif dan masuk akal sebelum dihitung.",
    detailEn:
      "Ensures all numeric inputs (entry, take-profit, stop-loss, capital) are valid and positive before calculation.",
  },
  {
    id: 1,
    code: "02",
    titleId: "Hitungan Eksak",
    titleEn: "Exact Math",
    techTag: "DECIMAL.JS",
    Icon: Calculator,
    riskyBadgeId: "R:R 1 : 0.86",
    riskyBadgeEn: "R:R 1 : 0.86",
    riskyStatus: "warn",
    safeBadgeId: "R:R 1 : 2.20",
    safeBadgeEn: "R:R 1 : 2.20",
    safeStatus: "pass",
    detailId:
      "Mesin Decimal.js menghitung rasio untung-rugi bersih setelah fee broker (0,40%), ukuran Lot BEI, serta batas risiko per transaksi.",
    detailEn:
      "Decimal.js computes exact net R:R after exchange fees, IDX lot sizing, and capital-at-risk percentage.",
  },
  {
    id: 2,
    code: "03",
    titleId: "Radar Pasar Harian",
    titleEn: "Macro Context",
    techTag: "HERMES RADAR",
    Icon: Globe2,
    riskyBadgeId: "RISK_OFF · ATR",
    riskyBadgeEn: "RISK_OFF · ATR",
    riskyStatus: "warn",
    safeBadgeId: "1.8× ATR Aman",
    safeBadgeEn: "1.8× ATR Safe",
    safeStatus: "pass",
    detailId:
      "Menyuntikkan kondisi pasar harian (IHSG, kurs USD/IDR, dan volatilitas ATR-14) agar batas Stop-Loss tidak terlalu sempit.",
    detailEn:
      "Injects live market regime (IDX, USD/IDR, ATR-14 volatility) to verify your Stop-Loss sits outside daily noise.",
  },
  {
    id: 3,
    code: "04",
    titleId: "Gerbang Veto Keras",
    titleEn: "Hard Veto Gate",
    techTag: "HARD RULE",
    Icon: ShieldAlert,
    riskyBadgeId: "✕ VETO: R:R < 1.5",
    riskyBadgeEn: "✕ VETO: R:R < 1.5",
    riskyStatus: "veto",
    safeBadgeId: "✓ Lolos Ambang",
    safeBadgeEn: "✓ Cleared Gate",
    safeStatus: "pass",
    detailId:
      "Jika R:R terlalu kecil, risiko > 2% modal, atau cicilan > 30% gaji, gerbang ini otomatis memblokir AI agar tidak memberi pujian palsu.",
    detailEn:
      "If R:R is weak, risk exceeds 2%, or DSR > 30%, this deterministic gate overrides AI optimism and flags the flaw.",
  },
  {
    id: 4,
    code: "05",
    titleId: "1.000 Skenario & Vonis",
    titleEn: "1,000-Path Verdict",
    techTag: "MONTE CARLO",
    Icon: Activity,
    riskyBadgeId: "Ruin 17.7% · SYARAT",
    riskyBadgeEn: "17.7% Ruin · CONDITIONAL",
    riskyStatus: "veto",
    safeBadgeId: "Ruin 1.4% · LAYAK",
    riskyStatusSafe: "pass",
    safeBadgeEn: "1.4% Ruin · CLEARED",
    safeStatus: "pass",
    detailId:
      "Menjalankan 1.000 simulasi acak untuk mengukur peluang kehancuran modal (P5) sebelum menerbitkan Kartu Vonis & 3 Titik Buta.",
    detailEn:
      "Runs 1,000 randomized paths to measure P5 tail-risk ruin before issuing the final Verdict Card and 3 Blind Spots.",
  },
] as unknown as readonly GateStageSpec[];

/**
 * Interactive 5-Gate Deterministic Pipeline Simulator on `/methodology`.
 * Replaces abstract 3D shapes with an immediately understandable, Stripe/Linear-grade
 * live architecture flow where users can toggle between a Risky vs. Safe plan.
 */
export default function MethodologyGate3D() {
  const { locale } = useTranslation();
  const isId = locale === "id";

  const [scenario, setScenario] = useState<SimScenarioId>("risky");
  const [selectedGate, setSelectedGate] = useState<number>(3);

  const activeGate = PIPELINE_GATES[selectedGate] ?? PIPELINE_GATES[3]!;
  const isRisky = scenario === "risky";

  const statusTone = (st: "pass" | "warn" | "veto") =>
    st === "pass"
      ? "border-cleared/50 bg-cleared/12 text-cleared"
      : st === "warn"
        ? "border-conditional/50 bg-conditional/12 text-conditional"
        : "border-rejected/55 bg-rejected/14 text-rejected";

  return (
    <div className="terminal-panel overflow-hidden rounded-xl border border-active-border/80 bg-obsidian/90 shadow-2xl">
      {/* Top Scenario Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface/85 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cleared" aria-hidden="true" />
          <span className="font-sans text-xs font-bold text-text-primary sm:text-[13px]">
            {isId
              ? "Simulasi Langsung: Lihat Cara 5 Gerbang Menyaring Rencana Anda"
              : "Live Simulation: Watch How 5 Gates Filter Your Financial Plan"}
          </span>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-obsidian p-1">
          <button
            type="button"
            onClick={() => {
              setScenario("risky");
              setSelectedGate(3);
            }}
            className={cn(
              "inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-3 font-sans text-xs font-semibold transition-colors",
              isRisky
                ? "bg-rejected/18 text-rejected"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId ? "Contoh Rencana Berisiko" : "Risky Plan Example"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScenario("safe");
              setSelectedGate(4);
            }}
            className={cn(
              "inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-3 font-sans text-xs font-semibold transition-colors",
              !isRisky
                ? "bg-cleared/18 text-cleared"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId ? "Contoh Rencana Aman" : "Calibrated Plan"}
            </span>
          </button>
        </div>
      </div>

      {/* Active Input Summary Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline/70 bg-obsidian/70 px-4 py-2.5 text-xs sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            {isId ? "INPUT SKENARIO:" : "SCENARIO INPUT:"}
          </span>
          <span className="font-sans font-medium text-text-primary">
            {isRisky
              ? isId
                ? "Beli BBCA.JK 40% modal · Target +5.4% · Stop-Loss -6.3% (R:R 1:0.86)"
                : "Buy BBCA.JK 40% capital · TP +5.4% · SL -6.3% (R:R 1:0.86)"
              : isId
                ? "Beli BBCA.JK 18% modal · Target +11.0% · Stop-Loss -5.0% (R:R 1:2.20)"
                : "Buy BBCA.JK 18% capital · TP +11.0% · SL -5.0% (R:R 1:2.20)"}
          </span>
        </div>

        <span
          className={cn(
            "rounded-sm border px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase",
            isRisky
              ? "border-rejected/45 bg-rejected/12 text-rejected"
              : "border-cleared/45 bg-cleared/12 text-cleared"
          )}
        >
          {isRisky
            ? isId
              ? "HASIL: TERTAHAN DI GERBANG 04"
              : "RESULT: FLAGGED AT GATE 04"
            : isId
              ? "HASIL: LOLOS SEMUA GERBANG (88/100)"
              : "RESULT: CLEARED ALL GATES (88/100)"}
        </span>
      </div>

      {/* 5-Stage Connected Gate Cards */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {PIPELINE_GATES.map((gate, idx) => {
            const Icon = gate.Icon;
            const st = isRisky ? gate.riskyStatus : gate.safeStatus;
            const badge = isRisky
              ? isId
                ? gate.riskyBadgeId
                : gate.riskyBadgeEn
              : isId
                ? gate.safeBadgeId
                : gate.safeBadgeEn;
            const isSelected = selectedGate === gate.id;

            return (
              <motion.button
                key={gate.code}
                type="button"
                onClick={() => setSelectedGate(gate.id)}
                initial={false}
                animate={{ y: isSelected ? -2 : 0 }}
                className={cn(
                  "group relative flex flex-col justify-between gap-3 rounded-lg border p-3.5 text-left transition-all",
                  isSelected
                    ? st === "veto"
                      ? "border-rejected/70 bg-rejected/10 shadow-[0_0_24px_-8px_rgba(239,68,68,0.45)]"
                      : "border-cleared/70 bg-cleared/10 shadow-[0_0_24px_-8px_rgba(16,185,129,0.4)]"
                    : "border-hairline bg-surface/85 hover:border-active-border"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-obsidian font-mono text-[11px] font-bold text-text-primary">
                    {gate.code}
                  </span>
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      st === "veto"
                        ? "text-rejected"
                        : st === "warn"
                          ? "text-conditional"
                          : "text-cleared"
                    )}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <span className="block font-mono text-[9.5px] font-bold tracking-wider text-text-muted">
                    {gate.techTag}
                  </span>
                  <span className="mt-0.5 block font-sans text-[13px] font-bold text-text-primary">
                    {isId ? gate.titleId : gate.titleEn}
                  </span>
                </div>

                <span
                  className={cn(
                    "inline-flex w-fit rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold",
                    statusTone(st)
                  )}
                >
                  {badge}
                </span>

                {idx < PIPELINE_GATES.length - 1 && (
                  <ArrowRight
                    className="pointer-events-none absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-text-muted lg:block"
                    aria-hidden="true"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Active Gate Detailed Explanation Footer */}
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg border border-hairline bg-surface/75 p-3.5 sm:flex-row sm:items-center sm:px-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-cleared">
                GERBANG {activeGate.code} ·{" "}
                {isId ? activeGate.titleId : activeGate.titleEn} (
                {activeGate.techTag})
              </span>
              <p className="mt-0.5 font-sans text-xs leading-relaxed text-text-secondary sm:text-[13px]">
                {isId ? activeGate.detailId : activeGate.detailEn}
              </p>
            </div>
          </div>

          <Link
            href="/terminal/audit"
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-md border border-cleared/45 bg-cleared/12 px-3 font-sans text-xs font-bold whitespace-nowrap text-cleared transition-colors hover:bg-cleared/20"
          >
            <span>{isId ? "Coba Langsung" : "Try Live"}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
