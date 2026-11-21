import { cn } from "@/lib/utils";

export interface TerminalDividerProps {
  label?: string;
  orientation?: "horizontal" | "vertical";
  align?: "left" | "center";
  className?: string;
}

/**
 * Precision 1px hairline divider with optional monospace category label.
 */
export function TerminalDivider({
  label,
  orientation = "horizontal",
  align = "left",
  className,
}: TerminalDividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("w-px self-stretch bg-hairline", className)}
      />
    );
  }

  if (!label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn("h-px w-full bg-hairline", className)}
      />
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("flex w-full items-center gap-3", className)}
    >
      {align === "center" && <div className="h-px flex-1 bg-hairline" />}
      <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </span>
      <div className="h-px flex-1 bg-hairline" />
    </div>
  );
}
