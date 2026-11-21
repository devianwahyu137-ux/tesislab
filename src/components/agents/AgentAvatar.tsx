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

const ROLE_PALETTE: Record<
  AgentRole,
  {
    primary: string;
    secondary: string;
    suit: string;
    suitShadow: string;
    hair: string;
    skin: string;
    skinShadow: string;
  }
> = {
  data_analyst: {
    primary: "#10B981",
    secondary: "#64748B",
    suit: "#1E293B",
    suitShadow: "#0F172A",
    hair: "#1E2430",
    skin: "#E2C4A8",
    skinShadow: "#C7A282",
  },
  risk_manager: {
    primary: "#F59E0B",
    secondary: "#F43F5E",
    suit: "#26211F",
    suitShadow: "#141110",
    hair: "#18181B",
    skin: "#D9B394",
    skinShadow: "#B88C6B",
  },
  committee_chair: {
    primary: "#38BDF8",
    secondary: "#EAB308",
    suit: "#172030",
    suitShadow: "#0C121D",
    hair: "#334155",
    skin: "#DFBC9E",
    skinShadow: "#BF9878",
  },
};

const STANCE_HALO: Record<AgentStance, string> = {
  standby: "#64748B",
  calculating: "#10B981",
  skeptical: "#F59E0B",
  alarmed: "#F43F5E",
  conditional: "#F59E0B",
  cleared: "#10B981",
};

