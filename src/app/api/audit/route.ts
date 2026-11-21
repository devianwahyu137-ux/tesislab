import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuditInputValidationError,
  runCommitteeAudit,
} from "@/lib/agents/orchestrator";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { checkAuditRateLimit, extractClientIp } from "@/lib/rateLimit";
import { AuditTrackSchema } from "@/lib/schemas/verdictSchema";

const AuditRequestSchema = z.object({
  mode: z.enum(["live", "demo"]).default("live"),
  preset_id: z.string().min(1).optional(),
  track: AuditTrackSchema,
  locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
  input: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  const parsedRequest = AuditRequestSchema.safeParse(rawBody);
  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: "Invalid audit request envelope.",
        details: parsedRequest.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { mode, preset_id, track, locale, input } = parsedRequest.data;

  let rateRemaining = 10;
  if (mode !== "demo") {
    const clientIp = extractClientIp(request);
    const rate = checkAuditRateLimit(clientIp);
    rateRemaining = rate.remaining;

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT_EXCEEDED",
          message:
            "Too many live audit requests. Please wait a moment or try a zero-cost demo preset.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            ...(rate.retryAfterSec
              ? { "Retry-After": String(rate.retryAfterSec) }
              : {}),
          },
        }
      );
    }
  }

  try {
    const result = await runCommitteeAudit({
      track,
      locale,
      rawInput: input,
      mode,
      presetId: preset_id,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(rateRemaining),
      },
    });
  } catch (err) {
    if (err instanceof AuditInputValidationError) {
      return NextResponse.json(
        {
          error: "INVALID_TRACK_INPUT",
          message: err.message,
          details: err.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "AUDIT_EXECUTION_FAILED",
        message: "Unable to complete committee audit at this time.",
      },
      { status: 500 }
    );
  }
}
