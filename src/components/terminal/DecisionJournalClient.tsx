"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Download,
  Info,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
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
        <span className="font-mono text-xs tracking-wider text-text-muted">
          Memuat Target Kalibrasi 3D...
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
  const [showGuide, setShowGuide] = useState(false);

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

  const psychologyInsight = useMemo(() => {
    if (entries.length === 0) {
      return isId
        ? "Mulai jalankan audit atau klik 'Muat Contoh Kalibrasi' di kanan atas untuk melihat pola bias psikologis keputusan Anda."
        : "Run an audit or load sample calibration entries above to analyze your personal forecasting bias.";
    }
    if (calibration.meanOptimismGap > 18) {
      return isId
        ? `Pola Terdeteksi: Bias Terlalu Percaya Diri (+${calibration.meanOptimismGap.toFixed(1)}%). Rata-rata keyakinan awal Anda jauh di atas skor ketahanan matematika. Biasakan menurunkan ukuran posisi sebelum eksekusi.`
        : `Detected Pattern: Overconfidence Bias (+${calibration.meanOptimismGap.toFixed(1)}%). Your initial conviction consistently exceeds mathematical resilience. Trim sizing before execution.`;
    }
    if (calibration.meanOptimismGap < -12) {
      return isId
        ? `Pola Terdeteksi: Sangat Hati-Hati (${calibration.meanOptimismGap.toFixed(1)}%). Anda cenderung lebih konservatif dibanding angka objektif mesin.`
        : `Detected Pattern: Conservative Caution (${calibration.meanOptimismGap.toFixed(1)}%). Your subjective confidence is lower than objective math resilience.`;
    }
    return isId
      ? "Pola Terdeteksi: Kalibrasi Sehat & Objektif. Keyakinan intuisi Anda selaras dengan struktur matematika rencana."
      : "Detected Pattern: Well-Calibrated Judgment. Your subjective conviction aligns closely with mathematical reality.";
  }, [entries.length, calibration.meanOptimismGap, isId]);

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

  const handleExportJson = () => {
    const payload = JSON.stringify(
      { exported_at: new Date().toISOString(), calibration, entries },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tesislab-decision-journal.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      isId
        ? "Arsip Jurnal Keputusan (.JSON) berhasil diunduh."
        : "Downloaded Decision Journal (.JSON)."
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
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cleared/40 bg-cleared/12 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared">
            <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId
                ? "BUKU BESAR KEPUTUSAN · SKOR KALIBRASI BRIER"
                : "DECISION LEDGER · PROBABILISTIC BRIER CALIBRATION"}
            </span>
          </span>
          <h2 className="mt-2.5 font-editorial text-2xl font-medium text-text-primary sm:text-4xl">
            {isId
              ? "Ukur Ketajaman Intuisi & Akurasi Keputusan Anda."
              : "Quantify Your Forecasting Accuracy Over Time."}
          </h2>
          <p className="mt-1.5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-text-secondary sm:text-[15px]">
            {isId
              ? "Tandai apakah keputusan masa lalu berakhir Berhasil atau Gagal. Mesin menghitung Brier Score untuk membongkar apakah Anda sering terlalu percaya diri."
              : "Log real outcomes on past decisions to compute your exact Brier calibration score and track cognitive biases."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:shrink-0">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className={cn(
              "inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border px-3 font-sans text-xs font-semibold whitespace-nowrap transition-colors",
              showGuide
                ? "border-cleared/60 bg-cleared/16 text-cleared"
                : "border-hairline bg-surface text-text-secondary hover:border-active-border hover:text-text-primary"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? "Cara Pakai" : "Guide"}</span>
          </button>

          <button
            type="button"
            onClick={handleSeedSamples}
            className="cta-primary-polish inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg bg-cleared px-3.5 font-sans text-xs font-bold whitespace-nowrap text-on-cleared"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId ? "Muat Contoh Kalibrasi" : "Load Sample Calibration"}
            </span>
          </button>

          {entries.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 font-sans text-xs font-semibold whitespace-nowrap text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isId ? "Unduh .JSON" : "Export .JSON"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clearAuditHistory();
                  setEntries([]);
                }}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-obsidian px-3 font-sans text-xs font-semibold whitespace-nowrap text-text-muted transition-colors hover:border-rejected/50 hover:text-rejected"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("history.clear_btn")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Beginner Guide */}
      {showGuide && (
        <SpotlightCard tone="sky" className="gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-sky-400">
              <Info className="h-4 w-4" aria-hidden="true" />
              <span>
                {isId
                  ? "Cara Mengukur Ketajaman Prediksi (Brier Score) untuk Pemula"
                  : "Beginner Guide to Brier Calibration Scoring"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="font-mono text-xs text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-hairline bg-obsidian/85 p-3">
              <span className="font-mono text-[11px] font-bold text-cleared">
                01 · TANDAI BERHASIL / GAGAL
              </span>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {isId
                  ? "Setelah keputusan lama dieksekusi di dunia nyata, klik tombol 'Berhasil' atau 'Gagal' pada baris keputusan di bawah."
                  : "After real-world execution, log 'Success' or 'Failed' on each decision row below."}
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-obsidian/85 p-3">
              <span className="font-mono text-[11px] font-bold text-sky-400">
                02 · BACA SKOR BRIER (0.00 = SEMPURNA)
              </span>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {isId
                  ? "Skor Brier ≤ 0.14 artinya tebakan Anda sangat tajam. Skor > 0.25 berarti Anda sering terlalu yakin pada rencana berisiko."
                  : "Brier <= 0.14 means sharp calibration. > 0.25 indicates frequent overconfidence."}
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-obsidian/85 p-3">
              <span className="font-mono text-[11px] font-bold text-conditional">
                03 · KLIK BOLA DI TARGET 3D
              </span>
              <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">
                {isId
                  ? "Arahkan atau klik bola bercahaya di Target Brier 3D untuk langsung membuka catatan 3 titik buta keputusan tersebut."
                  : "Hover or click any glowing sphere on the 3D Bullseye to jump directly to its blind spots."}
              </p>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* Psychological Bias Diagnosis Banner */}
      <SpotlightCard
        tone={calibration.meanOptimismGap > 18 ? "amber" : "emerald"}
        className="p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cleared/40 bg-cleared/12 text-cleared">
            <Brain className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <span className="block font-sans text-xs font-bold uppercase tracking-wider text-cleared">
              {isId
                ? "Diagnosis Pola Psikologis Pengguna"
                : "Personal Cognitive Bias Diagnosis"}
            </span>
            <p className="mt-1 font-sans text-[13.5px] leading-relaxed text-text-primary">
              {psychologyInsight}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Top Calibration Metrics + 3D Target Ring */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:col-span-7">
          <SpotlightCard tone="emerald" className="justify-between p-5">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-text-secondary">
              <span>
                {isId
                  ? "Skor Brier Anda (0.000 = Akurat Sempurna)"
                  : "Your Brier Score (0.000 = Perfect)"}
              </span>
              <InfoTooltip
                content={
                  isId
                    ? "Mengukur seberapa akurat tingkat keyakinan awal Anda dibanding hasil nyata (Berhasil/Gagal). Makin mendekati 0.000 makin akurat."
                    : "Measures how close your initial confidence was to actual outcomes. Lower (closer to 0.000) is sharper."
                }
              />
            </span>
            <span
              className={cn(
                "mt-2 block font-mono text-3xl font-bold tabular-nums",
                calibration.userBrierScore === null
                  ? "text-text-muted"
                  : calibration.userBrierScore <= 0.14
                    ? "text-cleared text-glow-emerald"
                    : calibration.userBrierScore <= 0.25
                      ? "text-conditional"
                      : "text-rejected"
              )}
            >
              {calibration.userBrierScore !== null
                ? calibration.userBrierScore.toFixed(3)
                : "—"}
            </span>
            <span className="mt-1 block font-sans text-xs text-text-muted">
              {calibration.resolvedCount} / {calibration.totalAudits}{" "}
              {isId ? "keputusan dinilai" : "outcomes logged"}
            </span>
          </SpotlightCard>

          <SpotlightCard tone="sky" className="justify-between p-5">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-text-secondary">
              <span>
                {isId ? "Skor Brier Mesin TesisLab" : "TesisLab Engine Brier"}
              </span>
              <InfoTooltip
                content={
                  isId
                    ? "Skor Brier milik kalkulator matematis TesisLab sebagai pembanding objektif terhadap intuisi manusia."
                    : "Brier score of TesisLab's deterministic engine as an objective benchmark."
                }
              />
            </span>
            <span className="mt-2 block font-mono text-3xl font-bold tabular-nums text-cleared">
              {calibration.engineBrierScore !== null
                ? calibration.engineBrierScore.toFixed(3)
                : "—"}
            </span>
            <span className="mt-1 block font-sans text-xs text-text-muted">
              {isId ? "Pembanding objektif Decimal.js" : "Deterministic benchmark"}
            </span>
          </SpotlightCard>

          <SpotlightCard tone="amber" className="justify-between p-5">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-text-secondary">
              <span>
                {isId ? "Rata-Rata Selisih Optimisme" : "Mean Optimism Gap"}
              </span>
              <InfoTooltip
                content={
                  isId
                    ? "Selisih rata-rata antara rasa percaya diri Anda (0–100%) dengan skor ketahanan matematis. Nilai positif tinggi menandakan terlalu pede."
                    : "Average gap between your initial conviction and objective math score."
                }
              />
            </span>
            <span
              className={cn(
                "mt-2 block font-mono text-3xl font-bold tabular-nums",
                calibration.meanOptimismGap > 15
                  ? "text-rejected"
                  : "text-cleared"
              )}
            >
              {calibration.meanOptimismGap >= 0 ? "+" : ""}
              {calibration.meanOptimismGap.toFixed(1)}%
            </span>
            <span className="mt-1 block font-sans text-xs text-text-muted">
              {isId ? "Keyakinan Anda − Skor Mesin" : "Conviction − Math Score"}
            </span>
          </SpotlightCard>

          <SpotlightCard tone="neutral" className="justify-between p-5">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-text-secondary">
              <span>{isId ? "Predikat Kalibrasi" : "Calibration Grade"}</span>
              <InfoTooltip
                content={
                  isId
                    ? "Predikat keseluruhan kualitas intuisi Anda: EXCELLENT (tajam), CALIBRATED (seimbang), atau OVERCONFIDENT (terlalu yakin)."
                    : "Overall forecasting grade: EXCELLENT, CALIBRATED, or OVERCONFIDENT."
                }
              />
            </span>
            <span
              className={cn(
                "mt-2 block truncate font-mono text-2xl font-bold uppercase sm:text-3xl",
                calibration.calibrationGrade === "EXCELLENT"
                  ? "text-cleared"
                  : calibration.calibrationGrade === "OVERCONFIDENT"
                    ? "text-rejected"
                    : "text-conditional"
              )}
            >
              {calibration.calibrationGrade}
            </span>
            <span className="mt-1 block font-mono text-xs text-text-muted">
              Brier = 1/N · Σ(f − o)²
            </span>
          </SpotlightCard>
        </div>

        {/* 3D Calibration Bullseye Ring */}
        <SpotlightCard
          tone="emerald"
          className="justify-between overflow-hidden xl:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-hairline bg-obsidian/90 px-4 py-3">
            <span className="inline-flex items-center gap-1.5 font-sans text-sm font-bold text-text-primary">
              <span>
                {isId
                  ? "Target Akurasi Brier 3D (Geser 360°)"
                  : "3D Brier Accuracy Bullseye (Drag 360°)"}
              </span>
              <InfoTooltip
                content={
                  isId
                    ? "Setiap bola melambangkan 1 keputusan. Makin dekat ke inti zamrud di tengah, makin akurat prediksi Anda. Klik bola untuk melihat detailnya!"
                    : "Each sphere is one decision. Closer to the emerald center = higher accuracy. Click any sphere to inspect!"
                }
              />
            </span>
            <span className="font-mono text-xs font-bold text-cleared">
              PUSAT = 0.00
            </span>
          </div>
          <div className="bg-blueprint-grid">
            <BrierCalibration3DRing
              entries={entries}
              userBrier={calibration.userBrierScore}
              onSelectEntry={(auditId) => {
                setFilterTrack("all");
                setExpandedId(auditId);
                toast.info(
                  isId
                    ? `Membuka detail titik buta ${auditId}`
                    : `Inspecting blind spots for ${auditId}`
                );
              }}
            />
          </div>
          <div className="border-t border-hairline bg-obsidian/90 px-4 py-2.5 font-sans text-xs text-text-secondary">
            {isId
              ? "Makin dekat bola ke cincin zamrud tengah, makin tajam akurasi prediksi Anda."
              : "Closer to the inner emerald ring indicates sharper probabilistic calibration."}
          </div>
        </SpotlightCard>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-obsidian p-1">
          {(["all", "trading", "business", "cashflow"] as const).map((tr) => (
            <button
              key={tr}
              type="button"
              onClick={() => setFilterTrack(tr)}
              className={cn(
                "min-h-[36px] rounded-md px-3.5 font-sans text-xs font-semibold capitalize transition-colors",
                filterTrack === tr
                  ? "bg-cleared/16 text-cleared"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tr === "all" ? (isId ? "Semua Jalur" : "All Tracks") : tr}
            </button>
          ))}
        </div>

        <span className="font-sans text-[13px] text-text-secondary">
          {isId
            ? "Klik judul baris untuk melihat 3 titik buta · Tandai Berhasil / Gagal di kanan."
            : "Click any row to inspect blind spots · Log Success / Failed on the right."}
        </span>
      </div>

      {/* Interactive Ledger List */}
      {visibleEntries.length === 0 ? (
        <SpotlightCard tone="neutral" className="items-center p-10 text-center">
          <p className="font-sans text-sm text-text-secondary">
            {isId
              ? "Belum ada riwayat keputusan tersimpan. Jalankan audit atau klik 'Muat Contoh Kalibrasi' di kanan atas."
              : "No recorded decisions yet. Run an audit or click 'Load Sample Calibration' above."}
          </p>
        </SpotlightCard>
      ) : (
        <div className="flex flex-col gap-3.5">
          {visibleEntries.map((entry) => {
            const statusKey = entry.verdict_status.toLowerCase() as
              | "cleared"
              | "conditional"
              | "rejected";
            const isExpanded = expandedId === entry.audit_id;

            return (
              <SpotlightCard
                key={entry.audit_id}
                tone={
                  entry.verdict_status === "CLEARED"
                    ? "emerald"
                    : entry.verdict_status === "CONDITIONAL"
                      ? "amber"
                      : "crimson"
                }
                className="overflow-hidden"
              >
                <div className="flex flex-col justify-between gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                  <div
                    onClick={() =>
                      setExpandedId(isExpanded ? null : entry.audit_id)
                    }
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-text-primary">
                        {entry.audit_id}
                      </span>
                      <span className="rounded-sm border border-hairline bg-obsidian px-2.5 py-0.5 text-[11px] font-semibold uppercase text-text-secondary">
                        {entry.track}
                      </span>
                      <span className="font-sans text-xs text-text-secondary">
                        {isId ? "Keyakinan" : "Conviction"}{" "}
                        <strong>{entry.submitted_conviction}%</strong> vs{" "}
                        {isId ? "Skor Mesin" : "Math"}{" "}
                        <strong>{entry.score}/100</strong>
                      </span>
                      <StatusStamp
                        variant={entry.verdict_status}
                        label={t(`verdict.status.${statusKey}`)}
                      />
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 font-sans text-[14.5px] font-semibold text-text-primary">
                      <span>{entry.headline_verdict}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-text-muted transition-transform",
                          isExpanded && "rotate-180 text-cleared"
                        )}
                        aria-hidden="true"
                      />
                    </p>
                  </div>

                  {/* Post-Mortem Outcome Buttons + Share + Replay */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                        "inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 font-sans text-xs font-bold transition-colors",
                        entry.actual_outcome === "SUCCESS"
                          ? "border-cleared bg-cleared/18 text-cleared"
                          : "border-hairline bg-obsidian text-text-secondary hover:text-cleared"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
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
                        "inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 font-sans text-xs font-bold transition-colors",
                        entry.actual_outcome === "FAILED"
                          ? "border-rejected bg-rejected/18 text-rejected"
                          : "border-hairline bg-obsidian text-text-secondary hover:text-rejected"
                      )}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isId ? "Gagal" : "Failed"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleShareEntry(entry)}
                      title="Share Public Dossier Link"
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-hairline bg-obsidian px-3 font-sans text-xs font-semibold text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
                    >
                      <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Share</span>
                    </button>

                    {entry.input_snapshot && (
                      <button
                        type="button"
                        onClick={() => {
                          queuePrefillInput(entry.track, entry.input_snapshot!);
                          router.push(`/terminal/audit?track=${entry.track}`);
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-cleared/40 bg-cleared/10 px-3 font-sans text-xs font-bold text-cleared hover:bg-cleared/18"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && entry.blind_spots && (
                  <div className="border-t border-hairline bg-obsidian/80 p-4 sm:p-5">
                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                      {entry.blind_spots.map((spot, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-hairline bg-surface p-3.5 font-sans text-[13px] leading-relaxed text-text-secondary"
                        >
                          <span className="mb-1 block font-mono text-xs font-bold text-conditional">
                            TITIK BUTA 0{idx + 1}
                          </span>
                          {spot}
                        </div>
                      ))}
                    </div>
                    {entry.actionable_fix && (
                      <p className="mt-3.5 font-sans text-[13px] font-semibold text-cleared">
                        ✓ {entry.actionable_fix}
                      </p>
                    )}
                  </div>
                )}
              </SpotlightCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
