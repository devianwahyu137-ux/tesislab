"use client";

import type { AgentRole, AuditPhase } from "@/context/AuditUIContext";
import { cn } from "@/lib/utils";

export interface AgentAvatarProps {
  role: AgentRole;
  phase: AuditPhase;
  isActive?: boolean;
  size?: number;
  className?: string;
}

function getAccentStroke(phase: AuditPhase, isActive: boolean): string {
  if (!isActive && phase === "idle") return "#6B7280";
  if (phase === "scanning") return "#10B981";
  if (phase === "debating") return "#F59E0B";
  if (phase === "verdict") return "#10B981";
  return "#9CA3AF";
}

/**
 * Lightweight Swiss Bauhaus / Editorial Monoline SVG avatar for the 3 committee roles.
 */
export function AgentAvatar({
  role,
  phase,
  isActive = false,
  size = 40,
  className,
}: AgentAvatarProps) {
  const accent = getAccentStroke(phase, isActive);
  const frameStroke = isActive ? accent : "#2E3742";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        "shrink-0 transition-transform duration-300",
        isActive && phase === "scanning" && "animate-pulse",
        className
      )}
    >
      {/* Precision Bauhaus Outer Frame */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="2"
        fill="#0B0D10"
        stroke={frameStroke}
        strokeWidth="1.25"
      />

      {role === "data_analyst" && (
        <>
          {/* Quantitative grid lines */}
          <line x1="6" y1="10" x2="34" y2="10" stroke="#1E242B" strokeWidth="1" />
          <line x1="20" y1="6" x2="20" y2="34" stroke="#1E242B" strokeWidth="1" />
          {/* Geometric head + analytical dual-lens visor */}
          <circle cx="20" cy="17" r="6.5" stroke="#F3F4F6" strokeWidth="1.4" />
          <rect x="13" y="15" width="6" height="4" rx="0.5" stroke={accent} strokeWidth="1.4" />
          <rect x="21" y="15" width="6" height="4" rx="0.5" stroke={accent} strokeWidth="1.4" />
          <line x1="19" y1="17" x2="21" y2="17" stroke={accent} strokeWidth="1.4" />
          <path d="M10 34C10 28.5 14.5 25.5 20 25.5C25.5 25.5 30 28.5 30 34" stroke="#9CA3AF" strokeWidth="1.4" />
        </>
      )}

      {role === "risk_manager" && (
        <>
          {/* Pre-Mortem structural shield + visor */}
          <path
            d="M20 7L30 11.5V20C30 26.2 25.6 31.1 20 33C14.4 31.1 10 26.2 10 20V11.5L20 7Z"
            stroke="#F3F4F6"
            strokeWidth="1.4"
          />
          <line x1="12.5" y1="17" x2="27.5" y2="17" stroke={accent} strokeWidth="1.6" />
          <circle cx="20" cy="22.5" r="2.2" stroke={accent} strokeWidth="1.4" />
        </>
      )}

      {role === "committee_chair" && (
        <>
          {/* Symmetrical authority seal + gavel bar */}
          <rect x="11" y="9" width="18" height="14" rx="1" stroke="#F3F4F6" strokeWidth="1.4" />
          <line x1="14" y1="14" x2="26" y2="14" stroke={accent} strokeWidth="1.5" />
          <line x1="20" y1="14" x2="20" y2="20" stroke={accent} strokeWidth="1.5" />
          <path d="M9 33L14 26.5H26L31 33" stroke="#9CA3AF" strokeWidth="1.4" />
          <circle cx="20" cy="29.5" r="1.5" fill={accent} />
        </>
      )}
    </svg>
  );
}
