"use client";

import { AuditSentinelCompanion } from "@/components/agents/AuditSentinelCompanion";
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
        className="surface-specular mx-auto w-full max-w-6xl overflow-hidden rounded-sm border border-active-border/80 bg-surface"
      >
        {/* Full-Frame 3D Isometric Institutional War-Room Office */}
        <VirtualWarRoomOffice
          macroContext={macroContext}
          macroOrigin={macroOrigin}
        />

        {/* Centralized Audit Workspace Body */}
        <div id="audit-workspace-form-slot" className="p-5 sm:p-7 md:p-8">
          <AuditWorkspace />
        </div>
      </section>

      <HowItWorksSection macroContext={macroContext} />

      <CommitteeShowcase />

      <FounderMemoSection />

      <EmpiricalEvidenceSection />

      <RoadmapSection />

      {/* Single Authoritative Page Disclaimer */}
      <footer className="mx-auto w-full max-w-6xl border-t border-hairline py-8">
        <p className="font-mono text-xs leading-relaxed text-ink-muted">
          {t("verdict.disclaimer")}
        </p>
      </footer>

      <XRayArchitectureDrawer
        macroContext={macroContext}
        macroOrigin={macroOrigin}
      />

      <AuditSentinelCompanion />
    </>
  );
}
