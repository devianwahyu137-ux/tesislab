import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuditInputValidationError,
  MissingApiKeyError,
  runCommitteeAudit,
} from "@/lib/agents/orchestrator";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { AuditTrackSchema } from "@/lib/schemas/verdictSchema";

const AuditRequestSchema = z.object({
  track: AuditTrackSchema,
  locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
  input: z.record(z.string(), z.unknown()),
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

  try {
    const result = await runCommitteeAudit({
      track: parsedRequest.data.track,
      locale: parsedRequest.data.locale,
      rawInput: parsedRequest.data.input,
    });

    return NextResponse.json(result, { status: 200 });
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

    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message:
            "Server is missing GOOGLE_API_KEY configuration in .env.local.",
        },
        { status: 503 }
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
