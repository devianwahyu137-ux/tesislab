"use client";

import { useState } from "react";
import { Download, ShieldAlert, CheckCircle2, Check } from "lucide-react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { downloadVerdictCardPng } from "@/lib/exportVerdictPng";
import type { VerdictPayload } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const SCORE_TONE_CLASSES: Record<VerdictPayload["verdict_status"], string> = {
  CLEARED: "text-cleared",
  CONDITIONAL: "text-conditional",
  REJECTED: "text-rejected",
};

/**
 * Official Swiss Editorial Verdict Card displaying the Pre-Mortem committee decision,
 * 3 blind spots, mandatory actionable fix, 3-agent deliberation, and 1200x675 PNG export.
 */
export function VerdictCard() {
  const { locale, t } = useTranslation();
  const { auditResponse, lastTrack } = useAuditUI();
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  if (!auditResponse) return null;

  const { verdict } = auditResponse;
  const track = lastTrack ?? "business";
  const statusKey = verdict.verdict_status.toLowerCase() as
    | "cleared"
    | "conditional"
    | "rejected";

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadVerdictCardPng({ verdict, track, locale });
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <EditorialPanel
      title={t("verdict.card_title")}
      indexCode={`${t("verdict.audit_id_label")}: ${verdict.audit_id}`}
      elevated
    >
      <div className="flex flex-col gap-6">
        {/* Card Meta Header + PNG Export Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusStamp
              variant={verdict.verdict_status}
              label={t(`verdict.status.${statusKey}`)}
            />
            <span className="rounded-sm border border-hairline bg-obsidian px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              {t(`tracks.${track}.name`)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-active-border bg-obsidian px-4 font-mono text-xs uppercase tracking-wider text-text-primary transition-colors hover:bg-surface disabled:opacity-60"
          >
            {exported ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-cleared" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isExporting
                ? t("verdict.exporting_png")
                : exported
                  ? t("verdict.exported_png")
                  : t("verdict.export_png_btn")}
            </span>
          </button>
        </div>

        {/* Main Verdict Headline + Score */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <h3 className="font-editorial max-w-2xl text-2xl font-medium leading-[1.2] text-text-primary md:text-3xl">
            {verdict.headline_verdict}
          </h3>

          <div className="flex shrink-0 flex-col md:items-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              {t("form.score_label")}
            </span>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span
                className={cn(
                  "text-4xl font-bold tracking-tight md:text-5xl",
                  SCORE_TONE_CLASSES[verdict.verdict_status]
                )}
              >
                {verdict.score}
              </span>
              <span className="text-sm text-text-muted">
                {t("verdict.score_suffix")}
              </span>
            </div>
          </div>
        </div>

        <TerminalDivider label={t("verdict.blind_spots_title")} />

        {/* 3 Pre-Mortem Blind Spots */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {verdict.premortem_blind_spots.map((spot, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 rounded-sm border border-hairline bg-obsidian p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-conditional">
                  0{idx + 1}
                </span>
                <ShieldAlert
                  className="h-3.5 w-3.5 text-conditional/70"
                  aria-hidden="true"
                />
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {spot}
              </p>
            </div>
          ))}
        </div>

        {/* Mandatory Actionable Fix */}
        <div className="rounded-sm border border-cleared/40 bg-cleared/10 p-4">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cleared">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("verdict.actionable_fix_title")}</span>
          </div>
          <p className="font-sans text-sm leading-relaxed text-text-primary">
            {verdict.actionable_fix}
          </p>
        </div>

        <TerminalDivider label={t("verdict.deliberation_title")} />

        {/* Compact 3-Agent Deliberation Summary */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(
            ["data_analyst", "risk_manager", "committee_chair"] as const
          ).map((role) => (
            <div
              key={role}
              className="rounded-sm border border-hairline bg-obsidian/70 p-3.5"
            >
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {t(`agents.roles.${role}.name`)}
              </span>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {verdict.agent_deliberation[role]}
              </p>
            </div>
          ))}
        </div>

        {/* Card Footer Disclaimer */}
        <p className="border-t border-hairline pt-3 font-mono text-[11px] leading-relaxed text-text-muted">
          {t("verdict.disclaimer")}
        </p>
      </div>
    </EditorialPanel>
  );
}
