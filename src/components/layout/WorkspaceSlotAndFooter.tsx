"use client";

import { AgentStage } from "@/components/agents/AgentStage";
import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
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
 * Asymmetric multi-device workspace shell with interactive Committee Showcase
 * and X-Ray Architecture Inspector drawer.
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
        className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <AgentStage macroContext={macroContext} />
        </div>

        <div id="audit-workspace-form-slot" className="lg:col-span-8">
          <AuditWorkspace />
        </div>
      </section>

      <CommitteeShowcase />

      <footer className="border-t border-hairline pt-5">
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
