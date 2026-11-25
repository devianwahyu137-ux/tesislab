"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  History,
  Trash2,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditHistoryEntry } from "@/lib/auditHistory";
import { cn } from "@/lib/utils";

export interface AuditHistoryPanelProps {
  entries: AuditHistoryEntry[];
  onClear: () => void;
  showEmptyState?: boolean;
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
 * score deltas on the same track. Upgraded with crisp `13px` readable typography,
 * luminous surface separation, and an optional guided empty state.
 */
export function AuditHistoryPanel({
  entries,
  onClear,
  showEmptyState = false,
}: AuditHistoryPanelProps) {
  const { locale, t } = useTranslation();
  const isId = locale === "id";

  if (entries.length === 0) {
    if (!showEmptyState) return null;
    return (
      <SpotlightCard tone="neutral" className="p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cleared/35 bg-cleared/12 text-cleared">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-sans text-sm font-semibold text-text-primary sm:text-[15px]">
                {isId
                  ? "Buku Besar Riwayat Audit Anda Masih Kosong"
                  : "Your Session Audit Ledger Is Ready"}
              </h3>
              <p className="mt-1 max-w-2xl font-sans text-[13px] leading-relaxed text-text-secondary">
                {isId
                  ? "Setiap kali Anda menjalankan sidang Pre-Mortem, skor awal, revisi perbaikan (Before vs. After), dan probabilitas kebangkrutan otomatis terekam di sini."
                  : "Every Pre-Mortem committee verdict, score improvement delta (Before vs. After), and ruin probability is logged here automatically."}
              </p>
            </div>
          </div>

          <Link
            href="/terminal/audit?demo=1"
            className="cta-primary-polish inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-md bg-cleared px-4 font-sans text-xs font-semibold whitespace-nowrap text-on-cleared"
          >
            <span>{isId ? "Coba Audit Pertama" : "Run First Demo Audit"}</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </SpotlightCard>
    );
  }

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
    <SpotlightCard tone="sky" className="p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <History
                className="h-4 w-4 shrink-0 text-cleared"
                aria-hidden="true"
              />
              <h3 className="font-sans text-sm font-bold tracking-tight text-text-primary sm:text-[15px]">
                {t("history.title")}
              </h3>
              <span className="rounded-full border border-cleared/40 bg-cleared/12 px-2 py-0.5 font-mono text-[11px] font-bold text-cleared">
                {entries.length}
              </span>
            </div>
            <p className="mt-1 font-sans text-[12.5px] text-text-secondary">
              {t("history.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/terminal/journal"
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-cleared/40 bg-cleared/10 px-3 font-sans text-xs font-semibold text-cleared transition-colors hover:bg-cleared/18"
            >
              <span>{isId ? "Buka Jurnal Brier" : "Open Brier Journal"}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-hairline bg-obsidian px-3 font-sans text-xs font-medium text-text-muted transition-colors hover:border-rejected/50 hover:text-rejected"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("history.clear_btn")}</span>
            </button>
          </div>
        </div>

        {/* Mobile Card Stack (< md) */}
        <div className="flex flex-col gap-3 md:hidden">
          {enriched.map(({ entry, delta, statusKey }) => (
            <div
              key={entry.audit_id}
              className="flex flex-col gap-2.5 rounded-lg border border-hairline bg-obsidian/90 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-text-primary">
                    {entry.audit_id}
                  </span>
                  <span className="rounded-xs border border-hairline bg-surface px-2 py-0.5 text-[10.5px] uppercase text-text-secondary">
                    {entry.track}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {formatShortTime(entry.timestamp)}
                  </span>
                </div>
                <StatusStamp
                  variant={entry.verdict_status}
                  label={t(`verdict.status.${statusKey}`)}
                />
              </div>

              <p className="line-clamp-2 font-sans text-xs leading-relaxed text-text-secondary">
                {entry.headline_verdict}
              </p>

              <div className="grid grid-cols-3 gap-2 border-t border-hairline/80 pt-2.5 font-mono text-xs tabular-nums">
                <div>
                  <span className="block font-sans text-[10.5px] text-text-muted">
                    {t("history.col_score")}
                  </span>
                  <span className={cn("font-bold", getScoreColor(entry.score))}>
                    {entry.score}/100
                  </span>
                </div>
                <div>
                  <span className="block font-sans text-[10.5px] text-text-muted">
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
                      <span>{delta > 0 ? `+${delta}` : `${delta}`} pts</span>
                    </span>
                  )}
                </div>
                <div>
                  <span className="block font-sans text-[10.5px] text-text-muted">
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
        <div className="hidden overflow-x-auto rounded-lg border border-hairline bg-obsidian/85 md:block">
          <table className="w-full border-collapse text-left tabular-nums">
            <thead>
              <tr className="border-b border-hairline bg-surface/80 font-sans text-xs font-semibold text-text-secondary">
                <th className="px-4 py-3">{t("history.col_ref")}</th>
                <th className="px-4 py-3">{t("history.col_track")}</th>
                <th className="px-4 py-3">
                  {isId ? "Ringkasan Putusan" : "Headline Verdict"}
                </th>
                <th className="px-4 py-3">{t("history.col_score")}</th>
                <th className="px-4 py-3">{t("history.col_delta")}</th>
                <th className="px-4 py-3">{t("history.col_ruin")}</th>
                <th className="px-4 py-3 text-right">
                  {t("history.col_status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/75 font-mono text-[12.5px]">
              {enriched.map(({ entry, delta, statusKey }) => (
                <tr
                  key={entry.audit_id}
                  className="transition-colors hover:bg-surface/75"
                >
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary">
                        {entry.audit_id}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {formatShortTime(entry.timestamp)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="rounded-sm border border-hairline bg-surface px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-text-primary">
                      {entry.track}
                    </span>
                  </td>
                  <td className="max-w-[320px] truncate px-4 py-3.5 font-sans text-[13px] text-text-secondary">
                    {entry.headline_verdict}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3.5 font-bold whitespace-nowrap",
                      getScoreColor(entry.score)
                    )}
                  >
                    {entry.score}
                    <span className="font-normal text-text-muted">/100</span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
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
                          <ArrowUpRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        ) : delta < 0 ? (
                          <ArrowDownRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span>{delta > 0 ? `+${delta}` : `${delta}`} pts</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-semibold whitespace-nowrap text-text-primary">
                    {entry.ruin_probability_pct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <StatusStamp
                      variant={entry.verdict_status}
                      label={t(`verdict.status.${statusKey}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SpotlightCard>
  );
}
