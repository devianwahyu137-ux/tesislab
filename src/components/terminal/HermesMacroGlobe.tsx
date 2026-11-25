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
  all: 2.92,
  ny: 2.52,
  ldn: 2.74,
  asia: 3.04,
};

function getFilteredArcs(filter: CorridorFilter): Arc[] {
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
}

/**
 * React-19-StrictMode-safe Centered 3D Global Macro Transmission Globe (`cobe`).
 *
 * Mounts `<canvas>` imperatively inside a dedicated DOM host element so `cobe`'s
 * internal wrapper injection never collides with React virtual DOM reconciliation,
 * keeps Maritime SE Asia & Jakarta facing viewer center, and supports corridor filtering
 * without recreating the WebGL context.
 */
export default function HermesMacroGlobe({
  macroContext,
}: HermesMacroGlobeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pointerDownX = useRef<number | null>(null);
  const dragDelta = useRef<number>(0);
  const corridorRef = useRef<CorridorFilter>("all");
  const targetPhiRef = useRef<number>(CORRIDOR_PHI.all);
  const currentPhiRef = useRef<number>(CORRIDOR_PHI.all);

  const { locale } = useTranslation();
  const { theme } = useTheme();
  const isId = locale === "id";

  const [webglReady, setWebglReady] = useState(true);
  const [corridor, setCorridor] = useState<CorridorFilter>("all");

  const regime = macroContext.synthesis.macro_regime;
  const { USD_IDR, GOLD_USD, BTC_USD } = macroContext.indicators;

  useEffect(() => {
    corridorRef.current = corridor;
    targetPhiRef.current = CORRIDOR_PHI[corridor];
    dragDelta.current = 0;
  }, [corridor]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.cursor = "grab";
    host.appendChild(canvas);

    const onDown = (e: PointerEvent) => {
      pointerDownX.current = e.clientX;
      canvas.style.cursor = "grabbing";
    };
    const onUp = () => {
      pointerDownX.current = null;
      canvas.style.cursor = "grab";
    };
    const onMove = (e: PointerEvent) => {
      if (pointerDownX.current !== null) {
        const delta = e.clientX - pointerDownX.current;
        dragDelta.current += delta * 0.006;
        pointerDownX.current = e.clientX;
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);

    const isDark = theme !== "light";
    const accentRgb: [number, number, number] =
      regime === "RISK_OFF"
        ? [0.98, 0.42, 0.42]
        : regime === "CAUTIOUS"
          ? [0.98, 0.74, 0.2]
          : [0.16, 0.9, 0.66];

    let isVisible = true;
    let rafId = 0;
    const startMs = performance.now();

    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      const boxSize = Math.max(200, host.clientWidth || 224);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: boxSize,
        height: boxSize,
        phi: currentPhiRef.current,
        theta: 0.1,
        dark: isDark ? 1 : 0,
        diffuse: 1.7,
        mapSamples: 15000,
        mapBrightness: isDark ? 10.2 : 5.6,
        mapBaseBrightness: isDark ? 0.11 : 0.03,
        baseColor: isDark ? [0.32, 0.45, 0.62] : [0.8, 0.87, 0.95],
        markerColor: accentRgb,
        glowColor: isDark ? [0.14, 0.28, 0.44] : [0.86, 0.92, 0.98],
        markers: [
          { location: JAKARTA_COORDS, size: 0.125 },
          { location: NEW_YORK_COORDS, size: 0.065 },
          { location: LONDON_COORDS, size: 0.06 },
          { location: TOKYO_COORDS, size: 0.065 },
          { location: SINGAPORE_COORDS, size: 0.055 },
        ],
        arcs: getFilteredArcs(corridorRef.current),
        arcColor: accentRgb,
        arcWidth: 0.85,
        arcHeight: 0.3,
      });
    } catch {
      const tId = setTimeout(() => setWebglReady(false), 0);
      return () => {
        clearTimeout(tId);
        canvas.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointermove", onMove);
        host.replaceChildren();
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      if (!isVisible || !globe) return;
      const elapsedSec = (now - startMs) * 0.001;
      currentPhiRef.current +=
        (targetPhiRef.current - currentPhiRef.current) * 0.07;
      const gentleSwing =
        pointerDownX.current === null ? Math.sin(elapsedSec * 0.42) * 0.26 : 0;
      const boxSize = Math.max(200, host.clientWidth || 224);
      globe.update({
        phi: currentPhiRef.current + gentleSwing + dragDelta.current,
        width: boxSize,
        height: boxSize,
        arcs: getFilteredArcs(corridorRef.current),
      });
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      globe?.destroy();
      host.replaceChildren();
    };
  }, [regime, theme]);

  const corridorNote =
    corridor === "ny"
      ? isId
        ? `NY → JKT: Dampak USD ke Kurs Rp${Math.round(USD_IDR.price).toLocaleString("id-ID")}`
        : `NY → JKT: USD spillover into IDR Rp${Math.round(USD_IDR.price).toLocaleString("id-ID")}`
      : corridor === "ldn"
        ? isId
          ? `LDN → JKT: Acuan Emas Dunia $${Math.round(GOLD_USD.price).toLocaleString("en-US")}`
          : `LDN → JKT: London Gold $${Math.round(GOLD_USD.price).toLocaleString("en-US")} hedge flow`
        : corridor === "asia"
          ? isId
            ? `TYO/SG → JKT: Sentimen Risiko Asia & BTC $${Math.round(BTC_USD.price).toLocaleString("en-US")}`
            : `TYO/SG → JKT: Asia liquidity & BTC $${Math.round(BTC_USD.price).toLocaleString("en-US")}`
          : isId
            ? "4 koridor likuiditas global aktif menuju BEI Jakarta"
            : "4 live global liquidity corridors feeding Jakarta (IDX)";

  if (!webglReady) {
    return (
      <div className="flex h-[240px] items-center justify-center p-4 text-center font-mono text-xs text-text-muted">
        GLOBAL MACRO BUS · NY / LDN / TYO → JKT ({regime})
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-between gap-2 px-3 py-2.5 select-none">
      {/* Strictly Centered Square Globe Stage */}
      <div className="relative mx-auto flex h-[230px] w-full items-center justify-center sm:h-[242px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-48 w-48 rounded-full bg-sky-400/15 blur-2xl"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 240 240"
          className="pointer-events-none absolute h-[228px] w-[228px] text-sky-400/24 sm:h-[238px] sm:w-[238px]"
        >
          <circle
            cx="120"
            cy="120"
            r="114"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx="120"
            cy="120"
            r="102"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="0.75"
          />
        </svg>

        <div
          ref={hostRef}
          className="relative z-10 aspect-square h-[216px] w-[216px] sm:h-[224px] sm:w-[224px]"
        />
      </div>

      {/* Corridor Pills + Focused Insight Footer */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-1">
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
                "rounded-md border px-2.5 py-1 font-mono text-[10.5px] font-bold transition-colors",
                corridor === item.id
                  ? "border-cleared/60 bg-cleared/16 text-cleared"
                  : "border-hairline bg-obsidian/80 text-text-secondary hover:text-text-primary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="w-full text-center font-sans text-[11.5px] font-medium text-text-secondary">
          {corridorNote}
        </p>
      </div>
    </div>
  );
}
