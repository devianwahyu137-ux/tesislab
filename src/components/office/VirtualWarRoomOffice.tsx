"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { StationId } from "@/components/office/WarRoom3DCanvas";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

const WarRoom3DCanvas = dynamic(
  () => import("@/components/office/WarRoom3DCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-blueprint-grid flex h-[280px] w-full items-center justify-center sm:h-[340px] lg:h-[390px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          INITIALIZING 3D WAR-ROOM...
        </span>
      </div>
    ),
  }
);

export interface VirtualWarRoomOfficeProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

/**
 * Full-frame 3D Isometric Institutional War-Room Office seamlessly joined
 * with a crisp telemetry strip below (no double-box borders).
 */
export function VirtualWarRoomOffice({
  macroContext,
  macroOrigin,
}: VirtualWarRoomOfficeProps) {
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const { auditPhase, activeAgent, auditResponse, agentSnippets } = useAuditUI();
  const [selectedStation, setSelectedStation] = useState<StationId>("hermes");

  const regime = macroContext.synthesis.macro_regime;
  const macroAlert =
    locale === "en"
      ? macroContext.synthesis.key_risk_alert_en
      : macroContext.synthesis.key_risk_alert_id;

  const flagCount = auditResponse?.metrics.deterministic_flags.length ?? 0;
  const calcMs = auditResponse?.telemetry.calc_ms;
  const verdictStatus = auditResponse?.verdict.verdict_status;
  const verdictScore = auditResponse?.verdict.score;

  const stationLabels: Record<StationId, string> = {
    hermes: "HERMES",
    data_analyst: "QUANT",
    risk_manager: "RISK",
    committee_chair: "CHAIR",
  };

  const activeStationName =
    selectedStation === "hermes"
      ? t("office.hermes_title")
      : t(`agents.roles.${selectedStation}.name`);

  const activeStationMessage =
    selectedStation === "hermes"
      ? macroAlert
      : agentSnippets[selectedStation] ||
        t(`protocol.divisions.${selectedStation}.mandate`);

  const activeStationMetric =
    selectedStation === "hermes"
      ? regime
      : selectedStation === "data_analyst"
        ? calcMs !== undefined
          ? `${calcMs.toFixed(1)} ms`
          : t("office.status_standby")
        : selectedStation === "risk_manager"
          ? auditPhase === "verdict"
            ? `${flagCount} ${t("office.flags_suffix")}`
            : t("office.status_standby")
          : auditPhase === "verdict" && verdictStatus
            ? `${verdictStatus} · ${verdictScore}/100`
            : t("office.status_standby");

  return (
    <div className="border-b border-hairline">
      {/* Full-Frame 3D Isometric Maquette */}
      <div className="relative">
        <div className="pointer-events-none absolute right-3 top-3 z-10 hidden rounded-xs border border-hairline bg-surface/85 px-2.5 py-1 backdrop-blur-xs sm:block">
          <span className="font-mono text-[10px] tracking-wider text-ink-muted">
            {t("office.click_3d_hint")}
          </span>
        </div>

        <WarRoom3DCanvas
          theme={theme}
          auditPhase={auditPhase}
          activeAgent={activeAgent}
          verdictStatus={verdictStatus}
          macroOrigin={macroOrigin}
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
          stationLabels={stationLabels}
          fallbackText={t("office.webgl_fallback")}
        />
      </div>

      {/* Integrated Station Telemetry Strip */}
      <div className="flex flex-col gap-3 border-t border-hairline bg-surface px-4 py-3.5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["hermes", "data_analyst", "risk_manager", "committee_chair"] as const).map(
              (id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedStation(id)}
                  aria-pressed={selectedStation === id}
                  className={cn(
                    "min-h-[34px] rounded-xs border px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    selectedStation === id
                      ? "border-cleared/60 bg-cleared/10 text-cleared"
                      : "border-hairline bg-canvas text-ink-muted hover:text-ink-primary"
                  )}
                >
                  {stationLabels[id]}
                </button>
              )
            )}
          </div>

          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-secondary tabular-nums">
            {activeStationName} · {activeStationMetric}
          </span>
        </div>

        <p className="font-sans text-xs leading-relaxed text-ink-secondary">
          {activeStationMessage}
        </p>
      </div>
    </div>
  );
}
