"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Brain, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type EvidenceCategory = "all" | "psychology" | "risk_math";

const CARD_META: readonly {
  url: string;
  category: Exclude<EvidenceCategory, "all">;
  accentBar: string;
  metricColor: string;
  pillBg: string;
  appliedHref: string;
  appliedTagId: string;
  appliedTagEn: string;
  progressPct: number;
  microBenchmarks: readonly string[];
}[] = [
  {
    url: "https://hbr.org/2007/09/performing-a-project-premortem",
    category: "psychology",
    accentBar: "bg-cleared",
    metricColor: "text-cleared",
    pillBg: "border-cleared/35 bg-cleared/10 text-cleared",
    appliedHref: "#audit-workspace-slot",
    appliedTagId: "3 Titik Buta Pre-Mortem",
    appliedTagEn: "3 Pre-Mortem Blind Spots",
    progressPct: 82,
    microBenchmarks: ["Prospective Hindsight", "+30% Risk Detection"],
  },
  {
    url: "https://doi.org/10.2307/1914185",
    category: "psychology",
    accentBar: "bg-sky-400",
    metricColor: "text-sky-400",
    pillBg: "border-sky-400/35 bg-sky-400/10 text-sky-400",
    appliedHref: "#audit-workspace-slot",
    appliedTagId: "Cermin Bias Optimisme",
    appliedTagEn: "Optimism Bias Mirror",
    progressPct: 76,
    microBenchmarks: ["Loss Aversion 2.25×", "Outside View Anchor"],
  },
  {
    url: "https://arxiv.org/abs/2310.13548",
    category: "psychology",
    accentBar: "bg-conditional",
    metricColor: "text-conditional",
    pillBg: "border-conditional/35 bg-conditional/10 text-conditional",
    appliedHref: "#cara-kerja",
    appliedTagId: "Gerbang Veto Deterministik",
    appliedTagEn: "Deterministic Veto Gate",
    progressPct: 90,
    microBenchmarks: ["RLHF Bias Mitigated", "Hard Math Override"],
  },
  {
    url: "https://en.wikipedia.org/wiki/Drawdown_(economics)",
    category: "risk_math",
    accentBar: "bg-rejected",
    metricColor: "text-rejected",
    pillBg: "border-rejected/35 bg-rejected/10 text-rejected",
    appliedHref: "#committee-showcase",
    appliedTagId: "Aturan Risiko 2% & R:R",
    appliedTagEn: "2% Risk Cap & R:R Rule",
    progressPct: 100,
    microBenchmarks: ["-20% → +25%", "-50% → +100%", "-75% → +300%"],
  },
  {
    url: "https://www.cbinsights.com/research/startup-failure-reasons-top/",
    category: "risk_math",
    accentBar: "bg-conditional",
    metricColor: "text-conditional",
    pillBg: "border-conditional/35 bg-conditional/10 text-conditional",
    appliedHref: "#audit-workspace-slot",
    appliedTagId: "Simulasi Runway & BEP",
    appliedTagEn: "Runway & BEP Stress Test",
    progressPct: 68,
    microBenchmarks: ["Runway < 6 Mo = Fragile", "-50% Shock Test"],
  },
  {
    url: "https://www.bi.go.id/",
    category: "risk_math",
    accentBar: "bg-cleared",
    metricColor: "text-cleared",
    pillBg: "border-cleared/35 bg-cleared/10 text-cleared",
    appliedHref: "#audit-workspace-slot",
    appliedTagId: "Ambang DSR ≤ 30%",
    appliedTagEn: "DSR ≤ 30% Gate",
    progressPct: 72,
    microBenchmarks: ["Safe DSR ≤ 30%", "Reserve ≥ 6 Mo"],
  },
];

/**
 * Interactive 6-Card Empirical Evidence Section (#riset) with domain filtering,
 * visual metric bars, direct links to where each paper is enforced in TesisLab,
 * and clickable academic/industry DOI citations.
 */
