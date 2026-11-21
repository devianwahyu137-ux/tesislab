"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Coffee, Monitor, Presentation, Users } from "lucide-react";
import type {
  OfficeCommandEvent,
  OfficeInteractionId,
  StationId,
} from "@/components/office/WarRoom3DCanvas";
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
      <div className="bg-blueprint-grid flex h-[350px] w-full items-center justify-center sm:h-[430px] lg:h-[500px]">
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
 * Full-frame Interactive 3D Studio AI Agents Office with clickable furniture
 * (Whiteboard, Wall Screen, Meeting Table, Coffee Bar, Desks, Server Rack)
 * and mobile/iPad-friendly quick-command buttons that dispatch live agent walk-overs.
 */
export function VirtualWarRoomOffice({
  macroContext,
  macroOrigin,
}: VirtualWarRoomOfficeProps) {
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const { auditPhase, activeAgent, auditResponse, agentSnippets } = useAuditUI();
  const [selectedStation, setSelectedStation] = useState<StationId>("hermes");
  const [officeCmd, setOfficeCmd] = useState<OfficeCommandEvent | null>(null);
  const [activityLog, setActivityLog] = useState<string | null>(null);

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

  const handleOfficeInteract = useCallback(
    (interaction: OfficeInteractionId, actor: StationId) => {
      const actorName = stationLabels[actor];
      const msgMap: Record<OfficeInteractionId, string> = {
        whiteboard: t("office.act_whiteboard"),
        wall_screen: t("office.act_screen"),
        meeting_table: t("office.act_meeting"),
        coffee_bar: `${actorName} — ${t("office.act_coffee")}`,
        hermes_rack: t("office.act_rack"),
        quant_desk: t("office.act_quant_desk"),
        risk_desk: t("office.act_risk_desk"),
        agent_wave: `${actorName} — ${t("office.act_wave")}`,
      };
      setActivityLog(msgMap[interaction]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const triggerOfficeCommand = (interaction: OfficeInteractionId) => {
    setOfficeCmd((prev) => ({ interaction, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const activeStationName =
    selectedStation === "hermes"
      ? t("office.hermes_title")
      : t(`agents.roles.${selectedStation}.name`);

  const activeStationMessage =
    activityLog ??
    (selectedStation === "hermes"
      ? macroAlert
      : agentSnippets[selectedStation] ||
        t(`protocol.divisions.${selectedStation}.mandate`));

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
      {/* Full-Frame Spacious 3D Studio Office */}
      <div className="relative">
        <div className="pointer-events-none absolute right-3 top-3 z-10 hidden rounded-xs border border-hairline bg-surface/90 px-2.5 py-1 backdrop-blur-xs sm:block">
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
          onSelectStation={(st) => {
            setSelectedStation(st);
            setActivityLog(null);
          }}
          onOfficeInteract={handleOfficeInteract}
          externalCommand={officeCmd}
          stationLabels={stationLabels}
          fallbackText={t("office.webgl_fallback")}
        />
      </div>

      {/* Integrated Station & Interactive Office Action Strip */}
      <div className="flex flex-col gap-3 border-t border-hairline bg-surface px-4 py-3.5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Agent Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["hermes", "data_analyst", "risk_manager", "committee_chair"] as const).map(
              (id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedStation(id);
                    setActivityLog(null);
                  }}
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

          {/* Right: 1-Click Interactive Office Prop Commands (Mobile / iPad / Desktop) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  id: "whiteboard",
                  label: t("office.cmd_whiteboard"),
                  Icon: Presentation,
                },
                {
                  id: "wall_screen",
                  label: t("office.cmd_screen"),
                  Icon: Monitor,
                },
                {
                  id: "meeting_table",
                  label: t("office.cmd_meeting"),
                  Icon: Users,
                },
                {
                  id: "coffee_bar",
                  label: t("office.cmd_coffee"),
                  Icon: Coffee,
                },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => triggerOfficeCommand(id)}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-xs border border-hairline bg-obsidian px-2.5 font-mono text-[10px] font-medium text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
              >
                <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline/70 pt-2.5">
          <p className="font-sans text-xs leading-relaxed text-ink-secondary">
            {activeStationMessage}
          </p>
          <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted tabular-nums">
            {activeStationName} · {activeStationMetric}
          </span>
        </div>
      </div>
    </div>
  );
}
