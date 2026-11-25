import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricTone = "neutral" | "cleared" | "conditional" | "rejected";

export interface MetricReadoutProps {
  label: string;
  value: ReactNode;
  subtext?: string;
  tone?: MetricTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TONE_CLASSES: Record<MetricTone, string> = {
  neutral: "text-text-primary",
  cleared: "text-cleared",
  conditional: "text-conditional",
  rejected: "text-rejected",
};

const SIZE_CLASSES: Record<NonNullable<MetricReadoutProps["size"]>, string> = {
  sm: "text-base @[150px]:text-lg @[210px]:text-xl",
  md: "text-lg @[160px]:text-xl @[220px]:text-2xl @[300px]:text-[26px]",
  lg: "text-xl @[180px]:text-2xl @[260px]:text-3xl",
};

/**
 * Container-aware financial metric display with uppercase label, tabular-nums
 * monospace value that scales fluidly to its box width (never overflowing),
 * and optional supporting sub-metric note.
 */
export function MetricReadout({
  label,
  value,
  subtext,
  tone = "neutral",
  size = "md",
  className,
}: MetricReadoutProps) {
  return (
    <div className={cn("@container flex min-w-0 flex-col justify-between gap-1.5", className)}>
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 max-w-full break-words font-mono leading-tight font-bold tracking-tight tabular-nums",
          SIZE_CLASSES[size],
          TONE_CLASSES[tone]
        )}
      >
        {value}
      </span>
      {subtext && (
        <span className="font-mono text-xs text-text-secondary">{subtext}</span>
      )}
    </div>
  );
}
