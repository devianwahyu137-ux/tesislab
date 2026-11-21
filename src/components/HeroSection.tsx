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
 * Asymmetric Editorial Hero standing directly on the blueprint canvas
 * without box-in-box borders, paired with a Live Audit Specimen Card.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="relative mx-auto w-full max-w-6xl py-12 sm:py-16 lg:py-24">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Asymmetric Editorial Narrative */}
        <div className="flex flex-col items-start text-left lg:col-span-7">
          <div className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-cleared"
            />
            <span>{t("hero.eyebrow")}</span>
          </div>

          <h1 className="font-editorial text-4xl font-medium leading-[1.06] tracking-[-0.02em] text-ink-primary sm:text-5xl lg:text-[3.65rem]">
            {t("hero.headline")}{" "}
            <span className="italic text-ink-secondary">
              {t("hero.headline_accent")}
            </span>
          </h1>

          <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-ink-secondary">
            {t("hero.subheadline")}
          </p>

          {/* Clean Dual CTAs */}
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={scrollToWorkspace}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-sm bg-cleared px-6 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <span>{t("hero.cta_primary")}</span>
              <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleDemoClick}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-sm border border-active-border bg-surface px-6 font-mono text-xs font-medium uppercase tracking-wider text-ink-primary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared"
            >
              <Play className="h-3.5 w-3.5 shrink-0 text-ink-secondary" aria-hidden="true" />
              <span>{t("hero.cta_demo")}</span>
            </button>
          </div>

          {/* Clean Single-Row Trust Pillars */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-5">
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
        </div>

        {/* Right Column: Precision Live Audit Specimen Card */}
        <div className="lg:col-span-5">
          <aside className="rounded-sm border border-active-border/80 bg-surface p-6 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                {t("hero.specimen.tag")}
              </span>
              <span className="rounded-xs border border-rejected/45 bg-rejected/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-rejected">
                {t("hero.specimen.gap_badge")}
              </span>
            </div>

            <div className="mt-4">
              <h2 className="font-editorial text-2xl font-medium leading-tight text-ink-primary">
                {t("hero.specimen.case_title")}
              </h2>
            </div>

            {/* Conviction vs. Reality Bars */}
            <div className="mt-5 flex flex-col gap-3.5 font-mono text-xs tabular-nums">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink-secondary">
                    {t("hero.specimen.conviction_label")}
                  </span>
                  <span className="font-semibold text-ink-primary">85%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-xs bg-canvas">
                  <div className="h-full w-[85%] bg-ink-secondary" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink-secondary">
                    {t("hero.specimen.resilience_label")}
                  </span>
                  <span className="font-semibold text-conditional">50%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-xs bg-canvas">
                  <div className="h-full w-[50%] bg-conditional" />
                </div>
              </div>
            </div>

            {/* 2 Deterministic Proof Rows */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-4 font-mono tabular-nums">
              <div className="rounded-xs border border-hairline bg-canvas p-3">
                <span className="block text-[10px] uppercase tracking-wider text-ink-muted">
                  {t("hero.specimen.bep_label")}
                </span>
                <span className="mt-1 block text-sm font-semibold text-ink-primary">
                  {t("hero.specimen.bep_val")}
                </span>
              </div>
              <div className="rounded-xs border border-hairline bg-canvas p-3">
                <span className="block text-[10px] uppercase tracking-wider text-ink-muted">
                  {t("hero.specimen.runway_label")}
                </span>
                <span className="mt-1 block text-sm font-semibold text-rejected">
                  {t("hero.specimen.runway_val")}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
