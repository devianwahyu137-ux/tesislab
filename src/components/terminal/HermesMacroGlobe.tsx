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
 * Interactive 3D Global Macro Transmission Globe powered by `cobe` (`shuding/cobe`).
 * Visualizes live macro liquidity corridors (USD/NY, XAU/London, BTC/Tokyo-SG)
 * converging on Jakarta (IDX / Bank Indonesia) with drag-to-rotate controls.
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
        ? [0.94, 0.27, 0.27]
        : regime === "CAUTIOUS"
          ? [0.96, 0.62, 0.04]
          : [0.06, 0.73, 0.51];

    let phi = 2.95; // Centered toward SE Asia / Jakarta on open
    let isVisible = true;
    let rafId = 0;

    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      const size = Math.max(180, canvas.offsetWidth || 210);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi,
        theta: 0.16,
        dark: isDark ? 1 : 0,
        diffuse: 1.35,
        mapSamples: 11000,
        mapBrightness: isDark ? 5.8 : 4.2,
        baseColor: isDark ? [0.11, 0.16, 0.24] : [0.85, 0.9, 0.96],
        markerColor: accentRgb,
        glowColor: isDark
          ? [accentRgb[0] * 0.22, accentRgb[1] * 0.22, accentRgb[2] * 0.25]
          : [0.88, 0.93, 0.97],
        markers: [
          { location: JAKARTA_COORDS, size: 0.095 },
          { location: NEW_YORK_COORDS, size: 0.055 },
          { location: LONDON_COORDS, size: 0.05 },
          { location: TOKYO_COORDS, size: 0.05 },
          { location: SINGAPORE_COORDS, size: 0.045 },
        ],
        arcs: [
          { from: NEW_YORK_COORDS, to: JAKARTA_COORDS },
          { from: LONDON_COORDS, to: JAKARTA_COORDS },
          { from: TOKYO_COORDS, to: JAKARTA_COORDS },
          { from: SINGAPORE_COORDS, to: JAKARTA_COORDS },
        ],
        arcColor: accentRgb,
        arcWidth: 0.55,
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

    const tick = () => {
      rafId = window.requestAnimationFrame(tick);
      if (!isVisible || !globe || !canvas) return;
      if (pointerDownX.current === null) {
        phi += 0.0038;
      }
      const size = Math.max(180, canvas.offsetWidth || 210);
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
        className="h-[205px] w-[205px] cursor-grab active:cursor-grabbing sm:h-[220px] sm:w-[220px]"
      />
      <div className="pointer-events-none absolute right-3 bottom-2 left-3 flex items-center justify-between font-mono text-[10px] text-text-secondary">
        <span>NY · LDN · TYO</span>
        <span className="font-semibold text-cleared">→ JKT (IDX)</span>
      </div>
    </div>
  );
}
