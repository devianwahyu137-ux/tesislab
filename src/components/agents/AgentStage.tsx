"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import {
  useAuditUI,
  type AgentRole,
  type AuditPhase,
} from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface AgentStageProps {
  macroContext: MarketContext;
}

const AGENT_ROLES: readonly AgentRole[] = [
  "data_analyst",
  "risk_manager",
  "committee_chair",
];

function getPhaseBadgeClass(phase: AuditPhase, isActive: boolean): string {
  if (!isActive && phase === "idle") {
    return "border-hairline bg-obsidian text-text-muted";
  }
  if (phase === "scanning" || phase === "verdict") {
    return "border-cleared/40 bg-cleared/10 text-cleared";
  }
  if (phase === "debating") {
    return "border-conditional/40 bg-conditional/10 text-conditional";
  }
  return "border-hairline bg-obsidian text-text-secondary";
}

/**
 * Adaptive Virtual Committee Stage for Desktop (vertical left panel),
 * iPad (3-column horizontal stage), and Mobile (Dynamic Active Agent Pill).
 */
export function AgentStage({ macroContext }: AgentStageProps) {
  const { locale, t } = useTranslation();
  const { auditPhase, activeAgent, agentSnippets } = useAuditUI();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const macroAlert =
    locale === "en"
      ? macroContext.synthesis.key_risk_alert_en
      : macroContext.synthesis.key_risk_alert_id;

  const pillRole: AgentRole = activeAgent ?? "committee_chair";
  const phaseLabel = t(`agents.status.${auditPhase}`);

  const renderAgentCard = (role: AgentRole, compact = false) => {
    const isActive =
      activeAgent === role || (auditPhase === "verdict" && Boolean(agentSnippets[role]));
    const snippet = agentSnippets[role];

    return (
      <div
        key={role}
        className={cn(
          "flex flex-col gap-2.5 rounded-sm border p-3.5 transition-colors",
          isActive
            ? "border-active-border bg-elevated"
            : "border-hairline bg-obsidian/70"
        )}
      >
        <div className="flex items-start gap-3">
          <AgentAvatar
            role={role}
            phase={auditPhase}
            isActive={isActive}
            size={compact ? 36 : 40}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-sans text-xs font-semibold text-text-primary">
                {t(`agents.roles.${role}.name`)}
              </h3>
              <span
                className={cn(
                  "shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  getPhaseBadgeClass(auditPhase, isActive)
                )}
              >
                {isActive ? phaseLabel : t("agents.status.idle")}
              </span>
            </div>
            <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
              {auditPhase === "verdict" && snippet
                ? snippet
                : t(`agents.roles.${role}.description`)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMacroBrief = () => (
    <div className="rounded-sm border border-hairline bg-obsidian p-3.5">
      <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-conditional">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t("agents.macro_brief_label")}</span>
      </div>
      <p className="font-sans text-xs leading-relaxed text-text-secondary">
        {macroAlert}
      </p>
    </div>
  );

  return (
    <div className="w-full">
      {/* 1. Desktop View (>= 1024px): Vertical Committee Chamber Panel */}
      <div className="hidden lg:block">
        <EditorialPanel
          title={t("agents.chamber_title")}
          indexCode="CHM-01"
        >
          <div className="flex flex-col gap-3">
            {AGENT_ROLES.map((role) => renderAgentCard(role))}
            <div className="pt-1">{renderMacroBrief()}</div>
          </div>
        </EditorialPanel>
      </div>

      {/* 2. iPad / Tablet View (768px - 1023px): Horizontal 3-Column Stage */}
      <div className="hidden md:flex md:flex-col md:gap-3 lg:hidden">
        <div className="grid grid-cols-3 gap-3">
          {AGENT_ROLES.map((role) => renderAgentCard(role, true))}
        </div>
        {renderMacroBrief()}
      </div>

      {/* 3. Mobile View (< 768px): Dynamic Active Agent Pill */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center justify-between gap-3 rounded-sm border border-hairline bg-surface p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <AgentAvatar
              role={pillRole}
              phase={auditPhase}
              isActive={auditPhase !== "idle"}
              size={34}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    auditPhase === "debating"
                      ? "animate-pulse bg-conditional"
                      : auditPhase === "idle"
                        ? "bg-text-muted"
                        : "animate-pulse bg-cleared"
                  )}
                />
                <span className="truncate font-sans text-xs font-semibold text-text-primary">
                  {t(`agents.roles.${pillRole}.name`)}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {phaseLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileExpanded((prev) => !prev)}
            aria-expanded={mobileExpanded}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-sm border border-active-border bg-obsidian px-3 font-mono text-[11px] uppercase tracking-wider text-text-secondary"
          >
            <span>
              {mobileExpanded
                ? t("agents.collapse_panel")
                : t("agents.expand_panel")}
            </span>
            {mobileExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {mobileExpanded && (
          <div className="flex flex-col gap-2.5 rounded-sm border border-hairline bg-surface p-3">
            {AGENT_ROLES.map((role) => renderAgentCard(role, true))}
            {renderMacroBrief()}
          </div>
        )}
      </div>
    </div>
  );
}
