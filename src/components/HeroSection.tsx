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
    <section className="hero-ambient-glow relative mx-auto w-full max-w-5xl rounded-sm pb-4 pt-5 sm:pb-6 sm:pt-8 md:pb-8 md:pt-11">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
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
          <span className="italic text-ink-secondary">
            {t("hero.headline_accent")}
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
