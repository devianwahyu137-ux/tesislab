import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import type { Locale } from "@/lib/i18n/config";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export interface ExportVerdictPdfParams {
  response: CommitteeAuditResponse;
  track: AuditTrack;
  locale: Locale;
  submittedConviction: number;
}

/**
 * Generates a print-ready A4 Pre-Mortem Due Diligence PDF report using jsPDF
 * (dynamically imported on click to keep the initial client bundle lean).
 */
export async function downloadVerdictPdf({
  response,
  track,
  locale,
  submittedConviction,
}: ExportVerdictPdfParams): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { verdict, metrics, monte_carlo: mc, telemetry } = response;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxW = pageW - margin * 2;
  let y = 18;

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 18;
    }
  };

  // Header Band
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("TESISLAB — PRE-MORTEM DUE DILIGENCE REPORT", margin, y);
  y += 6;

  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `REF: ${verdict.audit_id}  |  TRACK: ${track.toUpperCase()}  |  REGIME: ${telemetry.macro_regime}  |  DATE: ${new Date().toISOString().slice(0, 10)}`,
    margin,
    y
  );
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Verdict Status & Score Box
  const statusRgb: [number, number, number] =
    verdict.verdict_status === "CLEARED"
      ? [4, 120, 87]
      : verdict.verdict_status === "CONDITIONAL"
        ? [180, 83, 9]
        : [190, 18, 60];

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, maxW, 24, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...statusRgb);
  doc.text(`VERDICT: ${verdict.verdict_status}`, margin + 4, y + 7);

  doc.setFont("courier", "bold");
  doc.setFontSize(16);
  doc.text(`${verdict.score} / 100`, pageW - margin - 4, y + 9, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const headlineLines = doc.splitTextToSize(verdict.headline_verdict, maxW - 38);
  doc.text(headlineLines.slice(0, 2), margin + 4, y + 14);
  y += 30;

  // Conviction Gap & Monte Carlo Summary
  const gap = submittedConviction - verdict.score;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    locale === "id"
      ? "1. KALIBRASI BIAS & SIMULASI MONTE CARLO (1.000 SKENARIO)"
      : "1. CONVICTION CALIBRATION & MONTE CARLO (1,000 PATHS)",
    margin,
    y
  );
  y += 5;

  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Initial Conviction: ${submittedConviction}%   |   Math Resilience: ${verdict.score}%   |   Bias Gap: ${gap >= 0 ? "+" : ""}${gap}%`,
    margin,
    y
  );
  y += 5;
  doc.text(
    `Monte Carlo (${mc.horizon_label}): Risk of Ruin ${mc.ruin_probability_pct.toFixed(1)}%   |   P5: Rp ${mc.p5_ending_value.toLocaleString("id-ID")}   |   P50: Rp ${mc.p50_ending_value.toLocaleString("id-ID")}   |   P95: Rp ${mc.p95_ending_value.toLocaleString("id-ID")}`,
    margin,
    y
  );
  y += 5;
  const flagsText =
    metrics.deterministic_flags.length > 0
      ? metrics.deterministic_flags.join(", ")
      : "NONE";
  doc.text(`Deterministic Flags: ${flagsText}`, margin, y);
  y += 9;

  // 3 Pre-Mortem Blind Spots
  ensureSpace(35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    locale === "id"
      ? "2. TIGA TITIK BUTA PRE-MORTEM"
      : "2. THREE PRE-MORTEM BLIND SPOTS",
    margin,
    y
  );
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  verdict.premortem_blind_spots.forEach((spot, i) => {
    const lines = doc.splitTextToSize(`0${i + 1}. ${spot}`, maxW);
    ensureSpace(lines.length * 4.5 + 3);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 2.5;
  });
  y += 3;

  // Mandatory Actionable Fix
  ensureSpace(22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(4, 120, 87);
  doc.text(
    locale === "id"
      ? "3. SYARAT MITIGASI WAJIB"
      : "3. MANDATORY ACTIONABLE FIX",
    margin,
    y
  );
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const fixLines = doc.splitTextToSize(verdict.actionable_fix, maxW);
  doc.text(fixLines, margin, y);
  y += fixLines.length * 4.5 + 6;

  // 3-Division Committee Deliberation
  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    locale === "id"
      ? "4. TRANSKRIP DELIBERASI 3 DIVISI KOMITE"
      : "4. THREE-DIVISION COMMITTEE DELIBERATION",
    margin,
    y
  );
  y += 5;

  const divisions: Array<[string, string]> = [
    ["DIV-01 (Macro & Data Analyst)", verdict.agent_deliberation.data_analyst],
    ["DIV-02 (Risk Manager)", verdict.agent_deliberation.risk_manager],
    ["DIV-03 (Committee Chair)", verdict.agent_deliberation.committee_chair],
  ];

  divisions.forEach(([title, body]) => {
    const bodyLines = doc.splitTextToSize(body, maxW);
    ensureSpace(bodyLines.length * 4.3 + 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(bodyLines, margin, y);
    y += bodyLines.length * 4.2 + 3.5;
  });

  // Footer Disclaimer
  ensureSpace(16);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, 282, pageW - margin, 282);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const disc =
    locale === "id"
      ? "TesisLab adalah alat bantu simulasi risiko deterministik, bukan penasihat keuangan berlisensi."
      : "TesisLab is a deterministic risk simulation tool, not a licensed financial advisor.";
  doc.text(disc, margin, 287);

  doc.save(`tesislab-due-diligence-${verdict.audit_id.toLowerCase()}.pdf`);
}
