"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  BookOpen,
  Coffee,
  Cpu,
  FastForward,
  Monitor,
  Pause,
  Play,
  Presentation,
  Server,
  Users,
} from "lucide-react";
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
      <div className="bg-blueprint-grid flex h-[310px] w-full items-center justify-center sm:h-[430px] lg:h-[520px]">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          INITIALIZING 3D EXECUTIVE OFFICE...
        </span>
      </div>
    ),
  }
);

export interface VirtualWarRoomOfficeProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
  externalCommandOverride?: OfficeCommandEvent | null;
}

/**
 * Full-frame Interactive 3D Executive Quant Office with 5 camera presets,
 * simulation speed controls (`Pause | 1× | 2×`), and 6 interactive station triggers.
 */
export function VirtualWarRoomOffice({
  macroContext,
  macroOrigin,
  externalCommandOverride = null,
}: VirtualWarRoomOfficeProps) {
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
  const isId = locale === "id";
  const {
    auditPhase,
    activeAgent,
    auditResponse,
    agentSnippets,
    liveRiskSnapshot,
  } = useAuditUI();

  const [selectedStation, setSelectedStation] = useState<StationId>("hermes");
  const [officeCmd, setOfficeCmd] = useState<OfficeCommandEvent | null>(null);
  const [activityLog, setActivityLog] = useState<string | null>(null);
  const [simSpeed, setSimSpeed] = useState<0 | 1 | 2>(1);

  const effectiveCommand =
    externalCommandOverride &&
    externalCommandOverride.nonce > (officeCmd?.nonce ?? 0)
      ? externalCommandOverride
      : officeCmd;

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
        bookshelf: isId
          ? "CHAIR memeriksa Arsip Riset Brier & preseden kasus keuangan terdahulu."
          : "CHAIR is inspecting the Brier Research Archive & historical case precedents.",
        agent_wave: `${actorName} — ${t("office.act_wave")}`,
      };
      setActivityLog(msgMap[interaction]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const triggerOfficeCommand = (interaction: OfficeInteractionId) => {
    if (simSpeed === 0) setSimSpeed(1);
    const baseNonce = Math.max(
      officeCmd?.nonce ?? 0,
      externalCommandOverride?.nonce ?? 0
    );
    setOfficeCmd({ interaction, nonce: baseNonce + 1 });
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
    <div>
      {/* Full-Frame Spacious 3D Executive Quant Office */}
      <div className="relative">
        {/* Top-Right Simulation Speed & Hint Bar */}
        <div className="absolute right-3 top-3 z-20 hidden items-center gap-1.5 rounded-lg border border-hairline bg-obsidian/90 px-2.5 py-1 backdrop-blur-md xl:flex">
          <span className="font-sans text-xs text-text-muted">
            {isId ? "Kecepatan:" : "Sim Speed:"}
          </span>
          {(
            [
              { val: 0, label: "Jeda", Icon: Pause },
              { val: 1, label: "1×", Icon: Play },
              { val: 2, label: "2×", Icon: FastForward },
            ] as const
          ).map(({ val, label, Icon }) => (
            <button
              key={val}
              type="button"
              onClick={() => setSimSpeed(val)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10.5px] font-bold transition-colors",
                simSpeed === val
                  ? "bg-cleared/18 text-cleared"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <WarRoom3DCanvas
          theme={theme}
          auditPhase={auditPhase}
          activeAgent={activeAgent}
          verdictStatus={verdictStatus}
          liveRiskScore={liveRiskSnapshot?.score ?? null}
          macroOrigin={macroOrigin}
          selectedStation={selectedStation}
          onSelectStation={(st) => {
            setSelectedStation(st);
            setActivityLog(null);
          }}
          onOfficeInteract={handleOfficeInteract}
          externalCommand={effectiveCommand}
          simSpeed={simSpeed}
          stationLabels={stationLabels}
          fallbackText={t("office.webgl_fallback")}
        />
      </div>

      {/* Luminous Station & 7-Action Interactive Office Director Strip */}
      <div className="flex flex-col gap-3 border-t border-hairline bg-obsidian/92 px-3.5 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          {/* Agent Selector Pills + Mobile/iPad Sim Speed Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid flex-1 grid-cols-4 gap-1.5 sm:flex sm:flex-initial sm:flex-wrap sm:items-center">
              {(
                [
                  { id: "hermes", dot: "bg-sky-400" },
                  { id: "data_analyst", dot: "bg-cleared" },
                  { id: "risk_manager", dot: "bg-rejected" },
                  { id: "committee_chair", dot: "bg-conditional" },
                ] as const
              ).map(({ id, dot }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedStation(id);
                    setActivityLog(null);
                  }}
                  aria-pressed={selectedStation === id}
                  className={cn(
                    "inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-md border px-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-all sm:px-3 sm:text-xs",
                    selectedStation === id
                      ? "border-cleared/60 bg-cleared/16 text-cleared shadow-[0_0_16px_-4px_rgba(16,185,129,0.45)]"
                      : "border-hairline bg-surface text-text-secondary hover:text-text-primary"
                  )}
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} aria-hidden="true" />
                  <span>{stationLabels[id]}</span>
                </button>
              ))}
            </div>

            {/* Mobile & iPad Sim Speed Toggle (< xl) */}
            <div className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface p-0.5 xl:hidden">
              {(
                [
                  { val: 0, label: "Jeda", Icon: Pause },
                  { val: 1, label: "1×", Icon: Play },
                  { val: 2, label: "2×", Icon: FastForward },
                ] as const
              ).map(({ val, label, Icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSimSpeed(val)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xs px-2 py-1 font-mono text-[10px] font-bold transition-colors",
                    simSpeed === val
                      ? "bg-cleared/18 text-cleared"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 7 Interactive Office Station Triggers */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center">
            {(
              [
                {
                  id: "meeting_table",
                  label: t("office.cmd_meeting"),
                  Icon: Users,
                },
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
                  id: "quant_desk",
                  label: isId ? "Meja Quant" : "Quant Desk",
                  Icon: Cpu,
                },
                {
                  id: "hermes_rack",
                  label: isId ? "Server Makro" : "Macro Server",
                  Icon: Server,
                },
                {
                  id: "bookshelf",
                  label: isId ? "Arsip Riset" : "Archives",
                  Icon: BookOpen,
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
                className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 font-sans text-xs font-semibold text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared sm:px-3"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline/75 pt-2.5">
          <p className="font-sans text-[13px] leading-relaxed text-text-primary">
            {activeStationMessage}
          </p>
          <span className="shrink-0 rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-cleared tabular-nums">
            {activeStationName} · {activeStationMetric}
          </span>
        </div>
      </div>
    </div>
  );
}
