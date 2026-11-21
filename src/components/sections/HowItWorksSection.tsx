"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Cpu,
  FileCheck2,
  Play,
  Radio,
  Scale,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useTranslation } from "@/context/LanguageContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

type GraphNodeId = "n1" | "n2" | "n3" | "n4" | "n5";

export interface HowItWorksSectionProps {
  macroContext: MarketContext;
}

const REVEAL_PROPS = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 as const },
  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
};

const STAGE_ORDER: readonly GraphNodeId[] = ["n1", "n2", "n3", "n4", "n5"];

const STAGE_META: Record<
  GraphNodeId,
  {
    step: string;
    latency: string;
    accent: string;
    borderActive: string;
    bgActive: string;
    contractTitle: string;
    contractCode: string;
    Icon: typeof ShieldCheck;
  }
> = {
  n1: {
    step: "01",
    latency: "< 0.1 ms",
    accent: "text-sky-400",
    borderActive: "border-sky-400/70 shadow-[0_0_24px_rgba(56,189,248,0.14)]",
    bgActive: "bg-sky-400/10",
    contractTitle: "Zod.safeParse(rawInput)",
    contractCode: "entry > 0 && sl !== entry -> VALIDATED_PAYLOAD",
    Icon: ShieldCheck,
  },
  n2: {
    step: "02",
    latency: "0.84 ms",
    accent: "text-cleared",
    borderActive: "border-cleared/70 shadow-[0_0_24px_rgba(16,185,129,0.16)]",
    bgActive: "bg-cleared/10",
    contractTitle: "Decimal.js Deterministic Gate",
    contractCode: "rr = Decimal(tp - entry).div(entry - sl) // LOCKED",
    Icon: Cpu,
  },
  n3: {
    step: "03",
    latency: "07:00 WIB",
    accent: "text-conditional",
    borderActive: "border-conditional/70 shadow-[0_0_24px_rgba(245,158,11,0.16)]",
    bgActive: "bg-conditional/10",
    contractTitle: "Hermes Macro Snapshot",
    contractCode: "inject({ usd_idr, ihsg, gold, btc, regime })",
    Icon: Radio,
  },
  n4: {
    step: "04",
    latency: "SINGLE-PASS",
    accent: "text-rejected",
    borderActive: "border-rejected/70 shadow-[0_0_24px_rgba(239,68,68,0.15)]",
    bgActive: "bg-rejected/10",
    contractTitle: "Anti-Yes-Man Veto Enforcer",
    contractCode: "if (severeFlags.length > 0) blockStatus('CLEARED')",
    Icon: Scale,
  },
  n5: {
    step: "05",
    latency: "$0 CLIENT",
    accent: "text-cleared",
    borderActive: "border-cleared/70 shadow-[0_0_24px_rgba(16,185,129,0.16)]",
    bgActive: "bg-cleared/10",
    contractTitle: "Verdict Dossier + Stress Sim",
    contractCode: "export(PNG_2X, PDF_A4) && stressSlider(0..100%)",
    Icon: FileCheck2,
  },
};

/**
 * Interactive 4-Layer Methodology & 5-Stage Deterministic Pipeline Console (#cara-kerja).
 */
