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
      <div className="mx-auto flex h-[230px] w-full max-w-2xl items-center justify-center sm:h-[265px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
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
 * High-contrast Institutional Editorial Hero featuring an unboxed interactive
 * Three.js 3D Risk Sculpture floating directly over the tactile ledger canvas.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="hero-ambient-glow relative mx-auto w-full max-w-6xl rounded-sm pb-4 pt-5 sm:pb-6 sm:pt-8 md:pb-8 md:pt-11">
      {/* Floating Financial Artifacts Framing the Hero (Desktop xl+, subtle depth parallax) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden overflow-visible xl:block"
      >
        {/* Top-Left: Mini Audit Log Terminal */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          className="surface-specular absolute left-2 top-8 w-44 -rotate-3 rounded-sm border border-hairline bg-obsidian/90 p-2.5 backdrop-blur-xs"
        >
          <div className="mb-1.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rejected/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-conditional/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-cleared/70" />
            <span className="ml-1 font-mono text-[8px] text-text-muted">
              audit_bbca.log
            </span>
          </div>
          <div className="space-y-1 font-mono text-[9px]">
            <div className="flex justify-between">
              <span className="text-text-muted">R:R</span>
              <span className="font-semibold text-rejected">1 : 0.88 ⚠</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface">
              <div className="h-full w-[42%] bg-rejected" />
            </div>
            <span className="block text-[8px] text-conditional">
              FLAG: LOW_RR_RATIO
            </span>
          </div>
        </motion.div>

        {/* Mid-Left: Tilted Auditor Sticky Note */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-6 top-52 w-40 -rotate-6 rounded-xs border border-conditional/45 bg-conditional/12 p-3 shadow-lg backdrop-blur-xs"
        >
          <span className="block font-mono text-[8px] font-bold uppercase tracking-widest text-conditional">
            CATATAN AUDITOR
          </span>
          <p className="mt-1 font-editorial text-xs italic leading-snug text-text-primary">
            &ldquo;Cek SL vs ATR-14 dulu sebelum entry saat IHSG koreksi!&rdquo;
          </p>
        </motion.div>

        {/* Top-Right: Mini Hermes Macro Radar Card */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="surface-specular absolute right-2 top-10 w-44 rotate-3 rounded-sm border border-hairline bg-obsidian/90 p-2.5 backdrop-blur-xs"
        >
          <div className="mb-1.5 flex items-center justify-between font-mono text-[8px]">
            <span className="text-text-muted">hermes_macro.json</span>
            <span className="rounded-xs bg-rejected/15 px-1 text-rejected">
              RISK_OFF
            </span>
          </div>
          <div className="space-y-1 font-mono text-[9px]">
            <div className="flex justify-between">
              <span className="text-text-muted">IHSG</span>
              <span className="text-rejected">-0.92%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">MONTE CARLO</span>
              <span className="text-cleared">1,000 PATHS</span>
            </div>
          </div>
        </motion.div>

        {/* Mid-Right: Drawdown Asymmetry Card */}
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
          className="surface-specular absolute right-6 top-56 w-40 rotate-6 rounded-xs border border-cleared/35 bg-obsidian/90 p-2.5 backdrop-blur-xs"
        >
          <span className="block font-mono text-[8px] uppercase tracking-widest text-text-muted">
            DRAWDOWN LAW
          </span>
          <span className="mt-1 block font-mono text-xs font-bold text-cleared">
            -50% → +100%
          </span>
          <span className="mt-0.5 block font-mono text-[8px] text-text-secondary">
            DSR ≤ 30% · MAX 2%
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-2.5 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-cleared sm:mb-3.5 sm:text-[11px]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        <h1 className="font-editorial mx-auto max-w-3xl text-[1.85rem] font-medium leading-[1.08] tracking-[-0.02em] text-ink-primary sm:text-5xl lg:text-[3.5rem]">
          {t("hero.headline")}{" "}
          <span className="relative inline-block italic text-ink-secondary">
            {t("hero.headline_accent")}
            {/* Subtle Hand-Drawn Auditor Pen Underline */}
            <svg
              aria-hidden="true"
              viewBox="0 0 280 12"
              fill="none"
              className="pointer-events-none absolute -bottom-1.5 left-0 h-2.5 w-full text-cleared/70"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8.5 C 68 3.5, 195 2.5, 278 7.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-xl font-sans text-[13px] leading-relaxed text-ink-secondary sm:mt-4 sm:text-sm md:text-[15px]">
          {t("hero.subheadline")}
        </p>

        {/* Compact Dual CTAs (side-by-side even on mobile) */}
        <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2 sm:mt-6 sm:flex sm:w-auto sm:max-w-none sm:items-center sm:justify-center sm:gap-3">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={scrollToWorkspace}
            className="cta-primary-polish inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-sm bg-cleared px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-on-cleared transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-h-[46px] sm:gap-2 sm:px-6 sm:text-xs"
          >
            <span className="truncate">{t("hero.cta_primary")}</span>
            <ArrowDownRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDemoClick}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-sm border border-transparent bg-white px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0B0D10] shadow-md transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared sm:min-h-[46px] sm:gap-2 sm:px-6 sm:text-xs [[data-theme=light]_&]:bg-[#0F172A] [[data-theme=light]_&]:text-white [[data-theme=light]_&]:hover:bg-slate-800"
          >
            <Play className="h-3 w-3 shrink-0 fill-current sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span className="truncate">{t("hero.cta_demo")}</span>
          </motion.button>
        </div>

        {/* Unboxed Interactive 3D Hero Centerpiece (Three.js, alpha transparent) */}
        <div className="mt-1 w-full sm:mt-2">
          <Hero3DCenterpiece />
        </div>

        {/* 3 Compact Transparency Pillars + Scroll Cue */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-hairline/80 pt-3 sm:gap-x-6 sm:pt-4">
          {(
            [
              "hero.trust_badges.deterministic",
              "hero.trust_badges.macro",
              "hero.trust_badges.free",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="flex items-center gap-1.5 font-mono text-[10px] text-ink-secondary sm:gap-2 sm:text-[11px]"
            >
              <ShieldCheck
                className="h-3 w-3 shrink-0 text-cleared sm:h-3.5 sm:w-3.5"
                aria-hidden="true"
              />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollToWorkspace}
          className="mt-3 font-mono text-[9.5px] tracking-[0.14em] text-ink-muted transition-colors hover:text-cleared sm:mt-4 sm:text-[10px]"
        >
          {t("hero.scroll_cue")}
        </button>
      </motion.div>
    </section>
  );
}
