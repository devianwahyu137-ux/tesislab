"use client";

import { useState } from "react";
import { Radio } from "lucide-react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { useAuditUI, type AgentRole } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export type StationId = "hermes" | AgentRole;

export interface VirtualWarRoomOfficeProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

/**
 * Architectural Schematic Control Room (HERMES-00 -> DIV-01 -> DIV-02 -> DIV-03)
 * synchronized in real time with useAuditUI() and daily Hermes macro telemetry.
 */
export function VirtualWarRoomOffice({
  macroContext,
  macroOrigin,
}: VirtualWarRoomOfficeProps) {
  const { locale, t } = useTranslation();
  const { auditPhase, activeAgent, auditResponse, agentSnippets } = useAuditUI();
  const [selectedStation, setSelectedStation] = useState<StationId>("hermes");

  const isRemoteLive = macroOrigin === "remote_data_feed";
  const regime = macroContext.synthesis.macro_regime;
  const macroAlert =
    locale === "en"
      ? macroContext.synthesis.key_risk_alert_en
      : macroContext.synthesis.key_risk_alert_id;

  const flagCount = auditResponse?.metrics.deterministic_flags.length ?? 0;
  const calcMs = auditResponse?.telemetry.calc_ms;
  const verdictStatus = auditResponse?.verdict.verdict_status;
  const verdictScore = auditResponse?.verdict.score;

  // Circuit bus illumination state per segment
  const seg1Active =
    auditPhase === "idle" ||
    auditPhase === "scanning" ||
    auditPhase === "debating" ||
    auditPhase === "verdict";
  const seg2Active = auditPhase === "debating" || auditPhase === "verdict";
  const seg3Active = auditPhase === "verdict";

  const verdictBusColor =
    verdictStatus === "REJECTED"
      ? "var(--status-rejected)"
      : verdictStatus === "CONDITIONAL"
        ? "var(--status-conditional)"
        : "var(--status-cleared)";

  const seg1Color =
    auditPhase === "verdict" ? verdictBusColor : "var(--status-cleared)";
  const seg2Color =
    auditPhase === "verdict"
      ? verdictBusColor
      : auditPhase === "debating"
        ? "var(--status-conditional)"
        : "var(--border-hairline)";
  const seg3Color =
    auditPhase === "verdict" ? verdictBusColor : "var(--border-hairline)";

  // Status labels per desk
  const div1Status =
    auditPhase === "scanning"
      ? t("office.status_scanning")
      : auditPhase === "verdict" && calcMs !== undefined
        ? `${calcMs.toFixed(1)} ms`
        : t("office.status_standby");

  const div2Status =
    auditPhase === "debating"
      ? t("office.status_stress")
      : auditPhase === "verdict"
        ? `${flagCount} ${t("office.flags_suffix")}`
        : t("office.status_standby");

  const div3Status =
    auditPhase === "verdict" && verdictStatus
      ? `${verdictStatus} · ${verdictScore}/100`
      : auditPhase === "debating"
        ? t("office.status_deliberating")
        : t("office.status_standby");

  const activeStationCode =
    selectedStation === "hermes"
      ? t("office.hermes_code")
      : t(`protocol.divisions.${selectedStation}.code`);

  const activeStationName =
    selectedStation === "hermes"
      ? t("office.hermes_title")
      : t(`agents.roles.${selectedStation}.name`);

  const activeStationMessage =
    selectedStation === "hermes"
      ? macroAlert
      : agentSnippets[selectedStation] ||
        t(`protocol.divisions.${selectedStation}.mandate`);

  return (
    <div className="border-b border-hairline bg-canvas/70 px-4 py-4 md:px-6 md:py-5">
      {/* Control Room Subheader */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          {t("office.header_label")}
        </span>
        <span className="font-mono text-[10px] tracking-wider text-ink-muted">
          {t("office.inspect_hint")}
        </span>
      </div>

      {/* Architectural 4-Desk Floorplan + SVG Circuit Bus */}
      <div className="relative">
        {/* Desktop/Tablet Horizontal SVG Circuit Bus behind the 4 desks */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-10 w-full -translate-y-1/2 md:block"
        >
          {/* Base architectural rail */}
          <line
            x1="125"
            y1="20"
            x2="875"
            y2="20"
            stroke="var(--border-hairline)"
            strokeWidth="2"
          />

          {/* Segment 1: HERMES-00 -> DIV-01 */}
          <line
            x1="125"
            y1="20"
            x2="375"
            y2="20"
            stroke={seg1Color}
            strokeWidth={auditPhase === "scanning" ? "2.5" : "1.8"}
            strokeOpacity={auditPhase === "idle" ? "0.45" : "0.95"}
            strokeDasharray="6 6"
            className={seg1Active ? "animate-circuit-flow" : undefined}
          />

          {/* Segment 2: DIV-01 -> DIV-02 */}
          <line
            x1="375"
            y1="20"
            x2="625"
            y2="20"
            stroke={seg2Color}
            strokeWidth={auditPhase === "debating" ? "2.5" : "1.8"}
            strokeOpacity={seg2Active ? "0.95" : "0.35"}
            strokeDasharray="6 6"
            className={seg2Active ? "animate-circuit-flow" : undefined}
          />

          {/* Segment 3: DIV-02 -> DIV-03 */}
          <line
            x1="625"
            y1="20"
            x2="875"
            y2="20"
            stroke={seg3Color}
            strokeWidth={seg3Active ? "2.5" : "1.8"}
            strokeOpacity={seg3Active ? "0.95" : "0.35"}
            strokeDasharray="6 6"
            className={seg3Active ? "animate-circuit-flow" : undefined}
          />
        </svg>

        {/* 4 Interactive Workstations (2x2 Mobile, 4-col Tablet/Desktop) */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3.5">
          {/* Station 0: HERMES-00 */}
          <button
            type="button"
            onClick={() => setSelectedStation("hermes")}
            aria-pressed={selectedStation === "hermes"}
            className={cn(
              "flex min-h-[96px] flex-col justify-between rounded-sm border bg-surface p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
              selectedStation === "hermes"
                ? "border-active-border ring-1 ring-cleared/30"
                : "border-hairline hover:border-active-border"
            )}
          >
            <div className="flex w-full items-center justify-between gap-1.5">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
                {t("office.hermes_code")}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                  isRemoteLive
                    ? "border-cleared/40 bg-cleared/10 text-cleared"
                    : "border-conditional/40 bg-conditional/10 text-conditional"
                )}
              >
                <Radio className="h-2.5 w-2.5" aria-hidden="true" />
                <span>
                  {isRemoteLive
                    ? t("nav.macro_live_short")
                    : t("nav.macro_fallback_short")}
                </span>
              </span>
            </div>

            <div className="my-1">
              <span className="block font-sans text-xs font-semibold text-ink-primary">
                {t("office.hermes_title")}
              </span>
              <span className="font-mono text-[10px] text-ink-muted">
                {t("office.hermes_schedule")}
              </span>
            </div>

            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-conditional">
              {regime}
            </div>
          </button>

          {/* Station 1: DIV-01 */}
          <button
            type="button"
            onClick={() => setSelectedStation("data_analyst")}
            aria-pressed={selectedStation === "data_analyst"}
            className={cn(
              "flex min-h-[96px] flex-col justify-between rounded-sm border bg-surface p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
              activeAgent === "data_analyst" && auditPhase === "scanning"
                ? "border-cleared ring-1 ring-cleared/40"
                : selectedStation === "data_analyst"
                  ? "border-active-border ring-1 ring-cleared/30"
                  : "border-hairline hover:border-active-border"
            )}
          >
            <div className="flex w-full items-center justify-between gap-1.5">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
                DIV-01
              </span>
              <AgentAvatar
                role="data_analyst"
                phase={
                  activeAgent === "data_analyst" || auditPhase === "verdict"
                    ? auditPhase
                    : "idle"
                }
                isActive={
                  activeAgent === "data_analyst" || auditPhase === "verdict"
                }
                size={28}
              />
            </div>

            <span className="my-1 block truncate font-sans text-xs font-semibold text-ink-primary">
              {t("agents.roles.data_analyst.name")}
            </span>

            <span
              className={cn(
                "font-mono text-[10px] font-semibold uppercase tracking-wider tabular-nums",
                auditPhase === "scanning" || auditPhase === "verdict"
                  ? "text-cleared"
                  : "text-ink-muted"
              )}
            >
              {div1Status}
            </span>
          </button>

          {/* Station 2: DIV-02 */}
          <button
            type="button"
            onClick={() => setSelectedStation("risk_manager")}
            aria-pressed={selectedStation === "risk_manager"}
            className={cn(
              "flex min-h-[96px] flex-col justify-between rounded-sm border bg-surface p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
              activeAgent === "risk_manager" && auditPhase === "debating"
                ? "border-conditional ring-1 ring-conditional/40"
                : selectedStation === "risk_manager"
                  ? "border-active-border ring-1 ring-cleared/30"
                  : "border-hairline hover:border-active-border"
            )}
          >
            <div className="flex w-full items-center justify-between gap-1.5">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
                DIV-02
              </span>
              <AgentAvatar
                role="risk_manager"
                phase={
                  activeAgent === "risk_manager" || auditPhase === "verdict"
                    ? auditPhase
                    : "idle"
                }
                isActive={
                  activeAgent === "risk_manager" || auditPhase === "verdict"
                }
                size={28}
              />
            </div>

            <span className="my-1 block truncate font-sans text-xs font-semibold text-ink-primary">
              {t("agents.roles.risk_manager.name")}
            </span>

            <span
              className={cn(
                "font-mono text-[10px] font-semibold uppercase tracking-wider tabular-nums",
                auditPhase === "debating"
                  ? "text-conditional"
                  : auditPhase === "verdict"
                    ? flagCount > 0
                      ? "text-rejected"
                      : "text-cleared"
                    : "text-ink-muted"
              )}
            >
              {div2Status}
            </span>
          </button>

          {/* Station 3: DIV-03 */}
          <button
            type="button"
            onClick={() => setSelectedStation("committee_chair")}
            aria-pressed={selectedStation === "committee_chair"}
            className={cn(
              "flex min-h-[96px] flex-col justify-between rounded-sm border bg-surface p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
              auditPhase === "verdict"
                ? verdictStatus === "REJECTED"
                  ? "border-rejected/70"
                  : verdictStatus === "CONDITIONAL"
                    ? "border-conditional/70"
                    : "border-cleared/70"
                : selectedStation === "committee_chair"
                  ? "border-active-border ring-1 ring-cleared/30"
                  : "border-hairline hover:border-active-border"
            )}
          >
            <div className="flex w-full items-center justify-between gap-1.5">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
                DIV-03
              </span>
              <AgentAvatar
                role="committee_chair"
                phase={auditPhase === "verdict" ? "verdict" : "idle"}
                isActive={auditPhase === "verdict"}
                size={28}
              />
            </div>

            <span className="my-1 block truncate font-sans text-xs font-semibold text-ink-primary">
              {t("agents.roles.committee_chair.name")}
            </span>

            <span
              className={cn(
                "truncate font-mono text-[10px] font-semibold uppercase tracking-wider tabular-nums",
                auditPhase === "verdict"
                  ? verdictStatus === "REJECTED"
                    ? "text-rejected"
                    : verdictStatus === "CONDITIONAL"
                      ? "text-conditional"
                      : "text-cleared"
                  : "text-ink-muted"
              )}
            >
              {div3Status}
            </span>
          </button>
        </div>
      </div>

      {/* Live Telemetry & Comms Strip */}
      <div className="mt-3.5 rounded-sm border border-hairline bg-surface p-3">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cleared">
            {t("office.comms_label")} {"//"} {activeStationCode} · {activeStationName}
          </span>
          {selectedStation === "hermes" && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ink-secondary tabular-nums">
              <span>USD/IDR {macroContext.indicators.USD_IDR.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              <span>IHSG {macroContext.indicators.IHSG.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
              <span>GOLD ${macroContext.indicators.GOLD_USD.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              <span>BTC ${macroContext.indicators.BTC_USD.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>
        <p className="font-sans text-xs leading-relaxed text-ink-secondary">
          {activeStationMessage}
        </p>
      </div>
    </div>
  );
}
