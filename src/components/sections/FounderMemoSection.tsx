"use client";

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
      className="mx-auto w-full max-w-6xl border-t border-hairline py-16 md:py-24"
    >
      <article className="mx-auto max-w-3xl overflow-hidden rounded-sm border border-active-border/80 bg-surface shadow-xl shadow-black/40">
        {/* Terminal Document Header */}
        <header className="flex items-center justify-between gap-3 border-b border-hairline bg-obsidian px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rejected/55" />
              <span className="h-2.5 w-2.5 rounded-full bg-conditional/55" />
              <span className="h-2.5 w-2.5 rounded-full bg-cleared/55" />
            </div>
            <span className="font-mono text-xs font-medium text-text-primary">
              {t("memo.filename")}
            </span>
          </div>

          <span className="rounded-xs border border-hairline bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
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
      </article>
    </section>
  );
}
