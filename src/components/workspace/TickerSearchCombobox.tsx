"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bitcoin,
  Building2,
  Gem,
  Globe2,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import type {
  AssetCategory,
  TickerSearchItem,
} from "@/app/api/search/route";
import { cn } from "@/lib/utils";

interface TickerSearchComboboxProps {
  value: string;
  onChange: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onFetchLive: () => void;
  isFetchingQuote: boolean;
}

const DEFAULT_FEATURED: readonly TickerSearchItem[] = [
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
    name: "Telkom Indonesia Tbk",
    exchange: "IDX",
    quoteType: "EQUITY",
    category: "IDX",
    badgeText: "TLK",
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
    symbol: "^JKSE",
    name: "IDX Composite (IHSG)",
    exchange: "IDX",
    quoteType: "INDEX",
    category: "INDEX",
    badgeText: "IDX",
  },
];

type CategoryFilter = "ALL" | "IDX" | "CRYPTO" | "GLOBAL";

function getCategoryStyle(category: AssetCategory): {
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case "IDX":
      return {
        bg: "bg-cleared/12",
        text: "text-cleared",
        border: "border-cleared/35",
      };
    case "CRYPTO":
      return {
        bg: "bg-conditional/12",
        text: "text-conditional",
        border: "border-conditional/35",
      };
    case "COMMODITY":
      return {
        bg: "bg-amber-500/12",
        text: "text-amber-400",
        border: "border-amber-500/35",
      };
    case "INDEX":
      return {
        bg: "bg-sky-500/12",
        text: "text-sky-400",
        border: "border-sky-500/35",
      };
    default:
      return {
        bg: "bg-indigo-500/12",
        text: "text-indigo-400",
        border: "border-indigo-500/35",
      };
  }
}

function CategoryGlyph({ category }: { category: AssetCategory }) {
  switch (category) {
    case "CRYPTO":
      return <Bitcoin className="h-3.5 w-3.5" aria-hidden="true" />;
    case "COMMODITY":
      return <Gem className="h-3.5 w-3.5" aria-hidden="true" />;
    case "INDEX":
      return <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />;
    case "IDX":
      return <Building2 className="h-3.5 w-3.5" aria-hidden="true" />;
    default:
      return <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />;
  }
}

function inferQuickCategory(symbol: string): AssetCategory {
  const s = symbol.trim().toUpperCase();
  if (s.endsWith("-USD") || s.endsWith("USDT") || s.includes("BTC") || s.includes("ETH")) {
    return "CRYPTO";
  }
  if (s.includes("=F")) return "COMMODITY";
  if (s.startsWith("^")) return "INDEX";
  if (s.endsWith(".JK")) return "IDX";
  return "US_EQUITY";
}

/**
 * TradingView-style Symbol Search Combobox with live Yahoo Finance search,
 * asset-class emblem badges, exchange pills, category filters, and keyboard navigation.
 */
