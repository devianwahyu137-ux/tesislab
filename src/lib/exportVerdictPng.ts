"use client";

import type { Locale } from "@/lib/i18n/config";
import type { MonteCarloSummary } from "@/lib/quant/monteCarlo";
import type { MacroRegime } from "@/lib/schemas/macroContextSchema";
import type { AuditTrack, VerdictPayload } from "@/lib/schemas/verdictSchema";

const LOGICAL_WIDTH = 1200;
const LOGICAL_HEIGHT = 675;
const RETINA_SCALE = 2;

const STATUS_COLORS: Record<
  VerdictPayload["verdict_status"],
  { accent: string; bg: string; glow: string }
> = {
  CLEARED: {
    accent: "#10B981",
    bg: "rgba(16, 185, 129, 0.14)",
    glow: "rgba(16, 185, 129, 0.22)",
  },
  CONDITIONAL: {
    accent: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.14)",
    glow: "rgba(245, 158, 11, 0.22)",
  },
  REJECTED: {
    accent: "#EF4444",
    bg: "rgba(239, 68, 68, 0.14)",
    glow: "rgba(239, 68, 68, 0.22)",
  },
};

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth) {
      let trimmed = last;
      while (
        trimmed.length > 3 &&
        ctx.measureText(`${trimmed}...`).width > maxWidth
      ) {
        trimmed = trimmed.slice(0, -1);
      }
      lines[maxLines - 1] = `${trimmed}...`;
    }
  }

  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Deterministic HTML5 Canvas renderer for the Swiss Institutional Verdict Card
 * (1200x675 @ 2x Retina) including Conviction Gap, Monte Carlo Telemetry,
 * 3 Pre-Mortem Blind Spots, Mandatory Fix, and TesisLab. website branding.
 */
