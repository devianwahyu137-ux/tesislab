"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useTheme } from "@/context/ThemeContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";

export interface HermesMacroGlobeProps {
  macroContext: MarketContext;
}

const JAKARTA_COORDS: [number, number] = [-6.2088, 106.8456];
const NEW_YORK_COORDS: [number, number] = [40.7128, -74.006];
const LONDON_COORDS: [number, number] = [51.5074, -0.1278];
const TOKYO_COORDS: [number, number] = [35.6762, 139.6503];
const SINGAPORE_COORDS: [number, number] = [1.3521, 103.8198];

// Exact Cobe shader angle where Jakarta (106.8°E) faces dead-center toward camera
const JAKARTA_CENTER_PHI = 2.85;

/**
 * High-Luminance Interactive 3D Global Macro Transmission Globe powered by `cobe`.
 * Anchored on Maritime Southeast Asia / Indonesia (`phi = 2.85`) with gentle
 * pendulum oscillation so Jakarta, Singapore, Tokyo, and incoming macro arcs
 * remain continuously visible in front of the viewer, plus full 360° drag rotation.
 */
export default function HermesMacroGlobe({
  macroContext,
}: HermesMacroGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerDownX = useRef<number | null>(null);
  const dragDelta = useRef<number>(0);
  const { theme } = useTheme();
  const [webglReady, setWebglReady] = useState(true);

  const regime = macroContext.synthesis.macro_regime;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDark = theme !== "light";
    const accentRgb: [number, number, number] =
      regime === "RISK_OFF"
        ? [0.98, 0.38, 0.38]
        : regime === "CAUTIOUS"
          ? [0.98, 0.72, 0.18]
          : [0.16, 0.88, 0.64];

    let isVisible = true;
    let rafId = 0;
    const startMs = performance.now();

    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      const size = Math.max(190, canvas.offsetWidth || 215);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: JAKARTA_CENTER_PHI,
        theta: 0.08,
        dark: isDark ? 1 : 0,
        diffuse: 1.65,
        mapSamples: 14000,
        mapBrightness: isDark ? 9.5 : 5.4,
        mapBaseBrightness: isDark ? 0.09 : 0.02,
        baseColor: isDark ? [0.28, 0.4, 0.56] : [0.82, 0.88, 0.95],
        markerColor: accentRgb,
        glowColor: isDark ? [0.12, 0.25, 0.38] : [0.86, 0.92, 0.98],
        markers: [
          { location: JAKARTA_COORDS, size: 0.115 },
          { location: NEW_YORK_COORDS, size: 0.06 },
          { location: LONDON_COORDS, size: 0.055 },
          { location: TOKYO_COORDS, size: 0.06 },
          { location: SINGAPORE_COORDS, size: 0.055 },
        ],
        arcs: [
          { from: NEW_YORK_COORDS, to: JAKARTA_COORDS },
          { from: LONDON_COORDS, to: JAKARTA_COORDS },
          { from: TOKYO_COORDS, to: JAKARTA_COORDS },
          { from: SINGAPORE_COORDS, to: JAKARTA_COORDS },
        ],
        arcColor: accentRgb,
        arcWidth: 0.8,
        arcHeight: 0.28,
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
      const gentleSwing =
        pointerDownX.current === null ? Math.sin(elapsedSec * 0.45) * 0.34 : 0;
      const size = Math.max(190, canvas.offsetWidth || 215);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe.update({
        phi: JAKARTA_CENTER_PHI + gentleSwing + dragDelta.current,
        width: size * dpr,
        height: size * dpr,
      });
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      io.disconnect();
      globe?.destroy();
    };
  }, [regime, theme]);

  if (!webglReady) {
    return (
      <div className="flex h-[215px] items-center justify-center p-4 text-center font-mono text-xs text-text-muted">
        GLOBAL MACRO BUS · NY / LDN / TYO → JKT ({regime})
      </div>
    );
  }

  return (
    <div className="relative flex h-[215px] w-full items-center justify-center overflow-hidden select-none sm:h-[230px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-44 w-44 rounded-full bg-sky-400/14 blur-2xl"
      />
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
        className="relative z-10 h-[210px] w-[210px] cursor-grab active:cursor-grabbing sm:h-[222px] sm:w-[222px]"
      />
      <div className="pointer-events-none absolute right-3 bottom-2 left-3 z-20 flex items-center justify-between font-mono text-[10.5px] text-text-secondary">
        <span>NY · LDN · TYO</span>
        <span className="font-semibold text-cleared">→ JKT (IDX)</span>
      </div>
    </div>
  );
}
