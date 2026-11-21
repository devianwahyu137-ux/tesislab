import { cn } from "@/lib/utils";

export type StatusStampVariant =
  | "CLEARED"
  | "CONDITIONAL"
  | "REJECTED"
  | "LIVE FEED";

export interface StatusStampProps {
  variant: StatusStampVariant;
  label?: string;
  className?: string;
}

const VARIANT_STYLES: Record<
  StatusStampVariant,
  { border: string; text: string; dot: string; bg: string }
> = {
  CLEARED: {
    border: "border-cleared/40",
    text: "text-cleared",
    dot: "bg-cleared",
    bg: "bg-cleared/10",
  },
  CONDITIONAL: {
    border: "border-conditional/40",
    text: "text-conditional",
    dot: "bg-conditional",
    bg: "bg-conditional/10",
  },
  REJECTED: {
    border: "border-rejected/40",
    text: "text-rejected",
    dot: "bg-rejected",
    bg: "bg-rejected/10",
  },
  "LIVE FEED": {
    border: "border-active-border",
    text: "text-text-secondary",
    dot: "bg-cleared",
    bg: "bg-elevated",
  },
};

/**
 * Sharp-framed digital stamp badge with monospace uppercase typography
 * and functional status indicator dot.
 */
export function StatusStamp({ variant, label, className }: StatusStampProps) {
  const style = VARIANT_STYLES[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em]",
        style.border,
        style.bg,
        style.text,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)}
      />
      <span>{label ?? variant}</span>
    </span>
  );
}
