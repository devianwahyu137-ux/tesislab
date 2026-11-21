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

const BAR_TONE_CLASSES: Record<VerdictPayload["verdict_status"], string> = {
  CLEARED: "bg-cleared",
  CONDITIONAL: "bg-conditional",
  REJECTED: "bg-rejected",
};

/**
 * Official Swiss Editorial Verdict Card displaying the Pre-Mortem committee decision,
 * Conviction vs. Reality Gap mirror, 3 blind spots, mandatory actionable fix, and PNG export.
 */
export function VerdictCard() {
  const { locale, t } = useTranslation();
  const { auditResponse, lastTrack, submittedConviction } = useAuditUI();
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  if (!auditResponse) return null;

  const { verdict } = auditResponse;
  const track = lastTrack ?? "business";
  const statusKey = verdict.verdict_status.toLowerCase() as
    | "cleared"
    | "conditional"
    | "rejected";

  const gap = submittedConviction - verdict.score;
  const gapState =
    gap >= 20
      ? "OVERCONFIDENT"
      : gap <= -15
        ? "CONSERVATIVE"
        : "CALIBRATED";

  const gapBadgeLabel =
    gapState === "OVERCONFIDENT"
      ? `${t("conviction.bias_prefix")} +${gap}% · ${t("conviction.status_overconfident")}`
      : gapState === "CALIBRATED"
        ? t("conviction.status_calibrated")
        : t("conviction.status_conservative");

  const gapBadgeStyle =
    gapState === "OVERCONFIDENT"
      ? "border-rejected/50 bg-rejected/12 text-rejected"
      : gapState === "CALIBRATED"
        ? "border-cleared/50 bg-cleared/12 text-cleared"
        : "border-conditional/50 bg-conditional/12 text-conditional";

  const mirrorText =
    gapState === "OVERCONFIDENT"
      ? t("conviction.mirror_overconfident")
      : gapState === "CALIBRATED"
        ? t("conviction.mirror_calibrated")
        : t("conviction.mirror_conservative");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadVerdictCardPng({
        verdict,
        track,
        locale,
        submittedConviction,
      });
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

        {/* Conviction vs. Reality Gap Mirror */}
        <div className="flex flex-col gap-3.5 rounded-sm border border-hairline bg-obsidian p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {t("conviction.gap_section_title")}
            </span>
            <span
              className={cn(
                "rounded-sm border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                gapBadgeStyle
              )}
            >
              {gapBadgeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Bar 1: User Conviction */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                <span className="text-text-secondary">
                  {t("conviction.your_conviction")}
                </span>
                <span className="font-semibold text-text-primary">
                  {submittedConviction}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-xs bg-surface">
                <div
                  className="h-full bg-slate-400 transition-all duration-300"
                  style={{ width: `${submittedConviction}%` }}
                />
              </div>
            </div>

            {/* Bar 2: Mathematical Resilience */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                <span className="text-text-secondary">
                  {t("conviction.math_resilience")}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    SCORE_TONE_CLASSES[verdict.verdict_status]
                  )}
                >
                  {verdict.score}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-xs bg-surface">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    BAR_TONE_CLASSES[verdict.verdict_status]
                  )}
                  style={{ width: `${verdict.score}%` }}
                />
              </div>
            </div>
          </div>

          <p className="border-t border-hairline/80 pt-2.5 font-sans text-xs leading-relaxed text-text-secondary">
            {mirrorText}
          </p>
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
      </div>
    </EditorialPanel>
  );
}
