"use client";

import { History, Trash2 } from "lucide-react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditHistoryEntry } from "@/lib/auditHistory";
import { cn } from "@/lib/utils";

export interface AuditHistoryPanelProps {
  entries: AuditHistoryEntry[];
  onClear: () => void;
}

/**
 * Local Session Audit Ledger showing past Pre-Mortem runs and Before-vs-After
 * score deltas on the same track so users can verify risk improvements.
 */
export function AuditHistoryPanel({
  entries,
  onClear,
}: AuditHistoryPanelProps) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <EditorialPanel title={t("history.title")} indexCode={`${entries.length}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-sans text-xs text-text-secondary">
            <History className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
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

        <div className="overflow-x-auto rounded-xs border border-hairline bg-obsidian">
          <table className="w-full border-collapse text-left font-mono text-[11px] tabular-nums">
            <thead>
              <tr className="border-b border-hairline text-[10px] uppercase tracking-wider text-text-muted">
                <th className="px-3 py-2 font-medium">{t("history.col_ref")}</th>
                <th className="px-3 py-2 font-medium">{t("history.col_track")}</th>
                <th className="px-3 py-2 font-medium">{t("history.col_score")}</th>
                <th className="px-3 py-2 font-medium">{t("history.col_delta")}</th>
                <th className="px-3 py-2 font-medium">{t("history.col_ruin")}</th>
                <th className="px-3 py-2 font-medium">{t("history.col_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/70">
              {entries.map((entry, idx) => {
                // Find the most recent older entry on the same track for Before-vs-After diff
                const prevSameTrack = entries
                  .slice(idx + 1)
                  .find((e) => e.track === entry.track);
                const delta = prevSameTrack
                  ? entry.score - prevSameTrack.score
                  : null;
                const statusKey = entry.verdict_status.toLowerCase() as
                  | "cleared"
                  | "conditional"
                  | "rejected";

                return (
                  <tr key={entry.audit_id} className="hover:bg-surface/60">
                    <td className="px-3 py-2.5 text-text-secondary">
                      {entry.audit_id}
                    </td>
                    <td className="px-3 py-2.5 uppercase text-text-primary">
                      {entry.track}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-text-primary">
                      {entry.score}/100
                    </td>
                    <td className="px-3 py-2.5">
                      {delta === null ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        <span
                          className={cn(
                            "font-semibold",
                            delta > 0
                              ? "text-cleared"
                              : delta < 0
                                ? "text-rejected"
                                : "text-text-muted"
                          )}
                        >
                          {delta > 0 ? `+${delta}` : `${delta}`} pts
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary">
                      {entry.ruin_probability_pct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusStamp
                        variant={entry.verdict_status}
                        label={t(`verdict.status.${statusKey}`)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </EditorialPanel>
  );
}
