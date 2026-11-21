import { randomBytes } from "node:crypto";
import {
  BusinessAuditInputSchema,
  CashflowAuditInputSchema,
  TradeAuditInputSchema,
  calculateBusinessAudit,
  calculateCashflowAudit,
  calculateTradeAudit,
  type BusinessAuditResult,
  type CashflowAuditResult,
  type TradeAuditResult,
} from "@/lib/calculators";
import type { Locale } from "@/lib/i18n/config";
import { getDailyMacroContext, type MacroFeedOrigin } from "@/lib/macroFeed";
import type { MacroRegime } from "@/lib/schemas/macroContextSchema";
import {
  VerdictPayloadSchema,
  type AuditTrack,
  type VerdictPayload,
} from "@/lib/schemas/verdictSchema";
import { buildCommitteeSystemPrompt } from "@/lib/agents/soulLoader";

export type AuditMetrics =
  | TradeAuditResult
  | BusinessAuditResult
  | CashflowAuditResult;

export interface AuditTelemetry {
  calc_ms: number;
  llm_ms: number;
  macro_origin: MacroFeedOrigin;
  macro_regime: MacroRegime;
  model_used: string;
}

export interface CommitteeAuditResponse {
  verdict: VerdictPayload;
  metrics: AuditMetrics;
  telemetry: AuditTelemetry;
}

export class AuditInputValidationError extends Error {
  public readonly issues: unknown;
  constructor(message: string, issues: unknown) {
    super(message);
    this.name = "AuditInputValidationError";
    this.issues = issues;
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("GOOGLE_API_KEY is not configured in the server environment.");
    this.name = "MissingApiKeyError";
  }
}

const GEMINI_MODEL = "gemini-2.5-flash";
const SEVERE_FLAGS = new Set([
  "NEGATIVE_UNIT_MARGIN",
  "DEFICIT_CASHFLOW",
  "OVEREXPOSED_RISK",
  "INVALID_SL_DIRECTION",
  "INVALID_TP_DIRECTION",
]);

function generateAuditId(): string {
  const year = new Date().getUTCFullYear();
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `TL-${year}-${suffix}`;
}

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function runDeterministicStep(
  track: AuditTrack,
  rawInput: unknown
): { validatedInput: unknown; metrics: AuditMetrics; calcMs: number } {
  const start = performance.now();

  if (track === "trading") {
    const parsed = TradeAuditInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AuditInputValidationError(
        "Invalid trading audit input.",
        parsed.error.flatten()
      );
    }
    const metrics = calculateTradeAudit(parsed.data);
    return {
      validatedInput: parsed.data,
      metrics,
      calcMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  if (track === "business") {
    const parsed = BusinessAuditInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AuditInputValidationError(
        "Invalid business audit input.",
        parsed.error.flatten()
      );
    }
    const metrics = calculateBusinessAudit(parsed.data);
    return {
      validatedInput: parsed.data,
      metrics,
      calcMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  const parsed = CashflowAuditInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AuditInputValidationError(
      "Invalid cashflow audit input.",
      parsed.error.flatten()
    );
  }
  const metrics = calculateCashflowAudit(parsed.data);
  return {
    validatedInput: parsed.data,
    metrics,
    calcMs: Math.round((performance.now() - start) * 100) / 100,
  };
}

/**
 * Single-Pass Multi-Persona Committee Audit Orchestrator.
 * 1. Validates input & runs deterministic TypeScript calculator
 * 2. Injects daily macro context (3-tier resilient feed)
 * 3. Calls Gemini Free Tier with strict Zod output validation
 */
export async function runCommitteeAudit(params: {
  track: AuditTrack;
  locale: Locale;
  rawInput: unknown;
}): Promise<CommitteeAuditResponse> {
  const { track, locale, rawInput } = params;

  const { validatedInput, metrics, calcMs } = runDeterministicStep(
    track,
    rawInput
  );

  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const [{ context: macroContext, origin: macroOrigin }, systemPrompt] =
    await Promise.all([
      getDailyMacroContext(),
      buildCommitteeSystemPrompt(locale),
    ]);

  const auditId = generateAuditId();
  const hasSevereFlag = metrics.deterministic_flags.some((f) =>
    SEVERE_FLAGS.has(f)
  );

  const userPrompt = [
    `AUDIT_ID: ${auditId}`,
    `TRACK: ${track}`,
    `LOCALE: ${locale}`,
    `SEVERE_FLAG_PRESENT: ${hasSevereFlag}`,
    "RULE: If SEVERE_FLAG_PRESENT is true, verdict_status MUST NOT be 'CLEARED'.",
    "RULE: Use exact numbers from DETERMINISTIC_METRICS and MACRO_CONTEXT only.",
    "",
    `USER_INPUT: ${JSON.stringify(validatedInput)}`,
    `DETERMINISTIC_METRICS: ${JSON.stringify(metrics)}`,
    `MACRO_CONTEXT: ${JSON.stringify({
      updated_at: macroContext.updated_at,
      source_status: macroContext.source_status,
      indicators: macroContext.indicators,
      synthesis: macroContext.synthesis,
      headlines: macroContext.headlines.slice(0, 3),
    })}`,
  ].join("\n");

  const llmStart = performance.now();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const llmMs = Math.round((performance.now() - llmStart) * 100) / 100;

  if (!response.ok) {
    throw new Error(`Gemini API returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Empty response from Gemini API");
  }

  const cleanedJson = stripJsonFences(rawText);
  const parsedJson: unknown = JSON.parse(cleanedJson);
  const validatedVerdict = VerdictPayloadSchema.safeParse(parsedJson);

  if (!validatedVerdict.success) {
    throw new Error("LLM output failed VerdictPayloadSchema validation");
  }

  const verdict = validatedVerdict.data;
  if (hasSevereFlag && verdict.verdict_status === "CLEARED") {
    verdict.verdict_status = "CONDITIONAL";
  }

  return {
    verdict,
    metrics,
    telemetry: {
      calc_ms: calcMs,
      llm_ms: llmMs,
      macro_origin: macroOrigin,
      macro_regime: macroContext.synthesis.macro_regime,
      model_used: GEMINI_MODEL,
    },
  };
}