export function HowItWorksSection({ macroContext }: HowItWorksSectionProps) {
  const { t } = useTranslation();
  const [selectedNode, setSelectedNode] = useState<GraphNodeId>("n2");
  const [isTracing, setIsTracing] = useState(false);
  const [diffMode, setDiffMode] = useState<"optimistic" | "premortem">(
    "premortem"
  );

  // Interactive step-by-step pipeline trace simulation
  useEffect(() => {
    if (!isTracing) return;
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      if (idx >= STAGE_ORDER.length) {
        clearInterval(timer);
        setIsTracing(false);
        return;
      }
      setSelectedNode(STAGE_ORDER[idx]);
    }, 480);
    return () => clearInterval(timer);
  }, [isTracing]);

  const handleRunTrace = () => {
    setSelectedNode("n1");
    setIsTracing(true);
  };

  const activeStageIndex = STAGE_ORDER.indexOf(selectedNode);
  const activeMeta = STAGE_META[selectedNode];

  const regime = macroContext.synthesis.macro_regime;
  const regimeTone =
    regime === "RISK_OFF"
      ? "border-rejected/40 bg-rejected/10 text-rejected"
      : regime === "RISK_ON"
        ? "border-cleared/40 bg-cleared/10 text-cleared"
        : "border-conditional/40 bg-conditional/10 text-conditional";

  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;
  const liveMacroRows = [
    {
      k: "USD/IDR",
      v: `Rp ${Math.round(USD_IDR.price).toLocaleString("en-US")}`,
      tone: "text-text-primary",
    },
    {
      k: "IHSG",
      v: `${IHSG.price.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${IHSG.change_pct >= 0 ? "+" : ""}${IHSG.change_pct.toFixed(2)}%)`,
      tone: IHSG.change_pct < 0 ? "text-rejected" : "text-cleared",
    },
    {
      k: "GOLD",
      v: `$${Math.round(GOLD_USD.price).toLocaleString("en-US")}`,
      tone: "text-text-primary",
    },
    {
      k: "BTC",
      v: `$${Math.round(BTC_USD.price).toLocaleString("en-US")} (${BTC_USD.change_pct >= 0 ? "+" : ""}${BTC_USD.change_pct.toFixed(2)}%)`,
      tone: BTC_USD.change_pct < 0 ? "text-rejected" : "text-cleared",
    },
  ];

  return (
    <section
      id="cara-kerja"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-12 md:py-16"
    >
      {/* Clean Editorial Header */}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center md:mb-10">
        <span className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-cleared">
          {t("how_it_works.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("how_it_works.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("how_it_works.subtitle")}
        </p>
      </div>

      {/* Interactive 5-Stage Deterministic Pipeline Console */}
      <div className="surface-specular mb-8 overflow-hidden rounded-sm border border-active-border/80 bg-surface shadow-xl shadow-black/25">
        {/* Console Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-obsidian px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 rounded-full bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary sm:text-[11px]">
              {t("how_it_works.graph_title")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] text-text-muted md:inline">
              {t("how_it_works.graph_hint")}
            </span>
            <button
              type="button"
              onClick={handleRunTrace}
              disabled={isTracing}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-xs border border-cleared/50 bg-cleared/12 px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/20 disabled:opacity-60"
            >
              <Play className="h-3 w-3 fill-current" aria-hidden="true" />
              <span>
                {isTracing
                  ? t("how_it_works.trace_running")
                  : t("how_it_works.trace_btn")}
              </span>
            </button>
          </div>
        </div>

        {/* Generously Padded Interactive Stage Nodes */}
        <div className="relative bg-canvas/85 px-4 py-6 sm:px-7 sm:py-8">
          {/* Desktop Horizontal Connector Rail */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-12 left-12 hidden -translate-y-1/2 lg:block"
          >
            <div className="h-[2px] w-full bg-hairline" />
            <motion.div
              className="absolute top-0 left-0 h-[2px] bg-cleared"
              initial={false}
              animate={{
                width: `${(activeStageIndex / (STAGE_ORDER.length - 1)) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            />
          </div>

          <div
            role="tablist"
            aria-label={t("how_it_works.graph_title")}
            className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4"
          >
            {STAGE_ORDER.map((nodeId, idx) => {
              const meta = STAGE_META[nodeId];
              const Icon = meta.Icon;
              const isSelected = selectedNode === nodeId;
              const isPassed = idx < activeStageIndex;
              const rawLabel = t(`how_it_works.graph_nodes.${nodeId}.label`);
              const cleanTitle = rawLabel.replace(/^\d+\.\s*/, "");

              return (
                <button
                  key={nodeId}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setIsTracing(false);
                    setSelectedNode(nodeId);
                  }}
                  className={cn(
                    "group relative flex flex-col justify-between gap-3 rounded-sm border bg-obsidian p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
                    isSelected
                      ? meta.borderActive
                      : isPassed
                        ? "border-cleared/35 hover:border-cleared/60"
                        : "border-hairline hover:border-active-border"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-xs border transition-colors",
                        isSelected
                          ? cn(meta.bgActive, meta.accent, "border-current/40")
                          : isPassed
                            ? "border-cleared/30 bg-cleared/10 text-cleared"
                            : "border-hairline bg-surface text-text-muted group-hover:text-text-primary"
                      )}
                    >
                      {isPassed && !isSelected ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </span>

                    <span
                      className={cn(
                        "rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider",
                        isSelected
                          ? cn(meta.bgActive, meta.accent, "border-current/35")
                          : "border-hairline bg-surface text-text-muted"
                      )}
                    >
                      {meta.latency}
                    </span>
                  </div>

                  <div>
                    <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      STAGE {meta.step}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block font-mono text-xs font-semibold leading-snug transition-colors",
                        isSelected ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
                      )}
                    >
                      {cleanTitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deep Technical Spec Inspector Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 gap-4 border-t border-hairline bg-obsidian px-4 py-4 sm:px-6 lg:grid-cols-12 lg:items-center"
          >
            <div className="flex flex-col gap-1 lg:col-span-7">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-mono text-xs font-bold",
                    activeMeta.accent
                  )}
                >
                  {t(`how_it_works.graph_nodes.${selectedNode}.label`)}
                </span>
                <span className="rounded-xs border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase text-text-muted">
                  {activeMeta.latency}
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {t(`how_it_works.graph_nodes.${selectedNode}.spec`)}
              </p>
            </div>

            <div className="rounded-xs border border-hairline bg-surface/90 px-3.5 py-2.5 lg:col-span-5">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                <Terminal className="h-3 w-3 text-cleared" aria-hidden="true" />
                <span>{activeMeta.contractTitle}</span>
              </div>
              <code className="block overflow-x-auto font-mono text-[11px] text-cleared">
                {activeMeta.contractCode}
              </code>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Compact 2x2 Editorial Bento Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Layer 01: Deterministic Math */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cleared">
                    01 · {t("how_it_works.step1.badge")}
                  </span>
                  <span className="font-mono text-[10px] text-cleared">0.84 ms</span>
                </div>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step1.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step1.body")}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-hairline pt-3 font-mono text-xs tabular-nums">
                <div className="rounded-xs border border-hairline bg-obsidian p-2">
                  <span className="block text-[9px] text-text-muted">BEP UNITS</span>
                  <span className="mt-0.5 block font-semibold text-text-primary">
                    224 / mo
                  </span>
                </div>
                <div className="rounded-xs border border-hairline bg-obsidian p-2">
                  <span className="block text-[9px] text-text-muted">RUNWAY</span>
                  <span className="mt-0.5 block font-semibold text-conditional">
                    3.9 MO
                  </span>
                </div>
                <div className="rounded-xs border border-hairline bg-obsidian p-2">
                  <span className="block text-[9px] text-text-muted">SCORE LOCK</span>
                  <span className="mt-0.5 block font-semibold text-rejected">
                    50 / 100
                  </span>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Layer 02: Hermes Macro Radar */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-conditional">
                    02 · {t("how_it_works.step2.badge")}
                  </span>
                  <span
                    className={cn(
                      "rounded-xs border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      regimeTone
                    )}
                  >
                    {regime}
                  </span>
                </div>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step2.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step2.body")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-hairline pt-3 font-mono text-[11px] tabular-nums">
                {liveMacroRows.map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between rounded-xs border border-hairline bg-obsidian px-2.5 py-1.5"
                  >
                    <span className="text-[10px] text-text-muted">{row.k}</span>
                    <span className={`font-semibold ${row.tone}`}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Layer 03: Pre-Mortem Diff */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-bold text-rejected">
                  03 · {t("how_it_works.step3.badge")}
                </span>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step3.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step3.body")}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-hairline pt-3">
                <div className="inline-flex w-fit rounded-xs border border-hairline bg-obsidian p-0.5 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDiffMode("optimistic")}
                    aria-pressed={diffMode === "optimistic"}
                    className={cn(
                      "rounded-xs px-2.5 py-1 uppercase tracking-wider transition-colors",
                      diffMode === "optimistic"
                        ? "bg-elevated font-semibold text-text-primary"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {t("how_it_works.step3.left_label")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffMode("premortem")}
                    aria-pressed={diffMode === "premortem"}
                    className={cn(
                      "rounded-xs px-2.5 py-1 uppercase tracking-wider transition-colors",
                      diffMode === "premortem"
                        ? "bg-rejected/15 font-semibold text-rejected"
                        : "text-text-muted hover:text-rejected"
                    )}
                  >
                    {t("how_it_works.step3.right_label")}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {diffMode === "optimistic" ? (
                    <motion.div
                      key="optimistic"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xs border border-hairline bg-obsidian p-3"
                    >
                      <p className="font-sans text-xs leading-relaxed text-text-secondary">
                        {t("how_it_works.step3.left_text")}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="premortem"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xs border border-rejected/45 bg-rejected/10 p-3"
                    >
                      <p className="font-sans text-xs leading-relaxed text-text-primary">
                        {t("how_it_works.step3.right_text")}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Layer 04: Optimism Bias Mirror & Stress Slider */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cleared">
                    04 · {t("how_it_works.step4.badge")}
                  </span>
                  <span className="rounded-xs border border-rejected/45 bg-rejected/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rejected">
                    {t("how_it_works.step4.bias_tag")}
                  </span>
                </div>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step4.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step4.body")}
                </p>
              </div>

              <div className="flex flex-col gap-2 border-t border-hairline pt-3 font-mono text-[11px] tabular-nums">
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    {t("how_it_works.step4.conviction_bar")}
                  </span>
                  <span className="text-text-primary">85%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-xs bg-elevated">
                  <div className="h-full w-[85%] rounded-xs bg-text-primary/75" />
                </div>

                <div className="mt-1 flex justify-between">
                  <span className="text-text-secondary">
                    {t("how_it_works.step4.resilience_bar")}
                  </span>
                  <span className="text-rejected">42%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-xs bg-elevated">
                  <div className="h-full w-[42%] rounded-xs bg-rejected" />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
}
