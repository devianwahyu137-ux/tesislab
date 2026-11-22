"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Lightweight 60/120fps GPU-Composited Financial Ledger & Luminous Aura Canvas.
 * Uses pure GPU `translate3d` transforms (zero CPU mask-image repaint storms) so
 * scrolling stays buttery smooth across Desktop, iPad, and Mobile.
 */
export function FinancialLedgerCanvas() {
  const orbRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll();

  // Pure GPU transform parallax planes
  const yLedger = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const yLayer1 = useTransform(scrollYProgress, [0, 1], [0, -320]);
  const yLayer2 = useTransform(scrollYProgress, [0, 1], [24, -200]);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.3;
    let curX = targetX;
    let curY = targetY;
    let visible = false;
    let rafId = 0;

    const tick = () => {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      orb.style.transform = `translate3d(${(curX - 240).toFixed(1)}px, ${(curY - 240).toFixed(1)}px, 0)`;
      if (Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        orb.style.opacity = "1";
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      visible = false;
      orb.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Pure GPU-Composited Luminous Cursor Glow Orb (zero repaint cost) */}
      <div
        ref={orbRef}
        className="fixed top-0 left-0 hidden h-[480px] w-[480px] rounded-full opacity-0 transition-opacity duration-500 will-change-transform md:block"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.11) 0%, rgba(56, 189, 248, 0.05) 38%, transparent 70%)",
        }}
      />

      {/* Ambient Top Studio Aura */}
      <div
        className="absolute -top-32 left-1/2 h-[520px] w-[960px] -translate-x-1/2 rounded-full opacity-60 [[data-theme=light]_&]:opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.05) 42%, transparent 72%)",
        }}
      />

      {/* Horizontal Accounting Ledger Lines */}
      <motion.div
        style={{ y: yLedger }}
        className="absolute -inset-y-44 inset-x-0 opacity-[0.36] will-change-transform [[data-theme=light]_&]:opacity-[0.5]"
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
      <div className="absolute inset-y-0 left-4 hidden w-1 border-x border-rejected/22 sm:block lg:left-14 [[data-theme=light]_&]:border-rejected/18" />

      {/* Layer 1: Bell Curve (-2σ Tail Risk) & Formula Sketches */}
      <motion.div
        style={{ y: yLayer1 }}
        className="absolute -inset-y-32 inset-x-0 text-ink-secondary opacity-[0.16] will-change-transform [[data-theme=light]_&]:opacity-[0.18]"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 1100"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <g transform="translate(76, 130)">
            <path
              d="M 10 155 C 58 153, 86 122, 110 66 C 128 24, 144 10, 158 10 C 172 10, 188 24, 206 66 C 230 122, 258 153, 306 155"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M 10 155 C 42 154, 64 140, 82 115 L 82 155 Z"
              fill="var(--status-rejected)"
              fillOpacity="0.35"
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

      {/* Layer 2: Technical Candlesticks & Monte Carlo Cone */}
      <motion.div
        style={{ y: yLayer2 }}
        className="absolute -inset-y-32 inset-x-0 text-ink-secondary opacity-[0.15] will-change-transform [[data-theme=light]_&]:opacity-[0.18]"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 1100"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
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
                strokeWidth="1.35"
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
                  fillOpacity="0.24"
                />
              </g>
            ))}
            <path
              d="M 8 118 C 60 100, 110 68, 152 60 C 190 54, 212 88, 246 84"
              stroke="var(--status-cleared)"
              strokeWidth="1.6"
              strokeDasharray="6 4"
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

          <g transform="translate(1085, 700)">
            <path
              d="M 10 70 L 220 14 M 10 70 L 220 62 M 10 70 L 220 124"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="5 4"
            />
            <path
              d="M 10 70 L 220 14 L 220 124 Z"
              fill="var(--status-cleared)"
              fillOpacity="0.1"
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
        </svg>
      </motion.div>
    </div>
  );
}
