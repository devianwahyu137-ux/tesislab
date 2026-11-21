import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import type { Locale } from "@/lib/i18n/config";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export interface ExportVerdictPdfParams {
  response: CommitteeAuditResponse;
  track: AuditTrack;
  locale: Locale;
  submittedConviction: number;
}

const BRAND_NAME = "TesisLab.";
const BRAND_URL = "tesislab.app";

/**
 * Normalizes Unicode characters unsupported by jsPDF's built-in WinAnsi fonts
 * (Helvetica / Courier) so text never renders garbled glyphs or broken kerning.
 */
function pdfSafe(raw: string): string {
  return raw
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/×/g, "x")
    .replace(/[—–]/g, "-")
    .replace(/→/g, "->")
    .replace(/[·•]/g, "|")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRp(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rp ${Math.abs(Math.round(amount)).toLocaleString("id-ID")}`;
}

/**
 * Generates a print-ready A4 Swiss Institutional Pre-Mortem Due Diligence PDF
 * using jsPDF (dynamically imported on click to keep the client bundle lean).
 */
export async function downloadVerdictPdf({
  response,
  track,
  locale,
  submittedConviction,
}: ExportVerdictPdfParams): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { verdict, metrics, monte_carlo: mc, telemetry } = response;
  const isId = locale === "id";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxW = pageW - margin * 2;
  const dateStr = new Date().toISOString().slice(0, 10);

  const statusRgb: [number, number, number] =
    verdict.verdict_status === "CLEARED"
      ? [5, 150, 105]
      : verdict.verdict_status === "CONDITIONAL"
        ? [217, 119, 6]
        : [220, 38, 38];

  const statusBgRgb: [number, number, number] =
    verdict.verdict_status === "CLEARED"
      ? [236, 253, 245]
      : verdict.verdict_status === "CONDITIONAL"
        ? [255, 251, 235]
        : [254, 242, 242];

  const statusLabel =
    verdict.verdict_status === "CLEARED"
      ? isId
        ? "LAYAK DIJALANKAN"
        : "CLEARED TO PROCEED"
      : verdict.verdict_status === "CONDITIONAL"
        ? isId
          ? "JALANKAN DENGAN SYARAT"
          : "PROCEED WITH CONDITIONS"
        : isId
          ? "TUNDA / TOLAK"
          : "HOLD / REJECTED";

  // ── 1. DARK INSTITUTIONAL MASTHEAD ──────────────────────────────────────
  doc.setFillColor(11, 15, 23);
  doc.rect(0, 0, pageW, 30, "F");

  // Top emerald accent bar
  doc.setFillColor(...statusRgb);
  doc.rect(0, 0, pageW, 2.2, "F");

  // Brand + Subtitle (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(248, 250, 252);
  doc.text(BRAND_NAME, margin, 13.5);

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    isId
      ? "LAPORAN DUE DILIGENCE PRE-MORTEM // ANTI-YES-MAN ENGINE"
      : "PRE-MORTEM FINANCIAL DUE DILIGENCE REPORT // ANTI-YES-MAN ENGINE",
    margin,
    19.5
  );

  // Website + Metadata (Right)
  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text(BRAND_URL.toUpperCase(), pageW - margin, 12.5, { align: "right" });

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    pdfSafe(`REF: ${verdict.audit_id}  |  ${dateStr}`),
    pageW - margin,
    18.5,
    { align: "right" }
  );

  // Meta sub-bar inside header
  doc.setDrawColor(30, 41, 59);
  doc.line(margin, 23, pageW - margin, 23);
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    pdfSafe(
      `TRACK: ${track.toUpperCase()}   |   MACRO REGIME: ${telemetry.macro_regime}   |   ENGINE: ${telemetry.model_used.toUpperCase()}`
    ),
    margin,
    27.3
  );

  let y = 37;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 22) {
      doc.addPage();
      y = 18;
    }
  };

  // ── 2. EXECUTIVE VERDICT & SCORE HERO BOX ──────────────────────────────
  const headlineLines = doc.splitTextToSize(
    pdfSafe(verdict.headline_verdict),
    maxW - 44
  ) as string[];
  const heroBoxH = Math.max(26, 15 + Math.min(headlineLines.length, 3) * 4.6);

  doc.setFillColor(...statusBgRgb);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, maxW, heroBoxH, 1.5, 1.5, "FD");

  // Left colored accent bar
  doc.setFillColor(...statusRgb);
  doc.rect(margin, y, 2.2, heroBoxH, "F");

  // Verdict badge text
  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...statusRgb);
  doc.text(pdfSafe(`VERDICT: ${statusLabel}`), margin + 6, y + 7);

  // Score block on right
  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isId ? "SKOR KETAHANAN" : "RESILIENCE SCORE",
    pageW - margin - 5,
    y + 6.5,
    { align: "right" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...statusRgb);
  doc.text(`${verdict.score}`, pageW - margin - 17, y + 16, { align: "right" });

  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("/ 100", pageW - margin - 5, y + 16, { align: "right" });

  // Headline verdict text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(headlineLines.slice(0, 3), margin + 6, y + 13.5);

  y += heroBoxH + 7;

  // ── 3. SECTION 1: KEY DETERMINISTIC METRICS & MONTE CARLO GRID ─────────
  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isId
      ? "01. TELEMETRI KUANTITATIF, BIAS & MONTE CARLO (1.000 SKENARIO)"
      : "01. QUANTITATIVE TELEMETRY, BIAS & MONTE CARLO (1,000 PATHS)",
    margin,
    y
  );
  y += 4;

  const gap = submittedConviction - verdict.score;
  const kpiCards: Array<{ label: string; value: string; sub: string; accent?: [number, number, number] }> = [
    {
      label: isId ? "KEYAKINAN VS REALITAS" : "CONVICTION VS REALITY",
      value: `${submittedConviction}% vs ${verdict.score}%`,
      sub: pdfSafe(`Bias Gap: ${gap >= 0 ? "+" : ""}${gap}%`),
      accent: gap >= 20 ? [220, 38, 38] : gap <= -15 ? [217, 119, 6] : [5, 150, 105],
    },
    {
      label: isId ? "RISIKO RUIN MONTE CARLO" : "MONTE CARLO RUIN RISK",
      value: `${mc.ruin_probability_pct.toFixed(1)}%`,
      sub: pdfSafe(`Horizon: ${mc.horizon_label}`),
      accent:
        mc.ruin_probability_pct <= 15
          ? [5, 150, 105]
          : mc.ruin_probability_pct <= 35
            ? [217, 119, 6]
            : [220, 38, 38],
    },
    {
      label: isId ? "P5 TERBURUK (EKOR RISIKO)" : "P5 WORST-CASE TAIL",
      value: formatRp(mc.p5_ending_value),
      sub: pdfSafe(`P50: ${formatRp(mc.p50_ending_value)}`),
      accent: [220, 38, 38],
    },
    {
      label: isId ? "P95 TERBAIK (UPSIDE)" : "P95 BEST-CASE UPSIDE",
      value: formatRp(mc.p95_ending_value),
      sub: pdfSafe(
        `Flags: ${metrics.deterministic_flags.length === 0 ? "NONE" : metrics.deterministic_flags.length}`
      ),
      accent: [5, 150, 105],
    },
  ];

  const kpiGap = 3;
  const kpiW = (maxW - kpiGap * 3) / 4;
  const kpiH = 18;

  kpiCards.forEach((card, i) => {
    const cx = margin + i * (kpiW + kpiGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, kpiW, kpiH, 1, 1, "FD");

    doc.setFont("courier", "bold");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cx + 2.5, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...(card.accent ?? [15, 23, 42]));
    doc.text(pdfSafe(card.value), cx + 2.5, y + 10.5);

    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const subTrunc = doc.splitTextToSize(card.sub, kpiW - 5) as string[];
    doc.text(subTrunc[0] ?? "", cx + 2.5, y + 15.2);
  });

  y += kpiH + 3.5;

  // Track-specific deterministic ratio strip
  let trackSummary = "";
  if (track === "trading" && "rr_ratio" in metrics) {
    trackSummary = `R:R 1:${metrics.rr_ratio.toFixed(2)}  |  Risk/Trade: ${metrics.risk_per_trade_pct.toFixed(2)}%  |  Breakeven WR: ${metrics.breakeven_win_rate_pct.toFixed(1)}%  |  Max Safe Size (2% Rule): <= ${metrics.max_safe_position_pct.toFixed(1)}%`;
  } else if (track === "business" && "bep_units" in metrics) {
    trackSummary = `Unit Margin: ${metrics.unit_margin_pct.toFixed(1)}%  |  BEP: ${metrics.bep_units} units/mo  |  Stressed Runway: ${metrics.stressed_runway_months.toFixed(1)} mo  |  MoS: ${metrics.margin_of_safety_pct.toFixed(1)}%`;
  } else if (track === "cashflow" && "dsr_pct" in metrics) {
    trackSummary = `DSR: ${metrics.dsr_pct.toFixed(1)}%  |  Total Commitment: ${metrics.total_commitment_pct.toFixed(1)}%  |  Savings Rate: ${metrics.savings_rate_pct.toFixed(1)}%  |  Emergency Fund: ${metrics.emergency_fund_months.toFixed(1)} mo`;
  }

  const flagsLine =
    metrics.deterministic_flags.length > 0
      ? `Active Flags: ${metrics.deterministic_flags.join(", ")}`
      : isId
        ? "Active Flags: NIHIL (Lolos seluruh ambang matematis)"
        : "Active Flags: NONE (Cleared all mathematical thresholds)";

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, maxW, 11.5, 1, 1, "FD");
  doc.setFont("courier", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  const stripLine1 = doc.splitTextToSize(pdfSafe(trackSummary), maxW - 6) as string[];
  doc.text(stripLine1[0] ?? "", margin + 3, y + 4.7);
  doc.setTextColor(metrics.deterministic_flags.length > 0 ? 185 : 5, metrics.deterministic_flags.length > 0 ? 28 : 150, metrics.deterministic_flags.length > 0 ? 28 : 105);
  const stripLine2 = doc.splitTextToSize(pdfSafe(flagsLine), maxW - 6) as string[];
  doc.text(stripLine2[0] ?? "", margin + 3, y + 9.2);

  y += 16.5;

  // ── 4. SECTION 2: 3 PRE-MORTEM BLIND SPOTS ──────────────────────────────
  ensureSpace(36);
  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isId
      ? "02. TIGA TITIK BUTA PRE-MORTEM"
      : "02. THREE PRE-MORTEM BLIND SPOTS",
    margin,
    y
  );
  y += 4;

  verdict.premortem_blind_spots.forEach((spot, i) => {
    const cleanSpot = pdfSafe(spot);
    const lines = doc.splitTextToSize(cleanSpot, maxW - 14) as string[];
    const cardH = Math.max(10, lines.length * 4.2 + 4.5);
    ensureSpace(cardH + 3);

    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin, y, maxW, cardH, 1, 1, "FD");

    // Amber number badge
    doc.setFillColor(217, 119, 6);
    doc.rect(margin, y, 1.8, cardH, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text(`0${i + 1}`, margin + 4.5, y + 5.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(30, 41, 59);
    doc.text(lines, margin + 12, y + 5.6);

    y += cardH + 2.5;
  });

  y += 3;

  // ── 5. SECTION 3: MANDATORY ACTIONABLE FIX ──────────────────────────────
  const cleanFix = pdfSafe(verdict.actionable_fix);
  const fixLines = doc.splitTextToSize(cleanFix, maxW - 10) as string[];
  const fixBoxH = Math.max(16, fixLines.length * 4.5 + 10);
  ensureSpace(fixBoxH + 8);

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(110, 231, 183);
  doc.roundedRect(margin, y, maxW, fixBoxH, 1.2, 1.2, "FD");

  doc.setFillColor(5, 150, 105);
  doc.rect(margin, y, 2.2, fixBoxH, "F");

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87);
  doc.text(
    isId
      ? "03. SYARAT MITIGASI WAJIB SEBELUM EKSEKUSI"
      : "03. MANDATORY ACTIONABLE FIX PRIOR TO EXECUTION",
    margin + 5.5,
    y + 5.5
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(15, 23, 42);
  doc.text(fixLines, margin + 5.5, y + 11);

  y += fixBoxH + 7;

  // ── 6. SECTION 4: 3-DIVISION COMMITTEE DELIBERATION ─────────────────────
  ensureSpace(34);
  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isId
      ? "04. TRANSKRIP DELIBERASI 3 DIVISI KOMITE AUDIT"
      : "04. THREE-DIVISION AUDIT COMMITTEE DELIBERATION",
    margin,
    y
  );
  y += 4;

  const divisions: Array<[string, string, [number, number, number]]> = [
    [
      "DIV-01  |  MACRO & DATA ANALYST",
      verdict.agent_deliberation.data_analyst,
      [16, 185, 129],
    ],
    [
      "DIV-02  |  RISK MANAGER (PRE-MORTEM)",
      verdict.agent_deliberation.risk_manager,
      [239, 68, 68],
    ],
    [
      "DIV-03  |  AUDIT COMMITTEE CHAIR",
      verdict.agent_deliberation.committee_chair,
      [245, 158, 11],
    ],
  ];

  divisions.forEach(([title, body, accentRgb]) => {
    const cleanBody = pdfSafe(body);
    const bodyLines = doc.splitTextToSize(cleanBody, maxW - 8) as string[];
    const blockH = Math.max(14, bodyLines.length * 4.2 + 9);
    ensureSpace(blockH + 3);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, maxW, blockH, 1, 1, "FD");

    doc.setFillColor(...accentRgb);
    doc.rect(margin, y, 1.6, blockH, "F");

    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 4.5, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(bodyLines, margin + 4.5, y + 9.5);

    y += blockH + 2.5;
  });

  // ── 7. INSTITUTIONAL FOOTER ON EVERY PAGE ──────────────────────────────
  const totalPages = doc.getNumberOfPages();
  const disc = pdfSafe(
    isId
      ? "TesisLab. (tesislab.app) adalah alat bantu simulasi risiko deterministik, bukan penasihat keuangan berlisensi."
      : "TesisLab. (tesislab.app) is a deterministic risk simulation tool, not a licensed financial advisor."
  );

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(disc, margin, pageH - 9);
    doc.text(
      `REF ${verdict.audit_id}  |  PAGE ${p}/${totalPages}`,
      pageW - margin,
      pageH - 9,
      { align: "right" }
    );
  }

  doc.save(`tesislab-due-diligence-${verdict.audit_id.toLowerCase()}.pdf`);
}
