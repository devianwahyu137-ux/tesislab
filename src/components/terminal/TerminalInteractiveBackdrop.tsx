"use client";

import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTheme } from "@/context/ThemeContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";

export interface TerminalInteractiveBackdropProps {
  macroRegime: MarketContext["synthesis"]["macro_regime"];
  motionEnabled: boolean;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface FlowRibbon {
  seedX: number;
  seedY: number;
  speed: number;
  phase: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Regime-Reactive Interactive Vector Flow-Field & Cursor-Magnetic Telemetry Grid
 * powered by `simplex-noise` (`jwagner/simplex-noise`).
 *
 * - Reacts smoothly to pointer movement with magnetic crosshair illumination and tangential flow deflection.
 * - Shifts chromatic aura automatically between Emerald (Cleared / Risk-On), Amber (Conditional / Cautious),
 *   and Crimson (Rejected / Risk-Off) based on the user's live risk score or active macro regime.
 * - Respects Light/Dark themes, `prefers-reduced-motion`, tab visibility, and user toggle (`motionEnabled`).
 */
export function TerminalInteractiveBackdrop({
  macroRegime,
  motionEnabled,
}: TerminalInteractiveBackdropProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const { liveRiskSnapshot } = useAuditUI();

  // Store reactive targets in refs so the RAF loop transitions colors without restarting
  const targetPrimaryRef = useRef<RGB>({ r: 16, g: 185, b: 129 });
  const targetSecondaryRef = useRef<RGB>({ r: 56, g: 189, b: 248 });
  const themeRef = useRef(theme);
  const motionRef = useRef(motionEnabled);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    motionRef.current = motionEnabled;
  }, [motionEnabled]);

