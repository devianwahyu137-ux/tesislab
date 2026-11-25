"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { HeroQuickLauncher } from "@/components/hero/HeroQuickLauncher";
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

function scrollToSuite() {
  const el = document.getElementById("platform-suite");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Centered Executive Hero on the `(marketing)` landing page (`/`),
 * pairing the PBR 3D Risk Monolith with the zero-loss Quick Pre-Mortem Launcher.
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

        {/* Zero-Loss Interactive Quick Pre-Mortem Launcher */}
        <HeroQuickLauncher />

        {/* Centered PBR Three.js 3-Mode Risk Monolith */}
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
            onClick={scrollToSuite}
            className="font-sans text-[11px] font-medium text-ink-muted transition-colors hover:text-cleared sm:text-xs"
          >
            {t("hero.scroll_cue")}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
