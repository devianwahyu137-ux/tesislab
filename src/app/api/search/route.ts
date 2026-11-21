import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export type AssetCategory = "IDX" | "CRYPTO" | "COMMODITY" | "US_EQUITY" | "INDEX";

export interface TickerSearchItem {
  symbol: string;
  name: string;
  exchange: string;
  quoteType: string;
  category: AssetCategory;
  badgeText: string;
}

const CURATED_TICKERS: readonly TickerSearchItem[] = [
  {
    symbol: "BBCA.JK",
    name: "Bank Central Asia Tbk",
    exchange: "IDX",
    quoteType: "EQUITY",
    category: "IDX",
    badgeText: "BCA",
  },
  {
    symbol: "BBRI.JK",
    name: "Bank Rakyat Indonesia Tbk",
    exchange: "IDX",
    quoteType: "EQUITY",
    category: "IDX",
    badgeText: "BRI",
  },
  {
    symbol: "BMRI.JK",
    name: "Bank Mandiri (Persero) Tbk",
    exchange: "IDX",
    quoteType: "EQUITY",
    category: "IDX",
    badgeText: "MRI",
  },
  {
    symbol: "TLKM.JK",
    name: "Telkom Indonesia (Persero) Tbk",
    exchange: "IDX",
    quoteType: "EQUITY",
    category: "IDX",
    badgeText: "TLK",
  },
  {
    symbol: "ASII.JK",
    name: "Astra International Tbk",
    exchange: "IDX",
    quoteType: "EQUITY",
    category: "IDX",
    badgeText: "ASI",
  },
  {
    symbol: "ANTM.JK",
    name: "Aneka Tambang Tbk",
    exchange: "IDX",
    quoteType: "EQUITY",
    category: "IDX",
    badgeText: "ANT",
  },
  {
    symbol: "BTC-USD",
    name: "Bitcoin USD",
    exchange: "CRYPTO",
    quoteType: "CRYPTOCURRENCY",
    category: "CRYPTO",
    badgeText: "BTC",
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum USD",
    exchange: "CRYPTO",
    quoteType: "CRYPTOCURRENCY",
    category: "CRYPTO",
    badgeText: "ETH",
  },
  {
    symbol: "SOL-USD",
    name: "Solana USD",
    exchange: "CRYPTO",
    quoteType: "CRYPTOCURRENCY",
    category: "CRYPTO",
    badgeText: "SOL",
  },
  {
    symbol: "GC=F",
    name: "Gold Futures (COMEX)",
    exchange: "COMEX",
    quoteType: "FUTURE",
    category: "COMMODITY",
    badgeText: "XAU",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    quoteType: "EQUITY",
    category: "US_EQUITY",
    badgeText: "NVD",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    quoteType: "EQUITY",
    category: "US_EQUITY",
    badgeText: "APL",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    exchange: "NASDAQ",
    quoteType: "EQUITY",
    category: "US_EQUITY",
    badgeText: "TSL",
  },
  {
    symbol: "^JKSE",
    name: "IDX Composite (IHSG)",
    exchange: "IDX",
    quoteType: "INDEX",
    category: "INDEX",
    badgeText: "IDX",
  },
];

const CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_TIMEOUT_MS = 4_500;

const searchCache = new Map<
  string,
  { items: TickerSearchItem[]; expiresAt: number }
>();

function inferCategory(symbol: string, quoteType: string, exchange: string): AssetCategory {
  const sym = symbol.toUpperCase();
  const qt = quoteType.toUpperCase();
  const ex = exchange.toUpperCase();
  if (qt === "CRYPTOCURRENCY" || sym.endsWith("-USD") || sym.endsWith("USDT")) {
    return "CRYPTO";
  }
  if (qt === "FUTURE" || sym.includes("=F")) {
    return "COMMODITY";
  }
  if (qt === "INDEX" || sym.startsWith("^")) {
    return "INDEX";
  }
  if (sym.endsWith(".JK") || ex === "JKT" || ex === "IDX") {
    return "IDX";
  }
  return "US_EQUITY";
}

function makeBadgeText(symbol: string): string {
  const clean = symbol.replace(/\.JK$|-USD$|=F$|^\^/i, "").toUpperCase();
  return clean.slice(0, 3) || "AST";
}

function formatExchange(exchange: string, symbol: string, category: AssetCategory): string {
  if (symbol.toUpperCase().endsWith(".JK") || exchange.toUpperCase() === "JKT") {
    return "IDX";
  }
  if (category === "CRYPTO") return "CRYPTO";
  if (exchange) return exchange.toUpperCase().slice(0, 8);
  return category;
}

export async function GET(req: NextRequest) {
  const rawQuery = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const queryLower = rawQuery.toLowerCase();

  if (!rawQuery) {
    return NextResponse.json({
      query: "",
      items: CURATED_TICKERS,
      source: "curated",
    });
  }

  const curatedMatches = CURATED_TICKERS.filter(
    (item) =>
      item.symbol.toLowerCase().includes(queryLower) ||
      item.name.toLowerCase().includes(queryLower) ||
      item.exchange.toLowerCase().includes(queryLower)
  );

  const now = Date.now();
  const cached = searchCache.get(queryLower);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json({
      query: rawQuery,
      items: cached.items,
      source: "cache",
    });
  }

  try {
    const result = await Promise.race([
      yahooFinance.search(rawQuery, { quotesCount: 8, newsCount: 0 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SEARCH_TIMEOUT")), SEARCH_TIMEOUT_MS)
      ),
    ]);

    const seen = new Set<string>();
    const merged: TickerSearchItem[] = [];

    for (const item of curatedMatches) {
      seen.add(item.symbol.toUpperCase());
      merged.push(item);
    }

    const rawQuotes = Array.isArray(result?.quotes) ? result.quotes : [];
    for (const q of rawQuotes) {
      if (!q || typeof q !== "object" || !("symbol" in q)) continue;
      const sym = typeof q.symbol === "string" ? q.symbol.trim().toUpperCase() : "";
      if (!sym || seen.has(sym)) continue;
      const quoteType =
        "quoteType" in q && typeof q.quoteType === "string"
          ? q.quoteType.toUpperCase()
          : "EQUITY";
      const exchangeRaw =
        "exchDisp" in q && typeof q.exchDisp === "string"
          ? q.exchDisp
          : "exchange" in q && typeof q.exchange === "string"
            ? q.exchange
            : "";
      const name =
        ("shortname" in q && typeof q.shortname === "string" && q.shortname) ||
        ("longname" in q && typeof q.longname === "string" && q.longname) ||
        sym;
      const category = inferCategory(sym, quoteType, exchangeRaw);

      seen.add(sym);
      merged.push({
        symbol: sym,
        name,
        exchange: formatExchange(exchangeRaw, sym, category),
        quoteType,
        category,
        badgeText: makeBadgeText(sym),
      });
    }

    const finalItems = merged.slice(0, 10);
    searchCache.set(queryLower, {
      items: finalItems,
      expiresAt: now + CACHE_TTL_MS,
    });

    return NextResponse.json({
      query: rawQuery,
      items: finalItems,
      source: "live",
    });
  } catch {
    return NextResponse.json({
      query: rawQuery,
      items: curatedMatches.length > 0 ? curatedMatches : CURATED_TICKERS.slice(0, 6),
      source: "fallback",
    });
  }
}
