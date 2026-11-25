import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import {
  computeMarketTechnicals,
  type MarketTechnicals,
} from "@/lib/quant/technicalIndicators";
import { checkMarketApiRateLimit, extractClientIp } from "@/lib/rateLimit";

const yahooFinance = new YahooFinance();

const SYMBOL_REGEX = /^[A-Z0-9.=^-]{1,20}$/;
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_CACHE_ENTRIES = 200;

export interface OhlcBar {
  time: number; // UNIX timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface HistoryPayload {
  symbol: string;
  currency: string;
  bars: OhlcBar[];
  technicals: MarketTechnicals | null;
  cached: boolean;
}

const historyCache = new Map<
  string,
  { payload: Omit<HistoryPayload, "cached">; expiresAt: number }
>();

export async function GET(req: NextRequest) {
  const rate = checkMarketApiRateLimit(extractClientIp(req));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many history requests." },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      }
    );
  }

  const rawSymbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const symbol = rawSymbol.trim().toUpperCase();

  if (!symbol || !SYMBOL_REGEX.test(symbol)) {
    return NextResponse.json(
      { error: "INVALID_SYMBOL", message: "Ticker symbol format is invalid." },
      { status: 400 }
    );
  }

  const now = Date.now();
  const cachedEntry = historyCache.get(symbol);
  if (cachedEntry && cachedEntry.expiresAt > now) {
    return NextResponse.json({
      ...cachedEntry.payload,
      cached: true,
    } satisfies HistoryPayload);
  }

  try {
    const period1 = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const result = await Promise.race([
      yahooFinance.chart(symbol, {
        period1,
        interval: "1d",
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("HISTORY_TIMEOUT")), FETCH_TIMEOUT_MS)
      ),
    ]);

    const rawQuotes = result?.quotes ?? [];
    const seenTimes = new Set<number>();
    const bars: OhlcBar[] = [];

    for (const q of rawQuotes) {
      if (
        !q.date ||
        typeof q.open !== "number" ||
        typeof q.high !== "number" ||
        typeof q.low !== "number" ||
        typeof q.close !== "number" ||
        !Number.isFinite(q.open) ||
        !Number.isFinite(q.high) ||
        !Number.isFinite(q.low) ||
        !Number.isFinite(q.close)
      ) {
        continue;
      }
      const unixSec = Math.floor(new Date(q.date).getTime() / 1000);
      if (seenTimes.has(unixSec)) continue;
      seenTimes.add(unixSec);
      bars.push({
        time: unixSec,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
      });
    }

    bars.sort((a, b) => a.time - b.time);

    if (bars.length < 5) {
      return NextResponse.json(
        {
          error: "HISTORY_NOT_FOUND",
          message: `Insufficient historical bars for ${symbol}.`,
        },
        { status: 404 }
      );
    }

    const payload: Omit<HistoryPayload, "cached"> = {
      symbol: result?.meta?.symbol ?? symbol,
      currency: result?.meta?.currency ?? "USD",
      bars,
      technicals: computeMarketTechnicals(bars),
    };

    if (historyCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = historyCache.keys().next().value;
      if (oldestKey !== undefined) historyCache.delete(oldestKey);
    }
    historyCache.set(symbol, { payload, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json({
      ...payload,
      cached: false,
    } satisfies HistoryPayload);
  } catch {
    return NextResponse.json(
      {
        error: "HISTORY_UNAVAILABLE",
        message: `Unable to load OHLCV history for ${symbol}.`,
      },
      { status: 502 }
    );
  }
}
