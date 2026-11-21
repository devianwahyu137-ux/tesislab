"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";

export interface InfoTooltipProps {
  content: string;
  label?: string;
}

/**
 * Accessible institutional tooltip built on @radix-ui/react-tooltip
 * explaining financial & quantitative metrics without cluttering layouts.
 */
export function InfoTooltip({ content, label }: InfoTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label ?? content}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared"
        >
          <HelpCircle className="h-3 w-3" aria-hidden="true" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="z-50 max-w-[240px] rounded-xs border border-active-border bg-surface-elevated px-2.5 py-2 font-sans text-[11px] leading-relaxed text-text-primary shadow-xl shadow-black/40"
        >
          {content}
          <Tooltip.Arrow className="fill-active-border" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