  useEffect(() => {
    const score = liveRiskSnapshot?.score ?? null;
    if (score !== null) {
      if (score >= 75) {
        targetPrimaryRef.current = { r: 16, g: 185, b: 129 }; // Emerald
        targetSecondaryRef.current = { r: 56, g: 189, b: 248 }; // Sky
      } else if (score >= 50) {
        targetPrimaryRef.current = { r: 245, g: 158, b: 11 }; // Amber
        targetSecondaryRef.current = { r: 16, g: 185, b: 129 }; // Emerald
      } else {
        targetPrimaryRef.current = { r: 239, g: 68, b: 68 }; // Crimson
        targetSecondaryRef.current = { r: 245, g: 158, b: 11 }; // Amber
      }
      return;
    }

    if (macroRegime === "RISK_OFF") {
      targetPrimaryRef.current = { r: 239, g: 68, b: 68 };
      targetSecondaryRef.current = { r: 245, g: 158, b: 11 };
    } else if (macroRegime === "CAUTIOUS") {
      targetPrimaryRef.current = { r: 245, g: 158, b: 11 };
      targetSecondaryRef.current = { r: 56, g: 189, b: 248 };
    } else {
      targetPrimaryRef.current = { r: 16, g: 185, b: 129 };
      targetSecondaryRef.current = { r: 56, g: 189, b: 248 };
    }
  }, [liveRiskSnapshot?.score, macroRegime]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Deterministic seeded PRNG for consistent initial ribbon distribution
    let seed = 42019;
    const seededRandom = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const noise3D = createNoise3D(seededRandom);
    const ribbons: FlowRibbon[] = Array.from({ length: 26 }, () => ({
      seedX: seededRandom(),
      seedY: seededRandom(),
      speed: 0.45 + seededRandom() * 0.65,
      phase: seededRandom() * Math.PI * 2,
    }));

    let width = 1;
    let height = 1;
    let dpr = 1;

    const pointer = {
      x: -9999,
      y: -9999,
      smoothX: -9999,
      smoothY: -9999,
      active: false,
    };

    const currentPrimary: RGB = { ...targetPrimaryRef.current };
    const currentSecondary: RGB = { ...targetSecondaryRef.current };

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      if (!pointer.active) {
        pointer.smoothX = pointer.x;
        pointer.smoothY = pointer.y;
        pointer.active = true;
      }
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let rafId = 0;
    let timeZ = 0;

    const drawFrame = () => {
      const isDark = themeRef.current !== "light";
      const animate =
        motionRef.current && !reducedMotionQuery.matches && !document.hidden;

      // Smoothly interpolate chromatic regime palette
      currentPrimary.r = lerp(currentPrimary.r, targetPrimaryRef.current.r, 0.04);
      currentPrimary.g = lerp(currentPrimary.g, targetPrimaryRef.current.g, 0.04);
      currentPrimary.b = lerp(currentPrimary.b, targetPrimaryRef.current.b, 0.04);

      currentSecondary.r = lerp(
        currentSecondary.r,
        targetSecondaryRef.current.r,
        0.04
      );
      currentSecondary.g = lerp(
        currentSecondary.g,
        targetSecondaryRef.current.g,
        0.04
      );
      currentSecondary.b = lerp(
        currentSecondary.b,
        targetSecondaryRef.current.b,
        0.04
      );

      if (pointer.active) {
        pointer.smoothX = lerp(pointer.smoothX, pointer.x, 0.12);
        pointer.smoothY = lerp(pointer.smoothY, pointer.y, 0.12);
      }

      ctx.clearRect(0, 0, width, height);

      const pr = Math.round(currentPrimary.r);
      const pg = Math.round(currentPrimary.g);
      const pb = Math.round(currentPrimary.b);
      const sr = Math.round(currentSecondary.r);
      const sg = Math.round(currentSecondary.g);
      const sb = Math.round(currentSecondary.b);

      // 1. Ambient Dual-Corner Regime Aurora Wash
      const topGlow = ctx.createRadialGradient(
        width * 0.22,
        height * 0.08,
        20,
        width * 0.22,
        height * 0.08,
        Math.max(width, height) * 0.58
      );
      topGlow.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${isDark ? 0.11 : 0.065})`);
      topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      const bottomGlow = ctx.createRadialGradient(
        width * 0.84,
        height * 0.88,
        20,
        width * 0.84,
        height * 0.88,
        Math.max(width, height) * 0.52
      );
      bottomGlow.addColorStop(
        0,
        `rgba(${sr}, ${sg}, ${sb}, ${isDark ? 0.085 : 0.05})`
      );
      bottomGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Cursor-Following Optical Halo
      if (pointer.active) {
        const cursorHalo = ctx.createRadialGradient(
          pointer.smoothX,
          pointer.smoothY,
          8,
          pointer.smoothX,
          pointer.smoothY,
          280
        );
        cursorHalo.addColorStop(
          0,
          `rgba(${pr}, ${pg}, ${pb}, ${isDark ? 0.11 : 0.07})`
        );
        cursorHalo.addColorStop(
          0.5,
          `rgba(${sr}, ${sg}, ${sb}, ${isDark ? 0.045 : 0.025})`
        );
        cursorHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = cursorHalo;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Precision Coordinate Grid & Magnetic Crosshairs
      const gridStep = width < 640 ? 52 : 44;
      const magneticRadius = 210;
      const baseDotAlpha = isDark ? 0.14 : 0.13;

      for (let gx = gridStep * 0.5; gx < width; gx += gridStep) {
        for (let gy = gridStep * 0.5; gy < height; gy += gridStep) {
          let drawX = gx;
          let drawY = gy;
          let proximity = 0;

          if (pointer.active) {
            const dx = gx - pointer.smoothX;
            const dy = gy - pointer.smoothY;
            const dist = Math.hypot(dx, dy);
            if (dist < magneticRadius && dist > 0.1) {
              proximity = 1 - dist / magneticRadius;
              const pull = proximity * proximity * 6.5;
              drawX -= (dx / dist) * pull;
              drawY -= (dy / dist) * pull;
            }
          }

          if (proximity > 0.12) {
            const alpha = baseDotAlpha + proximity * (isDark ? 0.45 : 0.32);
            ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            const arm = 2 + proximity * 2.2;
            ctx.beginPath();
            ctx.moveTo(drawX - arm, drawY);
            ctx.lineTo(drawX + arm, drawY);
            ctx.moveTo(drawX, drawY - arm);
            ctx.lineTo(drawX, drawY + arm);
            ctx.stroke();
          } else {
            ctx.fillStyle = isDark
              ? `rgba(148, 163, 184, ${baseDotAlpha})`
              : `rgba(71, 85, 105, ${baseDotAlpha})`;
            ctx.fillRect(drawX - 0.75, drawY - 0.75, 1.5, 1.5);
          }
        }
      }

      // 4. Simplex 3D Mathematical Vector Flow-Field Streamlines
      const fieldScale = 0.0019;
      const stepLength = 15;
      const stepsPerRibbon = width < 640 ? 22 : 34;

      for (let i = 0; i < ribbons.length; i++) {
        const rib = ribbons[i];
        const driftOffset = (timeZ * rib.speed * 38 + i * 19) % (width + 240);
        let x = ((rib.seedX * width + driftOffset) % (width + 160)) - 80;
        let y =
          rib.seedY * height +
          Math.sin(timeZ * 0.9 + rib.phase) * 28;

        const useSecondary = i % 3 === 0;
        const cr = useSecondary ? sr : pr;
        const cg = useSecondary ? sg : pg;
        const cb = useSecondary ? sb : pb;

        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let s = 0; s < stepsPerRibbon; s++) {
          const n = noise3D(x * fieldScale, y * fieldScale, timeZ * 0.45);
          let angle = n * Math.PI * 1.65;

          if (pointer.active) {
            const dx = x - pointer.smoothX;
            const dy = y - pointer.smoothY;
            const d = Math.hypot(dx, dy);
            if (d < 220 && d > 1) {
              const swirl = (1 - d / 220) * 0.85;
              angle += Math.atan2(dy, dx) * swirl * 0.35;
            }
          }

          x += Math.cos(angle) * stepLength;
          y += Math.sin(angle) * stepLength * 0.65;
          ctx.lineTo(x, y);
        }

        const ribbonAlpha = isDark ? 0.135 : 0.11;
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${ribbonAlpha})`;
        ctx.lineWidth = i % 4 === 0 ? 1.35 : 0.9;
        ctx.stroke();

        // Leading telemetry photon pulse at the head of selected streamlines
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(x, y, 1.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${isDark ? 0.55 : 0.42})`;
          ctx.fill();
        }
      }

      if (animate) {
        timeZ += 0.0042;
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    const startOrStop = () => {
      window.cancelAnimationFrame(rafId);
      drawFrame();
    };

    startOrStop();

    const onVisibilityChange = () => {
      if (!document.hidden) {
        startOrStop();
      } else {
        window.cancelAnimationFrame(rafId);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [motionEnabled, theme]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
