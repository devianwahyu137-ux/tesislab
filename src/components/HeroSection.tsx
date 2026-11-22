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
      <div className="mx-auto flex h-[260px] w-full max-w-3xl items-center justify-center sm:h-[310px] lg:h-[340px]">
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
 * Flagship Luminous Editorial Hero featuring a dramatic emerald-cyan gradient headline,
 * volumetric studio aura, and a commanding PBR Three.js 3-Mode Risk Monolith.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="hero-ambient-glow relative mx-auto w-full max-w-6xl rounded-md pb-6 pt-7 sm:pb-9 sm:pt-11 md:pb-12 md:pt-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        {/* Crisp Glowing Eyebrow Badge */}
        <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-cleared/40 bg-cleared/12 px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared shadow-[0_0_24px_-4px_rgba(16,185,129,0.45)] sm:mb-5 sm:text-[11px]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared shadow-[0_0_10px_rgba(16,185,129,1)]"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        {/* High-Contrast Display Headline with Luminous Emerald-Cyan Gradient */}
        <h1 className="font-editorial mx-auto max-w-4xl text-[2.1rem] font-medium leading-[1.06] tracking-[-0.025em] text-ink-primary sm:text-5xl lg:text-[4rem]">
          {t("hero.headline")}{" "}
          <span className="text-gradient-luminous italic">
            {t("hero.headline_accent")}
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl font-sans text-sm leading-relaxed text-ink-secondary sm:mt-5 sm:text-base">
          {t("hero.subheadline")}
        </p>

        {/* High-Contrast Dual CTAs */}
        <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-2.5 sm:mt-7 sm:flex sm:w-auto sm:max-w-none sm:items-center sm:justify-center sm:gap-4">
          <motion.button
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={scrollToWorkspace}
            className="cta-primary-polish inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-cleared px-4 font-sans text-xs font-semibold tracking-wide text-on-cleared transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-h-[48px] sm:gap-2 sm:px-7 sm:text-sm"
          >
            <span className="truncate">{t("hero.cta_primary")}</span>
            <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDemoClick}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-active-border bg-white px-4 font-sans text-xs font-semibold tracking-wide text-[#090C11] shadow-lg transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared sm:min-h-[48px] sm:gap-2 sm:px-7 sm:text-sm [[data-theme=light]_&]:bg-[#0F172A] [[data-theme=light]_&]:text-white [[data-theme=light]_&]:hover:bg-slate-800"
          >
            <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
            <span className="truncate">{t("hero.cta_demo")}</span>
          </motion.button>
        </div>

        {/* Commanding PBR Three.js 3-Mode Risk Monolith */}
        <div className="mt-3 w-full sm:mt-4">
          <Hero3DCenterpiece />
        </div>

        {/* 3 Crisp Transparency Pillars */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-hairline/80 pt-4 sm:gap-x-8 sm:pt-5">
          {(
            [
              "hero.trust_badges.deterministic",
              "hero.trust_badges.macro",
              "hero.trust_badges.free",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 font-sans text-xs font-medium text-ink-secondary"
            >
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-cleared"
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
