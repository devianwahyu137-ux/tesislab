"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Subtle cursor-tracking spotlight card inspired by Linear & Vercel craft.
 * Uses CSS custom properties with zero extra dependencies and full Dark/Light adaptation.
 */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setPos(null)}
      className={cn(
        "surface-specular group relative overflow-hidden rounded-sm border border-hairline bg-surface transition-colors duration-200 hover:border-active-border",
        className
      )}
    >
      {pos && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
          style={{
            background: `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, color-mix(in srgb, var(--status-cleared) 9%, transparent), transparent 65%)`,
          }}
        />
      )}
      <div className="relative z-10 flex h-full flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
