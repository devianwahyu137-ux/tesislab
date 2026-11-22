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
      <div className="mx-auto flex h-[190px] w-full max-w-2xl items-center justify-center sm:h-[250px] lg:h-[360px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
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
 * Balanced 2-Column Executive Hero on Desktop (fits 100% above the fold with zero cut-off)
 * and ultra-compact centered stack on Mobile & iPad.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="hero-ambient-glow relative mx-auto w-full max-w-6xl rounded-md px-1 pb-4 pt-3 sm:px-2 sm:pb-7 sm:pt-6 lg:py-8">
      <div className="grid grid-cols-1 items-center gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Editorial Headline, Subheadline, CTAs & Trust Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left"
        >
          {/* Compact Glowing Eyebrow Badge */}
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-cleared/40 bg-cleared/12 px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.15em] text-cleared shadow-[0_0_20px_-4px_rgba(16,185,129,0.45)] sm:mb-3.5 sm:px-3 sm:py-1 sm:text-[10.5px]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared shadow-[0_0_8px_rgba(16,185,129,1)]"
            />
            <span>{t("hero.eyebrow")}</span>
          </div>

          {/* High-Contrast Display Headline with Luminous Emerald-Cyan Gradient */}
          <h1 className="font-editorial text-[1.65rem] font-medium leading-[1.08] tracking-[-0.025em] text-ink-primary sm:text-4xl lg:text-[2.9rem] xl:text-[3.35rem]">
            {t("hero.headline")}{" "}
            <span className="text-gradient-luminous italic">
              {t("hero.headline_accent")}
            </span>
          </h1>

          <p className="mt-2.5 max-w-lg font-sans text-xs leading-relaxed text-ink-secondary sm:mt-3.5 sm:text-sm lg:text-[15px]">
            {t("hero.subheadline")}
          </p>

          {/* Compact Dual CTAs */}
          <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 sm:mt-5 sm:flex sm:w-auto sm:max-w-none sm:items-center sm:gap-3">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={scrollToWorkspace}
              className="cta-primary-polish inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md bg-cleared px-3 font-sans text-[11px] font-semibold tracking-wide text-on-cleared transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-h-[44px] sm:gap-2 sm:px-5 sm:text-[13px]"
            >
              <span className="truncate">{t("hero.cta_primary")}</span>
              <ArrowDownRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            </motion.button>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleDemoClick}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-active-border bg-white px-3 font-sans text-[11px] font-semibold tracking-wide text-[#090C11] shadow-md transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared sm:min-h-[44px] sm:gap-2 sm:px-5 sm:text-[13px] [[data-theme=light]_&]:bg-[#0F172A] [[data-theme=light]_&]:text-white [[data-theme=light]_&]:hover:bg-slate-800"
            >
              <Play className="h-3 w-3 shrink-0 fill-current sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              <span className="truncate">{t("hero.cta_demo")}</span>
            </motion.button>
          </div>

          {/* 3 Compact Transparency Pillars */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-hairline/80 pt-3 sm:mt-5 sm:gap-x-5 sm:pt-4 lg:justify-start">
            {(
              [
                "hero.trust_badges.deterministic",
                "hero.trust_badges.macro",
                "hero.trust_badges.free",
              ] as const
            ).map((key) => (
              <div
                key={key}
                className="flex items-center gap-1.5 font-sans text-[10.5px] font-medium text-ink-secondary sm:text-xs"
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

        {/* Right Column: Full Commanding PBR Three.js 3-Mode Risk Monolith (100% visible above the fold) */}
        <div className="relative z-10 w-full lg:col-span-6">
          <Hero3DCenterpiece />
        </div>
      </div>

      {/* Centered Subtle Scroll Cue */}
      <div className="mt-3 flex justify-center sm:mt-4 lg:mt-5">
        <button
          type="button"
          onClick={scrollToWorkspace}
          className="font-sans text-[11px] font-medium text-ink-muted transition-colors hover:text-cleared"
        >
          {t("hero.scroll_cue")}
        </button>
      </div>
    </section>
  );
}
