"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Network,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FormattedNumberInput } from "@/components/workspace/FormattedNumberInput";
import { useTranslation } from "@/context/LanguageContext";
import {
  buildDeterministicFallbackCloses,
  computePortfolioRisk,
} from "@/lib/quant/portfolioRisk";
import { cn } from "@/lib/utils";

const Portfolio3DSurface = dynamic(
  () => import("@/components/terminal/Portfolio3DSurface"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] w-full items-center justify-center sm:h-[260px]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          INITIALIZING 3D COVARIANCE SURFACE...
        </span>
      </div>
    ),
  }
);

interface HoldingRow {
  symbol: string;
  weightPct: number;
}

const DEFAULT_HOLDINGS: HoldingRow[] = [
  { symbol: "BBCA.JK", weightPct: 30 },
  { symbol: "BMRI.JK", weightPct: 25 },
  { symbol: "TLKM.JK", weightPct: 20 },
  { symbol: "BTC-USD", weightPct: 15 },
  { symbol: "GC=F", weightPct: 10 },
];

const QUICK_ADD_SYMBOLS = [
  "BBRI.JK",
  "ASII.JK",
  "NVDA",
  "ETH-USD",
] as const;

export function PortfolioRiskClient() {
  const { locale } = useTranslation();
  const isId = locale === "id";

  const [totalCapitalRp, setTotalCapitalRp] = useState<number>(100_000_000);
  const [holdings, setHoldings] = useState<HoldingRow[]>(DEFAULT_HOLDINGS);
  const [newTicker, setNewTicker] = useState("");
  const [seriesMap, setSeriesMap] = useState<Record<string, number[]>>(() => {
    const init: Record<string, number[]> = {};
    for (const h of DEFAULT_HOLDINGS) {
      init[h.symbol] = buildDeterministicFallbackCloses(h.symbol);
    }
    return init;
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const syncHistoricalCloses = useCallback(async (symbols: string[]) => {
    setIsSyncing(true);
    const updates: Record<string, number[]> = {};
    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(
            `/api/history?symbol=${encodeURIComponent(sym)}`
          );
          if (!res.ok) {
            updates[sym] = buildDeterministicFallbackCloses(sym);
            return;
          }
          const data = (await res.json()) as {
            bars?: { close: number }[];
          };
          if (data.bars && data.bars.length >= 10) {
            updates[sym] = data.bars.map((b) => b.close);
          } else {
            updates[sym] = buildDeterministicFallbackCloses(sym);
          }
        } catch {
          updates[sym] = buildDeterministicFallbackCloses(sym);
        }
      })
    );
    setSeriesMap((prev) => ({ ...prev, ...updates }));
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const tId = setTimeout(() => {
      void syncHistoricalCloses(DEFAULT_HOLDINGS.map((h) => h.symbol));
    }, 0);
    return () => clearTimeout(tId);
  }, [syncHistoricalCloses]);

  const report = useMemo(() => {
    const inputs = holdings.map((h) => ({
      symbol: h.symbol,
      weightPct: h.weightPct,
      closes:
        seriesMap[h.symbol] ?? buildDeterministicFallbackCloses(h.symbol),
    }));
    return computePortfolioRisk(inputs, totalCapitalRp);
  }, [holdings, seriesMap, totalCapitalRp]);

  const handleAddSymbol = (rawSym?: string) => {
    const sym = (rawSym ?? newTicker).trim().toUpperCase();
    if (!sym) return;
    if (holdings.length >= 6) {
      toast.error(isId ? "Maksimal 6 aset simultan." : "Maximum 6 assets.");
      return;
    }
    if (holdings.some((h) => h.symbol === sym)) {
      toast.info(isId ? "Aset sudah ada di portofolio." : "Asset already in portfolio.");
      return;
    }
    setHoldings((prev) => [...prev, { symbol: sym, weightPct: 15 }]);
    setNewTicker("");
    void syncHistoricalCloses([sym]);
  };

  const handleApplyRiskParity = () => {
    setHoldings((prev) =>
      prev.map((h) => {
        const found = report.assetProfiles.find((p) => p.symbol === h.symbol);
        return {
          ...h,
          weightPct: found ? Math.round(found.suggestedRiskParityWeightPct) : h.weightPct,
        };
      })
    );
    toast.success(
      isId
        ? "Bobot Inverse-Volatility Risk Parity diterapkan."
        : "Applied Inverse-Volatility Risk Parity weights."
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
            <Network className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId
                ? "MATRIKS KORELASI PEARSON 90 HARI · VAR 95% · CVAR"
                : "90-DAY PEARSON CORRELATION · 95% VAR · EXPECTED SHORTFALL"}
            </span>
          </span>
          <h2 className="mt-1 font-editorial text-2xl font-medium text-text-primary sm:text-3xl">
            {isId
              ? "Audit Risiko Portofolio & Konsentrasi Tersembunyi."
              : "Multi-Asset Portfolio Risk & Hidden Concentration Audit."}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApplyRiskParity}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-cleared/45 bg-cleared/12 px-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-cleared hover:bg-cleared/20"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? "Auto Bobot Risk-Parity" : "Auto Risk-Parity"}</span>
          </button>

          <button
            type="button"
            disabled={isSyncing}
            onClick={() =>
              void syncHistoricalCloses(holdings.map((h) => h.symbol))
            }
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-hairline bg-obsidian px-3 font-mono text-[10.5px] uppercase tracking-wider text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")}
              aria-hidden="true"
            />
            <span>{isId ? "Sinkron Pasar" : "Sync Market"}</span>
          </button>
        </div>
      </div>

      {/* 4 Institutional VaR & Volatility Readouts */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "VaR 95% Harian (Parametrik)" : "Daily 95% VaR (Parametric)"}
          </span>
          <span className="mt-1 block text-lg font-bold text-conditional sm:text-xl">
            -Rp {report.parametricVar95DailyRp.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-text-muted">
            -{report.parametricVar95DailyPct.toFixed(2)}% / 1D
          </span>
        </div>

        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "CVaR 95% (Expected Shortfall)" : "95% CVaR (Tail Shortfall)"}
          </span>
          <span className="mt-1 block text-lg font-bold text-rejected sm:text-xl">
            -Rp {report.historicalCvar95DailyRp.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-text-muted">
            -{report.historicalCvar95DailyPct.toFixed(2)}% tail avg
          </span>
        </div>

        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "VaR 95% Horizon 20 Hari" : "20-Day Monthly 95% VaR"}
          </span>
          <span className="mt-1 block text-lg font-bold text-text-primary sm:text-xl">
            -Rp {report.monthlyVar95Rp.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-text-muted">sqrt(20) scaling</span>
        </div>

        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "Manfaat Diversifikasi" : "Diversification Benefit"}
          </span>
          <span className="mt-1 block text-lg font-bold text-cleared sm:text-xl">
            -{report.diversificationBenefitPct.toFixed(1)}% Vol
          </span>
          <span className="text-[10px] text-text-muted">
            Port Vol: {report.portfolioAnnualizedVolPct.toFixed(1)}% / yr
          </span>
        </div>
      </div>

      {/* Concentration Warning if correlated pairs >= 0.68 exist */}
      {report.highCorrelationPairs.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-rejected/40 bg-rejected/10 p-3.5 font-sans text-xs text-rejected">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <strong className="font-mono uppercase tracking-wider">
              HIDDEN_SECTOR_CONCENTRATION:{" "}
            </strong>
            <span>
              {report.highCorrelationPairs
                .map(
                  (p) =>
                    `${p.assetA} ↔ ${p.assetB} (ρ = ${p.correlation.toFixed(2)})`
                )
                .join(", ")}
              .{" "}
              {isId
                ? "Aset-aset ini bergerak serempak saat koreksi pasar sehingga menggandakan risiko drawdown."
                : "These holdings move in lockstep during selloffs, compounding tail drawdown risk."}
            </span>
          </div>
        </div>
      )}

      {/* Split: Left Holdings Editor + Right 3D Covariance Surface & Heatmap */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="terminal-panel flex flex-col gap-4 rounded-md p-4 sm:p-5 lg:col-span-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="port-capital"
              className="font-sans text-xs font-medium text-text-secondary"
            >
              {isId ? "Total Nilai Portofolio (Rp)" : "Total Portfolio Value (IDR)"}
            </label>
            <FormattedNumberInput
              id="port-capital"
              prefix="Rp"
              value={totalCapitalRp}
              onChange={(v) => setTotalCapitalRp(Math.max(1_000_000, v))}
            />
          </div>

          <div className="divide-y divide-hairline rounded-sm border border-hairline bg-obsidian">
            {holdings.map((h, idx) => {
              const prof = report.assetProfiles[idx];
              return (
                <div
                  key={h.symbol}
                  className="flex items-center justify-between gap-2 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <span className="block font-mono text-xs font-bold text-text-primary">
                      {h.symbol}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted">
                      Vol {prof ? `${prof.annualizedVolPct.toFixed(1)}%` : "--"} · Norm{" "}
                      {prof ? `${prof.normalizedWeightPct.toFixed(0)}%` : "--"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <FormattedNumberInput
                        id={`port-weight-${h.symbol}`}
                        suffix="%"
                        value={h.weightPct}
                        onChange={(val) =>
                          setHoldings((prev) =>
                            prev.map((item) =>
                              item.symbol === h.symbol
                                ? { ...item, weightPct: Math.max(1, val) }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    {holdings.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setHoldings((prev) =>
                            prev.filter((item) => item.symbol !== h.symbol)
                          )
                        }
                        aria-label={`Remove ${h.symbol}`}
                        className="rounded-xs p-1.5 text-text-muted hover:text-rejected"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Ticker */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                placeholder="Tambah ticker (mis. BBRI.JK)"
                className="min-h-[38px] flex-1 rounded-sm border border-hairline bg-obsidian px-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-cleared/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddSymbol()}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-sm border border-cleared/45 bg-cleared/12 px-3 font-mono text-xs font-semibold text-cleared"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_ADD_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleAddSymbol(sym)}
                  className="rounded-xs border border-hairline bg-obsidian px-2 py-0.5 font-mono text-[10px] text-text-muted hover:text-cleared"
                >
                  + {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: N x N Heatmap + 3D Surface */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="terminal-panel overflow-x-auto rounded-md p-4">
            <span className="mb-3 block font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary">
              {isId
                ? "Matriks Korelasi Return Harian (-1.00 s/d +1.00)"
                : "Daily Log-Return Correlation Matrix (-1.00 to +1.00)"}
            </span>

            <table className="w-full border-collapse font-mono text-xs tabular-nums">
              <thead>
                <tr>
                  <th className="p-2 text-left text-[10px] text-text-muted">
                    ASSET
                  </th>
                  {report.symbols.map((sym) => (
                    <th
                      key={sym}
                      className="p-2 text-center text-[10px] text-text-secondary"
                    >
                      {sym.replace(".JK", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.matrix.map((row, rIdx) => (
                  <tr key={report.symbols[rIdx]}>
                    <td className="p-2 font-bold text-text-primary">
                      {report.symbols[rIdx]}
                    </td>
                    {row.map((corr, cIdx) => {
                      const isDiag = rIdx === cIdx;
                      const cellCls = isDiag
                        ? "bg-sky-400/15 text-sky-400"
                        : corr >= 0.68
                          ? "bg-rejected/20 font-bold text-rejected"
                          : corr <= 0.15
                            ? "bg-cleared/15 text-cleared"
                            : "bg-obsidian text-text-secondary";
                      return (
                        <td
                          key={`${rIdx}-${cIdx}`}
                          className={cn(
                            "border border-hairline p-2 text-center",
                            cellCls
                          )}
                        >
                          {corr.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="terminal-panel bg-blueprint-grid overflow-hidden rounded-md">
            <div className="flex items-center justify-between border-b border-hairline bg-obsidian/90 px-4 py-2 font-mono text-[10px]">
              <span className="font-semibold uppercase tracking-wider text-text-primary">
                3D COVARIANCE ELEVATION SURFACE
              </span>
              <span className="text-text-muted">DRAG 360°</span>
            </div>
            <Portfolio3DSurface matrix={report.matrix} />
          </div>
        </div>
      </div>
    </div>
  );
}
