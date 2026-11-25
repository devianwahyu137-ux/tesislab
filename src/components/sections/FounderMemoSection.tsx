"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Cpu, ShieldCheck, Skull } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Editorial Founder's Memo terminal document (#memo).
 * Establishes the human, anti-sycophancy manifesto behind TesisLab with
 * crisp Swiss registration marks, 3 core principle anchors, and workspace CTA.
 */
export function FounderMemoSection() {
  const { t } = useTranslation();

  const pillars = [
    {
      code: "01",
      label: t("memo.pillar_1"),
      Icon: Cpu,
      tone: "text-cleared border-cleared/30 bg-cleared/8",
    },
    {
      code: "02",
      label: t("memo.pillar_2"),
      Icon: ShieldCheck,
      tone: "text-conditional border-conditional/30 bg-conditional/8",
    },
    {
      code: "03",
      label: t("memo.pillar_3"),
      Icon: Skull,
      tone: "text-rejected border-rejected/30 bg-rejected/8",
    },
  ] as const;

  return (
    <section
      id="memo"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-8 sm:py-12 md:py-16"
    >
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="surface-specular glow-emerald relative mx-auto max-w-3xl overflow-hidden rounded-md border border-active-border/80 bg-surface"
      >
        {/* Top Emerald Accent Hairline */}
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-gradient-to-r from-cleared via-cleared/40 to-transparent"
        />

        {/* Editorial Terminal Letterhead Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-obsidian px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rejected/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-conditional/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-cleared/60" />
            </div>
            <span className="font-mono text-xs font-medium tracking-wider text-text-primary">
              {t("memo.filename")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-xs border border-hairline bg-surface px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted sm:inline">
              READ-ONLY · MANIFESTO
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cleared">
              {t("memo.badge")}
            </span>
          </div>
        </header>

        {/* Document Body with Subtle Left Binder Margin Holes */}
        <div className="relative px-5 py-7 sm:px-8 sm:py-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-8 left-2.5 hidden flex-col justify-between sm:flex"
          >
            {[0, 1, 2, 3].map((hole) => (
              <span
                key={hole}
                className="h-3 w-3 rounded-full border border-hairline bg-canvas shadow-inner"
              />
            ))}
          </div>

          <div className="sm:pl-4">
          {/* 3 Core Principles Visual Strip */}
          <div className="mb-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {pillars.map(({ code, label, Icon, tone }) => (
              <div
                key={code}
                className="flex items-center gap-2.5 rounded-xs border border-hairline bg-obsidian/80 px-3 py-2.5"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border ${tone}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="block font-mono text-[9px] uppercase tracking-widest text-text-muted">
                    PRINSIP {code}
                  </span>
                  <span className="block truncate font-mono text-[11px] font-semibold text-text-primary">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5 border-l border-hairline/80 pl-4 sm:pl-6">
            <p className="font-sans text-sm leading-relaxed text-text-secondary sm:text-[15px]">
              {t("memo.p1")}
            </p>

            <p className="font-sans text-sm leading-relaxed text-text-secondary sm:text-[15px]">
              {t("memo.p2")}
            </p>

            {/* Highlighted Core Manifesto Quote */}
            <blockquote className="relative overflow-hidden rounded-xs border border-cleared/35 border-l-4 border-l-cleared bg-cleared/8 px-4 py-4 font-editorial text-lg leading-snug text-text-primary sm:px-5 sm:text-xl">
              {t("memo.p3")}
            </blockquote>

            <p className="font-sans text-sm leading-relaxed text-text-secondary sm:text-[15px]">
              {t("memo.p4")}
            </p>

            {/* Editorial Signature + Action Link */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-hairline pt-5">
              <a
                href="/terminal/audit"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xs border border-cleared/45 bg-cleared/10 px-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/20"
              >
                <span>{t("hero.cta_primary")}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <div className="flex items-center gap-3">
                {/* Circular Anti-Yes-Man Verification Seal */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 64 64"
                  className="h-11 w-11 shrink-0 -rotate-12 text-cleared/75"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <text
                    x="32"
                    y="30"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="7"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                  >
                    VERIFIED
                  </text>
                  <text
                    x="32"
                    y="39"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="6"
                    fontFamily="var(--font-mono)"
                  >
                    MATH FIRST
                  </text>
                </svg>

                <div className="flex flex-col items-end gap-1">
                  <span className="font-editorial text-base italic text-text-primary">
                    {t("memo.signature")}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    {t("memo.version")} · tesislab.app
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </motion.article>
    </section>
  );
}
