"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const Hero3DCenterpiece = dynamic(
  () => import("@/components/hero/Hero3DCenterpiece"),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex h-[185px] w-full max-w-2xl items-center justify-center sm:h-[225px] lg:h-[245px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          LOADING 3D RISK MONOLITH...
        </span>
      </div>
    ),
  }
);

function scrollToMethodology() {
  const el = document.getElementById("cara-kerja");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Centered Executive Hero on the `(marketing)` landing page (`/`),
 * funneling high-intent users directly into `/terminal/audit` with zero state loss.
 */
export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="hero-ambient-glow relative mx-auto w-full max-w-6xl rounded-md px-1 pb-3 pt-2 sm:px-2 sm:pb-5 sm:pt-4 lg:pb-6 lg:pt-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        {/* Compact Eyebrow Badge */}
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-cleared/35 bg-cleared/10 px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.15em] text-cleared sm:mb-3 sm:px-3 sm:py-1 sm:text-[10.5px]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        {/* High-Contrast Display Headline */}
        <h1 className="font-editorial text-[1.65rem] font-medium leading-[1.08] tracking-[-0.025em] text-ink-primary sm:text-4xl lg:text-[3.15rem]">
          {t("hero.headline")}{" "}
          <span className="text-gradient-luminous italic">
            {t("hero.headline_accent")}
          </span>
        </h1>

        <p className="editorial-measure mt-2.5 font-sans text-xs leading-relaxed text-ink-secondary sm:mt-3 sm:text-sm lg:text-[15px]">
          {t("hero.subheadline")}
        </p>

        {/* Dual Conversion CTAs Launching the Dedicated Terminal App */}
        <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 sm:mt-5 sm:flex sm:w-auto sm:max-w-none sm:items-center sm:justify-center sm:gap-3">
          <Link
            href="/terminal/audit"
            className="cta-primary-polish inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md bg-cleared px-3 font-sans text-[11px] font-semibold tracking-wide text-on-cleared transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-h-[42px] sm:gap-2 sm:px-5 sm:text-[13px]"
          >
            <span className="truncate">{t("hero.cta_primary")}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/terminal/audit?demo=1"
            className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-active-border bg-white px-3 font-sans text-[11px] font-semibold tracking-wide text-[#090C11] shadow-sm transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared sm:min-h-[42px] sm:gap-2 sm:px-5 sm:text-[13px] [[data-theme=light]_&]:bg-[#0F172A] [[data-theme=light]_&]:text-white [[data-theme=light]_&]:hover:bg-slate-800"
          >
            <Play className="h-3 w-3 shrink-0 fill-current sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span className="truncate">{t("hero.cta_demo")}</span>
          </Link>
        </div>

        {/* Centered PBR Three.js 3-Mode Risk Monolith below CTAs */}
        <div className="relative z-10 mt-3 w-full sm:mt-4">
          <Hero3DCenterpiece />
        </div>

        {/* 3 Compact Transparency Pillars */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-hairline/80 pt-2.5 sm:mt-4 sm:gap-x-6 sm:pt-3">
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

        {/* Centered Subtle Scroll Cue */}
        <div className="mt-2.5 flex justify-center sm:mt-3">
          <button
            type="button"
            onClick={scrollToMethodology}
            className="font-sans text-[11px] font-medium text-ink-muted transition-colors hover:text-cleared sm:text-xs"
          >
            {t("hero.scroll_cue")}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
