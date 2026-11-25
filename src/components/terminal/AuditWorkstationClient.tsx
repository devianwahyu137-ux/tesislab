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
  const { locale, t } = useTranslation();
  const { auditPhase, activeAgent, triggerDemo } = useAuditUI();
  const isId = locale === "id";

  const initialTrack = parseTrackParam(searchParams.get("track"));
  const initialSymbol = searchParams.get("symbol") ?? undefined;
  const autoRunDemo = searchParams.get("demo") === "1";

  const agents = [
    {
      id: "hermes",
      label: isId ? "Hermes Makro" : "Hermes Macro",
      active: auditPhase === "scanning",
    },
    {
      id: "data_analyst",
      label: isId ? "Div-01 Quant" : "Div-01 Quant",
      active: activeAgent === "data_analyst",
    },
    {
      id: "risk_manager",
      label: isId ? "Div-02 Risiko" : "Div-02 Risk",
      active: activeAgent === "risk_manager",
    },
    {
      id: "committee_chair",
      label: isId ? "Div-03 Ketua" : "Div-03 Chair",
      active: activeAgent === "committee_chair",
    },
  ] as const;

  return (
    <div className="flex h-full flex-col">
      {/* Luminous Institutional Committee Status Strip */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-hairline bg-obsidian/86 px-3.5 py-2.5 backdrop-blur-xl sm:px-6">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="mr-0.5 hidden font-sans text-xs font-semibold text-text-muted md:inline">
            {isId ? "Status Komite:" : "Committee:"}
          </span>
          {agents.map((ag) => (
            <span
              key={ag.id}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-sans text-xs font-medium transition-all",
                ag.active
                  ? "border-cleared/55 bg-cleared/14 font-semibold text-cleared shadow-[0_0_16px_-4px_rgba(16,185,129,0.45)]"
                  : "border-hairline bg-surface/85 text-text-secondary"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  ag.active
                    ? "animate-pulse bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                    : "bg-cleared/45"
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
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 font-sans text-xs font-semibold text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
          >
            <Play className="h-3 w-3 fill-current" aria-hidden="true" />
            <span>{t("terminal.instant_demo_btn")}</span>
          </button>

          <Link
            href="/terminal/war-room"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-cleared/45 bg-cleared/12 px-3 font-sans text-xs font-semibold text-cleared transition-colors hover:bg-cleared/20"
          >
            <Boxes className="h-3.5 w-3.5" aria-hidden="true" />
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
