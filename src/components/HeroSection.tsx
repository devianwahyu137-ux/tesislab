"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, Play, ShieldCheck } from "lucide-react";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";

function scrollToWorkspace() {
  const el = document.getElementById("audit-workspace-slot");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Compact, high-signal Institutional Editorial Hero.
 * Strips decorative floating widgets so the Audit Workspace sits close to the fold.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="hero-ambient-glow relative mx-auto w-full max-w-5xl rounded-sm py-10 md:py-14 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-4 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-cleared">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cleared"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        <h1 className="font-editorial mx-auto max-w-3xl text-4xl font-medium leading-[1.08] tracking-[-0.02em] text-ink-primary sm:text-5xl lg:text-[3.5rem]">
          {t("hero.headline")}{" "}
          <span className="italic text-ink-secondary">
            {t("hero.headline_accent")}
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-ink-secondary md:text-[15px]">
          {t("hero.subheadline")}
        </p>

        {/* Dual CTAs */}
        <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={scrollToWorkspace}
            className="cta-primary-polish inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm bg-cleared px-6 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
          >
            <span>{t("hero.cta_primary")}</span>
            <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleDemoClick}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm border border-active-border bg-surface px-6 font-mono text-xs font-medium uppercase tracking-wider text-ink-primary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:w-auto"
          >
            <Play
              className="h-3.5 w-3.5 shrink-0 text-ink-secondary"
              aria-hidden="true"
            />
            <span>{t("hero.cta_demo")}</span>
          </motion.button>
        </div>

        {/* 3 Compact Transparency Pillars */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-hairline pt-4">
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
