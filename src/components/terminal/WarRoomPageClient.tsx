"use client";

import Link from "next/link";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { VirtualWarRoomOffice } from "@/components/office/VirtualWarRoomOffice";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";

export interface WarRoomPageClientProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

export function WarRoomPageClient({
  macroContext,
  macroOrigin,
}: WarRoomPageClientProps) {
  const { t } = useTranslation();
  const { auditResponse, agentSnippets } = useAuditUI();

  const roles = [
    { role: "data_analyst", code: "DIV-01" },
    { role: "risk_manager", code: "DIV-02" },
    { role: "committee_chair", code: "DIV-03" },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-3.5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
            {t("office.hud_label")}
          </span>
          <h2 className="font-editorial text-xl font-medium text-text-primary sm:text-2xl">
            {t("agents.chamber_title")}
          </h2>
        </div>

        <Link
          href="/terminal/audit"
          className="cta-primary-polish inline-flex min-h-[38px] items-center gap-2 rounded-sm bg-cleared px-4 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("terminal.nav_audit")}</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

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
                  phase={auditResponse ? "verdict" : "idle"}
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
    </div>
  );
}
