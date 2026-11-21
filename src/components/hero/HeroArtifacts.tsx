"use client";

import { useTranslation } from "@/context/LanguageContext";

/**
 * Four editorial floating financial artifacts framing the centered Hero on xl+ viewports.
 * Strictly pointer-events-none and positioned at outer edges to preserve headline legibility.
 */
export function HeroArtifacts() {
  const { t } = useTranslation();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden select-none xl:block"
    >
      {/* 1. Top-Left: Mini Terminal Verification Card */}
      <div className="animate-float-slow absolute left-5 top-7 w-56 rounded-sm border border-active-border/80 bg-obsidian/92 shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rejected/55" />
            <span className="h-2 w-2 rounded-full bg-conditional/55" />
            <span className="h-2 w-2 rounded-full bg-cleared/55" />
          </div>
          <span className="font-mono text-[10px] tracking-wider text-text-muted">
            {t("hero.artifacts.terminal_title")}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-3 font-mono text-[11px] tabular-nums">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">R:R RATIO</span>
            <span className="font-semibold text-cleared">1 : 2.40</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">MAX DD</span>
            <span className="text-text-primary">1.50%</span>
          </div>
          <div className="mt-1 border-t border-hairline pt-1.5 text-[10px] uppercase tracking-widest text-cleared">
            ✓ DETERMINISTIC OK
          </div>
        </div>
      </div>

      {/* 2. Bottom-Left: Editorial Sticky Note */}
      <div className="animate-float-reverse absolute bottom-8 left-7 w-52 -rotate-3 rounded-sm border border-conditional/35 bg-[#19150D]/95 p-3.5 shadow-xl shadow-black/45">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-conditional">
            {t("hero.artifacts.sticky_label")}
          </span>
          <span className="h-1.5 w-4 rounded-xs bg-conditional/40" />
        </div>
        <p className="font-editorial text-[13px] italic leading-snug text-amber-100/90">
          &ldquo;{t("hero.artifacts.sticky_note")}&rdquo;
        </p>
      </div>

      {/* 3. Top-Right: Mini Volatility Sparkline Card */}
      <div className="animate-float-medium absolute right-5 top-8 w-56 rounded-sm border border-active-border/80 bg-obsidian/92 p-3.5 shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {t("hero.artifacts.sparkline_label")}
          </span>
          <span className="font-mono text-[10px] font-semibold text-conditional">
            VOL 1.8σ
          </span>
        </div>
        <svg
          viewBox="0 0 180 46"
          className="h-11 w-full overflow-visible"
          fill="none"
        >
          <line x1="0" y1="23" x2="180" y2="23" stroke="#1E242B" strokeDasharray="3 3" />
          <polyline
            points="2,34 26,28 50,31 74,18 98,22 122,12 146,16 176,8"
            stroke="#10B981"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="176" cy="8" r="2.8" fill="#10B981" />
        </svg>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-text-muted">
          <span>HERMES FEED</span>
          <span className="text-cleared">07:00 WIB</span>
        </div>
      </div>

      {/* 4. Bottom-Right: Deterministic Formula Plaque */}
      <div className="animate-float-slow absolute bottom-8 right-7 w-56 rotate-2 rounded-sm border border-active-border bg-surface/90 p-3.5 shadow-xl shadow-black/50 backdrop-blur-sm">
        <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
          {t("hero.artifacts.formula_label")}
        </span>
        <div className="flex flex-col gap-1.5 font-mono text-[11px] text-text-primary">
          <div className="rounded-xs border border-hairline bg-obsidian/80 px-2.5 py-1">
            BEP = FC / (P − VC)
          </div>
          <div className="rounded-xs border border-hairline bg-obsidian/80 px-2.5 py-1 text-cleared">
            DSR ≤ 30% · EF ≥ 6M
          </div>
        </div>
      </div>
    </div>
  );
}
