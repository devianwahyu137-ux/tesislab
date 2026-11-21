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
    <section className="hero-ambient-glow relative mx-auto w-full max-w-5xl rounded-sm pb-6 pt-8 md:pb-8 md:pt-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-3.5 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-cleared">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        <h1 className="font-editorial mx-auto max-w-3xl text-4xl font-medium leading-[1.06] tracking-[-0.02em] text-ink-primary sm:text-5xl lg:text-[3.6rem]">
          {t("hero.headline")}{" "}
          <span className="italic text-ink-secondary">
            {t("hero.headline_accent")}
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-ink-secondary md:text-[15px]">
          {t("hero.subheadline")}
        </p>

        {/* High-Contrast Dual CTAs */}
        <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={scrollToWorkspace}
            className="cta-primary-polish inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm bg-cleared px-6 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
          >
            <span>{t("hero.cta_primary")}</span>
            <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDemoClick}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm border border-transparent bg-white px-6 font-mono text-xs font-semibold uppercase tracking-wider text-[#0B0D10] shadow-md transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared sm:w-auto [[data-theme=light]_&]:bg-[#0F172A] [[data-theme=light]_&]:text-white [[data-theme=light]_&]:hover:bg-slate-800"
          >
            <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
            <span>{t("hero.cta_demo")}</span>
          </motion.button>
        </div>

        {/* Unboxed Interactive 3D Hero Centerpiece (Three.js, alpha transparent) */}
        <div className="mt-2 w-full">
          <Hero3DCenterpiece />
        </div>

        {/* 3 Compact Transparency Pillars + Scroll Cue */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-hairline/80 pt-4">
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

        <button
          type="button"
          onClick={scrollToWorkspace}
          className="mt-4 font-mono text-[10px] tracking-[0.16em] text-ink-muted transition-colors hover:text-cleared"
        >
          {t("hero.scroll_cue")}
        </button>
      </motion.div>
    </section>
  );
}
