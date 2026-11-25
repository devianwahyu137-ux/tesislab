import type { AuditTrack, VerdictStatus } from "@/lib/schemas/verdictSchema";

export type PostMortemOutcome = "SUCCESS" | "FAILED";

export interface AuditHistoryEntry {
  audit_id: string;
  track: AuditTrack;
  timestamp: string;
  verdict_status: VerdictStatus;
  score: number;
  submitted_conviction: number;
  ruin_probability_pct: number;
  headline_verdict: string;
  blind_spots?: string[];
  actionable_fix?: string;
  input_snapshot?: Record<string, unknown>;
  actual_outcome?: PostMortemOutcome;
}

export interface CalibrationSummary {
  totalAudits: number;
  resolvedCount: number;
  userBrierScore: number | null; // 0.00 = perfect, 0.25 = coin-flip, >0.30 = poor calibration
  engineBrierScore: number | null;
  meanOptimismGap: number; // positive = user overconfident vs math score
  calibrationGrade: "EXCELLENT" | "MODERATE" | "OVERCONFIDENT" | "UNRATED";
}

const STORAGE_KEY = "tesislab_audit_history_v1";
const MAX_ENTRIES = 30;

export function loadAuditHistory(): AuditHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AuditHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveAuditHistory(entries: AuditHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function appendAuditHistory(
  entry: AuditHistoryEntry
): AuditHistoryEntry[] {
  const existing = loadAuditHistory().filter(
    (item) => item.audit_id !== entry.audit_id
  );
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  saveAuditHistory(next);
  return next;
}

export function recordAuditOutcome(
  auditId: string,
  outcome: PostMortemOutcome | undefined
): AuditHistoryEntry[] {
  const updated = loadAuditHistory().map((item) =>
    item.audit_id === auditId ? { ...item, actual_outcome: outcome } : item
  );
  saveAuditHistory(updated);
  return updated;
}

export function clearAuditHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Computes exact probabilistic Brier Scores for both the human user's stated conviction
 * and TesisLab's deterministic resilience score across resolved post-mortem entries:
 * Brier = (1 / N) * sum((f_i - o_i)^2), where o_i in {0, 1}.
 */
export function computeCalibrationMetrics(
  entries: AuditHistoryEntry[]
): CalibrationSummary {
  if (entries.length === 0) {
    return {
      totalAudits: 0,
      resolvedCount: 0,
      userBrierScore: null,
      engineBrierScore: null,
      meanOptimismGap: 0,
      calibrationGrade: "UNRATED",
    };
  }

  const gapSum = entries.reduce(
    (acc, e) => acc + (e.submitted_conviction - e.score),
    0
  );
  const meanOptimismGap = Number((gapSum / entries.length).toFixed(1));

  const resolved = entries.filter(
    (e) => e.actual_outcome === "SUCCESS" || e.actual_outcome === "FAILED"
  );

  if (resolved.length === 0) {
    return {
      totalAudits: entries.length,
      resolvedCount: 0,
      userBrierScore: null,
      engineBrierScore: null,
      meanOptimismGap,
      calibrationGrade:
        meanOptimismGap > 18 ? "OVERCONFIDENT" : "UNRATED",
    };
  }

  let userSqSum = 0;
  let engineSqSum = 0;
  for (const item of resolved) {
    const o = item.actual_outcome === "SUCCESS" ? 1 : 0;
    const fUser = Math.max(0, Math.min(1, item.submitted_conviction / 100));
    const fEngine = Math.max(0, Math.min(1, item.score / 100));
    userSqSum += (fUser - o) * (fUser - o);
    engineSqSum += (fEngine - o) * (fEngine - o);
  }

  const userBrierScore = Number((userSqSum / resolved.length).toFixed(3));
  const engineBrierScore = Number((engineSqSum / resolved.length).toFixed(3));

  const calibrationGrade =
    userBrierScore <= 0.14
      ? "EXCELLENT"
      : userBrierScore <= 0.25
        ? "MODERATE"
        : "OVERCONFIDENT";

  return {
    totalAudits: entries.length,
    resolvedCount: resolved.length,
    userBrierScore,
    engineBrierScore,
    meanOptimismGap,
    calibrationGrade,
  };
}

export const SAMPLE_JOURNAL_ENTRIES: AuditHistoryEntry[] = [
  {
    audit_id: "TL-2026-JN01",
    track: "trading",
    timestamp: "2026-11-20T09:15:00.000Z",
    verdict_status: "CLEARED",
    score: 88,
    submitted_conviction: 80,
    ruin_probability_pct: 1.2,
    headline_verdict:
      "Posisi LONG BBCA.JK layak dengan R:R 1:2.00 dan risiko modal terjaga di 1.25%.",
    blind_spots: [
      "Gap-down pembukaan pasar akibat sentimen suku bunga global.",
      "Konsentrasi sektor perbankan jika memegang BMRI bersamaan.",
      "Tertahan di resistensi psikologis sebelum mencapai TP penuh.",
    ],
    actionable_fix:
      "Pasang Stop Loss otomatis dan batasi eksposur sektor perbankan.",
    actual_outcome: "SUCCESS",
  },
  {
    audit_id: "TL-2026-JN02",
    track: "business",
    timestamp: "2026-11-14T14:30:00.000Z",
    verdict_status: "CONDITIONAL",
    score: 52,
    submitted_conviction: 85,
    ruin_probability_pct: 28.4,
    headline_verdict:
      "Booth ritel mal rentan kehabisan kas di bulan ke-3.4 akibat sewa tetap tinggi & komisi 20%.",
    blind_spots: [
      "Fase ramp-up 3 bulan pertama hanya mencapai 50% target porsi.",
      "Komisi aplikasi 20% memotong margin bersih di bawah 12%.",
      "Deposit sewa mengunci modal kerja likuid.",
    ],
    actionable_fix:
      "Negosiasikan sewa bagi hasil atau beralih ke cloud kitchen biaya tetap rendah.",
    actual_outcome: "FAILED",
  },
  {
    audit_id: "TL-2026-JN03",
    track: "cashflow",
    timestamp: "2026-11-05T19:10:00.000Z",
    verdict_status: "REJECTED",
    score: 28,
    submitted_conviction: 75,
    ruin_probability_pct: 46.5,
    headline_verdict:
      "Ditolak: cicilan bunga flat 1,75%/bln setara 37,6% APR dan mendorong DSR OJK ke 35%.",
    blind_spots: [
      "Bunga efektif tahunan hampir 2x lipat angka promosi bulanan.",
      "Sisa kas bebas terlalu tipis untuk pengeluaran medis darurat.",
      "Dana darurat di bawah ambang aman 3 bulan pengeluaran.",
    ],
    actionable_fix:
      "Tunda kredit konsumtif dan kumpulkan pembayaran tunai bertahap selama 5 bulan.",
    actual_outcome: "FAILED",
  },
];
