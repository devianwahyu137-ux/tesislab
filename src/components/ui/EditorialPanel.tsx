import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EditorialPanelProps {
  title?: string;
  indexCode?: string;
  elevated?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Swiss Editorial research-sheet container with 1px hairline border,
 * optional header with top-right monospace index code, and adaptive padding.
 */
export function EditorialPanel({
  title,
  indexCode,
  elevated = false,
  className,
  children,
}: EditorialPanelProps) {
  const hasHeader = Boolean(title || indexCode);

  return (
    <section
      className={cn(
        "surface-specular rounded-md border border-active-border/75",
        elevated ? "bg-elevated" : "bg-surface",
        className
      )}
    >
      {hasHeader && (
        <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 md:px-6">
          {title ? (
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {indexCode && (
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              {indexCode}
            </span>
          )}
        </header>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </section>
  );
}
