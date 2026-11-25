import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { decodeSharedDossier } from "@/lib/dossierShare";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("d");
  const dossier = decodeSharedDossier(token);

  const status = dossier?.st ?? "CONDITIONAL";
  const score = dossier?.sc ?? 72;
  const conviction = dossier?.cv ?? 80;
  const ruinPct = dossier?.rn ?? 12.4;
  const refId = dossier?.id ?? "TL-2026-AUDIT";
  const track = (dossier?.tr ?? "trading").toUpperCase();
  const headline =
    dossier?.hl ??
    "Anti-Yes-Man Pre-Mortem Financial Risk Simulation & Deterministic Veto.";

  const statusColor =
    status === "CLEARED"
      ? "#10B981"
      : status === "REJECTED"
        ? "#EF4444"
        : "#F59E0B";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#080B10",
          color: "#F1F5F9",
          padding: "54px 64px",
          borderTop: `8px solid ${statusColor}`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Brand & Ref Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              TesisLab.
            </span>
            <span
              style={{
                fontSize: 16,
                color: "#10B981",
                border: "1px solid rgba(16,185,129,0.4)",
                backgroundColor: "rgba(16,185,129,0.12)",
                padding: "6px 14px",
                borderRadius: "4px",
                letterSpacing: "0.12em",
              }}
            >
              {track} DOSSIER
            </span>
          </div>

          <span style={{ fontSize: 18, color: "#94A3B8" }}>REF: {refId}</span>
        </div>

        {/* Center Headline & Big Score */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "40px",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: statusColor,
                  border: `1px solid ${statusColor}`,
                  padding: "6px 16px",
                  borderRadius: "4px",
                  letterSpacing: "0.1em",
                }}
              >
                {status}
              </span>
            </div>

            <span
              style={{
                fontSize: 38,
                fontWeight: 600,
                lineHeight: 1.22,
                color: "#F8FAFC",
              }}
            >
              {headline}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              backgroundColor: "#101620",
              border: "1px solid #1D2736",
              padding: "28px 36px",
              borderRadius: "8px",
            }}
          >
            <span
              style={{
                fontSize: 15,
                color: "#94A3B8",
                letterSpacing: "0.12em",
              }}
            >
              RESILIENCE SCORE
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span
                style={{
                  fontSize: 78,
                  fontWeight: 800,
                  color: statusColor,
                }}
              >
                {score}
              </span>
              <span style={{ fontSize: 24, color: "#64748B" }}>/100</span>
            </div>
          </div>
        </div>

        {/* Bottom Telemetry Strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #1D2736",
            paddingTop: "24px",
            fontSize: 18,
            color: "#CBD5E1",
          }}
        >
          <div style={{ display: "flex", gap: "36px" }}>
            <span>Initial Conviction: {conviction}%</span>
            <span>Monte Carlo Ruin: {ruinPct}%</span>
          </div>
          <span style={{ color: "#10B981", fontWeight: 600 }}>
            tesislab.app · Deterministic Pre-Mortem Engine
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
