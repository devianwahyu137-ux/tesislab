"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe, { type Arc } from "cobe";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface HermesMacroGlobeProps {
  macroContext: MarketContext;
}

type CorridorFilter = "all" | "ny" | "ldn" | "asia";

const JAKARTA_COORDS: [number, number] = [-6.2088, 106.8456];
const NEW_YORK_COORDS: [number, number] = [40.7128, -74.006];
const LONDON_COORDS: [number, number] = [51.5074, -0.1278];
const TOKYO_COORDS: [number, number] = [35.6762, 139.6503];
const SINGAPORE_COORDS: [number, number] = [1.3521, 103.8198];

const CORRIDOR_PHI: Record<CorridorFilter, number> = {
  all: 2.85, // Maritime SE Asia / Jakarta centered
  ny: 2.45,
  ldn: 2.68,
  asia: 2.96,
};

/**
 * Dead-Centered High-Luminance 3D Global Macro Transmission Globe (`cobe` v2).
 *
 * Wraps `<canvas>` inside an explicit `mx-auto aspect-square` host box so `cobe` v2's
 * dynamically injected `width:100%;height:100%` container stays 100% centered inside
 * the card, framed by an optical radar reticle and interactive corridor filter pills.
 */
export default function HermesMacroGlobe({
  macroContext,
}: HermesMacroGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerDownX = useRef<number | null>(null);
  const dragDelta = useRef<number>(0);
  const targetPhiRef = useRef<number>(CORRIDOR_PHI.all);
  const currentPhiRef = useRef<number>(CORRIDOR_PHI.all);

  const { locale } = useTranslation();
  const { theme } = useTheme();
  const isId = locale === "id";

  const [webglReady, setWebglReady] = useState(true);
  const [corridor, setCorridor] = useState<CorridorFilter>("all");

  const regime = macroContext.synthesis.macro_regime;
  const { USD_IDR, GOLD_USD, BTC_USD } = macroContext.indicators;

  const getFilteredArcs = (filter: CorridorFilter): Arc[] => {
    if (filter === "ny") return [{ from: NEW_YORK_COORDS, to: JAKARTA_COORDS }];
    if (filter === "ldn") return [{ from: LONDON_COORDS, to: JAKARTA_COORDS }];
    if (filter === "asia") {
      return [
        { from: TOKYO_COORDS, to: JAKARTA_COORDS },
        { from: SINGAPORE_COORDS, to: JAKARTA_COORDS },
      ];
    }
    return [
      { from: NEW_YORK_COORDS, to: JAKARTA_COORDS },
      { from: LONDON_COORDS, to: JAKARTA_COORDS },
      { from: TOKYO_COORDS, to: JAKARTA_COORDS },
      { from: SINGAPORE_COORDS, to: JAKARTA_COORDS },
    ];
  };

  useEffect(() => {
    targetPhiRef.current = CORRIDOR_PHI[corridor];
    dragDelta.current = 0;
  }, [corridor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDark = theme !== "light";
    const accentRgb: [number, number, number] =
      regime === "RISK_OFF"
        ? [0.98, 0.4, 0.4]
        : regime === "CAUTIOUS"
          ? [0.98, 0.74, 0.2]
          : [0.16, 0.9, 0.66];

    let isVisible = true;
    let rafId = 0;
    const startMs = performance.now();

    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      const boxSize = Math.max(196, canvas.parentElement?.clientWidth || 216);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: boxSize,
        height: boxSize,
        phi: currentPhiRef.current,
        theta: 0.08,
        dark: isDark ? 1 : 0,
        diffuse: 1.7,
        mapSamples: 15000,
        mapBrightness: isDark ? 9.8 : 5.5,
        mapBaseBrightness: isDark ? 0.1 : 0.03,
        baseColor: isDark ? [0.3, 0.43, 0.6] : [0.8, 0.87, 0.95],
        markerColor: accentRgb,
        glowColor: isDark ? [0.13, 0.27, 0.42] : [0.86, 0.92, 0.98],
        markers: [
          { location: JAKARTA_COORDS, size: 0.12 },
          { location: NEW_YORK_COORDS, size: 0.065 },
          { location: LONDON_COORDS, size: 0.06 },
          { location: TOKYO_COORDS, size: 0.065 },
          { location: SINGAPORE_COORDS, size: 0.055 },
        ],
        arcs: getFilteredArcs(corridor),
        arcColor: accentRgb,
        arcWidth: 0.85,
        arcHeight: 0.3,
      });
    } catch {
      const tId = setTimeout(() => setWebglReady(false), 0);
      return () => clearTimeout(tId);
    }

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      if (!isVisible || !globe || !canvas) return;
      const elapsedSec = (now - startMs) * 0.001;
      currentPhiRef.current +=
        (targetPhiRef.current - currentPhiRef.current) * 0.06;
      const gentleSwing =
        pointerDownX.current === null ? Math.sin(elapsedSec * 0.45) * 0.28 : 0;
      const boxSize = Math.max(196, canvas.parentElement?.clientWidth || 216);
      globe.update({
        phi: currentPhiRef.current + gentleSwing + dragDelta.current,
        width: boxSize,
        height: boxSize,
        arcs: getFilteredArcs(corridor),
      });
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      io.disconnect();
      globe?.destroy();
    };
  }, [regime, theme, corridor]);

  const corridorNote =
    corridor === "ny"
      ? isId
        ? `NY → JKT: Transmisi Dolar AS ke Kurs Rp${Math.round(USD_IDR.price).toLocaleString("id-ID")}`
        : `NY → JKT: USD liquidity transmission into IDR Rp${Math.round(USD_IDR.price).toLocaleString("id-ID")}`
      : corridor === "ldn"
        ? isId
          ? `LDN → JKT: Acuan Emas Dunia $${Math.round(GOLD_USD.price).toLocaleString("en-US")} bagi lindung nilai`
          : `LDN → JKT: London Gold benchmark $${Math.round(GOLD_USD.price).toLocaleString("en-US")} hedge flow`
        : corridor === "asia"
          ? isId
            ? `TYO/SG → JKT: Sentimen likuiditas Asia & BTC $${Math.round(BTC_USD.price).toLocaleString("en-US")}`
            : `TYO/SG → JKT: Regional risk appetite & BTC $${Math.round(BTC_USD.price).toLocaleString("en-US")}`
          : isId
            ? "4 jalur likuiditas global aktif menuju pasar domestik BEI Jakarta"
            : "4 live global liquidity corridors converging onto Jakarta (IDX)";

  if (!webglReady) {
    return (
      <div className="flex h-[240px] items-center justify-center p-4 text-center font-mono text-xs text-text-muted">
        GLOBAL MACRO BUS · NY / LDN / TYO → JKT ({regime})
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-between gap-2 px-3 py-2.5 select-none">
      {/* Interactive Corridor Selector Pills */}
      <div className="z-20 flex flex-wrap items-center justify-center gap-1">
        {(
          [
            { id: "all", label: isId ? "Semua" : "All" },
            { id: "ny", label: "USD·NY" },
            { id: "ldn", label: "XAU·LDN" },
            { id: "asia", label: "BTC·ASIA" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCorridor(item.id)}
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold transition-colors",
              corridor === item.id
                ? "border-cleared/55 bg-cleared/16 text-cleared"
                : "border-hairline/80 bg-obsidian/80 text-text-muted hover:text-text-primary"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Strictly Centered Square Host Wrapper so Cobe's 100%x100% Injected Div Never Drifts Left */}
      <div className="relative mx-auto flex items-center justify-center py-0.5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-44 w-44 rounded-full bg-sky-400/16 blur-2xl"
        />
        {/* Subtle Optical Radar Reticle Ring */}
        <svg
          aria-hidden="true"
          viewBox="0 0 240 240"
          className="pointer-events-none absolute h-[218px] w-[218px] text-sky-400/22 sm:h-[228px] sm:w-[228px]"
        >
          <circle
            cx="120"
            cy="120"
            r="112"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx="120"
            cy="120"
            r="98"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="0.75"
          />
        </svg>

        <div className="relative mx-auto aspect-square h-[204px] w-[204px] sm:h-[214px] sm:w-[214px]">
          <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              pointerDownX.current = e.clientX;
            }}
            onPointerUp={() => {
              pointerDownX.current = null;
            }}
            onPointerOut={() => {
              pointerDownX.current = null;
            }}
            onPointerMove={(e) => {
              if (pointerDownX.current !== null) {
                const delta = e.clientX - pointerDownX.current;
                dragDelta.current += delta * 0.006;
                pointerDownX.current = e.clientX;
              }
            }}
            className="block h-full w-full cursor-grab active:cursor-grabbing"
          />
        </div>
      </div>

      {/* Live Contextual Corridor Caption */}
      <div className="z-20 w-full rounded-md border border-hairline/70 bg-obsidian/80 px-2.5 py-1 text-center font-sans text-[11px] font-medium text-text-secondary">
        {corridorNote}
      </div>
    </div>
  );
}
