"use client";

import { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

export interface InfoTooltipProps {
  content: string;
  label?: string;
}

/**
 * Accessible institutional info badge ("i") built on @radix-ui/react-tooltip
 * that opens on hover (desktop) AND tap/click (iPad/mobile).
 */
export function InfoTooltip({ content, label }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen} delayDuration={120}>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          aria-label={label ?? content}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-hairline bg-obsidian/90 text-text-muted transition-colors hover:border-cleared/60 hover:text-cleared focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared"
        >
          <Info className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          onPointerDownOutside={() => setOpen(false)}
          className="z-50 max-w-[260px] rounded-md border border-active-border bg-elevated px-3 py-2 font-sans text-[11.5px] leading-relaxed text-text-primary shadow-2xl shadow-black/60"
        >
          {content}
          <Tooltip.Arrow className="fill-active-border" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
