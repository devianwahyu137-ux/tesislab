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

/**
 * High-Luminance Interactive 3D Global Macro Transmission Globe powered by `cobe`.
 * Initialized facing Southeast Asia / Indonesia (`phi = 4.72`) with high-contrast
 * continental dot density and glowing macro transmission arcs into Jakarta (IDX).
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

    // 4.72 radians centers Maritime Southeast Asia / Jakarta facing the viewer
    let phi = 4.72;
    let isVisible = true;
    let rafId = 0;

    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      const size = Math.max(190, canvas.offsetWidth || 215);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi,
        theta: 0.12,
        dark: isDark ? 1 : 0,
        diffuse: 1.65,
        mapSamples: 14000,
        mapBrightness: isDark ? 9.2 : 5.2,
        mapBaseBrightness: isDark ? 0.08 : 0.02,
        baseColor: isDark ? [0.26, 0.38, 0.54] : [0.82, 0.88, 0.95],
        markerColor: accentRgb,
        glowColor: isDark ? [0.12, 0.24, 0.36] : [0.86, 0.92, 0.98],
        markers: [
          { location: JAKARTA_COORDS, size: 0.11 },
          { location: NEW_YORK_COORDS, size: 0.06 },
          { location: LONDON_COORDS, size: 0.055 },
          { location: TOKYO_COORDS, size: 0.06 },
          { location: SINGAPORE_COORDS, size: 0.05 },
        ],
        arcs: [
          { from: NEW_YORK_COORDS, to: JAKARTA_COORDS },
          { from: LONDON_COORDS, to: JAKARTA_COORDS },
          { from: TOKYO_COORDS, to: JAKARTA_COORDS },
          { from: SINGAPORE_COORDS, to: JAKARTA_COORDS },
        ],
        arcColor: accentRgb,
        arcWidth: 0.75,
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

    const tick = () => {
      rafId = window.requestAnimationFrame(tick);
      if (!isVisible || !globe || !canvas) return;
      if (pointerDownX.current === null) {
        phi += 0.0024;
      }
      const size = Math.max(190, canvas.offsetWidth || 215);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe.update({
        phi: phi + dragDelta.current,
        width: size * dpr,
        height: size * dpr,
      });
    };

    tick();

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
        className="pointer-events-none absolute h-44 w-44 rounded-full bg-sky-400/12 blur-2xl"
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
            dragDelta.current += delta * 0.005;
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
