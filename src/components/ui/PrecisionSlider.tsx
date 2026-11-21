"use client";

import * as Slider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface PrecisionSliderProps {
  id?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (next: number) => void;
  tone?: "cleared" | "conditional" | "rejected";
  ariaLabel?: string;
  ticks?: number[];
}

const RANGE_TONE = {
  cleared: "bg-cleared",
  conditional: "bg-conditional",
  rejected: "bg-rejected",
} as const;

const THUMB_BORDER = {
  cleared: "border-cleared focus-visible:ring-cleared/50",
  conditional: "border-conditional focus-visible:ring-conditional/50",
  rejected: "border-rejected focus-visible:ring-rejected/50",
} as const;

/**
 * Hardware-grade tactile slider built on @radix-ui/react-slider with filled track,
 * crisp thumb, and optional scale tick marks.
 */
export function PrecisionSlider({
  id,
  value,
  min,
  max,
  step = 1,
  onValueChange,
  tone = "cleared",
  ariaLabel,
  ticks,
}: PrecisionSliderProps) {
  return (
    <div className="relative flex min-h-[36px] w-full items-center">
      <Slider.Root
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => {
          if (typeof vals[0] === "number") onValueChange(vals[0]);
        }}
        aria-label={ariaLabel}
        className="relative flex w-full touch-none select-none items-center py-2"
      >
        <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-xs border border-hairline bg-elevated">
          <Slider.Range
            className={cn("absolute h-full transition-colors", RANGE_TONE[tone])}
          />
        </Slider.Track>

        {ticks &&
          ticks.map((tick) => {
            const pct = ((tick - min) / Math.max(1, max - min)) * 100;
            return (
              <span
                key={tick}
                aria-hidden="true"
                style={{ left: `${pct}%` }}
                className="pointer-events-none absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-active-border/70"
              />
            );
          })}

        <Slider.Thumb
          className={cn(
            "block h-4 w-4 cursor-grab rounded-xs border-2 bg-canvas shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 active:cursor-grabbing",
            THUMB_BORDER[tone]
          )}
        />
      </Slider.Root>
    </div>
  );
}
