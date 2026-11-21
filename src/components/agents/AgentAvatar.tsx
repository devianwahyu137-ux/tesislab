"use client";

import { useId } from "react";
import type { AgentRole, AuditPhase } from "@/context/AuditUIContext";
import { cn } from "@/lib/utils";

export type AgentStance =
  | "standby"
  | "calculating"
  | "skeptical"
  | "alarmed"
  | "conditional"
  | "cleared";

export interface AgentAvatarProps {
  role: AgentRole;
  phase?: AuditPhase;
  stance?: AgentStance;
  isActive?: boolean;
  size?: number;
  className?: string;
}

function mapPhaseToStance(phase: AuditPhase): AgentStance {
  if (phase === "scanning") return "calculating";
  if (phase === "debating") return "skeptical";
  if (phase === "verdict") return "cleared";
  return "standby";
}

const DIVISION_STYLE: Record<
  AgentRole,
  { code: string; primary: string; secondary: string }
> = {
  data_analyst: {
    code: "01",
    primary: "#10B981",
    secondary: "#34D399",
  },
  risk_manager: {
    code: "02",
    primary: "#F59E0B",
    secondary: "#F43F5E",
  },
  committee_chair: {
    code: "03",
    primary: "#38BDF8",
    secondary: "#EAB308",
  },
};

const STANCE_ACCENT: Record<AgentStance, string | null> = {
  standby: null,
  calculating: "#10B981",
  skeptical: "#F59E0B",
  alarmed: "#F43F5E",
  conditional: "#F59E0B",
  cleared: "#10B981",
};

/**
 * Swiss Institutional Geometric Monogram Emblem (DIV-01 / DIV-02 / DIV-03).
 * Responds to audit phase/stance via precision border glow and scanline indicator.
 */
export function AgentAvatar({
  role,
  phase = "idle",
  stance,
  isActive = false,
  size = 44,
  className,
}: AgentAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const resolvedStance: AgentStance = stance ?? mapPhaseToStance(phase);
  const div = DIVISION_STYLE[role];
  const accent = STANCE_ACCENT[resolvedStance] ?? div.primary;
  const frameStroke =
    isActive || resolvedStance !== "standby" ? accent : "#2E3742";
  const isScanning = resolvedStance === "calculating";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0 transition-all duration-300", className)}
    >
      <defs>
        <radialGradient id={`emblem-glow-${uid}`} cx="50%" cy="50%" r="55%">
          <stop
            offset="0%"
            stopColor={accent}
            stopOpacity={isActive ? "0.22" : "0.1"}
          />
          <stop offset="100%" stopColor="#0B0D10" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer Precision Frame */}
      <rect
        x="1.5"
        y="1.5"
        width="77"
        height="77"
        rx="4"
        fill="#0B0D10"
        stroke={frameStroke}
        strokeWidth="1.5"
      />
      <rect
        x="2"
        y="2"
        width="76"
        height="76"
        rx="3.5"
        fill={`url(#emblem-glow-${uid})`}
      />

      {/* Corner Tick Marks */}
      <path d="M8 14 V8 H14" stroke="#2E3742" strokeWidth="1" />
      <path d="M66 8 H72 V14" stroke="#2E3742" strokeWidth="1" />
      <path d="M8 66 V72 H14" stroke="#2E3742" strokeWidth="1" />
      <path d="M66 72 H72 V66" stroke="#2E3742" strokeWidth="1" />

      {/* DIV-01: Quantitative Coordinate Grid + Precision Prism */}
      {role === "data_analyst" && (
        <g>
          <line x1="16" y1="40" x2="64" y2="40" stroke="#1E242B" strokeWidth="1" />
          <line x1="40" y1="16" x2="40" y2="64" stroke="#1E242B" strokeWidth="1" />
          <polygon
            points="40,18 60,40 40,62 20,40"
            stroke={accent}
            strokeWidth="1.6"
            fill={accent}
            fillOpacity="0.06"
          />
          <polygon
            points="40,28 50,40 40,52 30,40"
            stroke="#F3F4F6"
            strokeWidth="1.3"
          />
          <circle cx="40" cy="40" r="2.6" fill={accent} />
        </g>
      )}

      {/* DIV-02: Layered Hexagonal Shield + Drawdown Limit Bar */}
      {role === "risk_manager" && (
        <g>
          <polygon
            points="40,16 59,27 59,53 40,64 21,53 21,27"
            stroke={accent}
            strokeWidth="1.6"
            fill={accent}
            fillOpacity="0.06"
          />
          <polygon
            points="40,24 52,31 52,49 40,56 28,49 28,31"
            stroke="#F3F4F6"
            strokeWidth="1.2"
            strokeOpacity="0.85"
          />
          <line x1="25" y1="40" x2="55" y2="40" stroke={div.secondary} strokeWidth="1.8" />
          <rect x="37.5" y="37.5" width="5" height="5" fill="#0B0D10" stroke={div.secondary} strokeWidth="1.4" />
        </g>
      )}

      {/* DIV-03: Symmetrical Architectural Seal + Authority Balance */}
      {role === "committee_chair" && (
        <g>
          <circle cx="40" cy="40" r="22" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" />
          <rect
            x="24"
            y="24"
            width="32"
            height="32"
            rx="1"
            stroke="#F3F4F6"
            strokeWidth="1.4"
            fill={accent}
            fillOpacity="0.05"
          />
          <line x1="29" y1="35" x2="51" y2="35" stroke={div.secondary} strokeWidth="1.8" />
          <line x1="40" y1="29" x2="40" y2="51" stroke={accent} strokeWidth="1.6" />
          <circle cx="40" cy="35" r="2.5" fill={div.secondary} />
        </g>
      )}

      {/* Scanning Beam */}
      {isScanning && (
        <line
          x1="10"
          y1="40"
          x2="70"
          y2="40"
          stroke={accent}
          strokeWidth="1.5"
          strokeOpacity="0.85"
          className="animate-pulse"
        />
      )}

      {/* Division Index Tag */}
      <text
        x="67"
        y="20"
        textAnchor="end"
        fill="#6B7280"
        fontSize="8.5"
        fontWeight="600"
        fontFamily="monospace"
      >
        {div.code}
      </text>
    </svg>
  );
}
