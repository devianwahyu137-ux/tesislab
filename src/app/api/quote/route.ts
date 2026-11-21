import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const SYMBOL_REGEX = /^[A-Z0-9.=^-]{1,20}$/;
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 7_500;

export interface LiveQuotePayload {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  currency: string;
  cached: boolean;
  fetched_at: string;
}

const quoteCache = new Map<
  string,
  { payload: Omit<LiveQuotePayload, "cached">; expiresAt: number }
>();

export async function GET(req: NextRequest) {
  const rawSymbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const symbol = rawSymbol.trim().toUpperCase();

  if (!symbol || !SYMBOL_REGEX.test(symbol)) {
    return NextResponse.json(
      { error: "INVALID_SYMBOL", message: "Ticker symbol format is invalid." },
      { status: 400 }
    );
  }

  const now = Date.now();
  const cachedEntry = quoteCache.get(symbol);
  if (cachedEntry && cachedEntry.expiresAt > now) {
    return NextResponse.json({
      ...cachedEntry.payload,
      cached: true,
    } satisfies LiveQuotePayload);
  }

  try {
    const quoteResult = await Promise.race([
      yahooFinance.quote(symbol),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("QUOTE_TIMEOUT")), FETCH_TIMEOUT_MS)
      ),
    ]);

    const price = quoteResult?.regularMarketPrice;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          error: "QUOTE_NOT_FOUND",
          message: `No live market price available for ${symbol}.`,
        },
        { status: 404 }
      );
    }

    const payload: Omit<LiveQuotePayload, "cached"> = {
      symbol: quoteResult.symbol ?? symbol,
      name: quoteResult.shortName ?? quoteResult.longName ?? symbol,
      price,
      change_pct:
        typeof quoteResult.regularMarketChangePercent === "number"
          ? Number(quoteResult.regularMarketChangePercent.toFixed(2))
          : 0,
      currency: quoteResult.currency ?? "USD",
      fetched_at: new Date().toISOString(),
    };

    quoteCache.set(symbol, { payload, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json({
      ...payload,
      cached: false,
    } satisfies LiveQuotePayload);
  } catch {
    return NextResponse.json(
      {
        error: "QUOTE_UNAVAILABLE",
        message: `Unable to fetch live quote for ${symbol}. Enter price manually.`,
      },
      { status: 502 }
    );
  }
}
