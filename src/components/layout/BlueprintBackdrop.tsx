"use client";

import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Architectural Financial Blueprint Backdrop.
 * Renders subtle theme-adaptive vector diagrams (Bell Curve with -2σ tail risk,
 * Candlestick + Moving Average silhouette, mathematical symbols, and quadrant crosshairs)
 * with calm scroll-linked parallax depth.
 */
export function BlueprintBackdrop() {
  const { scrollYProgress } = useScroll();
  const yLayerSlow = useTransform(scrollYProgress, [0, 1], [0, -56]);
  const yLayerDrift = useTransform(scrollYProgress, [0, 1], [0, 42]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none text-ink-primary"
    >
      {/* Layer 1: Bell Curve + Coordinate Crosshairs */}
      <motion.div
        style={{ y: yLayerSlow }}
        className="absolute inset-0 opacity-[0.065] [[data-theme=light]_&]:opacity-[0.085]"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Four-quadrant coordinate crosshairs (+) */}
          {[
            [120, 140],
            [1320, 140],
            [120, 760],
            [1320, 760],
          ].map(([cx, cy], idx) => (
            <g key={idx} stroke="currentColor" strokeWidth="1">
              <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} />
              <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} />
            </g>
          ))}

          {/* Normal Distribution (Bell Curve) with -2σ tail-risk marker on left */}
          <g transform="translate(56, 175)">
            <line
              x1="0"
              y1="210"
              x2="420"
              y2="210"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <path
              d="M 10 210 C 75 208, 115 170, 148 92 C 172 34, 192 14, 210 14 C 228 14, 248 34, 272 92 C 305 170, 345 208, 410 210"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            {/* Tail-risk vertical threshold (-2σ) */}
            <line
              x1="102"
              y1="40"
              x2="102"
              y2="225"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeDasharray="4 3"
            />
            <text
              x="88"
              y="242"
              fill="currentColor"
              fontSize="12"
              fontFamily="var(--font-mono)"
            >
              -2σ TAIL RISK
            </text>
            <text
              x="198"
              y="242"
              fill="currentColor"
              fontSize="12"
              fontFamily="var(--font-mono)"
            >
              μ
            </text>
          </g>

          {/* Architectural Financial Formula Annotations */}
          <text
            x="92"
            y="645"
            fill="currentColor"
            fontSize="15"
            fontFamily="var(--font-mono)"
            letterSpacing="2"
          >
            Σ Rᵢ · Δ Drawdown · BEP
          </text>
          <text
            x="1140"
            y="220"
            fill="currentColor"
            fontSize="15"
            fontFamily="var(--font-mono)"
            letterSpacing="2"
          >
            E[R] &gt; 0 // DSR ≤ 0.30
          </text>
        </svg>
      </motion.div>

      {/* Layer 2: Candlestick & Moving Average Silhouette */}
      <motion.div
        style={{ y: yLayerDrift }}
        className="absolute inset-0 opacity-[0.055] [[data-theme=light]_&]:opacity-[0.08]"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <g transform="translate(970, 360)">
            {/* Thin architectural candlesticks */}
            {[
              { x: 20, top: 155, bodyTop: 170, bodyH: 38, bot: 225 },
              { x: 56, top: 135, bodyTop: 150, bodyH: 44, bot: 210 },
              { x: 92, top: 148, bodyTop: 168, bodyH: 26, bot: 208 },
              { x: 128, top: 105, bodyTop: 122, bodyH: 52, bot: 192 },
              { x: 164, top: 82, bodyTop: 98, bodyH: 36, bot: 155 },
              { x: 200, top: 96, bodyTop: 112, bodyH: 46, bot: 176 },
              { x: 236, top: 68, bodyTop: 84, bodyH: 42, bot: 148 },
              { x: 272, top: 88, bodyTop: 104, bodyH: 54, bot: 175 },
              { x: 308, top: 112, bodyTop: 126, bodyH: 48, bot: 196 },
              { x: 344, top: 130, bodyTop: 146, bodyH: 40, bot: 208 },
            ].map((c, idx) => (
              <g key={idx} stroke="currentColor" strokeWidth="1.2">
                <line x1={c.x} y1={c.top} x2={c.x} y2={c.bot} />
                <rect
                  x={c.x - 8}
                  y={c.bodyTop}
                  width="16"
                  height={c.bodyH}
                  fill={idx % 2 === 0 ? "currentColor" : "none"}
                  fillOpacity={idx % 2 === 0 ? "0.22" : "0"}
                />
              </g>
            ))}

            {/* Moving Average Overlay Curve */}
            <path
              d="M 10 198 C 75 184, 125 142, 185 118 C 245 94, 295 128, 365 162"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeDasharray="5 4"
            />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