/**
 * Layered Modern Editorial / Geometric bust portrait SVG (viewBox 120x120)
 * with distinct character silhouettes and 6 expressive mathematical stances.
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
  const palette = ROLE_PALETTE[role];
  const haloColor =
    resolvedStance === "standby" ? palette.primary : STANCE_HALO[resolvedStance];
  const frameStroke = isActive || resolvedStance !== "standby" ? haloColor : "#2E3742";

  // Dynamic facial geometry per stance
  const renderFacialExpression = () => {
    const eyeY = 55;
    const leftEyeX = 48;
    const rightEyeX = 72;

    return (
      <g>
        {/* Eyebrows */}
        {resolvedStance === "standby" && (
          <>
            <path d="M41 47 Q48 45 54 47" stroke={palette.hair} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M66 47 Q72 45 79 47" stroke={palette.hair} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        {resolvedStance === "calculating" && (
          <>
            <path d="M41 48 L55 48" stroke={palette.hair} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M65 48 L79 48" stroke={palette.hair} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        {resolvedStance === "skeptical" && (
          <>
            <path d="M41 48 L55 46" stroke={palette.hair} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M65 44 Q72 41 79 45" stroke={palette.hair} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        {resolvedStance === "alarmed" && (
          <>
            <path d="M41 44 L55 49" stroke={palette.hair} strokeWidth="2.7" strokeLinecap="round" />
            <path d="M79 44 L65 49" stroke={palette.hair} strokeWidth="2.7" strokeLinecap="round" />
          </>
        )}
        {resolvedStance === "conditional" && (
          <>
            <path d="M41 46 Q48 45 55 47" stroke={palette.hair} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M65 47 Q72 45 79 44" stroke={palette.hair} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        {resolvedStance === "cleared" && (
          <>
            <path d="M41 46 Q48 43 55 46" stroke={palette.hair} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M65 46 Q72 43 79 46" stroke={palette.hair} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}

        {/* Eyes */}
        {resolvedStance === "alarmed" ? (
          <>
            <circle cx={leftEyeX} cy={eyeY} r="4.2" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.2" />
            <circle cx={rightEyeX} cy={eyeY} r="4.2" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.2" />
            <circle cx={leftEyeX} cy={eyeY} r="1.9" fill="#F43F5E" />
            <circle cx={rightEyeX} cy={eyeY} r="1.9" fill="#F43F5E" />
          </>
        ) : resolvedStance === "skeptical" ? (
          <>
            <rect x="43" y="53" width="10" height="3.2" rx="1.6" fill="#0F172A" />
            <circle cx="50.5" cy="54.6" r="1.2" fill="#F8FAFC" />
            <circle cx={rightEyeX + 1} cy={eyeY} r="2.6" fill="#0F172A" />
            <circle cx={rightEyeX + 1.8} cy={eyeY - 0.8} r="0.9" fill="#F8FAFC" />
          </>
        ) : (
          <>
            <circle cx={leftEyeX} cy={eyeY} r="2.7" fill="#0F172A" />
            <circle cx={rightEyeX} cy={eyeY} r="2.7" fill="#0F172A" />
            <circle cx={leftEyeX + 0.9} cy={eyeY - 0.9} r="0.9" fill="#F8FAFC" />
            <circle cx={rightEyeX + 0.9} cy={eyeY - 0.9} r="0.9" fill="#F8FAFC" />
          </>
        )}

        {/* Calculating Scan Beam across eyes */}
        {resolvedStance === "calculating" && (
          <line
            x1="36"
            y1={eyeY}
            x2="84"
            y2={eyeY}
            stroke={palette.primary}
            strokeWidth="1.5"
            strokeOpacity="0.85"
            className="animate-pulse"
          />
        )}

        {/* Nose line */}
        <path d="M60 56 L58.5 63.5 L61.5 64" stroke={palette.skinShadow} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Mouth */}
        {resolvedStance === "standby" && (
          <path d="M53 71 Q60 72.5 67 71" stroke="#3F2B21" strokeWidth="2" strokeLinecap="round" />
        )}
        {resolvedStance === "calculating" && (
          <line x1="54" y1="71.5" x2="66" y2="71.5" stroke="#3F2B21" strokeWidth="2" strokeLinecap="round" />
        )}
        {resolvedStance === "skeptical" && (
          <path d="M53 72.5 Q60 70 67 69.5" stroke="#3F2B21" strokeWidth="2.1" strokeLinecap="round" />
        )}
        {resolvedStance === "alarmed" && (
          <path d="M53 73.5 Q60 68.5 67 73.5" stroke="#3F2B21" strokeWidth="2.2" strokeLinecap="round" />
        )}
        {resolvedStance === "conditional" && (
          <path d="M53 71.5 Q60 73 67 70" stroke="#3F2B21" strokeWidth="2" strokeLinecap="round" />
        )}
        {resolvedStance === "cleared" && (
          <path d="M52 70 Q60 75.5 68 70" stroke="#3F2B21" strokeWidth="2.2" strokeLinecap="round" />
        )}
      </g>
    );
  };

  // Micro corner badge per stance
  const renderStanceBadge = () => {
    if (resolvedStance === "standby") {
      return <circle cx="101" cy="19" r="3.5" fill={palette.primary} fillOpacity="0.55" />;
    }
    if (resolvedStance === "calculating") {
      return (
        <g className="animate-pulse">
          <rect x="91" y="10" width="18" height="18" rx="3" fill="#0B0D10" stroke="#10B981" strokeWidth="1.4" />
          <line x1="95" y1="16" x2="105" y2="16" stroke="#10B981" strokeWidth="1.6" />
          <line x1="95" y1="22" x2="102" y2="22" stroke="#10B981" strokeWidth="1.6" />
        </g>
      );
    }
    if (resolvedStance === "skeptical") {
      return (
        <g>
          <rect x="91" y="10" width="18" height="18" rx="3" fill="#0B0D10" stroke="#F59E0B" strokeWidth="1.4" />
          <text x="100" y="23" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="700" fontFamily="monospace">
            ?
          </text>
        </g>
      );
    }
    if (resolvedStance === "alarmed") {
      return (
        <g>
          <path d="M100 9 L110 27 H90 Z" fill="#2A0F14" stroke="#F43F5E" strokeWidth="1.5" strokeLinejoin="round" />
          <text x="100" y="24.5" textAnchor="middle" fill="#F43F5E" fontSize="11" fontWeight="800" fontFamily="monospace">
            !
          </text>
        </g>
      );
    }
    if (resolvedStance === "conditional") {
      return (
        <g>
          <rect x="91" y="10" width="18" height="18" rx="3" fill="#0B0D10" stroke="#F59E0B" strokeWidth="1.4" />
          <text x="100" y="23" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="700" fontFamily="monospace">
            §
          </text>
        </g>
      );
    }
    return (
      <g>
        <rect x="91" y="10" width="18" height="18" rx="3" fill="#072219" stroke="#10B981" strokeWidth="1.4" />
        <path d="M95.5 19.2 L98.8 22.4 L105 15.6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0 transition-transform duration-300", className)}
    >
      <defs>
        <radialGradient id={`halo-${uid}`} cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor={haloColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0B0D10" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x="3" y="3" width="114" height="114" rx="8" />
        </clipPath>
      </defs>

      {/* Outer Architectural Frame */}
      <rect
        x="2"
        y="2"
        width="116"
        height="116"
        rx="9"
        fill="#0D1117"
        stroke={frameStroke}
        strokeWidth="2"
      />

      <g clipPath={`url(#clip-${uid})`}>
        {/* Ambient Rim Halo */}
        <rect x="3" y="3" width="114" height="114" fill={`url(#halo-${uid})`} />

        {/* Role-Specific Background Motif */}
        {role === "data_analyst" && (
          <g stroke="#1E293B" strokeWidth="1">
            <line x1="24" y1="4" x2="24" y2="116" />
            <line x1="60" y1="4" x2="60" y2="116" />
            <line x1="96" y1="4" x2="96" y2="116" />
            <line x1="4" y1="32" x2="116" y2="32" />
            <circle cx="24" cy="32" r="2" fill={palette.primary} fillOpacity="0.4" />
            <circle cx="96" cy="32" r="2" fill={palette.primary} fillOpacity="0.4" />
          </g>
        )}

        {role === "risk_manager" && (
          <g stroke={palette.primary} strokeOpacity="0.14" strokeWidth="1.2">
            <line x1="6" y1="98" x2="44" y2="60" />
            <line x1="76" y1="60" x2="114" y2="98" />
            <circle cx="60" cy="54" r="42" strokeDasharray="4 4" />
          </g>
        )}

        {role === "committee_chair" && (
          <g stroke={palette.primary} strokeOpacity="0.16" strokeWidth="1.2">
            <circle cx="60" cy="56" r="36" />
            <circle cx="60" cy="56" r="46" strokeDasharray="2 5" />
          </g>
        )}

        {/* Shoulders / Bust Attire */}
        <path
          d="M18 118 C20 93 36 84 60 84 C84 84 100 93 102 118 Z"
          fill={palette.suit}
          stroke={palette.suitShadow}
          strokeWidth="1.5"
        />
        {/* Collar & Role Emblem */}
        <path d="M47 84 L60 100 L73 84" fill="#F1F5F9" fillOpacity="0.9" />
        {role === "data_analyst" && (
          <path d="M57 96 L60 116 L63 96 L60 91 Z" fill={palette.primary} />
        )}
        {role === "risk_manager" && (
          <>
            <path d="M45 84 L55 104 L49 116" stroke={palette.primary} strokeWidth="1.4" strokeOpacity="0.6" />
            <path d="M77 99 L83 101.5 V106.5 C83 109.5 80.5 111.5 77 112.5 C73.5 111.5 71 109.5 71 106.5 V101.5 Z" fill={palette.primary} />
          </>
        )}
        {role === "committee_chair" && (
          <>
            <path d="M56 97 L60 115 L64 97 L60 92 Z" fill={palette.primary} />
            <circle cx="77" cy="103" r="4.2" fill={palette.secondary} stroke="#0B0D10" strokeWidth="1.2" />
          </>
        )}

        {/* Neck */}
        <rect x="52" y="74" width="16" height="14" rx="5" fill={palette.skinShadow} />

        {/* Ears */}
        <circle cx="35" cy="57" r="4.5" fill={palette.skinShadow} />
        <circle cx="85" cy="57" r="4.5" fill={palette.skinShadow} />

        {/* Head Silhouette */}
        <rect
          x="36"
          y="28"
          width="48"
          height="52"
          rx="22"
          fill={palette.skin}
          stroke={haloColor}
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />

        {/* Hair per Role */}
        {role === "data_analyst" && (
          <path
            d="M35 50 C35 30 45 22 62 22 C77 22 85 32 85 49 C81 40 72 36 60 36 C48 36 40 41 35 50 Z"
            fill={palette.hair}
          />
        )}
        {role === "risk_manager" && (
          <path
            d="M35 49 C34 31 44 20 60 20 C76 20 86 31 85 49 L81 38 L70 33 L60 36 L48 32 L38 39 Z"
            fill={palette.hair}
          />
        )}
        {role === "committee_chair" && (
          <>
            <path
              d="M35 50 C35 28 45 21 60 21 C75 21 85 28 85 50 C81 39 74 35 60 35 C46 35 39 39 35 50 Z"
              fill={palette.hair}
            />
            {/* Distinguished silver temple streaks */}
            <path d="M36 45 C37 40 39 37 42 36" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M84 45 C83 40 81 37 78 36" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
          </>
        )}

        {/* Facial Expression */}
        {renderFacialExpression()}

        {/* Data Analyst Geometric Glasses */}
        {role === "data_analyst" && (
          <g>
            <rect
              x="40"
              y="49"
              width="17"
              height="12"
              rx="2.5"
              fill={palette.primary}
              fillOpacity="0.09"
              stroke={palette.primary}
              strokeWidth="1.8"
            />
            <rect
              x="63"
              y="49"
              width="17"
              height="12"
              rx="2.5"
              fill={palette.primary}
              fillOpacity="0.09"
              stroke={palette.primary}
              strokeWidth="1.8"
            />
            <line x1="57" y1="54.5" x2="63" y2="54.5" stroke={palette.primary} strokeWidth="1.8" />
            {/* Lens glint */}
            <line x1="43" y1="58" x2="47" y2="52" stroke="#F8FAFC" strokeOpacity="0.45" strokeWidth="1.2" />
            <line x1="66" y1="58" x2="70" y2="52" stroke="#F8FAFC" strokeOpacity="0.45" strokeWidth="1.2" />
          </g>
        )}

        {/* Stance Micro Badge */}
        {renderStanceBadge()}
      </g>
    </svg>
  );
}
