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
  emerald: "rgba(16, 185, 129, 0.14)",
  amber: "rgba(245, 158, 11, 0.14)",
  crimson: "rgba(239, 68, 68, 0.15)",
  sky: "rgba(56, 189, 248, 0.14)",
  neutral: "rgba(148, 163, 184, 0.10)",
};

const TONE_ACCENT_BAR: Record<SpotlightTone, string> = {
  emerald:
    "before:bg-gradient-to-r before:from-emerald-400/90 before:via-teal-300/60 before:to-transparent",
  amber:
    "before:bg-gradient-to-r before:from-amber-400/90 before:via-amber-300/55 before:to-transparent",
  crimson:
    "before:bg-gradient-to-r before:from-rose-500/90 before:via-amber-400/55 before:to-transparent",
  sky: "before:bg-gradient-to-r before:from-sky-400/90 before:via-emerald-400/55 before:to-transparent",
  neutral:
    "before:bg-gradient-to-r before:from-slate-400/50 before:via-slate-400/15 before:to-transparent",
};

const TONE_RING: Record<SpotlightTone, string> = {
  emerald: "hover:border-emerald-400/45",
  amber: "hover:border-amber-400/45",
  crimson: "hover:border-rose-400/45",
  sky: "hover:border-sky-400/45",
  neutral: "hover:border-active-border",
};

/**
 * Luminous Glass-Bevel Container inspired by open-source React craft primitives
 * (`magicui` Spotlight & `motion-primitives`). Updates cursor coordinates via CSS
 * variables directly on the DOM node so zero React re-renders occur on mouse move.
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
        "terminal-panel group/spot relative overflow-hidden rounded-lg transition-all duration-200",
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
          className="pointer-events-none absolute -inset-px z-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
          style={{
            background:
              "radial-gradient(380px circle at var(--spot-x, 50%) var(--spot-y, 0%), var(--spot-color), transparent 72%)",
          }}
        />
      )}
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
