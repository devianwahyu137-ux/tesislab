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
        "@container surface-specular min-w-0 overflow-hidden rounded-lg border border-active-border/75",
        elevated ? "bg-elevated" : "bg-surface",
        className
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3 @[560px]:px-6">
          {title ? (
            <h2 className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-text-primary">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {indexCode && (
            <span className="shrink-0 rounded-xs border border-hairline bg-obsidian/80 px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
              {indexCode}
            </span>
          )}
        </header>
      )}
      <div className="p-4 @[560px]:p-6">{children}</div>
    </section>
  );
}
