"use client";

import { AlertTriangle } from "lucide-react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
import { FounderMemoSection } from "@/components/sections/FounderMemoSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { AuditWorkspace } from "@/components/workspace/AuditWorkspace";
import { XRayArchitectureDrawer } from "@/components/xray/XRayArchitectureDrawer";
import { useAuditUI, type AgentRole } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface WorkspaceSlotAndFooterProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

const DIVISIONS: readonly { role: AgentRole; code: string }[] = [
  { role: "data_analyst", code: "DIV-01" },
  { role: "risk_manager", code: "DIV-02" },
  { role: "committee_chair", code: "DIV-03" },
];

/**
 * Centered Institutional War-Room Terminal shell with horizontal 3-division status strip,
 * single-source AuditWorkspace, Committee Veto Protocol Dossier, and X-Ray drawer.
 */
export function WorkspaceSlotAndFooter({
  macroContext,
  macroOrigin,
}: WorkspaceSlotAndFooterProps) {
  const { locale, t } = useTranslation();
  const { auditPhase, activeAgent } = useAuditUI();

  const macroAlert =
    locale === "en"
      ? macroContext.synthesis.key_risk_alert_en
      : macroContext.synthesis.key_risk_alert_id;

  const phaseLabel = t(`agents.status.${auditPhase}`);

  return (
    <>
      <section
        id="audit-workspace-slot"
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-sm border border-active-border/80 bg-surface/90 shadow-2xl shadow-black/40 backdrop-blur-xs"
      >
        {/* War-Room Terminal Header Bar */}
        <div className="flex flex-col gap-3 border-b border-hairline bg-obsidian px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rejected/55" />
              <span className="h-2.5 w-2.5 rounded-full bg-conditional/55" />
              <span className="h-2.5 w-2.5 rounded-full bg-cleared/55" />
            </div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
              {t("warroom.session_code")}
            </span>
          </div>

          {/* Horizontal 3-Division Live Status Indicators */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            {DIVISIONS.map(({ role, code }) => {
              const isLit =
                auditPhase === "verdict" || activeAgent === role;
              return (
                <div
                  key={role}
                  className={cn(
                    "flex items-center gap-2 rounded-sm border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                    isLit
                      ? auditPhase === "debating" && activeAgent === role
                        ? "border-conditional/60 bg-conditional/10 text-conditional"
                        : "border-cleared/50 bg-cleared/10 text-cleared"
                      : "border-hairline bg-surface/70 text-text-muted"
                  )}
                >
                  <AgentAvatar
                    role={role}
                    phase={isLit ? auditPhase : "idle"}
                    isActive={isLit}
                    size={22}
                  />
                  <span className="font-semibold">{code}</span>
                  <span className="hidden sm:inline">
                    · {isLit ? phaseLabel : t("agents.status.idle")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Macro Alert Strip inside War-Room */}
        <div className="flex items-start gap-2.5 border-b border-hairline bg-obsidian/55 px-4 py-2.5 md:px-6">
          <AlertTriangle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-conditional"
            aria-hidden="true"
          />
          <p className="font-sans text-xs leading-relaxed text-text-secondary">
            <span className="mr-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-conditional">
              {t("agents.macro_brief_label")}:
            </span>
            {macroAlert}
          </p>
        </div>

        {/* Centralized Audit Workspace Body */}
        <div id="audit-workspace-form-slot" className="p-4 md:p-6">
          <AuditWorkspace />
        </div>
      </section>

      <HowItWorksSection />

      <CommitteeShowcase />

      <FounderMemoSection />

      {/* Single Authoritative Page Disclaimer */}
      <footer className="mx-auto w-full max-w-5xl border-t border-hairline pt-5">
        <p className="font-mono text-xs leading-relaxed text-text-muted">
          {t("verdict.disclaimer")}
        </p>
      </footer>

      <XRayArchitectureDrawer
        macroContext={macroContext}
        macroOrigin={macroOrigin}
      />
    </>
  );
}
