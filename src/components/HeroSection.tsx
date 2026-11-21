"use client";

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
 * Swiss Editorial Hero Section communicating TesisLab's value proposition
 * in 5 seconds with primary audit scroll CTA and zero-API instant demo trigger.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="w-full rounded-sm border border-hairline bg-surface p-6 md:p-10">
      <div className="flex flex-col gap-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
          {t("hero.eyebrow")}
        </p>

        <h1 className="font-editorial max-w-4xl text-3xl font-medium leading-[1.12] tracking-tight text-text-primary md:text-5xl">
          {t("hero.headline")}
        </h1>

        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary md:text-base">
          {t("hero.subheadline")}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={scrollToWorkspace}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-cleared/50 bg-cleared/15 px-5 font-mono text-xs font-medium uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared"
          >
            <span>{t("hero.cta_primary")}</span>
            <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleDemoClick}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-active-border bg-obsidian px-5 font-mono text-xs font-medium uppercase tracking-wider text-text-primary transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared"
          >
            <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t("hero.cta_demo")}</span>
          </button>
        </div>

        {/* 3 Transparency Pillars */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-4">
          {(
            [
              "hero.trust_badges.deterministic",
              "hero.trust_badges.macro",
              "hero.trust_badges.free",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 font-mono text-xs text-text-secondary"
            >
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-cleared"
                aria-hidden="true"
              />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
