import type { AuditTrack, VerdictStatus } from "@/lib/schemas/verdictSchema";

export interface AuditHistoryEntry {
  audit_id: string;
  track: AuditTrack;
  timestamp: string;
  verdict_status: VerdictStatus;
  score: number;
  submitted_conviction: number;
  ruin_probability_pct: number;
  headline_verdict: string;
}

const STORAGE_KEY = "tesislab_audit_history_v1";
const MAX_ENTRIES = 10;

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

export function appendAuditHistory(
  entry: AuditHistoryEntry
): AuditHistoryEntry[] {
  const existing = loadAuditHistory().filter(
    (item) => item.audit_id !== entry.audit_id
  );
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function clearAuditHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
