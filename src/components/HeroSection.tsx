"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowDownRight, Play, ShieldCheck } from "lucide-react";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";

const Hero3DCenterpiece = dynamic(
  () => import("@/components/hero/Hero3DCenterpiece"),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex h-[220px] w-full max-w-2xl items-center justify-center sm:h-[260px]">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          LOADING 3D RISK MONOLITH...
        </span>
      </div>
    ),
  }
);

function scrollToWorkspace() {
  const el = document.getElementById("audit-workspace-slot");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * High-Contrast Luminous Editorial Hero featuring a PBR Three.js 3-Mode Risk Monolith,
 * clean readable glassmorphic specimen cards, and zero clutter across all viewports.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="hero-ambient-glow relative mx-auto w-full max-w-6xl rounded-sm pb-5 pt-6 sm:pb-8 sm:pt-10 md:pb-10 md:pt-12">
      {/* 2 Clean, High-Contrast Floating Glassmorphic Specimen Cards (Desktop xl+ only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden overflow-visible xl:block"
      >
        {/* Left: Crisp Pre-Mortem Risk Trap Specimen */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="glow-amber absolute left-1 top-20 w-52 -rotate-2 rounded-md border border-active-border/80 bg-surface/92 p-3.5 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold text-text-primary">
              Pre-Mortem Check
            </span>
            <span className="rounded-xs border border-rejected/45 bg-rejected/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rejected">
              VETO
            </span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] tabular-nums">
            <div className="flex justify-between">
              <span className="text-text-muted">R:R Ratio</span>
              <span className="font-semibold text-rejected">1 : 0.88</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-obsidian">
              <div className="h-full w-[44%] rounded-full bg-rejected" />
            </div>
            <p className="pt-0.5 font-sans text-[11px] leading-snug text-text-secondary">
              Cek SL vs ATR-14 sebelum entry.
            </p>
          </div>
        </motion.div>

        {/* Right: Crisp Drawdown & Monte Carlo Specimen */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 6.6, repeat: Infinity, ease: "easeInOut" }}
          className="glow-emerald absolute right-1 top-24 w-52 rotate-2 rounded-md border border-cleared/35 bg-surface/92 p-3.5 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold text-text-primary">
              Drawdown Law
            </span>
            <span className="rounded-xs border border-cleared/40 bg-cleared/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cleared">
              1,000×
            </span>
          </div>
          <div className="font-mono text-base font-bold tracking-tight text-cleared tabular-nums">
            -50% → +100%
          </div>
          <p className="mt-1 font-sans text-[11px] leading-snug text-text-secondary">
            Aturan risiko 2% &amp; DSR ≤ 30% terkunci eksak.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cleared/30 bg-cleared/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared sm:mb-4 sm:text-[11px]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.9)]"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        <h1 className="font-editorial mx-auto max-w-3xl text-[2rem] font-medium leading-[1.08] tracking-[-0.02em] text-ink-primary sm:text-5xl lg:text-[3.65rem]">
          {t("hero.headline")}{" "}
          <span className="text-gradient-luminous italic">
            {t("hero.headline_accent")}
          </span>
        </h1>

        <p className="mx-auto mt-3.5 max-w-xl font-sans text-sm leading-relaxed text-ink-secondary sm:mt-4 sm:text-[15px] md:text-base">
          {t("hero.subheadline")}
        </p>

        {/* High-Contrast Dual CTAs */}
        <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2.5 sm:mt-6 sm:flex sm:w-auto sm:max-w-none sm:items-center sm:justify-center sm:gap-3.5">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={scrollToWorkspace}
            className="cta-primary-polish inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-md bg-cleared px-3.5 font-sans text-xs font-semibold tracking-wide text-on-cleared transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-h-[46px] sm:gap-2 sm:px-6 sm:text-[13px]"
          >
            <span className="truncate">{t("hero.cta_primary")}</span>
            <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDemoClick}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-md border border-active-border bg-white px-3.5 font-sans text-xs font-semibold tracking-wide text-[#090C11] shadow-md transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared sm:min-h-[46px] sm:gap-2 sm:px-6 sm:text-[13px] [[data-theme=light]_&]:bg-[#0F172A] [[data-theme=light]_&]:text-white [[data-theme=light]_&]:hover:bg-slate-800"
          >
            <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
            <span className="truncate">{t("hero.cta_demo")}</span>
          </motion.button>
        </div>

        {/* Unboxed Interactive PBR Three.js Hero Centerpiece */}
        <div className="mt-2 w-full sm:mt-3">
          <Hero3DCenterpiece />
        </div>

        {/* 3 Crisp Transparency Pillars + Scroll Cue */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-hairline/80 pt-3.5 sm:gap-x-7 sm:pt-4">
          {(
            [
              "hero.trust_badges.deterministic",
              "hero.trust_badges.macro",
              "hero.trust_badges.free",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="flex items-center gap-1.5 font-sans text-xs font-medium text-ink-secondary"
            >
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-cleared"
                aria-hidden="true"
              />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollToWorkspace}
          className="mt-3 font-sans text-xs font-medium text-ink-muted transition-colors hover:text-cleared sm:mt-4"
        >
          {t("hero.scroll_cue")}
        </button>
      </motion.div>
    </section>
  );
}
