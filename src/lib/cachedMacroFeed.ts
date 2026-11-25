import { cacheLife } from "next/cache";
import { getDailyMacroContext, type MacroFeedResult } from "@/lib/macroFeed";

/**
 * Shared Next.js 16 Cache Components server helper for the daily Hermes macro feed.
 */
export async function getCachedMacroFeed(): Promise<MacroFeedResult> {
  "use cache";
  cacheLife("minutes");
  return getDailyMacroContext();
}
