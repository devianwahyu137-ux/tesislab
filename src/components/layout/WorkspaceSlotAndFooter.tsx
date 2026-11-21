"use client";

import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Localized placeholder slot for Sprint 12-15 workspace components
 * and professional disclaimer footer.
 */
export function WorkspaceSlotAndFooter() {
  const { t } = useTranslation();

  return (
    <>
      <section
        id="audit-workspace-slot"
        className="w-full rounded-sm border border-dashed border-hairline bg-surface/40 p-6 md:p-8"
      >
        <TerminalDivider label={t("common.workspace_slot_label")} />
      </section>

      <footer className="border-t border-hairline pt-5">
        <p className="font-mono text-xs leading-relaxed text-text-muted">
          {t("verdict.disclaimer")}
        </p>
      </footer>
    </>
  );
}
