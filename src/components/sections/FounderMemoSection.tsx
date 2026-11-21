"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Editorial Founder's Memo terminal document (#memo).
 * Establishes the human, anti-sycophancy manifesto behind TesisLab.
 */
export function FounderMemoSection() {
  const { t } = useTranslation();

  return (
    <section
      id="memo"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-12 md:py-16"
    >
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl overflow-hidden rounded-sm border border-active-border/80 bg-surface shadow-xl shadow-black/40"
      >
        {/* Editorial Letterhead Header */}
        <header className="flex items-center justify-between gap-3 border-b border-hairline bg-obsidian px-5 py-3.5 sm:px-8">
          <span className="font-mono text-xs font-medium tracking-wider text-text-primary">
            {t("memo.filename")}
          </span>

          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            {t("memo.badge")}
          </span>
        </header>

        {/* Document Body */}
        <div className="flex flex-col gap-5 px-5 py-7 sm:px-8 sm:py-9">
          <p className="font-sans text-sm leading-relaxed text-text-secondary sm:text-[15px]">
            {t("memo.p1")}
          </p>

          <p className="font-sans text-sm leading-relaxed text-text-secondary sm:text-[15px]">
            {t("memo.p2")}
          </p>

          {/* Highlighted Core Manifesto */}
          <blockquote className="rounded-xs border-l-2 border-cleared bg-cleared/8 px-4 py-3.5 font-editorial text-lg leading-snug text-text-primary sm:text-xl">
            {t("memo.p3")}
          </blockquote>

          <p className="font-sans text-sm leading-relaxed text-text-secondary sm:text-[15px]">
            {t("memo.p4")}
          </p>

          {/* Editorial Signature */}
          <div className="mt-4 flex flex-col items-end gap-1.5 border-t border-hairline pt-5">
            <span className="font-editorial text-base italic text-text-primary">
              {t("memo.signature")}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              {t("memo.version")}
            </span>
          </div>
        </div>
      </motion.article>
    </section>
  );
}
