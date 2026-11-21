import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  MarketContextSchema,
  type MarketContext,
} from "@/lib/schemas/macroContextSchema";

export type MacroFeedOrigin =
  | "remote_data_feed"
  | "local_snapshot"
  | "emergency_fallback";

export interface MacroFeedResult {
  context: MarketContext;
  origin: MacroFeedOrigin;
}

const REMOTE_TIMEOUT_MS = 4000;
const REVALIDATE_SECONDS = 1800; // 30 minutes

const EMERGENCY_FALLBACK_CONTEXT: MarketContext = {
  updated_at: "2026-01-01T00:00:00.000Z",
  source_status: "fallback",
  indicators: {
    USD_IDR: {
      symbol: "IDR=X",
      price: 16800,
      change_pct: 0,
      status: "fallback",
      source: "emergency",
    },
    IHSG: {
      symbol: "^JKSE",
      price: 7200,
      change_pct: 0,
      status: "fallback",
      source: "emergency",
    },
    GOLD_USD: {
      symbol: "GC=F",
      price: 2650,
      change_pct: 0,
      status: "fallback",
      source: "emergency",
    },
    BTC_USD: {
      symbol: "BTC-USD",
      price: 90000,
      change_pct: 0,
      status: "fallback",
      source: "emergency",
    },
  },
  headlines: [
    "Macro feed unavailable; using baseline emergency reference values.",
  ],
  synthesis: {
    macro_regime: "CAUTIOUS",
    summary_id:
      "Data makro langsung tidak tersedia; gunakan asumsi konservatif dan margin pengaman tambahan.",
    summary_en:
      "Live macro feed unavailable; apply conservative assumptions and extra safety margins.",
    key_risk_alert_id:
      "Konteks makro bersifat cadangan; periksa likuiditas dan batas risiko sebelum eksekusi.",
    key_risk_alert_en:
      "Macro context is in fallback mode; verify liquidity and risk caps prior to execution.",
  },
};

function isValidHttpUrl(rawUrl: string | undefined): rawUrl is string {
  if (!rawUrl || !rawUrl.trim()) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Fetch daily macro context with 3-tier resilience:
 * 1. Remote `data-feed` branch JSON (4s timeout, 30m Next.js cache)
 * 2. Local `data/market_context.json` snapshot
 * 3. In-memory emergency fallback (never throws)
 */
export async function getDailyMacroContext(): Promise<MacroFeedResult> {
  const remoteUrl = process.env.NEXT_PUBLIC_MACRO_FEED_URL;

  if (isValidHttpUrl(remoteUrl)) {
    try {
      const response = await fetch(remoteUrl.trim(), {
        signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
        next: { revalidate: REVALIDATE_SECONDS },
      });
      if (response.ok) {
        const json: unknown = await response.json();
        const parsed = MarketContextSchema.safeParse(json);
        if (parsed.success) {
          return { context: parsed.data, origin: "remote_data_feed" };
        }
      }
    } catch {
      // Fall through to local snapshot
    }
  }

  try {
    const localPath = path.join(process.cwd(), "data", "market_context.json");
    const raw = await readFile(localPath, "utf-8");
    const json: unknown = JSON.parse(raw);
    const parsed = MarketContextSchema.safeParse(json);
    if (parsed.success) {
      return { context: parsed.data, origin: "local_snapshot" };
    }
  } catch {
    // Fall through to emergency fallback
  }

  return {
    context: EMERGENCY_FALLBACK_CONTEXT,
    origin: "emergency_fallback",
  };
}
