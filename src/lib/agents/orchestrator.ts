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
import {
  runMonteCarloSimulation,
  type MonteCarloSummary,
} from "@/lib/quant/monteCarlo";
import type { MacroRegime } from "@/lib/schemas/macroContextSchema";
import {
  VerdictPayloadSchema,
  type AuditTrack,
  type VerdictPayload,
} from "@/lib/schemas/verdictSchema";
import {
  buildDeterministicFallbackVerdict,
  getDemoPresetById,
} from "@/lib/agents/demoPresets";
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
  fallback_reason?: string;
}

export interface CommitteeAuditResponse {
  verdict: VerdictPayload;
  metrics: AuditMetrics;
  monte_carlo: MonteCarloSummary;
  telemetry: AuditTelemetry;
  resolved_input: Record<string, unknown>;
}

export class AuditInputValidationError extends Error {
  public readonly issues: unknown;
  constructor(message: string, issues: unknown) {
    super(message);
    this.name = "AuditInputValidationError";
    this.issues = issues;
  }
}

const GEMINI_MODEL = "gemini-2.5-flash";
const OPENROUTER_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
] as const;
const LLM_TIMEOUT_MS = 12_000;

function classifyProviderError(provider: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/AbortError|TimeoutError|timed out/i.test(msg)) {
    return `${provider}_TIMEOUT`;
  }
  const httpMatch = msg.match(/HTTP\s+(\d{3})/i);
  if (httpMatch) {
    return `${provider}_${httpMatch[1]}`;
  }
  if (/VerdictPayloadSchema|JSON/i.test(msg)) {
    return "SCHEMA_MISMATCH";
  }
  if (/Empty/i.test(msg)) {
    return `${provider}_EMPTY`;
  }
  return `${provider}_ERROR`;
}

const SEVERE_FLAGS = new Set([
  "NEGATIVE_UNIT_MARGIN",
  "DEFICIT_CASHFLOW",
  "OVEREXPOSED_RISK",
  "INVALID_SL_DIRECTION",
  "INVALID_TP_DIRECTION",
  "FEE_ERODES_EDGE",
  "PREDATORY_EFFECTIVE_APR",
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
    return {
      validatedInput: parsed.data,
      metrics: calculateTradeAudit(parsed.data),
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
    return {
      validatedInput: parsed.data,
      metrics: calculateBusinessAudit(parsed.data),
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
  return {
    validatedInput: parsed.data,
    metrics: calculateCashflowAudit(parsed.data),
    calcMs: Math.round((performance.now() - start) * 100) / 100,
  };
}

function parseAndValidateVerdict(
  rawText: string,
  hasSevereFlag: boolean
): VerdictPayload {
  const cleanedJson = stripJsonFences(rawText);
  const parsedJson: unknown = JSON.parse(cleanedJson);
  const validated = VerdictPayloadSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error("LLM output failed VerdictPayloadSchema validation");
  }
  const verdict = validated.data;
  if (hasSevereFlag && verdict.verdict_status === "CLEARED") {
    verdict.verdict_status = "CONDITIONAL";
  }
  return verdict;
}

async function callGeminiFreeTier(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  hasSevereFlag: boolean
): Promise<VerdictPayload> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Empty Gemini response");
  }
  return parseAndValidateVerdict(rawText, hasSevereFlag);
}

async function callOpenRouterFreeTier(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  hasSevereFlag: boolean
): Promise<VerdictPayload> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenRouter HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = payload.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error("Empty OpenRouter response");
  }
  return parseAndValidateVerdict(rawText, hasSevereFlag);
}

/**
 * Tiered Single-Pass Multi-Persona Audit Orchestrator:
 * 1. Demo preset (zero API cost)
 * 2. Primary: Google Gemini Free Tier (12s timeout)
 * 3. Secondary: OpenRouter Free Tier (12s timeout)
 * 4. Emergency: Deterministic fallback verdict (never crashes)
 */