export async function downloadVerdictCardPng(params: {
  verdict: VerdictPayload;
  track: AuditTrack;
  locale: Locale;
  submittedConviction?: number;
  monteCarlo?: MonteCarloSummary;
  macroRegime?: MacroRegime;
}): Promise<void> {
  const {
    verdict,
    track,
    locale,
    submittedConviction = 75,
    monteCarlo,
    macroRegime,
  } = params;
  const isId = locale === "id";

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const canvas = document.createElement("canvas");
  canvas.width = LOGICAL_WIDTH * RETINA_SCALE;
  canvas.height = LOGICAL_HEIGHT * RETINA_SCALE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.scale(RETINA_SCALE, RETINA_SCALE);

  const statusStyle = STATUS_COLORS[verdict.verdict_status];
  const gap = submittedConviction - verdict.score;
  const gapColor =
    gap >= 20 ? "#EF4444" : gap <= -15 ? "#F59E0B" : "#10B981";
  const gapBg =
    gap >= 20
      ? "rgba(239, 68, 68, 0.14)"
      : gap <= -15
        ? "rgba(245, 158, 11, 0.14)"
        : "rgba(16, 185, 129, 0.14)";
  const gapText =
    gap >= 20
      ? isId
        ? `BIAS OPTIMISME +${gap}%`
        : `OPTIMISM BIAS +${gap}%`
      : gap <= -15
        ? isId
          ? "TERLALU HATI-HATI"
          : "CONSERVATIVE"
        : isId
          ? "TERKALIBRASI REALISTIS"
          : "WELL CALIBRATED";

  const statusLabel =
    verdict.verdict_status === "CLEARED"
      ? isId
        ? "LAYAK DIJALANKAN"
        : "CLEARED"
      : verdict.verdict_status === "CONDITIONAL"
        ? isId
          ? "JALANKAN DENGAN SYARAT"
          : "CONDITIONAL"
        : isId
          ? "TUNDA / TOLAK"
          : "REJECTED";

  // ── 1. OUTER OBSIDIAN CANVAS + SUBTLE LEDGER GRID ───────────────────────
  ctx.fillStyle = "#090B0F";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < LOGICAL_WIDTH; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, LOGICAL_HEIGHT);
    ctx.stroke();
  }
  for (let gy = 0; gy < LOGICAL_HEIGHT; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(LOGICAL_WIDTH, gy);
    ctx.stroke();
  }

  // ── 2. MAIN EDITORIAL SURFACE CARD ──────────────────────────────────────
  const pad = 28;
  const cardW = LOGICAL_WIDTH - pad * 2;
  const cardH = LOGICAL_HEIGHT - pad * 2;

  drawRoundedRect(ctx, pad, pad, cardW, cardH, 8);
  ctx.fillStyle = "#11151C";
  ctx.fill();
  ctx.strokeStyle = "#222A35";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top Status Accent Bar
  ctx.fillStyle = statusStyle.accent;
  ctx.fillRect(pad, pad, cardW, 3.5);

  // Subtle ambient glow behind top-right score
  const glowGrad = ctx.createRadialGradient(
    pad + cardW - 110,
    pad + 125,
    10,
    pad + cardW - 110,
    pad + 125,
    130
  );
  glowGrad.addColorStop(0, statusStyle.glow);
  glowGrad.addColorStop(1, "rgba(17, 21, 28, 0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(pad + cardW - 260, pad + 60, 258, 120);

  // ── 3. HEADER BAR WITH WEBSITE BRANDING ─────────────────────────────────
  ctx.fillStyle = "#F8FAFC";
  ctx.font = '700 22px Georgia, "Times New Roman", serif';
  ctx.fillText("TesisLab.", pad + 28, pad + 42);

  // Green dot + website domain pill
  ctx.fillStyle = "#10B981";
  ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText("tesislab.app", pad + 136, pad + 41);

  ctx.fillStyle = "#64748B";
  ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
  const metaText = `// REF: ${verdict.audit_id}  // ${track.toUpperCase()}${
    macroRegime ? `  // ${macroRegime}` : ""
  }`;
  ctx.fillText(metaText, pad + 236, pad + 41);

  // Status Pill at Top-Right
  ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
  const badgeW = ctx.measureText(statusLabel).width + 34;
  const badgeX = pad + cardW - 28 - badgeW;
  const badgeY = pad + 21;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, 28, 4);
  ctx.fillStyle = statusStyle.bg;
  ctx.fill();
  ctx.strokeStyle = statusStyle.accent;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Status dot inside pill
  ctx.fillStyle = statusStyle.accent;
  ctx.beginPath();
  ctx.arc(badgeX + 13, badgeY + 14, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(statusLabel, badgeX + 22, badgeY + 18);

  // Header Hairline
  ctx.strokeStyle = "#1E2530";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad + 62);
  ctx.lineTo(pad + cardW, pad + 62);
  ctx.stroke();

  // ── 4. HEADLINE + PERFECTLY ALIGNED SCORE BLOCK ─────────────────────────
  ctx.fillStyle = "#F8FAFC";
  ctx.font = '600 25px Georgia, "Times New Roman", serif';
  const headlineLines = wrapLines(
    ctx,
    verdict.headline_verdict,
    cardW - 270,
    2
  );
  headlineLines.forEach((line, idx) => {
    ctx.fillText(line, pad + 28, pad + 102 + idx * 33);
  });

  // Right-aligned Score Block (measure BEFORE switching font!)
  const scoreRightX = pad + cardW - 28;
  ctx.textAlign = "right";
  ctx.fillStyle = "#94A3B8";
  ctx.font = '600 10.5px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    isId ? "SKOR KETAHANAN" : "RESILIENCE SCORE",
    scoreRightX,
    pad + 92
  );

  // Draw "/ 100" on far right, then measure its width and place score neatly to its left
  ctx.font = '500 16px "JetBrains Mono", ui-monospace, monospace';
  const suffixStr = "/ 100";
  const suffixW = ctx.measureText(suffixStr).width;
  ctx.fillStyle = "#64748B";
  ctx.fillText(suffixStr, scoreRightX, pad + 138);

  ctx.font = '700 46px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = statusStyle.accent;
  ctx.fillText(`${verdict.score}`, scoreRightX - suffixW - 8, pad + 138);
  ctx.textAlign = "left";

  // ── 5. MIDDLE TELEMETRY BAND: BIAS MIRROR + MONTE CARLO ─────────────────
  const bandY = pad + 162;
  const bandH = 82;
  const bandW = cardW - 56;
  drawRoundedRect(ctx, pad + 28, bandY, bandW, bandH, 5);
  ctx.fillStyle = "#0B0E14";
  ctx.fill();
  ctx.strokeStyle = "#1E2530";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left side: Dual Conviction vs Resilience bars
  const barW = monteCarlo ? 215 : 280;
  const bar1X = pad + 46;
  const bar2X = bar1X + barW + 24;

  ctx.fillStyle = "#94A3B8";
  ctx.font = '600 10.5px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    isId
      ? `KEYAKINAN AWAL: ${submittedConviction}%`
      : `INITIAL CONVICTION: ${submittedConviction}%`,
    bar1X,
    bandY + 25
  );
  drawRoundedRect(ctx, bar1X, bandY + 34, barW, 8, 2);
  ctx.fillStyle = "#1E2530";
  ctx.fill();
  drawRoundedRect(ctx, bar1X, bandY + 34, (barW * submittedConviction) / 100, 8, 2);
  ctx.fillStyle = "#94A3B8";
  ctx.fill();

  ctx.fillStyle = "#94A3B8";
  ctx.fillText(
    isId
      ? `KETAHANAN MATEMATIS: ${verdict.score}%`
      : `MATH RESILIENCE: ${verdict.score}%`,
    bar2X,
    bandY + 25
  );
  drawRoundedRect(ctx, bar2X, bandY + 34, barW, 8, 2);
  ctx.fillStyle = "#1E2530";
  ctx.fill();
  drawRoundedRect(ctx, bar2X, bandY + 34, (barW * verdict.score) / 100, 8, 2);
  ctx.fillStyle = statusStyle.accent;
  ctx.fill();

  // Gap status label under bars
  ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
  const gBadgeW = Math.min(240, ctx.measureText(gapText).width + 20);
  drawRoundedRect(ctx, bar1X, bandY + 51, gBadgeW, 21, 3);
  ctx.fillStyle = gapBg;
  ctx.fill();
  ctx.strokeStyle = gapColor;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = gapColor;
  ctx.fillText(gapText, bar1X + 10, bandY + 65);

  // Right side: Monte Carlo 1,000-Path Summary (if provided)
  if (monteCarlo) {
    const mcX = bar2X + barW + 28;
    ctx.strokeStyle = "#1E2530";
    ctx.beginPath();
    ctx.moveTo(mcX - 14, bandY + 12);
    ctx.lineTo(mcX - 14, bandY + bandH - 12);
    ctx.stroke();

    ctx.fillStyle = "#94A3B8";
    ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(
      `MONTE CARLO (1,000) · ${monteCarlo.horizon_label.toUpperCase()}`,
      mcX,
      bandY + 23
    );

    const ruinColor =
      monteCarlo.ruin_probability_pct <= 15
        ? "#10B981"
        : monteCarlo.ruin_probability_pct <= 35
          ? "#F59E0B"
          : "#EF4444";

    ctx.fillStyle = ruinColor;
    ctx.font = '700 18px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(
      `RUIN ${monteCarlo.ruin_probability_pct.toFixed(1)}%`,
      mcX,
      bandY + 46
    );

    ctx.fillStyle = "#CBD5E1";
    ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace';
    const p5Txt = `P5: Rp${Math.round(monteCarlo.p5_ending_value).toLocaleString("id-ID")}`;
    const p50Txt = `P50: Rp${Math.round(monteCarlo.p50_ending_value).toLocaleString("id-ID")}`;
    ctx.fillText(`${p5Txt}   |   ${p50Txt}`, mcX, bandY + 67);
  }

  // ── 6. THREE PRE-MORTEM BLIND SPOTS ─────────────────────────────────────
  const gridY = bandY + bandH + 30;
  const colGap = 16;
  const colW = (cardW - 56 - colGap * 2) / 3;
  const colH = 148;

  ctx.fillStyle = "#94A3B8";
  ctx.font = '700 10.5px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    isId ? "3 TITIK BUTA PRE-MORTEM" : "3 PRE-MORTEM BLIND SPOTS",
    pad + 28,
    gridY - 10
  );

  verdict.premortem_blind_spots.forEach((spot, idx) => {
    const x = pad + 28 + idx * (colW + colGap);
    drawRoundedRect(ctx, x, gridY, colW, colH, 5);
    ctx.fillStyle = "#0B0E14";
    ctx.fill();
    ctx.strokeStyle = "#1E2530";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Subtle amber top accent tick
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(x + 16, gridY, 28, 2);

    ctx.fillStyle = "#F59E0B";
    ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(`0${idx + 1}`, x + 16, gridY + 24);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = '400 13px "Plus Jakarta Sans", system-ui, sans-serif';
    const lines = wrapLines(ctx, spot, colW - 32, 5);
    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, x + 16, gridY + 46 + lineIdx * 19);
    });
  });

  // ── 7. MANDATORY ACTIONABLE FIX CALLOUT ─────────────────────────────────
  const fixY = gridY + colH + 16;
  const fixH = 82;
  drawRoundedRect(ctx, pad + 28, fixY, cardW - 56, fixH, 5);
  ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Thick emerald left stripe
  ctx.fillStyle = "#10B981";
  ctx.fillRect(pad + 28, fixY, 4, fixH);

  ctx.fillStyle = "#10B981";
  ctx.font = '700 10.5px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    isId ? "SYARAT MITIGASI WAJIB" : "MANDATORY ACTIONABLE FIX",
    pad + 46,
    fixY + 22
  );

  ctx.fillStyle = "#F8FAFC";
  ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
  const fixLines = wrapLines(ctx, verdict.actionable_fix, cardW - 92, 2);
  fixLines.forEach((line, idx) => {
    ctx.fillText(line, pad + 46, fixY + 46 + idx * 20);
  });

  // ── 8. INSTITUTIONAL FOOTER WITH WEBSITE NAME ───────────────────────────
  const footerY = pad + cardH - 18;
  ctx.fillStyle = "#94A3B8";
  ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    "TesisLab.  |  tesislab.app  —  Anti-Yes-Man Pre-Mortem Financial Audit Engine",
    pad + 28,
    footerY
  );

  ctx.textAlign = "right";
  ctx.fillStyle = "#64748B";
  ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    `${new Date().toISOString().slice(0, 10)}  ·  ${verdict.audit_id}`,
    pad + cardW - 28,
    footerY
  );
  ctx.textAlign = "left";

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `tesislab-verdict-${verdict.audit_id}.png`;
  link.href = dataUrl;
  link.click();
}
