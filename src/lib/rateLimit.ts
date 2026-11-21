const MINUTE_WINDOW_MS = 60_000;
const DAY_WINDOW_MS = 86_400_000;
const MAX_PER_MINUTE = 10;
const MAX_PER_DAY = 40;

// In-memory sliding window store keyed by client IP
const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
}

/**
 * Extract client IP address from request headers with local fallback.
 */
export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "local-dev";
}

/**
 * Sliding-window rate limiter for live LLM audit calls:
 * max 10 requests/minute and 40 requests/day per IP.
 */
export function checkAuditRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const dayCutoff = now - DAY_WINDOW_MS;
  const minuteCutoff = now - MINUTE_WINDOW_MS;

  const existing = requestLog.get(ip) ?? [];
  const withinDay = existing.filter((ts) => ts > dayCutoff);
  const withinMinute = withinDay.filter((ts) => ts > minuteCutoff);

  if (withinMinute.length >= MAX_PER_MINUTE) {
    const oldestInMinute = withinMinute[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldestInMinute + MINUTE_WINDOW_MS - now) / 1000)
    );
    requestLog.set(ip, withinDay);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  if (withinDay.length >= MAX_PER_DAY) {
    const oldestInDay = withinDay[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldestInDay + DAY_WINDOW_MS - now) / 1000)
    );
    requestLog.set(ip, withinDay);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  withinDay.push(now);
  requestLog.set(ip, withinDay);

  const remainingMinute = MAX_PER_MINUTE - (withinMinute.length + 1);
  const remainingDay = MAX_PER_DAY - withinDay.length;

  return {
    allowed: true,
    remaining: Math.max(0, Math.min(remainingMinute, remainingDay)),
  };
}
