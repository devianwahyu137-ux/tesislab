import { cn } from "@/lib/utils";

export type MetricTone = "neutral" | "cleared" | "conditional" | "rejected";

export interface MetricReadoutProps {
  label: string;
  value: string;
  subtext?: string;
  tone?: MetricTone;
  className?: string;
}

const TONE_CLASSES: Record<MetricTone, string> = {
  neutral: "text-text-primary",
  cleared: "text-cleared",
  conditional: "text-conditional",
  rejected: "text-rejected",
};

/**
 * Financial metric display with uppercase label, tabular-nums monospace value,
 * and concise supporting sub-metric note.
 */
export function MetricReadout({
  label,
  value,
  subtext,
  tone = "neutral",
  className,
}: MetricReadoutProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-sans text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-2xl font-semibold tracking-tight tabular-nums md:text-3xl",
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
