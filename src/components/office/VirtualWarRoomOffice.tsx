"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Radio } from "lucide-react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
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
      <div className="bg-blueprint-grid flex h-[240px] w-full items-center justify-center rounded-sm border border-hairline sm:h-[290px] lg:h-[330px]">
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
 * Interactive 3D Isometric Institutional War-Room Office synchronized two-way
 * with the compact 4-station status bar and Live Telemetry & Comms Strip.
 */
export function VirtualWarRoomOffice({
  macroContext,
  macroOrigin,
}: VirtualWarRoomOfficeProps) {
  const { locale, t } = useTranslation();
  const { theme } = useTheme();
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
      {/* 3D Isometric War-Room Stage with Minimalist HUD Overlay */}
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-2.5 z-10 flex items-center gap-2 rounded-xs border border-hairline bg-surface/85 px-2.5 py-1 backdrop-blur-xs">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-cleared"
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
            {t("office.hud_label")}
          </span>
        </div>

        <div className="pointer-events-none absolute right-3 top-2.5 z-10 hidden rounded-xs border border-hairline bg-surface/85 px-2.5 py-1 backdrop-blur-xs sm:block">
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
          fallbackText={t("office.webgl_fallback")}
        />
      </div>

      {/* Compact 4-Station Selector Bar (Synced 2-Way with 3D Raycaster) */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setSelectedStation("hermes")}
          aria-pressed={selectedStation === "hermes"}
          className={cn(
            "flex min-h-[48px] items-center justify-between gap-2 rounded-sm border bg-surface px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
            selectedStation === "hermes"
              ? "border-active-border ring-1 ring-cleared/30"
              : "border-hairline hover:border-active-border"
          )}
        >
          <div className="min-w-0">
            <span className="block font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
              {t("office.hermes_code")}
            </span>
            <span className="block truncate font-mono text-[10px] font-semibold uppercase text-conditional">
              {regime}
            </span>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase",
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
        </button>

        <button
          type="button"
          onClick={() => setSelectedStation("data_analyst")}
          aria-pressed={selectedStation === "data_analyst"}
          className={cn(
            "flex min-h-[48px] items-center justify-between gap-2 rounded-sm border bg-surface px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
            selectedStation === "data_analyst"
              ? "border-active-border ring-1 ring-cleared/30"
              : "border-hairline hover:border-active-border"
          )}
        >
          <div className="min-w-0">
            <span className="block font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
              DIV-01
            </span>
            <span
              className={cn(
                "block truncate font-mono text-[10px] font-semibold uppercase tabular-nums",
                auditPhase === "scanning" || auditPhase === "verdict"
                  ? "text-cleared"
                  : "text-ink-muted"
              )}
            >
              {div1Status}
            </span>
          </div>
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
            size={26}
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedStation("risk_manager")}
          aria-pressed={selectedStation === "risk_manager"}
          className={cn(
            "flex min-h-[48px] items-center justify-between gap-2 rounded-sm border bg-surface px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
            selectedStation === "risk_manager"
              ? "border-active-border ring-1 ring-cleared/30"
              : "border-hairline hover:border-active-border"
          )}
        >
          <div className="min-w-0">
            <span className="block font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
              DIV-02
            </span>
            <span
              className={cn(
                "block truncate font-mono text-[10px] font-semibold uppercase tabular-nums",
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
          </div>
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
            size={26}
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedStation("committee_chair")}
          aria-pressed={selectedStation === "committee_chair"}
          className={cn(
            "flex min-h-[48px] items-center justify-between gap-2 rounded-sm border bg-surface px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
            selectedStation === "committee_chair"
              ? "border-active-border ring-1 ring-cleared/30"
              : "border-hairline hover:border-active-border"
          )}
        >
          <div className="min-w-0">
            <span className="block font-mono text-[10px] font-semibold tracking-wider text-ink-muted">
              DIV-03
            </span>
            <span
              className={cn(
                "block truncate font-mono text-[10px] font-semibold uppercase tabular-nums",
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
          </div>
          <AgentAvatar
            role="committee_chair"
            phase={auditPhase === "verdict" ? "verdict" : "idle"}
            isActive={auditPhase === "verdict"}
            size={26}
          />
        </button>
      </div>

      {/* Live Telemetry & Comms Strip */}
      <div className="mt-3 rounded-sm border border-hairline bg-surface p-3">
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