export function EmpiricalEvidenceSection() {
  const { dict, locale, t } = useTranslation();
  const [filter, setFilter] = useState<EvidenceCategory>("all");

  const visibleCards = dict.evidence.cards
    .map((card, idx) => ({ card, idx, meta: CARD_META[idx] }))
    .filter(({ meta }) => filter === "all" || meta?.category === filter);

  return (
    <section
      id="riset"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-8 sm:py-12 md:py-16"
    >
      {/* Clean Editorial Header */}
      <div className="mx-auto mb-5 flex max-w-2xl flex-col items-center text-center sm:mb-7">
        <span className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-cleared sm:mb-2.5 sm:text-[11px]">
          {t("evidence.eyebrow")}
        </span>
        <h2 className="font-editorial text-xl font-medium leading-[1.14] tracking-tight text-text-primary sm:text-3xl md:text-4xl">
          {t("evidence.title")}
        </h2>
        <p className="mt-2.5 font-sans text-xs leading-relaxed text-text-secondary sm:mt-3 sm:text-sm">
          {t("evidence.subtitle")}
        </p>
      </div>

      {/* Interactive Domain Filter Tabs */}
      <div className="mb-7 flex justify-center">
        <div
          role="tablist"
          aria-label={t("evidence.eyebrow")}
          className="inline-flex flex-wrap items-center justify-center gap-1 rounded-sm border border-hairline bg-obsidian p-1"
        >
          {(
            [
              { id: "all", label: t("evidence.filter_all"), Icon: BookOpen },
              { id: "psychology", label: t("evidence.filter_psych"), Icon: Brain },
              { id: "risk_math", label: t("evidence.filter_math"), Icon: ShieldCheck },
            ] as const
          ).map(({ id, label, Icon }) => {
            const isSelected = filter === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setFilter(id)}
                className={cn(
                  "relative inline-flex min-h-[38px] items-center gap-1.5 rounded-xs px-3.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                  isSelected
                    ? "font-semibold text-cleared"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId="evidence-filter-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xs bg-elevated"
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Precision Research Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map(({ card, idx, meta }) => {
          const href = meta?.url;
          const appliedTag =
            locale === "id" ? meta?.appliedTagId : meta?.appliedTagEn;

          return (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.36,
                delay: (idx % 3) * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <SpotlightCard className="flex h-full flex-col transition-transform duration-200 hover:-translate-y-0.5">
                {/* Subtle Top Color Strip */}
                <div
                  aria-hidden="true"
                  className={cn("h-[2px] w-full opacity-80", meta?.accentBar ?? "bg-cleared")}
                />

                {/* Clean Editorial Citation Header */}
                <div className="flex items-center justify-between gap-2 border-b border-hairline bg-obsidian/70 px-4 py-2.5">
                  <span className="truncate font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {card.journal}
                  </span>
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-active-border bg-surface font-mono text-[10px] font-semibold text-text-secondary">
                    {card.initials}
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-xs font-semibold text-text-primary">
                      {card.author}
                    </span>
                    {appliedTag && meta?.appliedHref && (
                      <a
                        href={meta.appliedHref}
                        className={cn(
                          "rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-semibold transition-opacity hover:opacity-80",
                          meta.pillBg
                        )}
                      >
                        {appliedTag}
                      </a>
                    )}
                  </div>

                  <div
                    className={cn(
                      "font-mono text-2xl font-bold tracking-tight tabular-nums",
                      meta?.metricColor ?? "text-cleared"
                    )}
                  >
                    {card.metric}
                  </div>

                  {/* Subtle Visual Evidence Weight Bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-elevated">
                    <div
                      className={cn("h-full rounded-full opacity-80", meta?.accentBar ?? "bg-cleared")}
                      style={{ width: `${meta?.progressPct ?? 75}%` }}
                    />
                  </div>

                  <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
                    {card.summary}
                  </p>

                  {meta?.microBenchmarks && meta.microBenchmarks.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                      {meta.microBenchmarks.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-xs border border-hairline bg-obsidian px-1.5 py-0.5 font-mono text-[9.5px] text-text-muted"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clickable DOI / Reference Footer */}
                <div className="border-t border-hairline bg-obsidian/50 px-4 py-2.5">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex max-w-full items-center gap-1.5 font-mono text-[10px] text-text-muted transition-colors hover:text-cleared"
                    >
                      <span className="truncate">{card.ref}</span>
                      <ArrowUpRight
                        className="h-3 w-3 shrink-0 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </a>
                  ) : (
                    <span className="block truncate font-mono text-[10px] text-text-muted">
                      {card.ref}
                    </span>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
