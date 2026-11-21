"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, Play, ShieldCheck } from "lucide-react";
import { HeroArtifacts } from "@/components/hero/HeroArtifacts";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";

export interface HeroSectionProps {
  macroContext: MarketContext;
}

function scrollToWorkspace() {
  const el = document.getElementById("audit-workspace-slot");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Monumental Centered Editorial Hero standing freely on the blueprint canvas
 * (no constraining outer card), flanked on xl+ by live scroll-parallax macro artifacts.
 */
export function HeroSection({ macroContext }: HeroSectionProps) {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="relative mx-auto w-full max-w-6xl py-16 md:py-24 lg:py-28">
      {/* 4 Live Scroll-Parallax Financial Instruments (xl+) */}
      <HeroArtifacts macroContext={macroContext} />

      {/* Centered Editorial Stack */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/85 px-3.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-secondary sm:text-[11px]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cleared"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        <h1 className="font-editorial mx-auto max-w-3xl text-4xl font-medium leading-[1.06] tracking-[-0.02em] text-ink-primary sm:text-5xl lg:text-[4rem]">
          {t("hero.headline")}{" "}
          <span className="italic text-ink-secondary">
            {t("hero.headline_accent")}
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl font-sans text-sm leading-relaxed text-ink-secondary md:text-base">
          {t("hero.subheadline")}
        </p>

        {/* Clean Dual CTAs */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={scrollToWorkspace}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm bg-cleared px-6 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared transition-opacity hover:opacity-92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
          >
            <span>{t("hero.cta_primary")}</span>
            <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDemoClick}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm border border-active-border bg-surface px-6 font-mono text-xs font-medium uppercase tracking-wider text-ink-primary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 shrink-0 text-ink-secondary" aria-hidden="true" />
            <span>{t("hero.cta_demo")}</span>
          </motion.button>
        </div>

        {/* Sleek Conviction vs. Reality Gap Preview Strip */}
        <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2.5 rounded-sm border border-hairline bg-surface/90 px-4 py-2 font-mono text-[11px] tabular-nums">
          <span className="text-ink-muted">
            {t("hero.preview_strip.conviction_label")}{" "}
            <strong className="text-ink-primary">
              {t("hero.preview_strip.conviction_val")}
            </strong>
          </span>
          <span className="text-hairline" aria-hidden="true">
            vs
          </span>
          <span className="text-ink-muted">
            {t("hero.preview_strip.reality_label")}{" "}
            <strong className="text-rejected">
              {t("hero.preview_strip.reality_val")}
            </strong>
          </span>
          <span className="text-ink-muted" aria-hidden="true">
            →
          </span>
          <span className="rounded-xs border border-rejected/40 bg-rejected/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rejected">
            {t("hero.preview_strip.gap_badge")}
          </span>
        </div>

        {/* 3 Clean Transparency Pillars */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-hairline pt-5">
          {(
            [
              "hero.trust_badges.deterministic",
              "hero.trust_badges.macro",
              "hero.trust_badges.free",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 font-mono text-[11px] text-ink-secondary"
            >
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-cleared"
                aria-hidden="true"
              />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