export function TickerSearchCombobox({
  value,
  onChange,
  onSelectSymbol,
  onFetchLive,
  isFetchingQuote,
}: TickerSearchComboboxProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [remoteResults, setRemoteResults] = useState<TickerSearchItem[]>([
    ...DEFAULT_FEATURED,
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // Debounced search against /api/search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = value.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items?: TickerSearchItem[] };
        if (Array.isArray(data.items)) {
          setRemoteResults(data.items);
          setActiveIndex(0);
        }
      } catch {
        // Keep current results on abort/network error
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, isOpen]);

  const baseResults = useMemo(
    () => (value.trim() ? remoteResults : [...DEFAULT_FEATURED]),
    [value, remoteResults]
  );

  const filteredResults = useMemo(() => {
    if (categoryFilter === "ALL") return baseResults;
    if (categoryFilter === "IDX") {
      return baseResults.filter(
        (r) => r.category === "IDX" || r.category === "INDEX"
      );
    }
    if (categoryFilter === "CRYPTO") {
      return baseResults.filter((r) => r.category === "CRYPTO");
    }
    return baseResults.filter(
      (r) => r.category === "US_EQUITY" || r.category === "COMMODITY"
    );
  }, [baseResults, categoryFilter]);

  const activeCategory = inferQuickCategory(value);
  const activeStyle = getCategoryStyle(activeCategory);

  const handleChoose = (item: TickerSearchItem) => {
    onChange(item.symbol);
    setIsOpen(false);
    onSelectSymbol(item.symbol);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        filteredResults.length > 0
          ? (prev - 1 + filteredResults.length) % filteredResults.length
          : 0
      );
    } else if (e.key === "Enter") {
      if (filteredResults[activeIndex]) {
        e.preventDefault();
        handleChoose(filteredResults[activeIndex]);
      } else {
        setIsOpen(false);
        onFetchLive();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <div className="flex items-stretch gap-2">
        <div className="relative flex flex-1 items-center">
          {/* Active Asset Class Badge inside input */}
          <span
            className={cn(
              "pointer-events-none absolute left-2.5 flex h-6 w-6 items-center justify-center rounded-xs border",
              activeStyle.bg,
              activeStyle.text,
              activeStyle.border
            )}
            aria-hidden="true"
          >
            <CategoryGlyph category={activeCategory} />
          </span>

          <input
            ref={inputRef}
            id="trade-symbol"
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="ticker-search-listbox"
            autoComplete="off"
            required
            value={value}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            placeholder={t("quote.search_ph")}
            className="min-h-[44px] w-full rounded-sm border border-hairline bg-obsidian pl-10 pr-14 py-2 font-mono text-sm uppercase text-text-primary placeholder:normal-case placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared"
          />

          <div className="absolute right-2.5 flex items-center gap-1">
            {isSearching && value.trim() ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-text-muted"
                aria-hidden="true"
              />
            ) : value ? (
              <button
                type="button"
                aria-label="Clear ticker"
                onClick={() => {
                  onChange("");
                  setIsSearching(false);
                  setIsOpen(true);
                  inputRef.current?.focus();
                }}
                className="rounded-xs p-0.5 text-text-muted transition-colors hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
            <Search
              className="h-3.5 w-3.5 text-text-muted"
              aria-hidden="true"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onFetchLive}
          disabled={isFetchingQuote || !value.trim()}
          title={t("quote.fetch_btn")}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-sm border border-active-border bg-surface px-3 font-mono text-[11px] uppercase tracking-wider text-text-secondary transition-colors hover:border-cleared/60 hover:text-cleared disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isFetchingQuote && "animate-spin"
            )}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isFetchingQuote ? t("quote.fetching_btn") : t("quote.fetch_btn")}
          </span>
        </button>
      </div>

      {/* TradingView-style Symbol Search Popover */}
      {isOpen && (
        <div
          id="ticker-search-listbox"
          role="listbox"
          className="absolute top-[48px] left-0 z-50 w-full min-w-[280px] overflow-hidden rounded-sm border border-active-border bg-surface shadow-2xl"
        >
          {/* Category Filter Strip */}
          <div className="flex items-center justify-between gap-2 border-b border-hairline bg-obsidian px-2.5 py-1.5">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: "ALL", label: t("quote.cat_all") },
                  { id: "IDX", label: "IDX" },
                  { id: "CRYPTO", label: "CRYPTO" },
                  { id: "GLOBAL", label: t("quote.cat_global") },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCategoryFilter(cat.id);
                    setActiveIndex(0);
                  }}
                  className={cn(
                    "rounded-xs px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    categoryFilter === cat.id
                      ? "bg-cleared/15 text-cleared"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">
              {t("quote.tv_search_hint")}
            </span>
          </div>

          {/* Search Results List */}
          <div className="max-h-[264px] overflow-y-auto py-1">
            {filteredResults.length === 0 ? (
              <div className="px-3 py-4 text-center font-mono text-[11px] text-text-muted">
                {t("quote.no_results")}
              </div>
            ) : (
              filteredResults.map((item, idx) => {
                const style = getCategoryStyle(item.category);
                const isSelected = idx === activeIndex;
                const isCurrent =
                  item.symbol.toUpperCase() === value.trim().toUpperCase();
                return (
                  <button
                    key={item.symbol}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleChoose(item)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
                      isSelected ? "bg-elevated" : "hover:bg-elevated/60"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {/* Crisp TradingView-style Emblem Monogram */}
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] font-bold tracking-tight",
                          style.bg,
                          style.text,
                          style.border
                        )}
                      >
                        {item.badgeText}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "font-mono text-xs font-bold tracking-wide",
                              isCurrent ? "text-cleared" : "text-text-primary"
                            )}
                          >
                            {item.symbol}
                          </span>
                          {isCurrent && (
                            <span className="h-1.5 w-1.5 rounded-full bg-cleared" />
                          )}
                        </div>
                        <span className="block truncate font-sans text-[11px] text-text-secondary">
                          {item.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="hidden rounded-xs border border-hairline bg-obsidian px-1.5 py-0.5 font-mono text-[9px] uppercase text-text-muted sm:inline">
                        {item.quoteType}
                      </span>
                      <span
                        className={cn(
                          "rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                          style.bg,
                          style.text,
                          style.border
                        )}
                      >
                        {item.exchange}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