export async function runCommitteeAudit(params: {
  track: AuditTrack;
  locale: Locale;
  rawInput: unknown;
  mode?: "live" | "demo";
  presetId?: string;
}): Promise<CommitteeAuditResponse> {
  const { track, locale, rawInput, mode = "live", presetId } = params;

  // Tier 1: Demo Mode (Zero-API)
  if (mode === "demo" && presetId) {
    const preset = getDemoPresetById(presetId);
    if (!preset) {
      throw new AuditInputValidationError("Unknown demo preset_id.", {
        preset_id: presetId,
      });
    }
    const { validatedInput, metrics, calcMs } = runDeterministicStep(
      preset.track,
      preset.input
    );
    const monteCarlo = runMonteCarloSimulation(
      preset.track,
      validatedInput,
      metrics
    );
    const { context: macroContext, origin: macroOrigin } =
      await getDailyMacroContext();

    return {
      verdict: locale === "en" ? preset.verdict_en : preset.verdict_id,
      metrics,
      monte_carlo: monteCarlo,
      resolved_input: validatedInput as Record<string, unknown>,
      telemetry: {
        calc_ms: calcMs,
        llm_ms: 0,
        macro_origin: macroOrigin,
        macro_regime: macroContext.synthesis.macro_regime,
        model_used: "deterministic-preset",
      },
    };
  }

  const { validatedInput, metrics, calcMs } = runDeterministicStep(
    track,
    rawInput
  );
  const monteCarlo = runMonteCarloSimulation(track, validatedInput, metrics);

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
    "RULE: Use exact numbers from DETERMINISTIC_METRICS, MONTE_CARLO_1000_PATHS, and MACRO_CONTEXT only.",
    "RULE: Explicitly reference quantitative metrics (such as breakeven_win_rate_pct, max_safe_position_pct, sl_to_atr_ratio, payback_period_months, margin_of_safety_pct, savings_rate_pct, and Monte Carlo ruin_probability_pct / p5_ending_value) inside agent_deliberation and premortem_blind_spots.",
    "",
    `USER_INPUT: ${JSON.stringify(validatedInput)}`,
    `DETERMINISTIC_METRICS: ${JSON.stringify(metrics)}`,
    `MONTE_CARLO_1000_PATHS: ${JSON.stringify(monteCarlo)}`,
    `MACRO_CONTEXT: ${JSON.stringify({
      updated_at: macroContext.updated_at,
      source_status: macroContext.source_status,
      indicators: macroContext.indicators,
      synthesis: macroContext.synthesis,
      headlines: macroContext.headlines.slice(0, 3),
    })}`,
  ].join("\n");

  const llmStart = performance.now();
  const failureReasons: string[] = [];

  // Tier 2: Primary Provider (Gemini Free Tier)
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (googleKey) {
    try {
      const verdict = await callGeminiFreeTier(
        googleKey,
        systemPrompt,
        userPrompt,
        hasSevereFlag
      );
      return {
        verdict,
        metrics,
        monte_carlo: monteCarlo,
        resolved_input: validatedInput as Record<string, unknown>,
        telemetry: {
          calc_ms: calcMs,
          llm_ms: Math.round((performance.now() - llmStart) * 100) / 100,
          macro_origin: macroOrigin,
          macro_regime: macroContext.synthesis.macro_regime,
          model_used: GEMINI_MODEL,
          fallback_reason: "NONE",
        },
      };
    } catch (err) {
      failureReasons.push(classifyProviderError("GEMINI", err));
    }
  } else {
    failureReasons.push("GEMINI_NO_KEY");
  }

  // Tier 3: Secondary Provider (OpenRouter Free Tier: openrouter/free -> llama-3.3-70b-instruct:free)
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouterKey) {
    for (const model of OPENROUTER_MODELS) {
      try {
        const verdict = await callOpenRouterFreeTier(
          openrouterKey,
          model,
          systemPrompt,
          userPrompt,
          hasSevereFlag
        );
        return {
          verdict,
          metrics,
          monte_carlo: monteCarlo,
          resolved_input: validatedInput as Record<string, unknown>,
          telemetry: {
            calc_ms: calcMs,
            llm_ms: Math.round((performance.now() - llmStart) * 100) / 100,
            macro_origin: macroOrigin,
            macro_regime: macroContext.synthesis.macro_regime,
            model_used: model,
            fallback_reason: failureReasons[0] ?? "NONE",
          },
        };
      } catch (err) {
        failureReasons.push(classifyProviderError("OPENROUTER", err));
      }
    }
  } else {
    failureReasons.push("OPENROUTER_NO_KEY");
  }

  // Tier 4: Emergency Deterministic Fallback
  const fallbackVerdict = buildDeterministicFallbackVerdict({
    track,
    locale,
    calcResult: metrics,
    macroContext,
    monteCarlo,
  });

  const resolvedReason =
    !googleKey && !openrouterKey
      ? "MISSING_KEYS"
      : failureReasons.join("|");

  return {
    verdict: fallbackVerdict,
    metrics,
    monte_carlo: monteCarlo,
    resolved_input: validatedInput as Record<string, unknown>,
    telemetry: {
      calc_ms: calcMs,
      llm_ms: 0,
      macro_origin: macroOrigin,
      macro_regime: macroContext.synthesis.macro_regime,
      model_used: "deterministic-fallback",
      fallback_reason: resolvedReason,
    },
  };
}
