"use client";

import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
import { VirtualWarRoomOffice } from "@/components/office/VirtualWarRoomOffice";
import { EmpiricalEvidenceSection } from "@/components/sections/EmpiricalEvidenceSection";
import { FounderMemoSection } from "@/components/sections/FounderMemoSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { RoadmapSection } from "@/components/sections/RoadmapSection";
import { AuditWorkspace } from "@/components/workspace/AuditWorkspace";
import { XRayArchitectureDrawer } from "@/components/xray/XRayArchitectureDrawer";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";

export interface WorkspaceSlotAndFooterProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

/**
 * Centered Institutional War-Room Terminal shell featuring the Live Virtual Office,
 * single-source AuditWorkspace, 4-Step Walkthrough, Veto Protocol Dossier,
 * Founder's Memo, Empirical Evidence, Roadmap, and X-Ray Inspector.
 */
export function WorkspaceSlotAndFooter({
  macroContext,
  macroOrigin,
}: WorkspaceSlotAndFooterProps) {
  const { t } = useTranslation();

  return (
    <>
      <section
        id="audit-workspace-slot"
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-sm border border-active-border/80 bg-surface/92 shadow-2xl shadow-black/40 backdrop-blur-xs"
      >
        {/* War-Room Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-hairline bg-canvas px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rejected/55" />
              <span className="h-2.5 w-2.5 rounded-full bg-conditional/55" />
              <span className="h-2.5 w-2.5 rounded-full bg-cleared/55" />
            </div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">
              {t("warroom.session_code")}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            WRM-01
          </span>
        </div>

        {/* Live Institutional Virtual Office (HERMES-00 -> DIV-01 -> DIV-02 -> DIV-03) */}
        <VirtualWarRoomOffice
          macroContext={macroContext}
          macroOrigin={macroOrigin}
        />

        {/* Centralized Audit Workspace Body */}
        <div id="audit-workspace-form-slot" className="p-4 md:p-6">
          <AuditWorkspace />
        </div>
      </section>

      <HowItWorksSection />

      <CommitteeShowcase />

      <FounderMemoSection />

      <EmpiricalEvidenceSection />

      <RoadmapSection />

      {/* Single Authoritative Page Disclaimer */}
      <footer className="mx-auto w-full max-w-5xl border-t border-hairline pt-5">
        <p className="font-mono text-xs leading-relaxed text-ink-muted">
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
