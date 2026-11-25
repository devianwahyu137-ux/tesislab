"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { MonteCarloBucket } from "@/lib/quant/monteCarlo";

export interface MonteCarloHistogramProps {
  buckets: MonteCarloBucket[];
  height?: number;
}

/**
 * Compact interactive Recharts histogram visualizing the 1,000-path
 * Monte Carlo ending-value distribution (loss tail in red, resilient paths in emerald).
 * Observes container bounds so hidden responsive tabs never emit Recharts width(0)/height(0) warnings.
 */
export function MonteCarloHistogram({
  buckets,
  height = 78,
}: MonteCarloHistogramProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [hasPositiveBox, setHasPositiveBox] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const checkSize = () => {
      const rect = el.getBoundingClientRect();
      setHasPositiveBox(rect.width > 16 && rect.height > 16);
    };
    checkSize();

    const ro = new ResizeObserver(checkSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!buckets || buckets.length === 0) return null;

  return (
    <div ref={hostRef} style={{ width: "100%", height }}>
      {hasPositiveBox ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={40}>
          <BarChart
            data={buckets}
            margin={{ top: 4, right: 2, left: 2, bottom: 0 }}
            barCategoryGap="12%"
          >
            <XAxis
              dataKey="bin_label"
              hide={height < 95}
              tick={{
                fill: "var(--text-muted)",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <Tooltip
              cursor={{ fill: "var(--border-hairline)", opacity: 0.35 }}
              contentStyle={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-active)",
                borderRadius: 4,
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
                padding: "6px 8px",
              }}
              formatter={(val) => [`${String(val ?? 0)} / 1,000 paths`, "Frequency"]}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload as MonteCarloBucket | undefined;
                return item
                  ? `~ Rp ${item.midpoint.toLocaleString("id-ID")}`
                  : "";
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {buckets.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.is_loss
                      ? "var(--status-rejected)"
                      : "var(--status-cleared)"
                  }
                  fillOpacity={entry.is_loss ? 0.78 : 0.72}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
