"use client";

import type { Locale } from "@/lib/i18n/config";
import type { AuditTrack, VerdictPayload } from "@/lib/schemas/verdictSchema";

const LOGICAL_WIDTH = 1200;
const LOGICAL_HEIGHT = 675;
const RETINA_SCALE = 2;

const STATUS_COLORS: Record<
  VerdictPayload["verdict_status"],
  { accent: string; bg: string }
> = {
  CLEARED: { accent: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  CONDITIONAL: { accent: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  REJECTED: { accent: "#EF4444", bg: "rgba(239, 68, 68, 0.12)" },
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

/**
 * Deterministic HTML5 Canvas renderer for the Swiss Editorial Verdict Card (1200x675 @ 2x),
 * including the Conviction vs. Reality Gap mirror block.
 */
export async function downloadVerdictCardPng(params: {
  verdict: VerdictPayload;
  track: AuditTrack;
  locale: Locale;
  submittedConviction?: number;
}): Promise<void> {
  const { verdict, track, locale, submittedConviction = 75 } = params;

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
      ? "rgba(239, 68, 68, 0.12)"
      : gap <= -15
        ? "rgba(245, 158, 11, 0.12)"
        : "rgba(16, 185, 129, 0.12)";
  const gapText =
    gap >= 20
      ? locale === "id"
        ? `BIAS OPTIMISME +${gap}% · TERLALU YAKIN`
        : `OPTIMISM BIAS +${gap}% · OVERCONFIDENT`
      : gap <= -15
        ? locale === "id"
          ? "TERLALU HATI-HATI"
          : "OVERLY CONSERVATIVE"
        : locale === "id"
          ? "TERKALIBRASI REALISTIS"
          : "WELL CALIBRATED";

  // Outer Obsidian Background
  ctx.fillStyle = "#0B0D10";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  // Main Editorial Surface Card
  const pad = 36;
  const cardW = LOGICAL_WIDTH - pad * 2;
  const cardH = LOGICAL_HEIGHT - pad * 2;
  ctx.fillStyle = "#12161B";
  ctx.fillRect(pad, pad, cardW, cardH);
  ctx.strokeStyle = "#1E242B";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pad, pad, cardW, cardH);

  // Header Bar
  ctx.fillStyle = "#F3F4F6";
  ctx.font = '600 22px Georgia, "Times New Roman", serif';
  ctx.fillText("TesisLab.", pad + 32, pad + 42);

  ctx.fillStyle = "#6B7280";
  ctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    `// REF: ${verdict.audit_id}   // TRACK: ${track.toUpperCase()}`,
    pad + 142,
    pad + 41
  );

  // Status Badge at Top-Right
  const badgeText = verdict.verdict_status;
  ctx.font = '600 12px "JetBrains Mono", ui-monospace, monospace';
  const badgeW = ctx.measureText(badgeText).width + 34;
  const badgeX = pad + cardW - 32 - badgeW;
  const badgeY = pad + 20;
  ctx.fillStyle = statusStyle.bg;
  ctx.fillRect(badgeX, badgeY, badgeW, 28);
  ctx.strokeStyle = statusStyle.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(badgeX, badgeY, badgeW, 28);
  ctx.fillStyle = statusStyle.accent;
  ctx.fillText(badgeText, badgeX + 17, badgeY + 18);

  // Header Hairline
  ctx.strokeStyle = "#1E242B";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad + 64);
  ctx.lineTo(pad + cardW, pad + 64);
  ctx.stroke();

  // Headline + Score Block
  ctx.fillStyle = "#F3F4F6";
  ctx.font = '500 26px Georgia, "Times New Roman", serif';
  const headlineLines = wrapLines(
    ctx,
    verdict.headline_verdict,
    cardW - 260,
    2
  );
  headlineLines.forEach((line, idx) => {
    ctx.fillText(line, pad + 32, pad + 104 + idx * 34);
  });

  // Score Box on Right
  const scoreX = pad + cardW - 190;
  ctx.fillStyle = "#6B7280";
  ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    locale === "id" ? "SKOR KETAHANAN" : "RESILIENCE SCORE",
    scoreX,
    pad + 96
  );
  ctx.fillStyle = statusStyle.accent;
  ctx.font = '700 42px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(`${verdict.score}`, scoreX, pad + 140);
  ctx.fillStyle = "#6B7280";
  ctx.font = '500 15px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    "/ 100",
    scoreX + ctx.measureText(`${verdict.score}`).width + 6,
    pad + 140
  );

  // Conviction vs. Reality Gap Strip
  const gapY = pad + 168;
  const gapH = 70;
  const gapW = cardW - 64;
  ctx.fillStyle = "#0B0D10";
  ctx.fillRect(pad + 32, gapY, gapW, gapH);
  ctx.strokeStyle = "#1E242B";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 32, gapY, gapW, gapH);

  // Two compact progress bars on left of gap strip
  const barW = 280;
  const bar1X = pad + 48;
  const bar2X = bar1X + barW + 28;

  ctx.fillStyle = "#9CA3AF";
  ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    locale === "id"
      ? `KEYAKINAN AWAL: ${submittedConviction}%`
      : `INITIAL CONVICTION: ${submittedConviction}%`,
    bar1X,
    gapY + 24
  );
  ctx.fillStyle = "#1E242B";
  ctx.fillRect(bar1X, gapY + 34, barW, 8);
  ctx.fillStyle = "#94A3B8";
  ctx.fillRect(bar1X, gapY + 34, (barW * submittedConviction) / 100, 8);

  ctx.fillStyle = "#9CA3AF";
  ctx.fillText(
    locale === "id"
      ? `KETAHANAN MATEMATIS: ${verdict.score}%`
      : `MATH RESILIENCE: ${verdict.score}%`,
    bar2X,
    gapY + 24
  );
  ctx.fillStyle = "#1E242B";
  ctx.fillRect(bar2X, gapY + 34, barW, 8);
  ctx.fillStyle = statusStyle.accent;
  ctx.fillRect(bar2X, gapY + 34, (barW * verdict.score) / 100, 8);

  // Gap Badge on right of strip
  ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
  const gBadgeW = Math.min(340, ctx.measureText(gapText).width + 24);
  const gBadgeX = pad + 32 + gapW - 16 - gBadgeW;
  const gBadgeY = gapY + 20;
  ctx.fillStyle = gapBg;
  ctx.fillRect(gBadgeX, gBadgeY, gBadgeW, 28);
  ctx.strokeStyle = gapColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(gBadgeX, gBadgeY, gBadgeW, 28);
  ctx.fillStyle = gapColor;
  ctx.fillText(gapText, gBadgeX + 12, gBadgeY + 18);

  // 3 Pre-Mortem Blind Spots Columns
  const gridY = gapY + gapH + 30;
  const colGap = 16;
  const colW = (cardW - 64 - colGap * 2) / 3;
  const colH = 148;

  ctx.fillStyle = "#9CA3AF";
  ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    locale === "id" ? "3 TITIK BUTA PRE-MORTEM" : "3 PRE-MORTEM BLIND SPOTS",
    pad + 32,
    gridY - 10
  );

  verdict.premortem_blind_spots.forEach((spot, idx) => {
    const x = pad + 32 + idx * (colW + colGap);
    ctx.fillStyle = "#0B0D10";
    ctx.fillRect(x, gridY, colW, colH);
    ctx.strokeStyle = "#1E242B";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, gridY, colW, colH);

    ctx.fillStyle = "#F59E0B";
    ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(`0${idx + 1}`, x + 16, gridY + 24);

    ctx.fillStyle = "#D1D5DB";
    ctx.font = '400 13px "Plus Jakarta Sans", system-ui, sans-serif';
    const lines = wrapLines(ctx, spot, colW - 32, 5);
    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, x + 16, gridY + 46 + lineIdx * 19);
    });
  });

  // Actionable Fix Box
  const fixY = gridY + colH + 18;
  const fixH = 84;
  ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
  ctx.fillRect(pad + 32, fixY, cardW - 64, fixH);
  ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 32, fixY, cardW - 64, fixH);

  ctx.fillStyle = "#10B981";
  ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    locale === "id" ? "SYARAT MITIGASI WAJIB" : "MANDATORY ACTIONABLE FIX",
    pad + 48,
    fixY + 22
  );

  ctx.fillStyle = "#F3F4F6";
  ctx.font = '500 14.5px "Plus Jakarta Sans", system-ui, sans-serif';
  const fixLines = wrapLines(ctx, verdict.actionable_fix, cardW - 96, 2);
  fixLines.forEach((line, idx) => {
    ctx.fillText(line, pad + 48, fixY + 46 + idx * 20);
  });

  // Bottom Watermark
  ctx.fillStyle = "#6B7280";
  ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(
    "tesislab — Anti-Yes-Man Pre-Mortem Financial Decision Simulator",
    pad + 32,
    pad + cardH - 18
  );

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `tesislab-verdict-${verdict.audit_id}.png`;
  link.href = dataUrl;
  link.click();
}
