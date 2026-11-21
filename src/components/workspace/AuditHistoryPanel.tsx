"use client";

import { ArrowDownRight, ArrowUpRight, History, Trash2 } from "lucide-react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditHistoryEntry } from "@/lib/auditHistory";
import { cn } from "@/lib/utils";

export interface AuditHistoryPanelProps {
  entries: AuditHistoryEntry[];
  onClear: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-cleared";
  if (score >= 50) return "text-conditional";
  return "text-rejected";
}

function formatShortTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Local Session Audit Ledger showing past Pre-Mortem runs and Before-vs-After
 * score deltas on the same track. Renders as a responsive card stack on Mobile
 * and an institutional tabular ledger on Tablet / Desktop.
 */
export function AuditHistoryPanel({
  entries,
  onClear,
}: AuditHistoryPanelProps) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  const enriched = entries.map((entry, idx) => {
    const prevSameTrack = entries
      .slice(idx + 1)
      .find((e) => e.track === entry.track);
    const delta = prevSameTrack ? entry.score - prevSameTrack.score : null;
    const statusKey = entry.verdict_status.toLowerCase() as
      | "cleared"
      | "conditional"
      | "rejected";
    return { entry, delta, statusKey };
  });

  return (
    <EditorialPanel title={t("history.title")} indexCode={`${entries.length}`}>
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-sans text-xs text-text-secondary">
            <History className="h-3.5 w-3.5 shrink-0 text-cleared" aria-hidden="true" />
            <span>{t("history.subtitle")}</span>
          </p>

          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xs border border-hairline bg-obsidian px-2.5 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:border-rejected/50 hover:text-rejected"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            <span>{t("history.clear_btn")}</span>
          </button>
        </div>

        {/* Mobile Card Stack (< md) */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {enriched.map(({ entry, delta, statusKey }) => (
            <div
              key={entry.audit_id}
              className="flex flex-col gap-2.5 rounded-sm border border-hairline bg-obsidian p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="font-semibold text-text-primary">
                    {entry.audit_id}
                  </span>
                  <span className="rounded-xs border border-hairline bg-surface px-1.5 py-0.5 uppercase text-text-secondary">
                    {entry.track}
                  </span>
                  <span className="text-text-muted">
                    {formatShortTime(entry.timestamp)}
                  </span>
                </div>
                <StatusStamp
                  variant={entry.verdict_status}
                  label={t(`verdict.status.${statusKey}`)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-hairline/70 pt-2.5 font-mono text-[11px] tabular-nums">
                <div>
                  <span className="block text-[9px] uppercase text-text-muted">
                    {t("history.col_score")}
                  </span>
                  <span
                    className={cn("font-bold", getScoreColor(entry.score))}
                  >
                    {entry.score}/100
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-text-muted">
                    {t("history.col_delta")}
                  </span>
                  {delta === null ? (
                    <span className="text-text-muted">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 font-semibold",
                        delta > 0
                          ? "text-cleared"
                          : delta < 0
                            ? "text-rejected"
                            : "text-text-muted"
                      )}
                    >
                      {delta > 0 ? (
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      ) : delta < 0 ? (
                        <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                      ) : null}
                      <span>
                        {delta > 0 ? `+${delta}` : `${delta}`} pts
                      </span>
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-text-muted">
                    {t("history.col_ruin")}
                  </span>
                  <span className="font-semibold text-text-primary">
                    {entry.ruin_probability_pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet & Desktop Institutional Ledger Table (md+) */}
        <div className="hidden overflow-x-auto rounded-sm border border-hairline bg-obsidian md:block">
          <table className="w-full border-collapse text-left font-mono text-[11px] tabular-nums">
            <thead>
              <tr className="border-b border-hairline bg-surface/50 text-[10px] uppercase tracking-wider text-text-muted">
                <th className="px-3.5 py-2.5 font-medium">{t("history.col_ref")}</th>
                <th className="px-3.5 py-2.5 font-medium">{t("history.col_track")}</th>
                <th className="px-3.5 py-2.5 font-medium">{t("history.col_score")}</th>
                <th className="px-3.5 py-2.5 font-medium">{t("history.col_delta")}</th>
                <th className="px-3.5 py-2.5 font-medium">{t("history.col_ruin")}</th>
                <th className="px-3.5 py-2.5 text-right font-medium">{t("history.col_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/70">
              {enriched.map(({ entry, delta, statusKey }) => (
                <tr
                  key={entry.audit_id}
                  title={entry.headline_verdict}
                  className="transition-colors hover:bg-surface/60"
                >
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">
                        {entry.audit_id}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {formatShortTime(entry.timestamp)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="rounded-xs border border-hairline bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
                      {entry.track}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-3.5 py-3 font-bold",
                      getScoreColor(entry.score)
                    )}
                  >
                    {entry.score}
                    <span className="font-normal text-text-muted">/100</span>
                  </td>
                  <td className="px-3.5 py-3">
                    {delta === null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-xs border px-1.5 py-0.5 text-[10px] font-semibold",
                          delta > 0
                            ? "border-cleared/35 bg-cleared/10 text-cleared"
                            : delta < 0
                              ? "border-rejected/35 bg-rejected/10 text-rejected"
                              : "border-hairline bg-surface text-text-muted"
                        )}
                      >
                        {delta > 0 ? (
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        ) : delta < 0 ? (
                          <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                        ) : null}
                        <span>
                          {delta > 0 ? `+${delta}` : `${delta}`} pts
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 font-semibold text-text-secondary">
                    {entry.ruin_probability_pct.toFixed(1)}%
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <div className="inline-flex justify-end">
                      <StatusStamp
                        variant={entry.verdict_status}
                        label={t(`verdict.status.${statusKey}`)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EditorialPanel>
  );
}
