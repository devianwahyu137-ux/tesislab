"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { VirtualWarRoomOffice } from "@/components/office/VirtualWarRoomOffice";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { getDemoPresetByTrack } from "@/lib/agents/demoPresets";
import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const PRESET_MAP: Record<AuditTrack, string> = {
  trading: "demo_trading_bbca",
  business: "demo_business_batik",
  cashflow: "demo_cashflow_gadget",
};

export interface WarRoomPageClientProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

export function WarRoomPageClient({
  macroContext,
  macroOrigin,
}: WarRoomPageClientProps) {
  const { locale, t } = useTranslation();
  const {
    activeTrack,
    setActiveTrack,
    auditPhase,
    setAuditPhase,
    setActiveAgent,
    auditResponse,
    agentSnippets,
    setAuditOutcome,
  } = useAuditUI();

  const [isConvening, setIsConvening] = useState(false);
  const isId = locale === "id";

  const handleConveneHearing = async (trackOverride?: AuditTrack) => {
    const targetTrack = trackOverride ?? activeTrack;
    setActiveTrack(targetTrack);
    setIsConvening(true);
    setAuditPhase("scanning");
    setActiveAgent("data_analyst");

    const t1 = setTimeout(() => {
      setAuditPhase("debating");
      setActiveAgent("risk_manager");
    }, 550);

    try {
      const preset = getDemoPresetByTrack(targetTrack);
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "demo",
          preset_id: PRESET_MAP[targetTrack],
          track: targetTrack,
          locale,
          input: preset.input,
        }),
      });
      const data = (await res.json()) as CommitteeAuditResponse;
      clearTimeout(t1);
      if (res.ok && "verdict" in data) {
        setAuditOutcome(data, data.resolved_input, targetTrack, 80);
        toast.success(t("toast.audit_done"));
      }
    } catch {
      clearTimeout(t1);
      setAuditPhase("idle");
      setActiveAgent(null);
    } finally {
      setIsConvening(false);
    }
  };

  const roles = [
    { role: "data_analyst", code: "DIV-01" },
    { role: "risk_manager", code: "DIV-02" },
    { role: "committee_chair", code: "DIV-03" },
  ] as const;

  const statusKey = (
    auditResponse?.verdict.verdict_status ?? "CONDITIONAL"
  ).toLowerCase() as "cleared" | "conditional" | "rejected";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-3.5 sm:p-6">
      {/* Top Hearing Command Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
            {t("office.hud_label")}
          </span>
          <h2 className="mt-0.5 font-editorial text-xl font-medium text-text-primary sm:text-2xl">
            {t("agents.chamber_title")}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-sm border border-hairline bg-obsidian p-1">
            {(["trading", "business", "cashflow"] as const).map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => void handleConveneHearing(tr)}
                disabled={isConvening}
                className={cn(
                  "min-h-[32px] rounded-xs px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  activeTrack === tr
                    ? "bg-surface text-cleared"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {tr === "trading"
                  ? "Trading"
                  : tr === "business"
                    ? "UMKM"
                    : "Cashflow"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleConveneHearing()}
            disabled={isConvening}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-sm border border-cleared/45 bg-cleared/12 px-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/20 disabled:opacity-60"
          >
            {isConvening ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-3 w-3 fill-current" aria-hidden="true" />
            )}
            <span>
              {isId ? "Panggil Sidang Live" : "Convene Live Hearing"}
            </span>
          </button>

          <Link
            href={`/terminal/audit?track=${activeTrack}`}
            className="cta-primary-polish inline-flex min-h-[38px] shrink-0 items-center gap-2 rounded-sm bg-cleared px-4 font-mono text-xs font-semibold whitespace-nowrap uppercase tracking-wider text-on-cleared"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("terminal.nav_audit")}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Full-Frame Interactive 3D War-Room Studio */}
      <div className="terminal-panel overflow-hidden rounded-md">
        <VirtualWarRoomOffice
          macroContext={macroContext}
          macroOrigin={macroOrigin}
        />
      </div>

      {/* Live 3-Division Committee Transcript / Mandate Console */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {roles.map(({ role, code }) => {
          const liveText =
            auditResponse?.verdict.agent_deliberation[role] ??
            agentSnippets[role] ??
            t(`protocol.divisions.${role}.mandate`);
          return (
            <div
              key={role}
              className="terminal-panel flex flex-col gap-3 rounded-md p-4"
            >
              <div className="flex items-center gap-3 border-b border-hairline pb-3">
                <AgentAvatar
                  role={role}
                  phase={auditPhase}
                  isActive
                  size={36}
                />
                <div>
                  <span className="block font-mono text-[10px] tracking-widest text-text-muted">
                    {code}
                  </span>
                  <h3 className="font-sans text-xs font-semibold text-text-primary">
                    {t(`agents.roles.${role}.name`)}
                  </h3>
                </div>
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {liveText}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Chamber Dossier Summary when a Hearing Verdict is Present */}
      {auditResponse && (
        <div className="terminal-panel flex flex-col gap-4 rounded-md p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                REF · {auditResponse.verdict.audit_id}
              </span>
              <h3 className="mt-0.5 font-editorial text-lg font-medium text-text-primary sm:text-xl">
                {auditResponse.verdict.headline_verdict}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold tabular-nums text-cleared">
                {auditResponse.verdict.score}/100
              </span>
              <StatusStamp
                variant={auditResponse.verdict.verdict_status}
                label={t(`verdict.status.${statusKey}`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {auditResponse.verdict.premortem_blind_spots.map((spot, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1.5 rounded-sm border border-hairline bg-obsidian p-3.5"
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-conditional">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  <span>BLIND SPOT 0{idx + 1}</span>
                </span>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {spot}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-cleared/35 bg-cleared/8 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
                aria-hidden="true"
              />
              <p className="font-sans text-xs leading-relaxed text-text-primary">
                {auditResponse.verdict.actionable_fix}
              </p>
            </div>
            <Link
              href={`/terminal/audit?track=${activeTrack}`}
              className="font-mono text-[10.5px] font-semibold whitespace-nowrap uppercase tracking-wider text-cleared hover:underline"
            >
              {isId ? "Kalibrasi di Workstation →" : "Calibrate in Workstation →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
