"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Boxes, Play } from "lucide-react";
import { AuditWorkspace } from "@/components/workspace/AuditWorkspace";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

function parseTrackParam(raw: string | null): AuditTrack | undefined {
  if (raw === "trading" || raw === "business" || raw === "cashflow") {
    return raw;
  }
  return undefined;
}

export function AuditWorkstationClient() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { auditPhase, activeAgent, triggerDemo } = useAuditUI();

  const initialTrack = parseTrackParam(searchParams.get("track"));
  const initialSymbol = searchParams.get("symbol") ?? undefined;
  const autoRunDemo = searchParams.get("demo") === "1";

  const agents = [
    { id: "hermes", label: "HERMES", active: auditPhase === "scanning" },
    {
      id: "data_analyst",
      label: "QUANT",
      active: activeAgent === "data_analyst",
    },
    {
      id: "risk_manager",
      label: "RISK",
      active: activeAgent === "risk_manager",
    },
    {
      id: "committee_chair",
      label: "CHAIR",
      active: activeAgent === "committee_chair",
    },
  ] as const;

  return (
    <div className="flex h-full flex-col">
      {/* Compact 40px Institutional Committee Status Strip (Replaces heavy 3D block in workstation) */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-hairline bg-obsidian/80 px-3.5 py-2 sm:px-5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="mr-1 hidden font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-text-muted sm:inline">
            {t("terminal.status_strip_label")}:
          </span>
          {agents.map((ag) => (
            <span
              key={ag.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[9.5px] font-semibold tracking-wider",
                ag.active
                  ? "border-cleared/50 bg-cleared/12 text-cleared"
                  : "border-hairline bg-surface text-text-muted"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  ag.active ? "bg-cleared" : "bg-text-muted/50"
                )}
                aria-hidden="true"
              />
              <span>{ag.label}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerDemo}
            className="inline-flex h-7 items-center gap-1 rounded-xs border border-hairline bg-surface px-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary transition-colors hover:border-cleared/45 hover:text-cleared"
          >
            <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
            <span>{t("terminal.instant_demo_btn")}</span>
          </button>

          <Link
            href="/terminal/war-room"
            className="inline-flex h-7 items-center gap-1.5 rounded-xs border border-cleared/40 bg-cleared/10 px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/20"
          >
            <Boxes className="h-3 w-3" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t("terminal.open_3d_warroom")}
            </span>
            <span className="sm:hidden">3D</span>
          </Link>
        </div>
      </div>

      {/* Main Split-Pane Workstation */}
      <div className="min-h-0 flex-1">
        <AuditWorkspace
          variant="terminal"
          initialTrack={initialTrack}
          initialSymbol={initialSymbol}
          autoRunDemo={autoRunDemo}
        />
      </div>
    </div>
  );
}
