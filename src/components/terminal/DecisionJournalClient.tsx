"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Check,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  clearAuditHistory,
  computeCalibrationMetrics,
  loadAuditHistory,
  recordAuditOutcome,
  SAMPLE_JOURNAL_ENTRIES,
  saveAuditHistory,
  type AuditHistoryEntry,
  type PostMortemOutcome,
} from "@/lib/auditHistory";
import { encodeSharedDossier } from "@/lib/dossierShare";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const BrierCalibration3DRing = dynamic(
  () => import("@/components/terminal/BrierCalibration3DRing"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[210px] w-full items-center justify-center sm:h-[240px]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          INITIALIZING 3D CALIBRATION BULLSEYE...
        </span>
      </div>
    ),
  }
);

export function DecisionJournalClient() {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const { queuePrefillInput } = useAuditUI();
  const isId = locale === "id";

  const [entries, setEntries] = useState<AuditHistoryEntry[]>([]);
  const [filterTrack, setFilterTrack] = useState<"all" | AuditTrack>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const tId = setTimeout(() => setEntries(loadAuditHistory()), 0);
    return () => clearTimeout(tId);
  }, []);

  const calibration = useMemo(
    () => computeCalibrationMetrics(entries),
    [entries]
  );

  const visibleEntries = useMemo(
    () =>
      filterTrack === "all"
        ? entries
        : entries.filter((e) => e.track === filterTrack),
    [entries, filterTrack]
  );

  const handleSeedSamples = () => {
    saveAuditHistory(SAMPLE_JOURNAL_ENTRIES);
    setEntries(SAMPLE_JOURNAL_ENTRIES);
    setExpandedId(SAMPLE_JOURNAL_ENTRIES[0]?.audit_id ?? null);
    toast.success(
      isId
        ? "3 studi kasus Jurnal Kalibrasi Brier dimuat."
        : "Loaded 3 sample Brier calibration journal entries."
    );
  };

  const handleMarkOutcome = (
    auditId: string,
    outcome: PostMortemOutcome | undefined
  ) => {
    const next = recordAuditOutcome(auditId, outcome);
    setEntries(next);
    toast.success(
      isId
        ? "Hasil Post-Mortem diperbarui — Skor Brier dihitung ulang."
        : "Post-mortem outcome logged — Brier Score updated."
    );
  };

  const handleShareEntry = async (entry: AuditHistoryEntry) => {
    const token = encodeSharedDossier({
      audit_id: entry.audit_id,
      track: entry.track,
      verdict_status: entry.verdict_status,
      score: entry.score,
      submitted_conviction: entry.submitted_conviction,
      ruin_probability_pct: entry.ruin_probability_pct,
      p5_ending_value: 0,
      macro_regime: "HERMES",
      headline_verdict: entry.headline_verdict,
      blind_spots: entry.blind_spots ?? [
        "Sensitivitas volatilitas makro harian.",
        "Batas risiko disiplin eksekusi.",
        "Cadangan likuiditas darurat.",
      ],
      actionable_fix:
        entry.actionable_fix ??
        "Terapkan disiplin batas risiko deterministik sebelum modal keluar.",
      timestamp: entry.timestamp.slice(0, 10),
    });
    const url = `${window.location.origin}/dossier?d=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        isId
          ? "Tautan Dossier publik disalin ke papan klip!"
          : "Shareable Dossier URL copied to clipboard!"
      );
    } catch {
      router.push(`/dossier?d=${token}`);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
            <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId
                ? "BUKU BESAR KEPUTUSAN · PELACAK SKOR KALIBRASI BRIER"
                : "DECISION LEDGER · PROBABILISTIC BRIER CALIBRATION"}
            </span>
          </span>
          <h2 className="mt-1 font-editorial text-2xl font-medium text-text-primary sm:text-3xl">
            {isId
              ? "Ukur Akurasi Keyakinan Anda dari Waktu ke Waktu."
              : "Quantify Your Forecasting Accuracy Over Time."}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSeedSamples}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-cleared/45 bg-cleared/12 px-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-cleared hover:bg-cleared/20"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId ? "Muat Contoh Kalibrasi" : "Load Sample Calibration"}
            </span>
          </button>

          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearAuditHistory();
                setEntries([]);
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-hairline bg-obsidian px-3 font-mono text-[10.5px] uppercase tracking-wider text-text-muted hover:text-rejected"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("history.clear_btn")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Calibration Metrics + 3D Target Ring */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="grid grid-cols-2 gap-3 lg:col-span-7">
          <div className="terminal-panel flex flex-col justify-between rounded-md p-4 font-mono tabular-nums">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              {isId
                ? "Skor Brier Anda (0.000 = Sempurna)"
                : "Your Brier Score (0.000 = Perfect)"}
            </span>
            <span
              className={cn(
                "mt-2 text-2xl font-bold sm:text-3xl",
                calibration.userBrierScore === null
                  ? "text-text-muted"
                  : calibration.userBrierScore <= 0.14
                    ? "text-cleared"
                    : calibration.userBrierScore <= 0.25
                      ? "text-conditional"
                      : "text-rejected"
              )}
            >
              {calibration.userBrierScore !== null
                ? calibration.userBrierScore.toFixed(3)
                : "—"}
            </span>
            <span className="mt-1 text-[10px] text-text-muted">
              {calibration.resolvedCount} / {calibration.totalAudits}{" "}
              {isId ? "keputusan dinilai" : "outcomes logged"}
            </span>
          </div>

          <div className="terminal-panel flex flex-col justify-between rounded-md p-4 font-mono tabular-nums">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              {isId ? "Skor Brier Mesin TesisLab" : "TesisLab Engine Brier"}
            </span>
            <span className="mt-2 text-2xl font-bold text-cleared sm:text-3xl">
              {calibration.engineBrierScore !== null
                ? calibration.engineBrierScore.toFixed(3)
                : "—"}
            </span>
            <span className="mt-1 text-[10px] text-text-muted">
              {isId ? "Benchmark deterministik" : "Deterministic benchmark"}
            </span>
          </div>

          <div className="terminal-panel flex flex-col justify-between rounded-md p-4 font-mono tabular-nums">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              {isId ? "Rata-Rata Bias Optimisme" : "Mean Optimism Bias"}
            </span>
            <span
              className={cn(
                "mt-2 text-2xl font-bold sm:text-3xl",
                calibration.meanOptimismGap > 15
                  ? "text-rejected"
                  : "text-cleared"
              )}
            >
              {calibration.meanOptimismGap >= 0 ? "+" : ""}
              {calibration.meanOptimismGap.toFixed(1)}%
            </span>
            <span className="mt-1 text-[10px] text-text-muted">
              Conviction − Math Score
            </span>
          </div>

          <div className="terminal-panel flex flex-col justify-between rounded-md p-4 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              {isId ? "Status Kalibrasi" : "Calibration Grade"}
            </span>
            <span
              className={cn(
                "mt-2 text-xl font-bold uppercase sm:text-2xl",
                calibration.calibrationGrade === "EXCELLENT"
                  ? "text-cleared"
                  : calibration.calibrationGrade === "OVERCONFIDENT"
                    ? "text-rejected"
                    : "text-conditional"
              )}
            >
              {calibration.calibrationGrade}
            </span>
            <span className="mt-1 text-[10px] text-text-muted">
              Brier = 1/N · Σ(f − o)²
            </span>
          </div>
        </div>

        {/* 3D Calibration Bullseye Ring */}
        <div className="terminal-panel bg-blueprint-grid flex flex-col justify-between overflow-hidden rounded-md lg:col-span-5">
          <div className="flex items-center justify-between border-b border-hairline bg-obsidian/90 px-4 py-2 font-mono text-[10px]">
            <span className="font-semibold uppercase tracking-wider text-text-primary">
              3D BRIER ACCURACY BULLSEYE
            </span>
            <span className="text-cleared">CENTER = 0.00</span>
          </div>
          <BrierCalibration3DRing
            entries={entries}
            userBrier={calibration.userBrierScore}
          />
          <div className="border-t border-hairline bg-obsidian/90 px-4 py-1.5 font-mono text-[9.5px] text-text-muted">
            {isId
              ? "Makin dekat ke cincin hijau tengah, makin akurat kalibrasi prediksi Anda"
              : "Closer to the inner emerald ring indicates sharper probabilistic calibration"}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-sm border border-hairline bg-obsidian p-1">
          {(["all", "trading", "business", "cashflow"] as const).map((tr) => (
            <button
              key={tr}
              type="button"
              onClick={() => setFilterTrack(tr)}
              className={cn(
                "min-h-[32px] rounded-xs px-3 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                filterTrack === tr
                  ? "bg-surface text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {tr === "all" ? (isId ? "Semua" : "All") : tr}
            </button>
          ))}
        </div>

        <span className="font-sans text-xs text-text-muted">
          {isId
            ? "Tandai hasil nyata (Berhasil / Gagal) pada tiap baris untuk menghitung Brier Score."
            : "Log real outcomes (Success / Failed) on each entry to compute your Brier Score."}
        </span>
      </div>

      {/* Interactive Ledger List */}
      {visibleEntries.length === 0 ? (
        <div className="terminal-panel flex flex-col items-center justify-center gap-3 rounded-md p-10 text-center">
          <p className="font-sans text-sm text-text-secondary">
            {isId
              ? "Belum ada riwayat keputusan tersimpan. Jalankan audit atau muat contoh kalibrasi di atas."
              : "No recorded decisions yet. Run an audit or click Load Sample Calibration above."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleEntries.map((entry) => {
            const statusKey = entry.verdict_status.toLowerCase() as
              | "cleared"
              | "conditional"
              | "rejected";
            const isExpanded = expandedId === entry.audit_id;

            return (
              <div
                key={entry.audit_id}
                className="terminal-panel overflow-hidden rounded-md"
              >
                <div className="flex flex-col justify-between gap-3 p-4 lg:flex-row lg:items-center">
                  <div
                    onClick={() =>
                      setExpandedId(isExpanded ? null : entry.audit_id)
                    }
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                      <span className="font-bold text-text-primary">
                        {entry.audit_id}
                      </span>
                      <span className="rounded-xs border border-hairline bg-obsidian px-2 py-0.5 uppercase text-text-secondary">
                        {entry.track}
                      </span>
                      <span className="text-text-muted">
                        Conviction {entry.submitted_conviction}% vs Math{" "}
                        {entry.score}/100
                      </span>
                      <StatusStamp
                        variant={entry.verdict_status}
                        label={t(`verdict.status.${statusKey}`)}
                      />
                    </div>
                    <p className="mt-1.5 font-sans text-sm font-medium text-text-primary">
                      {entry.headline_verdict}
                    </p>
                  </div>

                  {/* Post-Mortem Outcome Buttons + Share */}
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleMarkOutcome(
                          entry.audit_id,
                          entry.actual_outcome === "SUCCESS"
                            ? undefined
                            : "SUCCESS"
                        )
                      }
                      className={cn(
                        "inline-flex min-h-[32px] items-center gap-1 rounded-xs border px-2.5 font-mono text-[10px] font-semibold uppercase",
                        entry.actual_outcome === "SUCCESS"
                          ? "border-cleared bg-cleared/15 text-cleared"
                          : "border-hairline bg-obsidian text-text-muted hover:text-cleared"
                      )}
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                      <span>{isId ? "Berhasil" : "Success"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleMarkOutcome(
                          entry.audit_id,
                          entry.actual_outcome === "FAILED"
                            ? undefined
                            : "FAILED"
                        )
                      }
                      className={cn(
                        "inline-flex min-h-[32px] items-center gap-1 rounded-xs border px-2.5 font-mono text-[10px] font-semibold uppercase",
                        entry.actual_outcome === "FAILED"
                          ? "border-rejected bg-rejected/15 text-rejected"
                          : "border-hairline bg-obsidian text-text-muted hover:text-rejected"
                      )}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                      <span>{isId ? "Gagal" : "Failed"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleShareEntry(entry)}
                      title="Share Dossier Link"
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-xs border border-hairline bg-obsidian px-2.5 font-mono text-[10px] uppercase text-text-secondary hover:border-cleared/50 hover:text-cleared"
                    >
                      <Share2 className="h-3 w-3" aria-hidden="true" />
                      <span>Share</span>
                    </button>

                    {entry.input_snapshot && (
                      <button
                        type="button"
                        onClick={() => {
                          queuePrefillInput(entry.track, entry.input_snapshot!);
                          router.push(`/terminal/audit?track=${entry.track}`);
                        }}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-xs border border-hairline bg-obsidian px-2.5 font-mono text-[10px] uppercase text-text-secondary hover:text-text-primary"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && entry.blind_spots && (
                  <div className="border-t border-hairline bg-obsidian/70 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {entry.blind_spots.map((spot, idx) => (
                        <div
                          key={idx}
                          className="rounded-xs border border-hairline bg-surface p-3 font-sans text-xs text-text-secondary"
                        >
                          <span className="mb-1 block font-mono text-[10px] font-semibold text-conditional">
                            BLIND SPOT 0{idx + 1}
                          </span>
                          {spot}
                        </div>
                      ))}
                    </div>
                    {entry.actionable_fix && (
                      <p className="mt-3 font-mono text-xs text-cleared">
                        ✓ {entry.actionable_fix}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
