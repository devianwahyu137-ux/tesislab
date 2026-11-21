"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface HeroArtifactsProps {
  macroContext: MarketContext;
}

/**
 * Four live scroll-parallax institutional financial instruments framing
 * the Monumental Centered Hero on xl+ viewports using real Hermes macro data.
 */
export function HeroArtifacts({ macroContext }: HeroArtifactsProps) {
  const { scrollY } = useScroll();
  const yUpSlow = useTransform(scrollY, [0, 500], [0, -34]);
  const yDownSlow = useTransform(scrollY, [0, 500], [0, 26]);
  const yUpMed = useTransform(scrollY, [0, 500], [0, -48]);

  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;
  const regime = macroContext.synthesis.macro_regime;

  const regimeTone =
    regime === "RISK_ON"
      ? "text-cleared"
      : regime === "CAUTIOUS"
        ? "text-conditional"
        : "text-rejected";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden select-none xl:block"
    >
      {/* 1. Top-Left: Live FX & Equity Feed */}
      <motion.div
        style={{ y: yUpSlow }}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-2 top-8 w-56 rounded-sm border border-hairline bg-surface/92 shadow-lg shadow-black/40 backdrop-blur-xs"
      >
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rejected/55" />
            <span className="h-1.5 w-1.5 rounded-full bg-conditional/55" />
            <span className="h-1.5 w-1.5 rounded-full bg-cleared/55" />
          </div>
          <span className="font-mono text-[10px] tracking-wider text-ink-muted">
            FX &amp; IDX LIVE
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-3 font-mono text-[11px] tabular-nums">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">USD/IDR</span>
            <span className="font-semibold text-ink-primary">
              Rp {USD_IDR.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">IHSG</span>
            <span
              className={cn(
                "font-semibold",
                IHSG.change_pct < 0 ? "text-rejected" : "text-cleared"
              )}
            >
              {IHSG.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
              ({IHSG.change_pct >= 0 ? "+" : ""}
              {IHSG.change_pct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Bottom-Left: Veto Gate Monitor */}
      <motion.div
        style={{ y: yDownSlow }}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-8 left-2 w-56 rounded-sm border border-hairline bg-surface/92 p-3.5 shadow-lg shadow-black/40 backdrop-blur-xs"
      >
        <div className="mb-2 flex items-center justify-between border-b border-hairline pb-1.5">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            VETO GATE MONITOR
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-cleared" />
        </div>
        <div className="flex flex-col gap-1.5 font-mono text-[10px] tabular-nums">
          <div className="flex items-center justify-between">
            <span className="text-ink-secondary">R:R CHECK</span>
            <span className="font-semibold text-cleared">[PASS]</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-secondary">RUNWAY GATE</span>
            <span className="font-semibold text-conditional">[WARN]</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-secondary">DSR LIMIT</span>
            <span className="font-semibold text-ink-primary">[≤30%]</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Top-Right: Live Macro Regime & Safe-Haven Card */}
      <motion.div
        style={{ y: yUpMed }}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-2 top-8 w-56 rounded-sm border border-hairline bg-surface/92 p-3.5 shadow-lg shadow-black/40 backdrop-blur-xs"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            MACRO REGIME
          </span>
          <span className={cn("font-mono text-[10px] font-semibold", regimeTone)}>
            {regime}
          </span>
        </div>
        <svg viewBox="0 0 180 38" className="h-9 w-full overflow-visible" fill="none">
          <line x1="0" y1="19" x2="180" y2="19" stroke="var(--border-hairline)" strokeDasharray="3 3" />
          <polyline
            points="2,28 28,22 54,25 82,14 108,18 136,10 176,12"
            stroke="var(--status-cleared)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="176" cy="12" r="2.5" fill="var(--status-cleared)" />
        </svg>
        <div className="mt-2 flex items-center justify-between border-t border-hairline pt-1.5 font-mono text-[10px] tabular-nums text-ink-secondary">
          <span>XAU ${GOLD_USD.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          <span>BTC ${BTC_USD.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
        </div>
      </motion.div>

      {/* 4. Bottom-Right: Deterministic Formula Plaque */}
      <motion.div
        style={{ y: yDownSlow }}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-8 right-2 w-56 rounded-sm border border-hairline bg-surface/92 p-3.5 shadow-lg shadow-black/40 backdrop-blur-xs"
      >
        <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">
          DETERMINISTIC MATH
        </span>
        <div className="flex flex-col gap-1.5 font-mono text-[11px] text-ink-primary">
          <div className="rounded-xs border border-hairline bg-canvas px-2.5 py-1">
            BEP = FC / (P − VC)
          </div>
          <div className="rounded-xs border border-hairline bg-canvas px-2.5 py-1 text-cleared">
            DSR ≤ 30% · EF ≥ 6M
          </div>
        </div>
      </motion.div>
    </div>
  );
}
