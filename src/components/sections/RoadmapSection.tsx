"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Transparent 2-column Product Progress Board (#roadmap)
 * contrasting live free v1.0 capabilities with upcoming v2.0 Pro modules.
 */
export function RoadmapSection() {
  const { dict, t } = useTranslation();

  return (
    <section
      id="roadmap"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-12 md:py-16"
    >
      {/* Centered Editorial Header */}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center">
        <span className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-cleared">
          {t("roadmap.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("roadmap.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("roadmap.subtitle")}
        </p>
      </div>

      {/* 2-Column Progress Board */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Left: v1.0 LIVE */}
        <div className="surface-specular flex flex-col gap-4 rounded-sm border border-hairline border-t-2 border-t-cleared bg-surface p-5">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cleared">
              {t("roadmap.v1_badge")}
            </span>
            <span className="h-2 w-2 rounded-full bg-cleared" aria-hidden="true" />
          </div>

          <ul className="flex flex-col gap-3">
            {dict.roadmap.v1_items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
                  aria-hidden="true"
                />
                <span className="font-sans text-sm leading-snug text-text-primary">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: v2.0 PRO ROADMAP */}
        <div className="surface-specular flex flex-col gap-4 rounded-sm border border-hairline border-t-2 border-t-conditional/70 bg-surface p-5">
          <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-conditional">
              {t("roadmap.v2_badge")}
            </span>
            <span className="rounded-xs border border-conditional/40 bg-conditional/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-conditional">
              {t("roadmap.coming_soon")}
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {dict.roadmap.v2_items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Clock
                  className="mt-0.5 h-4 w-4 shrink-0 text-conditional"
                  aria-hidden="true"
                />
                <span className="font-sans text-sm leading-snug text-text-secondary">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
