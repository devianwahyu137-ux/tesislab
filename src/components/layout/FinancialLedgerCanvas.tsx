"use client";

import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Tactile Financial Ledger & Market Blueprint Canvas.
 * Gives TesisLab a distinct, visible physical world (accounting margin rule,
 * subtle horizontal ledger lines, and crisp technical risk sketches with gentle parallax).
 */
export function FinancialLedgerCanvas() {
  const { scrollYProgress } = useScroll();
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const yCounter = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Subtle Horizontal Accounting Ledger Lines */}
      <div
        className="absolute inset-0 opacity-[0.38] [[data-theme=light]_&]:opacity-[0.55]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 39px, var(--border-hairline) 39px, var(--border-hairline) 40px)",
        }}
      />

      {/* Double Vertical Audit Margin Rule on Left Edge */}
      <div className="absolute inset-y-0 left-5 hidden w-1 border-x border-rejected/25 sm:block lg:left-14 [[data-theme=light]_&]:border-rejected/20" />

      {/* Layer 1: Bell Curve (-2σ Tail Risk) & Drawdown Asymmetry Sketches */}
      <motion.div
        style={{ y: ySlow }}
        className="absolute inset-0 text-ink-secondary opacity-[0.16] [[data-theme=light]_&]:opacity-[0.18]"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 960"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Top-Left: Probability Distribution Bell Curve + Tail Risk Shading */}
          <g transform="translate(76, 125)">
            <path
              d="M 10 155 C 58 153, 86 122, 110 66 C 128 24, 144 10, 158 10 C 172 10, 188 24, 206 66 C 230 122, 258 153, 306 155"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            {/* Shaded -2σ Tail Risk Zone */}
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
            <line
              x1="82"
              y1="38"
              x2="82"
              y2="168"
              stroke="var(--status-rejected)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
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
              x="148"
              y="184"
              fill="currentColor"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              μ · R:R ≥ 1.50
            </text>
          </g>

          {/* Bottom-Left: BEP & Drawdown Formula Annotation */}
          <g transform="translate(88, 690)">
            <rect
              x="0"
              y="0"
              width="210"
              height="68"
              rx="2"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="14"
              y="26"
              fill="currentColor"
              fontSize="13"
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
          </g>
        </svg>
      </motion.div>

      {/* Layer 2: Technical Candlesticks & Monte Carlo Fan Sketches */}
      <motion.div
        style={{ y: yCounter }}
        className="absolute inset-0 text-ink-secondary opacity-[0.15] [[data-theme=light]_&]:opacity-[0.18]"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 960"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Top-Right: Crisp Technical Candlesticks + MA */}
          <g transform="translate(1075, 130)">
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
                stroke={c.bull ? "var(--status-cleared)" : "var(--status-rejected)"}
                strokeWidth="1.3"
              >
                <line x1={c.x} y1={c.top} x2={c.x} y2={c.bot} />
                <rect
                  x={c.x - 6}
                  y={c.bodyY}
                  width="12"
                  height={c.h}
                  fill={c.bull ? "var(--status-cleared)" : "var(--status-rejected)"}
                  fillOpacity="0.22"
                />
              </g>
            ))}
            <path
              d="M 8 118 C 60 100, 110 68, 152 60 C 190 54, 212 88, 246 84"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 3"
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

          {/* Bottom-Right: Monte Carlo 1,000-Path Cone */}
          <g transform="translate(1090, 665)">
            <path
              d="M 10 70 L 220 14 M 10 70 L 220 62 M 10 70 L 220 124"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeDasharray="3 3"
            />
            <path
              d="M 10 70 L 220 14 L 220 124 Z"
              fill="var(--status-cleared)"
              fillOpacity="0.08"
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
