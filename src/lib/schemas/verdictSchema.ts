import { z } from "zod";

export const AuditTrackSchema = z.enum(["trading", "business", "cashflow"]);
export type AuditTrack = z.infer<typeof AuditTrackSchema>;

export const VerdictStatusSchema = z.enum([
  "CLEARED",
  "CONDITIONAL",
  "REJECTED",
]);
export type VerdictStatus = z.infer<typeof VerdictStatusSchema>;

export const AgentDeliberationSchema = z.object({
  data_analyst: z.string().min(1).max(280),
  risk_manager: z.string().min(1).max(280),
  committee_chair: z.string().min(1).max(280),
});

export const XrayTraceSchema = z.object({
  macro_factors_used: z.array(z.string().min(1)),
  deterministic_flags: z.array(z.string().min(1)),
  reasoning_summary: z.string().min(1),
});

export const VerdictPayloadSchema = z.object({
  audit_id: z
    .string()
    .min(1)
    .regex(/^TL-[0-9]{4}-[A-Z0-9]{4,}$/, "Expected format TL-YYYY-XXXX"),
  verdict_status: VerdictStatusSchema,
  score: z.number().int().min(0).max(100),
  headline_verdict: z.string().min(1).max(140),
  agent_deliberation: AgentDeliberationSchema,
  premortem_blind_spots: z.array(z.string().min(1).max(160)).length(3),
  actionable_fix: z.string().min(1).max(220),
  xray_trace: XrayTraceSchema,
});

export type VerdictPayload = z.infer<typeof VerdictPayloadSchema>;
