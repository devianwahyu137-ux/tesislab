"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext";

/**
 * 6-Card Empirical Evidence Section (#riset) grounding TesisLab's Pre-Mortem
 * and deterministic veto methodology in published academic & industry research.
 */
export function EmpiricalEvidenceSection() {
  const { dict, t } = useTranslation();

  return (
    <section
      id="riset"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-16 md:py-24"
    >
      {/* Centered Editorial Header */}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center md:mb-10">
        <span className="mb-3 inline-flex items-center rounded-full border border-active-border bg-obsidian/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
          {t("evidence.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("evidence.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("evidence.subtitle")}
        </p>
      </div>

      {/* 6 Precision Research Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {dict.evidence.cards.map((card, idx) => (
          <motion.article
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.42,
              delay: (idx % 3) * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col justify-between overflow-hidden rounded-sm border border-hairline bg-obsidian/85"
          >
            {/* Mini Terminal Header */}
            <div className="flex items-center justify-between gap-2 border-b border-hairline bg-surface px-3.5 py-2">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-rejected/55" />
                <span className="h-1.5 w-1.5 rounded-full bg-conditional/55" />
                <span className="h-1.5 w-1.5 rounded-full bg-cleared/55" />
              </div>
              <span className="truncate font-mono text-[10px] tracking-wider text-text-muted">
                {card.journal}
              </span>
            </div>

            {/* Card Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-xs font-semibold text-text-secondary">
                  {card.author}
                </span>
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-active-border bg-surface font-mono text-[10px] font-bold text-text-primary">
                  {card.initials}
                </span>
              </div>

              <div className="font-mono text-2xl font-bold tracking-tight text-cleared tabular-nums">
                {card.metric}
              </div>

              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {card.summary}
              </p>
            </div>

            {/* DOI / Reference Footer */}
            <div className="border-t border-hairline bg-surface/60 px-4 py-2.5">
              <span className="block truncate font-mono text-[10px] text-text-muted">
                {card.ref}
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
