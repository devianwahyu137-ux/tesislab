"use client";

import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Share2,
  ShieldAlert,
  CheckCircle2,
  Check,
  Copy,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { MonteCarloHistogram } from "@/components/workspace/MonteCarloHistogram";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { encodeSharedDossier } from "@/lib/dossierShare";
import { downloadVerdictPdf } from "@/lib/exportVerdictPdf";
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

export interface VerdictCardProps {
  onApplyMitigation?: () => void;
}

/**
 * Official Swiss Editorial Verdict Card displaying the Pre-Mortem committee decision,
 * Conviction vs. Reality Gap mirror, 3 blind spots, mandatory actionable fix, and PNG/PDF export.
 * Uses CSS Container Queries (@container) so it adapts cleanly inside narrow split-panes or full-width views.
 */
export function VerdictCard({ onApplyMitigation }: VerdictCardProps = {}) {
  const { locale, t } = useTranslation();
  const { auditResponse, lastTrack, submittedConviction } = useAuditUI();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exported, setExported] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const celebratedIdRef = useRef<string | null>(null);

  const activeAuditId = auditResponse?.verdict.audit_id ?? null;
  const activeStatus = auditResponse?.verdict.verdict_status ?? null;

  // Trigger restrained Emerald & Gold confetti celebration once per CLEARED verdict
  useEffect(() => {
    if (
      !activeAuditId ||
      activeStatus !== "CLEARED" ||
      celebratedIdRef.current === activeAuditId
    ) {
      return;
    }
    celebratedIdRef.current = activeAuditId;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    void import("canvas-confetti").then(({ default: confetti }) => {
      void confetti({
        particleCount: 42,
        spread: 62,
        origin: { y: 0.65 },
        colors: ["#10B981", "#F59E0B", "#F8FAFC"],
        disableForReducedMotion: true,
      });
    });
  }, [activeAuditId, activeStatus]);

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
        monteCarlo: auditResponse.monte_carlo,
        macroRegime: auditResponse.telemetry.macro_regime,
      });
      setExported(true);
      toast.success(t("toast.png_downloaded"));
      setTimeout(() => setExported(false), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadVerdictPdf({
        response: auditResponse,
        track,
        locale,
        submittedConviction,
      });
      toast.success(t("toast.pdf_downloaded"));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareDossier = async () => {
    const token = encodeSharedDossier({
      audit_id: verdict.audit_id,
      track,
      verdict_status: verdict.verdict_status,
      score: verdict.score,
      submitted_conviction: submittedConviction,
      ruin_probability_pct: auditResponse.monte_carlo.ruin_probability_pct,
      p5_ending_value: auditResponse.monte_carlo.p5_ending_value,
      macro_regime: auditResponse.telemetry.macro_regime,
      headline_verdict: verdict.headline_verdict,
      blind_spots: verdict.premortem_blind_spots,
      actionable_fix: verdict.actionable_fix,
    });
    const shareUrl = `${window.location.origin}/dossier?d=${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(
        locale === "id"
          ? "Link Dossier Publik disalin! Siap dibagikan ke WA/Telegram."
          : "Public Dossier Link copied! Ready to share."
      );
    } catch {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopySummary = async () => {
    const summaryText = [
      `[TesisLab Pre-Mortem Verdict · ${verdict.audit_id}]`,
      `Status: ${verdict.verdict_status} (${verdict.score}/100) · Ruin: ${auditResponse.monte_carlo.ruin_probability_pct.toFixed(1)}%`,
      `Putusan: ${verdict.headline_verdict}`,
      `Titik Buta:`,
      ...verdict.premortem_blind_spots.map((s, i) => `  ${i + 1}. ${s}`),
      `Mitigasi Wajib: ${verdict.actionable_fix}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      toast.success(
        locale === "id"
          ? "Ringkasan vonis disalin ke clipboard!"
          : "Verdict summary copied to clipboard!"
      );
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      toast.error(locale === "id" ? "Gagal menyalin teks." : "Copy failed.");
    }
  };

  return (
    <div
      className={cn(
        "@container surface-specular min-w-0 overflow-hidden rounded-lg border-t-2 transition-shadow",
        verdict.verdict_status === "CLEARED"
          ? "glow-emerald border-t-cleared"
          : verdict.verdict_status === "CONDITIONAL"
            ? "glow-amber border-t-conditional"
            : "glow-crimson border-t-rejected"
      )}
    >
      <EditorialPanel
        title={t("verdict.card_title")}
        indexCode={`${t("verdict.audit_id_label")}: ${verdict.audit_id}`}
        elevated
      >
        <div className="flex flex-col gap-5">
          {/* Card Meta Header + Container-Responsive Export Actions */}
          <div className="flex flex-col gap-3 border-b border-hairline pb-4 @[640px]:flex-row @[640px]:items-center @[640px]:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <motion.div
                key={verdict.audit_id}
                initial={{ scale: 1.32, opacity: 0, rotate: -4 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
              >
                <StatusStamp
                  variant={verdict.verdict_status}
                  label={t(`verdict.status.${statusKey}`)}
                />
              </motion.div>
              <span className="rounded-md border border-hairline bg-obsidian px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary">
                {t(`tracks.${track}.name`)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 @[440px]:grid-cols-4 @[640px]:flex @[640px]:flex-wrap @[640px]:items-center">
              <button
                type="button"
                onClick={() => void handleShareDossier()}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-cleared/45 bg-cleared/12 px-2.5 font-sans text-xs font-semibold text-cleared transition-colors hover:bg-cleared/20"
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {locale === "id" ? "Share Link" : "Share"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopySummary()}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-hairline bg-obsidian px-2.5 font-sans text-xs font-medium text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
              >
                {copiedSummary ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-cleared" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                  {copiedSummary
                    ? locale === "id"
                      ? "Tersalin"
                      : "Copied"
                    : locale === "id"
                      ? "Salin Teks"
                      : "Copy Text"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-active-border bg-obsidian px-2.5 font-sans text-xs font-medium text-text-primary transition-colors hover:border-cleared/50 hover:bg-surface disabled:opacity-60"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-cleared" aria-hidden="true" />
                <span className="truncate">
                  {isExportingPdf
                    ? "..."
                    : locale === "id"
                      ? "Laporan PDF"
                      : "Export PDF"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify(auditResponse, null, 2)],
                    { type: "application/json" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${verdict.audit_id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(
                    locale === "id"
                      ? "Laporan .JSON berhasil diunduh."
                      : "Exported .JSON audit dossier."
                  );
                }}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-hairline bg-obsidian px-2.5 font-mono text-xs font-medium text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
              >
                <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>JSON</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-active-border bg-obsidian px-2.5 font-sans text-xs font-medium text-text-primary transition-colors hover:border-cleared/50 hover:bg-surface disabled:opacity-60"
              >
                {exported ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-cleared" aria-hidden="true" />
                ) : (
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                  {isExporting
                    ? "..."
                    : exported
                      ? locale === "id"
                        ? "Tersimpan"
                        : "Saved"
                      : locale === "id"
                        ? "Kartu PNG"
                        : "Card PNG"}
                </span>
              </button>
            </div>
          </div>

          {/* Main Verdict Headline + Score */}
          <div className="flex flex-col justify-between gap-4 @[540px]:flex-row @[540px]:items-start">
            <h3 className="font-editorial max-w-2xl text-xl font-medium leading-[1.28] text-text-primary @[540px]:text-2xl @[720px]:text-3xl">
              {verdict.headline_verdict}
            </h3>

            <div className="flex shrink-0 items-center justify-between rounded-lg border border-hairline bg-obsidian/85 px-4 py-2.5 @[540px]:flex-col @[540px]:items-end @[540px]:py-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t("form.score_label")}
              </span>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span
                  className={cn(
                    "text-3xl font-bold tracking-tight @[540px]:text-4xl",
                    SCORE_TONE_CLASSES[verdict.verdict_status]
                  )}
                >
                  <NumberFlow value={verdict.score} />
                </span>
                <span className="text-xs text-text-muted">
                  {t("verdict.score_suffix")}
                </span>
              </div>
            </div>
          </div>

          {/* Conviction vs. Reality Gap Mirror */}
          <div className="flex flex-col gap-3.5 rounded-lg border border-hairline bg-obsidian p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-sans text-xs font-bold text-text-primary">
                {t("conviction.gap_section_title")}
              </span>
              <span
                className={cn(
                  "rounded-sm border px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wider",
                  gapBadgeStyle
                )}
              >
                {gapBadgeLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 @[480px]:grid-cols-2">
              {/* Bar 1: User Conviction */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                  <span className="font-sans text-text-secondary">
                    {t("conviction.your_conviction")}
                  </span>
                  <span className="font-bold text-text-primary">
                    {submittedConviction}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${submittedConviction}%` }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-sky-400"
                  />
                </div>
              </div>

              {/* Bar 2: Mathematical Resilience */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                  <span className="font-sans text-text-secondary">
                    {t("conviction.math_resilience")}
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      SCORE_TONE_CLASSES[verdict.verdict_status]
                    )}
                  >
                    {verdict.score}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${verdict.score}%` }}
                    transition={{
                      duration: 0.65,
                      delay: 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={cn(
                      "h-full",
                      BAR_TONE_CLASSES[verdict.verdict_status]
                    )}
                  />
                </div>
              </div>
            </div>

            <p className="border-t border-hairline/80 pt-2.5 font-sans text-xs leading-relaxed text-text-secondary">
              {mirrorText}
            </p>
          </div>

          {/* Monte Carlo 1,000-Path Distribution Dossier Block */}
          {auditResponse.monte_carlo && (
            <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-obsidian p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-sans text-xs font-bold text-text-primary">
                  {t("live_preview.mc_title")} ·{" "}
                  <span className="font-mono text-text-secondary">
                    {auditResponse.monte_carlo.horizon_label}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-sm border px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums",
                    auditResponse.monte_carlo.ruin_probability_pct <= 15
                      ? "border-cleared/40 bg-cleared/12 text-cleared"
                      : auditResponse.monte_carlo.ruin_probability_pct <= 35
                        ? "border-conditional/40 bg-conditional/12 text-conditional"
                        : "border-rejected/40 bg-rejected/12 text-rejected"
                  )}
                >
                  {t("live_preview.mc_ruin_label")}:{" "}
                  {auditResponse.monte_carlo.ruin_probability_pct.toFixed(1)}%
                </span>
              </div>

              <MonteCarloHistogram
                buckets={auditResponse.monte_carlo.histogram}
                height={112}
              />

              <p className="font-sans text-[11px] leading-relaxed text-text-muted">
                {locale === "id"
                  ? "Catatan asumsi: simulasi 1.000 jalur memakai distribusi Normal & baseline win-rate 45% (untuk jalur Trading). Kondisi fat-tail pasar ekstrem bisa melampaui estimasi P5."
                  : "Assumption note: 1,000-path simulation uses a Normal distribution & 45% baseline win-rate (for Trading). Extreme fat-tail market shocks may exceed P5."}
              </p>

              <div className="grid grid-cols-1 gap-2 border-t border-hairline pt-3 font-mono text-xs tabular-nums @[480px]:grid-cols-3">
                <div className="flex items-center justify-between gap-2 rounded-md border border-hairline/70 bg-surface/65 px-3 py-2 @[480px]:flex-col @[480px]:items-start @[480px]:gap-1">
                  <span className="font-sans text-[10.5px] font-medium text-text-muted">
                    {t("live_preview.mc_p5_label")}
                  </span>
                  <span className="min-w-0 truncate font-bold text-rejected">
                    Rp{" "}
                    {auditResponse.monte_carlo.p5_ending_value.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md border border-hairline/70 bg-surface/65 px-3 py-2 @[480px]:flex-col @[480px]:items-start @[480px]:gap-1">
                  <span className="font-sans text-[10.5px] font-medium text-text-muted">
                    {t("live_preview.mc_p50_label")}
                  </span>
                  <span className="min-w-0 truncate font-bold text-text-primary">
                    Rp{" "}
                    {auditResponse.monte_carlo.p50_ending_value.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md border border-hairline/70 bg-surface/65 px-3 py-2 @[480px]:flex-col @[480px]:items-start @[480px]:gap-1">
                  <span className="font-sans text-[10.5px] font-medium text-text-muted">
                    {t("live_preview.mc_p95_label")}
                  </span>
                  <span className="min-w-0 truncate font-bold text-cleared">
                    Rp{" "}
                    {auditResponse.monte_carlo.p95_ending_value.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <TerminalDivider label={t("verdict.blind_spots_title")} />

          {/* 3 Pre-Mortem Blind Spots — Full-width readable cards in narrow split-pane, 3 columns when wide */}
          <div className="grid grid-cols-1 gap-3 @[680px]:grid-cols-3">
            {verdict.premortem_blind_spots.map((spot, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-lg border border-hairline bg-obsidian p-4 transition-colors hover:border-conditional/45"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-xs border border-conditional/35 bg-conditional/10 px-2 py-0.5 font-mono text-[11px] font-bold text-conditional">
                    <span>TITIK BUTA 0{idx + 1}</span>
                  </span>
                  <ShieldAlert
                    className="h-4 w-4 text-conditional/80"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
                  {spot}
                </p>
              </div>
            ))}
          </div>

          {/* Mandatory Actionable Fix + 1-Click Auto-Heal & Re-Audit Action */}
          <div className="flex flex-col gap-3 rounded-lg border border-cleared/45 border-l-4 border-l-cleared bg-cleared/10 p-4">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-cleared">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t("verdict.actionable_fix_title")}</span>
            </div>
            <p className="font-sans text-[13.5px] font-medium leading-relaxed text-text-primary">
              {verdict.actionable_fix}
            </p>

            {onApplyMitigation && verdict.verdict_status !== "CLEARED" && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onApplyMitigation}
                  className="cta-primary-polish inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-md bg-cleared px-4 font-sans text-xs font-bold text-on-cleared transition-all hover:brightness-105 @[520px]:w-auto"
                >
                  <WandSparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {locale === "id"
                      ? "Terapkan Kalibrasi Komite & Uji Ulang (1-Klik)"
                      : "Apply Committee Fix & Re-Audit (1-Click)"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Institutional Dossier Footer Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 font-mono text-[10.5px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-text-primary">TesisLab.</span>
              <span>·</span>
              <span className="text-cleared">tesislab.app</span>
            </span>
            <span>
              {auditResponse.telemetry.macro_regime} ·{" "}
              {auditResponse.telemetry.calc_ms.toFixed(1)} ms
            </span>
          </div>
        </div>
      </EditorialPanel>
    </div>
  );
}
