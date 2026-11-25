"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, GitCompare, Trophy } from "lucide-react";
import { PrecisionSlider } from "@/components/ui/PrecisionSlider";
import { FormattedNumberInput } from "@/components/workspace/FormattedNumberInput";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  calculateBusinessAudit,
  calculateCashflowAudit,
  calculateTradeAudit,
  simulateBusinessStress,
  simulateCashflowStress,
  simulateTradeStress,
  type BusinessAuditInput,
  type CashflowAuditInput,
  type TradeAuditInput,
} from "@/lib/calculators";
import { runMonteCarloSimulation } from "@/lib/quant/monteCarlo";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const Compare3DDiffStage = dynamic(
  () => import("@/components/terminal/Compare3DDiffStage"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[210px] w-full items-center justify-center sm:h-[250px]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          INITIALIZING 3D DUAL-LANE STAGE...
        </span>
      </div>
    ),
  }
);

const STRESS_STEPS = [0, 10, 20, 30, 40, 50, 60] as const;

export function CompareArenaClient() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { queuePrefillInput } = useAuditUI();
  const isId = locale === "id";

  const [track, setTrack] = useState<AuditTrack>("business");
  const [shockPct, setShockPct] = useState<number>(20);

  // Track 1: Trading Option A vs B
  const [tradeA, setTradeA] = useState<TradeAuditInput>({
    asset_symbol: "BBCA.JK",
    direction: "LONG",
    total_capital: 50_000_000,
    position_size_pct: 25,
    entry_price: 9_200,
    take_profit: 10_120,
    stop_loss: 8_740,
    round_trip_fee_pct: 0.4,
    rationale: "Swing konservatif 1:2.0 dengan risiko terkunci <= 1.5%",
  });
  const [tradeB, setTradeB] = useState<TradeAuditInput>({
    asset_symbol: "BBCA.JK",
    direction: "LONG",
    total_capital: 50_000_000,
    position_size_pct: 55,
    entry_price: 9_200,
    take_profit: 9_550,
    stop_loss: 8_850,
    round_trip_fee_pct: 0.4,
    rationale: "Posisi agresif R:R 1:1.0 mengejar pantulan cepat",
  });

  // Track 2: Business Option A (Cloud Kitchen) vs Option B (Mall Booth)
  const [bizA, setBizA] = useState<BusinessAuditInput>({
    initial_capital: 45_000_000,
    monthly_fixed_cost: 4_800_000,
    selling_price: 45_000,
    unit_cogs: 22_000,
    target_monthly_units: 520,
    platform_commission_pct: 20,
    include_umkm_tax: true,
    business_concept: "Opsi A: Cloud Kitchen Sewa Ringan + Aplikasi 20%",
  });
  const [bizB, setBizB] = useState<BusinessAuditInput>({
    initial_capital: 45_000_000,
    monthly_fixed_cost: 14_500_000,
    selling_price: 48_000,
    unit_cogs: 22_000,
    target_monthly_units: 620,
    platform_commission_pct: 0,
    include_umkm_tax: true,
    business_concept: "Opsi B: Sewa Ruko/Mal Rp14,5 Jt Jual Langsung",
  });

  // Track 3: Cashflow Option A (Conservative Tenor + Larger DP) vs Option B (High Flat-Rate PayLater)
  const [cashA, setCashA] = useState<CashflowAuditInput>({
    monthly_net_income: 16_000_000,
    current_monthly_expenses: 8_000_000,
    existing_debt_installment: 1_500_000,
    new_monthly_installment: 1_800_000,
    installment_months: 12,
    flat_interest_pct_per_month: 0.6,
    liquid_emergency_fund: 55_000_000,
    decision_purpose: "Opsi A: DP Besar + Cicilan Bank Bunga Rendah",
  });
  const [cashB, setCashB] = useState<CashflowAuditInput>({
    monthly_net_income: 16_000_000,
    current_monthly_expenses: 8_000_000,
    existing_debt_installment: 1_500_000,
    new_monthly_installment: 3_600_000,
    installment_months: 12,
    flat_interest_pct_per_month: 1.75,
    liquid_emergency_fund: 22_000_000,
    decision_purpose: "Opsi B: Tanpa DP via PayLater Bunga Flat 1,75%/Bln",
  });

  const comparison = useMemo(() => {
    if (track === "trading") {
      const baseA = calculateTradeAudit(tradeA);
      const baseB = calculateTradeAudit(tradeB);
      const stressA = simulateTradeStress(tradeA, shockPct);
      const stressB = simulateTradeStress(tradeB, shockPct);
      const mcA = runMonteCarloSimulation("trading", tradeA, baseA);
      const mcB = runMonteCarloSimulation("trading", tradeB, baseB);
      const curveA = STRESS_STEPS.map(
        (s) => simulateTradeStress(tradeA, s).baseline_score
      );
      const curveB = STRESS_STEPS.map(
        (s) => simulateTradeStress(tradeB, s).baseline_score
      );
      return {
        scoreA: stressA.baseline_score,
        scoreB: stressB.baseline_score,
        ruinA: mcA.ruin_probability_pct,
        ruinB: mcB.ruin_probability_pct,
        p5A: mcA.p5_ending_value,
        p5B: mcB.p5_ending_value,
        flagsA: stressA.deterministic_flags as string[],
        flagsB: stressB.deterministic_flags as string[],
        curveA,
        curveB,
        kpiLabel: isId ? "R:R Bersih (Setelah Fee)" : "Net R:R (After Fee)",
        kpiA: `1 : ${stressA.net_rr_ratio.toFixed(2)}`,
        kpiB: `1 : ${stressB.net_rr_ratio.toFixed(2)}`,
        inputA: tradeA as unknown as Record<string, unknown>,
        inputB: tradeB as unknown as Record<string, unknown>,
      };
    }

    if (track === "business") {
      const baseA = calculateBusinessAudit(bizA);
      const baseB = calculateBusinessAudit(bizB);
      const stressA = simulateBusinessStress(bizA, shockPct);
      const stressB = simulateBusinessStress(bizB, shockPct);
      const mcA = runMonteCarloSimulation("business", bizA, baseA);
      const mcB = runMonteCarloSimulation("business", bizB, baseB);
      const curveA = STRESS_STEPS.map(
        (s) => simulateBusinessStress(bizA, s).baseline_score
      );
      const curveB = STRESS_STEPS.map(
        (s) => simulateBusinessStress(bizB, s).baseline_score
      );
      return {
        scoreA: stressA.baseline_score,
        scoreB: stressB.baseline_score,
        ruinA: mcA.ruin_probability_pct,
        ruinB: mcB.ruin_probability_pct,
        p5A: mcA.p5_ending_value,
        p5B: mcB.p5_ending_value,
        flagsA: stressA.deterministic_flags as string[],
        flagsB: stressB.deterministic_flags as string[],
        curveA,
        curveB,
        kpiLabel: isId ? "Laba / Rugi Tertekan" : "Stressed Monthly PnL",
        kpiA: `Rp ${Math.round(stressA.projected_monthly_profit).toLocaleString("id-ID")}`,
        kpiB: `Rp ${Math.round(stressB.projected_monthly_profit).toLocaleString("id-ID")}`,
        inputA: bizA as unknown as Record<string, unknown>,
        inputB: bizB as unknown as Record<string, unknown>,
      };
    }

    const baseA = calculateCashflowAudit(cashA);
    const baseB = calculateCashflowAudit(cashB);
    const stressA = simulateCashflowStress(cashA, shockPct);
    const stressB = simulateCashflowStress(cashB, shockPct);
    const mcA = runMonteCarloSimulation("cashflow", cashA, baseA);
    const mcB = runMonteCarloSimulation("cashflow", cashB, baseB);
    const curveA = STRESS_STEPS.map(
      (s) => simulateCashflowStress(cashA, s).baseline_score
    );
    const curveB = STRESS_STEPS.map(
      (s) => simulateCashflowStress(cashB, s).baseline_score
    );
    return {
      scoreA: stressA.baseline_score,
      scoreB: stressB.baseline_score,
      ruinA: mcA.ruin_probability_pct,
      ruinB: mcB.ruin_probability_pct,
      p5A: mcA.p5_ending_value,
      p5B: mcB.p5_ending_value,
      flagsA: stressA.deterministic_flags as string[],
      flagsB: stressB.deterministic_flags as string[],
      curveA,
      curveB,
      kpiLabel: isId ? "Total DSR OJK Tertekan" : "Stressed OJK DSR",
      kpiA: `${stressA.total_ojk_dsr_pct.toFixed(1)}%`,
      kpiB: `${stressB.total_ojk_dsr_pct.toFixed(1)}%`,
      inputA: cashA as unknown as Record<string, unknown>,
      inputB: cashB as unknown as Record<string, unknown>,
    };
  }, [track, shockPct, tradeA, tradeB, bizA, bizB, cashA, cashB, isId]);

  const winner =
    comparison.scoreA > comparison.scoreB
      ? "A"
      : comparison.scoreB > comparison.scoreA
        ? "B"
        : comparison.ruinA <= comparison.ruinB
          ? "A"
          : "B";

  const handlePromote = (side: "A" | "B") => {
    const chosen = side === "A" ? comparison.inputA : comparison.inputB;
    queuePrefillInput(track, chosen);
    router.push(`/terminal/audit?track=${track}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      {/* Header & Track Selector */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
            <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId
                ? "ARENA KOMPARASI KEPUTUSAN HEAD-TO-HEAD"
                : "HEAD-TO-HEAD DECISION ARENA"}
            </span>
          </span>
          <h2 className="mt-1 font-editorial text-2xl font-medium text-text-primary sm:text-3xl">
            {isId
              ? "Adu Ketahanan Skenario A vs. Skenario B."
              : "Stress-Test Scenario A Against Scenario B."}
          </h2>
        </div>

        <div className="inline-flex w-fit items-center gap-1 rounded-sm border border-hairline bg-obsidian p-1">
          {(["business", "trading", "cashflow"] as const).map((tr) => (
            <button
              key={tr}
              type="button"
              onClick={() => setTrack(tr)}
              className={cn(
                "min-h-[34px] rounded-xs px-3 font-mono text-[10.5px] font-semibold uppercase tracking-wider transition-colors",
                track === tr
                  ? "bg-surface text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {tr === "business"
                ? "UMKM"
                : tr === "trading"
                  ? "Trading"
                  : "Cashflow"}
            </button>
          ))}
        </div>
      </div>

      {/* Top Winner Verdict + 3D Dual-Lane Stress Stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="terminal-panel flex flex-col justify-between gap-4 rounded-md p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-cleared/40 bg-cleared/12 text-cleared">
                <Trophy className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {isId ? "PEMENANG KETAHANAN MATEMATIS" : "MATHEMATICAL WINNER"}
                </span>
                <span className="font-sans text-sm font-bold text-text-primary">
                  {isId ? `Skenario ${winner} Lebih Tahan Guncangan` : `Scenario ${winner} Survives Stress Better`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePromote(winner)}
              className="cta-primary-polish inline-flex min-h-[36px] items-center gap-1.5 rounded-sm bg-cleared px-3.5 font-mono text-[10.5px] font-semibold whitespace-nowrap uppercase tracking-wider text-on-cleared"
            >
              <span>
                {isId
                  ? `Sidang Skenario ${winner}`
                  : `Audit Scenario ${winner}`}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Simultaneous Stress Lever */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-text-secondary">
                {isId
                  ? "Guncangan Stres Simultan (Slippage / Penurunan Omzet / Gaji)"
                  : "Simultaneous Shock Level (Slippage / Volume / Income Drop)"}
              </span>
              <span className="font-bold text-conditional">{shockPct}%</span>
            </div>
            <PrecisionSlider
              id="compare-shock-slider"
              min={0}
              max={60}
              step={10}
              value={shockPct}
              onValueChange={setShockPct}
              tone={shockPct >= 30 ? "conditional" : "cleared"}
              ariaLabel="Simultaneous shock slider"
            />
          </div>

          {/* Head-to-Head Matrix */}
          <div className="divide-y divide-hairline rounded-sm border border-hairline bg-obsidian font-mono text-xs tabular-nums">
            <div className="grid grid-cols-3 px-3.5 py-2 text-[10px] uppercase tracking-wider text-text-muted">
              <span>{isId ? "Metrik" : "Metric"}</span>
              <span className="text-cleared">Skenario A</span>
              <span className="text-sky-400">Skenario B</span>
            </div>
            <div className="grid grid-cols-3 px-3.5 py-2.5">
              <span className="font-sans text-text-secondary">
                {isId ? "Skor Tertekan" : "Stressed Score"}
              </span>
              <span className="font-bold text-cleared">
                {comparison.scoreA} / 100
              </span>
              <span className="font-bold text-sky-400">
                {comparison.scoreB} / 100
              </span>
            </div>
            <div className="grid grid-cols-3 px-3.5 py-2.5">
              <span className="font-sans text-text-secondary">
                {isId ? "Risiko Ruin (MC)" : "MC Ruin Prob."}
              </span>
              <span className="text-text-primary">
                {comparison.ruinA.toFixed(1)}%
              </span>
              <span className="text-text-primary">
                {comparison.ruinB.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-3 px-3.5 py-2.5">
              <span className="font-sans text-text-secondary">
                {comparison.kpiLabel}
              </span>
              <span className="text-text-primary">{comparison.kpiA}</span>
              <span className="text-text-primary">{comparison.kpiB}</span>
            </div>
            <div className="grid grid-cols-3 px-3.5 py-2.5">
              <span className="font-sans text-text-secondary">
                {isId ? "Ekor P5 Terburuk" : "P5 Worst Tail"}
              </span>
              <span className="text-text-secondary">
                Rp {Math.round(comparison.p5A).toLocaleString("id-ID")}
              </span>
              <span className="text-text-secondary">
                Rp {Math.round(comparison.p5B).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Three.js 3D Dual-Lane Stress Stage */}
        <div className="terminal-panel bg-blueprint-grid flex flex-col justify-between overflow-hidden rounded-md lg:col-span-5">
          <div className="flex items-center justify-between border-b border-hairline bg-obsidian/90 px-4 py-2.5 font-mono text-[10px]">
            <span className="font-semibold uppercase tracking-wider text-text-primary">
              3D STRESS TRAJECTORY (0% → 60%)
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-cleared">■ A</span>
              <span className="text-sky-400">■ B</span>
            </div>
          </div>
          <Compare3DDiffStage
            curveA={comparison.curveA}
            curveB={comparison.curveB}
          />
          <div className="border-t border-hairline bg-obsidian/90 px-4 py-2 font-mono text-[10px] text-text-muted">
            {isId
              ? "Pilar berubah merah otomatis saat skor jatuh di bawah zona patah (< 50)"
              : "Pillars turn crimson automatically when score drops below breakdown (< 50)"}
          </div>
        </div>
      </div>

      {/* Side-by-Side Editable Parameter Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {(["A", "B"] as const).map((side) => {
          const isA = side === "A";
          const accent = isA
            ? "border-t-2 border-t-cleared"
            : "border-t-2 border-t-sky-400";

          return (
            <div
              key={side}
              className={cn(
                "terminal-panel flex flex-col gap-4 rounded-md p-5",
                accent
              )}
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <span
                  className={cn(
                    "font-mono text-xs font-bold uppercase tracking-wider",
                    isA ? "text-cleared" : "text-sky-400"
                  )}
                >
                  SKENARIO {side}
                </span>
                <button
                  type="button"
                  onClick={() => handlePromote(side)}
                  className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary hover:text-cleared"
                >
                  {isId ? "Buka di Audit →" : "Open in Audit →"}
                </button>
              </div>

              {track === "trading" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Modal (Rp)
                    </span>
                    <FormattedNumberInput
                      id={`cmp-trade-cap-${side}`}
                      prefix="Rp"
                      value={(isA ? tradeA : tradeB).total_capital}
                      onChange={(v) =>
                        isA
                          ? setTradeA({ ...tradeA, total_capital: v })
                          : setTradeB({ ...tradeB, total_capital: v })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Ukuran Posisi (%)
                    </span>
                    <FormattedNumberInput
                      id={`cmp-trade-size-${side}`}
                      suffix="%"
                      allowDecimal
                      value={(isA ? tradeA : tradeB).position_size_pct}
                      onChange={(v) =>
                        isA
                          ? setTradeA({
                              ...tradeA,
                              position_size_pct: Math.min(100, Math.max(1, v)),
                            })
                          : setTradeB({
                              ...tradeB,
                              position_size_pct: Math.min(100, Math.max(1, v)),
                            })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Take Profit
                    </span>
                    <FormattedNumberInput
                      id={`cmp-trade-tp-${side}`}
                      allowDecimal
                      value={(isA ? tradeA : tradeB).take_profit}
                      onChange={(v) =>
                        isA
                          ? setTradeA({ ...tradeA, take_profit: v })
                          : setTradeB({ ...tradeB, take_profit: v })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Stop Loss
                    </span>
                    <FormattedNumberInput
                      id={`cmp-trade-sl-${side}`}
                      allowDecimal
                      value={(isA ? tradeA : tradeB).stop_loss}
                      onChange={(v) =>
                        isA
                          ? setTradeA({ ...tradeA, stop_loss: v })
                          : setTradeB({ ...tradeB, stop_loss: v })
                      }
                    />
                  </div>
                </div>
              )}

              {track === "business" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Biaya Tetap / Bln
                    </span>
                    <FormattedNumberInput
                      id={`cmp-biz-fixed-${side}`}
                      prefix="Rp"
                      value={(isA ? bizA : bizB).monthly_fixed_cost}
                      onChange={(v) =>
                        isA
                          ? setBizA({ ...bizA, monthly_fixed_cost: v })
                          : setBizB({ ...bizB, monthly_fixed_cost: v })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Target Unit / Bln
                    </span>
                    <FormattedNumberInput
                      id={`cmp-biz-units-${side}`}
                      suffix="unit"
                      value={(isA ? bizA : bizB).target_monthly_units}
                      onChange={(v) =>
                        isA
                          ? setBizA({ ...bizA, target_monthly_units: v })
                          : setBizB({ ...bizB, target_monthly_units: v })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Harga Jual / Unit
                    </span>
                    <FormattedNumberInput
                      id={`cmp-biz-price-${side}`}
                      prefix="Rp"
                      value={(isA ? bizA : bizB).selling_price}
                      onChange={(v) =>
                        isA
                          ? setBizA({ ...bizA, selling_price: v })
                          : setBizB({ ...bizB, selling_price: v })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Komisi Aplikasi (%)
                    </span>
                    <FormattedNumberInput
                      id={`cmp-biz-comm-${side}`}
                      suffix="%"
                      allowDecimal
                      value={(isA ? bizA : bizB).platform_commission_pct ?? 0}
                      onChange={(v) =>
                        isA
                          ? setBizA({
                              ...bizA,
                              platform_commission_pct: Math.min(50, Math.max(0, v)),
                            })
                          : setBizB({
                              ...bizB,
                              platform_commission_pct: Math.min(50, Math.max(0, v)),
                            })
                      }
                    />
                  </div>
                </div>
              )}

              {track === "cashflow" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Cicilan Baru / Bln
                    </span>
                    <FormattedNumberInput
                      id={`cmp-cash-inst-${side}`}
                      prefix="Rp"
                      value={(isA ? cashA : cashB).new_monthly_installment}
                      onChange={(v) =>
                        isA
                          ? setCashA({ ...cashA, new_monthly_installment: v })
                          : setCashB({ ...cashB, new_monthly_installment: v })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Bunga Flat (% / Bln)
                    </span>
                    <FormattedNumberInput
                      id={`cmp-cash-apr-${side}`}
                      suffix="%"
                      allowDecimal
                      value={
                        (isA ? cashA : cashB).flat_interest_pct_per_month ?? 0
                      }
                      onChange={(v) =>
                        isA
                          ? setCashA({
                              ...cashA,
                              flat_interest_pct_per_month: Math.min(
                                20,
                                Math.max(0, v)
                              ),
                            })
                          : setCashB({
                              ...cashB,
                              flat_interest_pct_per_month: Math.min(
                                20,
                                Math.max(0, v)
                              ),
                            })
                      }
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="font-sans text-xs text-text-secondary">
                      Dana Darurat Likuid (Rp)
                    </span>
                    <FormattedNumberInput
                      id={`cmp-cash-efund-${side}`}
                      prefix="Rp"
                      value={(isA ? cashA : cashB).liquid_emergency_fund}
                      onChange={(v) =>
                        isA
                          ? setCashA({ ...cashA, liquid_emergency_fund: v })
                          : setCashB({ ...cashB, liquid_emergency_fund: v })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
