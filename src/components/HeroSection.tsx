"use client";

import { ArrowDownRight, Play, ShieldCheck } from "lucide-react";
import { HeroArtifacts } from "@/components/hero/HeroArtifacts";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";

function scrollToWorkspace() {
  const el = document.getElementById("audit-workspace-slot");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Centered Swiss Editorial Hero Centerpiece with ambient radial spotlights,
 * floating financial artifacts on xl+ viewports, tactile CTAs, and scroll cue.
 */
export function HeroSection() {
  const { t } = useTranslation();
  const { triggerDemo } = useAuditUI();

  const handleDemoClick = () => {
    triggerDemo();
    scrollToWorkspace();
  };

  return (
    <section className="relative w-full overflow-hidden rounded-sm border border-hairline bg-surface/80 px-5 py-16 backdrop-blur-xs md:px-10 md:py-24 lg:py-28">
      {/* Subtle Ambient Radial Spotlights */}
      <div
        aria-hidden="true"
        className="ambient-spotlight-emerald pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="ambient-spotlight-amber pointer-events-none absolute inset-0"
      />

      {/* Floating Editorial Financial Artifacts (xl+) */}
      <HeroArtifacts />

      {/* Centered Editorial Content */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        {/* Eyebrow Pill with subtle pulsing dot */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-active-border bg-obsidian/85 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary sm:text-[11px]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cleared"
          />
          <span>{t("hero.eyebrow")}</span>
        </div>

        {/* Serif Display Headline */}
        <h1 className="font-editorial mx-auto max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight text-text-primary sm:text-5xl lg:text-[3.75rem]">
          {t("hero.headline")}{" "}
          <span className="italic text-cleared">
            {t("hero.headline_accent")}
          </span>
        </h1>

        {/* Concise Subheadline */}
        <p className="mx-auto mt-5 max-w-xl font-sans text-sm leading-relaxed text-text-secondary md:text-base">
          {t("hero.subheadline")}
        </p>

        {/* Dual Tactile CTAs with Micro-Captions */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:items-start">
          <div className="flex w-full flex-col items-center gap-1.5 sm:w-auto">
            <button
              type="button"
              onClick={scrollToWorkspace}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm bg-cleared px-6 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared shadow-[0_0_24px_rgba(16,185,129,0.18)] transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian sm:w-auto"
            >
              <span>{t("hero.cta_primary")}</span>
              <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
            <span className="font-mono text-[10px] tracking-wide text-text-muted">
              {t("hero.cta_primary_hint")}
            </span>
          </div>

          <div className="flex w-full flex-col items-center gap-1.5 sm:w-auto">
            <button
              type="button"
              onClick={handleDemoClick}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm border border-active-border bg-obsidian/90 px-6 font-mono text-xs font-medium uppercase tracking-wider text-text-primary transition-colors hover:border-text-secondary hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:w-auto"
            >
              <Play className="h-3.5 w-3.5 shrink-0 text-conditional" aria-hidden="true" />
              <span>{t("hero.cta_demo")}</span>
            </button>
            <span className="font-mono text-[10px] tracking-wide text-text-muted">
              {t("hero.cta_demo_hint")}
            </span>
          </div>
        </div>

        {/* Mini Conviction vs. Reality Gap Preview Strip */}
        <div className="mt-7 hidden items-center gap-3 rounded-sm border border-hairline bg-obsidian/85 px-4 py-2 font-mono text-[11px] tabular-nums sm:inline-flex">
          <span className="text-text-muted">
            {t("hero.preview_strip.conviction_label")}{" "}
            <strong className="text-text-primary">
              {t("hero.preview_strip.conviction_val")}
            </strong>
          </span>
          <span className="text-hairline" aria-hidden="true">
            vs
          </span>
          <span className="text-text-muted">
            {t("hero.preview_strip.reality_label")}{" "}
            <strong className="text-rejected">
              {t("hero.preview_strip.reality_val")}
            </strong>
          </span>
          <span className="text-text-muted" aria-hidden="true">
            →
          </span>
          <span className="rounded-xs border border-rejected/40 bg-rejected/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rejected">
            {t("hero.preview_strip.gap_badge")}
          </span>
        </div>

        {/* 3 Transparency Pillars */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-hairline/80 pt-5">
          {(
            [
              "hero.trust_badges.deterministic",
              "hero.trust_badges.macro",
              "hero.trust_badges.free",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 font-mono text-[11px] text-text-secondary"
            >
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-cleared"
                aria-hidden="true"
              />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>

        {/* Subtle Scroll Cue */}
        <button
          type="button"
          onClick={scrollToWorkspace}
          className="mt-5 inline-flex min-h-[36px] items-center font-mono text-[11px] tracking-widest text-text-muted transition-colors hover:text-text-secondary"
        >
          {t("hero.scroll_cue")}
        </button>
      </div>
    </section>
  );
}
