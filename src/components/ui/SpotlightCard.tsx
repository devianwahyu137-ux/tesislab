"use client";

import { useRef, type HTMLAttributes, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export type SpotlightTone =
  | "emerald"
  | "amber"
  | "crimson"
  | "sky"
  | "neutral";

export interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SpotlightTone;
  topAccent?: boolean;
  interactive?: boolean;
}

const TONE_SPOTLIGHT_RGBA: Record<SpotlightTone, string> = {
  emerald: "rgba(16, 185, 129, 0.15)",
  amber: "rgba(245, 158, 11, 0.15)",
  crimson: "rgba(239, 68, 68, 0.16)",
  sky: "rgba(56, 189, 248, 0.15)",
  neutral: "rgba(148, 163, 184, 0.11)",
};

const TONE_ACCENT_BAR: Record<SpotlightTone, string> = {
  emerald:
    "before:bg-gradient-to-r before:from-emerald-400/95 before:via-teal-300/65 before:to-transparent",
  amber:
    "before:bg-gradient-to-r before:from-amber-400/95 before:via-amber-300/60 before:to-transparent",
  crimson:
    "before:bg-gradient-to-r before:from-rose-500/95 before:via-amber-400/60 before:to-transparent",
  sky: "before:bg-gradient-to-r before:from-sky-400/95 before:via-emerald-400/60 before:to-transparent",
  neutral:
    "before:bg-gradient-to-r before:from-slate-400/55 before:via-slate-400/20 before:to-transparent",
};

const TONE_RING: Record<SpotlightTone, string> = {
  emerald: "hover:border-emerald-400/50",
  amber: "hover:border-amber-400/50",
  crimson: "hover:border-rose-400/50",
  sky: "hover:border-sky-400/50",
  neutral: "hover:border-active-border",
};

/**
 * Luminous Glass-Bevel Container inspired by open-source React craft primitives.
 * Uses `isolate flex flex-col` directly on the root element so layout utilities
 * (`justify-between`, `gap-*`, `p-*`) work natively on direct children.
 */
export function SpotlightCard({
  tone = "emerald",
  topAccent = true,
  interactive = true,
  className,
  children,
  onMouseMove,
  ...rest
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (interactive && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      cardRef.current.style.setProperty(
        "--spot-x",
        `${Math.round(e.clientX - rect.left)}px`
      );
      cardRef.current.style.setProperty(
        "--spot-y",
        `${Math.round(e.clientY - rect.top)}px`
      );
    }
    onMouseMove?.(e);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      style={
        {
          "--spot-color": TONE_SPOTLIGHT_RGBA[tone],
        } as React.CSSProperties
      }
      className={cn(
        "terminal-panel group/spot relative isolate flex flex-col overflow-hidden rounded-lg transition-all duration-200",
        topAccent &&
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[2px]",
        topAccent && TONE_ACCENT_BAR[tone],
        interactive && TONE_RING[tone],
        className
      )}
      {...rest}
    >
      {interactive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
          style={{
            background:
              "radial-gradient(380px circle at var(--spot-x, 50%) var(--spot-y, 0%), var(--spot-color), transparent 72%)",
          }}
        />
      )}
      {children}
    </div>
  );
}
