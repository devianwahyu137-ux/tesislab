"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useTranslation } from "@/context/LanguageContext";

const EVIDENCE_URLS: readonly string[] = [
  "https://hbr.org/2007/09/performing-a-project-premortem",
  "https://doi.org/10.2307/1914185",
  "https://arxiv.org/abs/2310.13548",
  "https://en.wikipedia.org/wiki/Drawdown_(economics)",
  "https://www.cbinsights.com/research/startup-failure-reasons-top/",
  "https://www.bi.go.id/",
];

/**
 * 6-Card Empirical Evidence Section (#riset) grounding TesisLab's Pre-Mortem
 * and deterministic veto methodology in published academic & industry research.
 */
export function EmpiricalEvidenceSection() {
  const { dict, t } = useTranslation();

  return (
    <section
      id="riset"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-12 md:py-16"
    >
      {/* Clean Editorial Header */}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center md:mb-10">
        <span className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-cleared">
          {t("evidence.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("evidence.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("evidence.subtitle")}
        </p>
      </div>

      {/* 6 Precision Research Cards (Zero decorative macOS dots, clickable references) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {dict.evidence.cards.map((card, idx) => {
          const href = EVIDENCE_URLS[idx];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.42,
                delay: (idx % 3) * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <SpotlightCard className="h-full hover:-translate-y-0.5 transition-all">
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
                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <span className="font-sans text-xs font-semibold text-text-secondary">
                    {card.author}
                  </span>

                  <div className="font-mono text-2xl font-bold tracking-tight text-cleared tabular-nums">
                    {card.metric}
                  </div>

                  <p className="font-sans text-xs leading-relaxed text-text-secondary">
                    {card.summary}
                  </p>
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
