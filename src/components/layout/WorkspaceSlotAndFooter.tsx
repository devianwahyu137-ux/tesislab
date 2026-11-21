"use client";

import { AgentStage } from "@/components/agents/AgentStage";
import { AuditWorkspace } from "@/components/workspace/AuditWorkspace";
import { useTranslation } from "@/context/LanguageContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";

export interface WorkspaceSlotAndFooterProps {
  macroContext: MarketContext;
}

/**
 * Asymmetric multi-device workspace shell:
 * - Desktop (lg): 4 cols AgentStage (left) + 8 cols AuditWorkspace (right)
 * - Tablet/Mobile: AgentStage stacked above AuditWorkspace
 */
export function WorkspaceSlotAndFooter({
  macroContext,
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

      <footer className="border-t border-hairline pt-5">
        <p className="font-mono text-xs leading-relaxed text-text-muted">
          {t("verdict.disclaimer")}
        </p>
      </footer>
    </>
  );
}
