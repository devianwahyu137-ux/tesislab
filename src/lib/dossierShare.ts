import LZString from "lz-string";
import { z } from "zod";
import {
  AuditTrackSchema,
  VerdictStatusSchema,
  type AuditTrack,
  type VerdictStatus,
} from "@/lib/schemas/verdictSchema";

export const SharedDossierSchema = z.object({
  id: z.string().min(1).max(32),
  tr: AuditTrackSchema,
  st: VerdictStatusSchema,
  sc: z.number().min(0).max(100),
  cv: z.number().min(0).max(100),
  rn: z.number().min(0).max(100),
  p5: z.number(),
  rg: z.string().min(1).max(24),
  hl: z.string().min(1).max(220),
  bs: z.tuple([z.string(), z.string(), z.string()]),
  fx: z.string().min(1).max(280),
  ts: z.string().min(1).max(40),
});

export type SharedDossierPayload = z.infer<typeof SharedDossierSchema>;

export interface EncodeDossierInput {
  audit_id: string;
  track: AuditTrack;
  verdict_status: VerdictStatus;
  score: number;
  submitted_conviction: number;
  ruin_probability_pct: number;
  p5_ending_value: number;
  macro_regime: string;
  headline_verdict: string;
  blind_spots: readonly string[];
  actionable_fix: string;
  timestamp?: string;
}

/**
 * Compresses an official TesisLab Verdict Dossier into a URL-safe token via `lz-string`
 * so users can share read-only verifiable links on WhatsApp, Telegram, Slack, or X
 * without requiring a centralized user database.
 */
export function encodeSharedDossier(input: EncodeDossierInput): string {
  const compact: SharedDossierPayload = {
    id: input.audit_id,
    tr: input.track,
    st: input.verdict_status,
    sc: Math.round(input.score),
    cv: Math.round(input.submitted_conviction),
    rn: Number(input.ruin_probability_pct.toFixed(1)),
    p5: Math.round(input.p5_ending_value),
    rg: input.macro_regime,
    hl: input.headline_verdict.slice(0, 220),
    bs: [
      (input.blind_spots[0] ?? "—").slice(0, 180),
      (input.blind_spots[1] ?? "—").slice(0, 180),
      (input.blind_spots[2] ?? "—").slice(0, 180),
    ],
    fx: input.actionable_fix.slice(0, 260),
    ts: input.timestamp ?? new Date().toISOString().slice(0, 10),
  };

  return LZString.compressToEncodedURIComponent(JSON.stringify(compact));
}

export function decodeSharedDossier(
  token: string | null | undefined
): SharedDossierPayload | null {
  if (!token || token.length > 4096) return null;
  try {
    const raw = LZString.decompressFromEncodedURIComponent(token.trim());
    if (!raw) return null;
    const json: unknown = JSON.parse(raw);
    const parsed = SharedDossierSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
