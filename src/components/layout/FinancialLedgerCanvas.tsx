"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * Cursor-Lit Quantitative Financial Ledger & Market Blueprint Canvas.
 * Combines 3-plane scroll + cursor parallax with an interactive "X-Ray Spotlight"
 * that illuminates hidden financial formulas and risk curves wherever the user moves their pointer.
 */
export function FinancialLedgerCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll();

  // Multi-plane scroll parallax so the ledger visibly glides on scroll
  const yLedger = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const yLayer1 = useTransform(scrollYProgress, [0, 1], [0, -440]);
  const yLayer2 = useTransform(scrollYProgress, [0, 1], [40, -260]);
  const xDrift = useTransform(scrollYProgress, [0, 1], [0, 64]);

  // Spring-smoothed cursor parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 24 });
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 24 });

  useEffect(() => {
    const el = containerRef.current;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 28;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 22;
      mouseX.set(-nx);
      mouseY.set(-ny);

      if (el) {
        el.style.setProperty("--mx", `${e.clientX}px`);
        el.style.setProperty("--my", `${e.clientY}px`);
        el.style.setProperty("--spot-opacity", "1");
      }
    };
    const onLeave = () => {
      if (el) el.style.setProperty("--spot-opacity", "0");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [mouseX, mouseY]);

  const renderLedgerGraphics = (highlighted: boolean) => (
    <>
      {/* Layer 1: Bell Curve (-2σ Tail Risk) & Formula Sketches */}
      <motion.div
        style={{ y: yLayer1, x: smoothX }}
        className={
          highlighted
            ? "absolute -inset-y-32 inset-x-0 text-cleared opacity-[0.62]"
            : "absolute -inset-y-32 inset-x-0 text-ink-secondary opacity-[0.18] [[data-theme=light]_&]:opacity-[0.2]"
        }
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 1100"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Top-Left: Probability Distribution Bell Curve + Tail Risk Shading */}
          <g transform="translate(76, 130)">
            <path
              d="M 10 155 C 58 153, 86 122, 110 66 C 128 24, 144 10, 158 10 C 172 10, 188 24, 206 66 C 230 122, 258 153, 306 155"
              stroke="currentColor"
              strokeWidth={highlighted ? "2" : "1.6"}
            />
            <path
              d="M 10 155 C 42 154, 64 140, 82 115 L 82 155 Z"
              fill="var(--status-rejected)"
              fillOpacity={highlighted ? "0.5" : "0.35"}
            />
            <line
              x1="0"
              y1="155"
              x2="316"
              y2="155"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <line
              x1="82"
              y1="38"
              x2="82"
              y2="168"
              stroke="var(--status-rejected)"
              strokeWidth="1.3"
              strokeDasharray="4 3"
              className="animate-circuit-flow"
            />
            <circle cx="158" cy="10" r="3.5" fill="var(--status-cleared)" />
            <text
              x="64"
              y="184"
              fill="var(--status-rejected)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              -2σ RUIN TAIL
            </text>
            <text
              x="156"
              y="184"
              fill="currentColor"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              μ · R:R ≥ 1.50
            </text>
          </g>

          {/* Mid-Left: BEP, Kelly & Drawdown Formula Box */}
          <g transform="translate(88, 670)">
            <rect
              x="0"
              y="0"
              width="238"
              height="92"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeDasharray="4 4"
            />
            <text
              x="14"
              y="26"
              fill="currentColor"
              fontSize="12.5"
              fontFamily="var(--font-mono)"
            >
              BEP = FC / (P - VC)
            </text>
            <text
              x="14"
              y="50"
              fill="var(--status-cleared)"
              fontSize="12"
              fontFamily="var(--font-mono)"
            >
              -50% DD → +100% REC
            </text>
            <text
              x="14"
              y="74"
              fill="var(--status-conditional)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              f* = (bp - q) / b · MAX 2%
            </text>
          </g>
        </svg>
      </motion.div>

      {/* Layer 2: Live Flowing Candlesticks & Monte Carlo Cone */}
      <motion.div
        style={{ y: yLayer2, x: xDrift }}
        className={
          highlighted
            ? "absolute -inset-y-32 inset-x-0 text-cleared opacity-[0.62]"
            : "absolute -inset-y-32 inset-x-0 text-ink-secondary opacity-[0.17] [[data-theme=light]_&]:opacity-[0.2]"
        }
      >
        <motion.svg
          style={{ y: smoothY }}
          className="h-full w-full"
          viewBox="0 0 1440 1100"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Top-Right: Crisp Technical Candlesticks + Moving Average */}
          <g transform="translate(1070, 145)">
            {[
              { x: 18, top: 82, bodyY: 96, h: 30, bot: 140, bull: true },
              { x: 48, top: 68, bodyY: 80, h: 36, bot: 128, bull: true },
              { x: 78, top: 76, bodyY: 90, h: 24, bot: 126, bull: false },
              { x: 108, top: 48, bodyY: 62, h: 42, bot: 118, bull: true },
              { x: 138, top: 34, bodyY: 48, h: 30, bot: 96, bull: true },
              { x: 168, top: 52, bodyY: 66, h: 38, bot: 120, bull: false },
              { x: 198, top: 72, bodyY: 86, h: 34, bot: 136, bull: false },
              { x: 228, top: 60, bodyY: 74, h: 28, bot: 118, bull: true },
            ].map((c, idx) => (
              <g
                key={idx}
                stroke={
                  c.bull ? "var(--status-cleared)" : "var(--status-rejected)"
                }
                strokeWidth={highlighted ? "1.8" : "1.35"}
              >
                <line x1={c.x} y1={c.top} x2={c.x} y2={c.bot} />
                <rect
                  x={c.x - 6}
                  y={c.bodyY}
                  width="12"
                  height={c.h}
                  fill={
                    c.bull ? "var(--status-cleared)" : "var(--status-rejected)"
                  }
                  fillOpacity={highlighted ? "0.42" : "0.24"}
                />
              </g>
            ))}
            <path
              d="M 8 118 C 60 100, 110 68, 152 60 C 190 54, 212 88, 246 84"
              stroke="var(--status-cleared)"
              strokeWidth="1.6"
              strokeDasharray="6 4"
              className="animate-circuit-flow"
            />
            <text
              x="12"
              y="164"
              fill="currentColor"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              ATR-14 · SMA-50 · VOL
            </text>
          </g>

          {/* Bottom-Right: Animated Monte Carlo 1,000-Path Cone */}
          <g transform="translate(1085, 700)">
            <path
              d="M 10 70 L 220 14 M 10 70 L 220 62 M 10 70 L 220 124"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="5 4"
              className="animate-circuit-flow"
            />
            <path
              d="M 10 70 L 220 14 L 220 124 Z"
              fill="var(--status-cleared)"
              fillOpacity={highlighted ? "0.2" : "0.09"}
            />
            <text
              x="228"
              y="18"
              fill="var(--status-cleared)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              P95
            </text>
            <text
              x="228"
              y="66"
              fill="currentColor"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              P50
            </text>
            <text
              x="228"
              y="128"
              fill="var(--status-rejected)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              P5
            </text>
            <text
              x="10"
              y="146"
              fill="currentColor"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              MONTE CARLO · N=1,000 · DSR ≤ 30%
            </text>
          </g>
        </motion.svg>
      </motion.div>
    </>
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={
        {
          "--mx": "50vw",
          "--my": "35vh",
          "--spot-opacity": "0",
        } as React.CSSProperties
      }
    >
      {/* Moving Horizontal Accounting Ledger Lines */}
      <motion.div
        style={{ y: yLedger }}
        className="absolute -inset-y-48 inset-x-0 opacity-[0.42] [[data-theme=light]_&]:opacity-[0.55]"
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 39px, var(--border-hairline) 39px, var(--border-hairline) 40px)",
          }}
        />
      </motion.div>

      {/* Double Vertical Audit Margin Rule on Left Edge */}
      <div className="absolute inset-y-0 left-4 hidden w-1 border-x border-rejected/25 sm:block lg:left-14 [[data-theme=light]_&]:border-rejected/20" />

      {/* Base Ambient Blueprint Layer */}
      {renderLedgerGraphics(false)}

      {/* Cursor-Lit X-Ray Spotlight Layer (illuminates formulas directly under pointer) */}
      <div
        className="absolute inset-0 hidden transition-opacity duration-300 md:block"
        style={{
          opacity: "var(--spot-opacity)",
          background:
            "radial-gradient(320px circle at var(--mx) var(--my), rgba(16, 185, 129, 0.085), transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0 hidden transition-opacity duration-300 md:block"
        style={{
          opacity: "var(--spot-opacity)",
          maskImage:
            "radial-gradient(280px circle at var(--mx) var(--my), black 0%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(280px circle at var(--mx) var(--my), black 0%, transparent 72%)",
        }}
      >
        {renderLedgerGraphics(true)}
      </div>
    </div>
  );
}
