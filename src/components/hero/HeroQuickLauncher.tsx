"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Briefcase, Play, Wallet } from "lucide-react";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const QUICK_TICKERS = [
  "BBCA.JK",
  "BBRI.JK",
  "TLKM.JK",
  "BTC-USD",
  "GC=F",
] as const;

const QUICK_BUSINESS_CHIPS: readonly {
  labelId: string;
  labelEn: string;
  input: Record<string, unknown>;
}[] = [
  {
    labelId: "Booth Kuliner Mal",
    labelEn: "Mall Food Kiosk",
    input: {
      initial_capital: 35_000_000,
      monthly_fixed_cost: 8_000_000,
      selling_price: 50_000,
      unit_cogs: 35_000,
      target_monthly_units: 750,
      platform_fee_pct: 20,
      tax_rate_pct: 0.5,
      cash_reserve: 12_000_000,
    },
  },
  {
    labelId: "Kopi Grab-and-Go",
    labelEn: "Grab-and-Go Coffee",
    input: {
      initial_capital: 25_000_000,
      monthly_fixed_cost: 3_500_000,
      selling_price: 22_000,
      unit_cogs: 9_000,
      target_monthly_units: 900,
      platform_fee_pct: 0,
      tax_rate_pct: 0.5,
      cash_reserve: 15_000_000,
    },
  },
  {
    labelId: "Ekspansi Ruko",
    labelEn: "Shophouse Expansion",
    input: {
      initial_capital: 120_000_000,
      monthly_fixed_cost: 18_000_000,
      selling_price: 65_000,
      unit_cogs: 38_000,
      target_monthly_units: 1_100,
      platform_fee_pct: 15,
      tax_rate_pct: 0.5,
      cash_reserve: 45_000_000,
    },
  },
];

const QUICK_CASHFLOW_CHIPS: readonly {
  labelId: string;
  labelEn: string;
  input: Record<string, unknown>;
}[] = [
  {
    labelId: "Cicilan PayLater",
    labelEn: "PayLater Installment",
    input: {
      monthly_income: 15_000_000,
      monthly_fixed_expenses: 6_500_000,
      existing_monthly_debt: 3_000_000,
      new_monthly_installment: 2_250_000,
      tenor_months: 12,
      stated_monthly_flat_rate_pct: 1.75,
      liquid_emergency_reserve: 18_000_000,
    },
  },
  {
    labelId: "KPR + Kendaraan",
    labelEn: "Mortgage + Auto Loan",
    input: {
      monthly_income: 28_000_000,
      monthly_fixed_expenses: 9_500_000,
      existing_monthly_debt: 6_000_000,
      new_monthly_installment: 4_500_000,
      tenor_months: 120,
      stated_monthly_flat_rate_pct: 0.85,
      liquid_emergency_reserve: 75_000_000,
    },
  },
  {
    labelId: "Audit Gaji Bulanan",
    labelEn: "Monthly Salary Check",
    input: {
      monthly_income: 10_000_000,
      monthly_fixed_expenses: 5_200_000,
      existing_monthly_debt: 1_500_000,
      new_monthly_installment: 500_000,
      tenor_months: 12,
      stated_monthly_flat_rate_pct: 1.1,
      liquid_emergency_reserve: 24_000_000,
    },
  },
];

/**
 * Zero-loss Quick Pre-Mortem Launcher embedded in the Landing Hero (`/`).
 * Pipes ticker or track selection directly into `/terminal/audit`.
 */
export function HeroQuickLauncher() {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const { queuePrefillInput } = useAuditUI();
  const [track, setTrack] = useState<AuditTrack>("trading");
  const [symbol, setSymbol] = useState("BBCA.JK");
  const isId = locale === "id";

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (track === "trading") {
      const clean = symbol.trim().toUpperCase() || "BBCA.JK";
      router.push(
        `/terminal/audit?track=trading&symbol=${encodeURIComponent(clean)}`
      );
      return;
    }
    router.push(`/terminal/audit?track=${track}`);
  };

  const handleQuickDemo = () => {
    router.push(`/terminal/audit?track=${track}&demo=1`);
  };

  return (
    <div className="terminal-panel mt-4 w-full max-w-2xl rounded-md p-2.5 text-left sm:mt-5 sm:p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
          {t("landing_suite.launcher_label")}
        </span>

        <div className="inline-flex items-center gap-1 rounded-xs border border-hairline bg-obsidian p-0.5">
          {(
            [
              { id: "trading", label: "Trading", Icon: Activity },
              { id: "business", label: isId ? "UMKM" : "SME", Icon: Briefcase },
              { id: "cashflow", label: "Cashflow", Icon: Wallet },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={track === id}
              onClick={() => setTrack(id)}
              className={cn(
                "inline-flex min-h-[38px] items-center gap-1.5 rounded-xs px-2.5 py-1.5 font-mono text-[11px] font-medium transition-colors sm:px-3",
                track === id
                  ? "bg-surface text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleLaunch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        {track === "trading" ? (
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder={t("landing_suite.launcher_symbol_ph")}
            aria-label={t("landing_suite.launcher_symbol_ph")}
            className="min-h-[38px] flex-1 rounded-sm border border-hairline bg-obsidian px-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-cleared/60 focus:outline-none"
          />
        ) : (
          <div className="flex min-h-[38px] flex-1 items-center rounded-sm border border-hairline bg-obsidian px-3 font-sans text-xs text-text-secondary">
            {track === "business"
              ? t("landing_suite.launcher_biz_preview")
              : t("landing_suite.launcher_cash_preview")}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-sm border border-hairline bg-obsidian px-3 font-mono text-[10.5px] font-medium uppercase tracking-wider text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
          >
            <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
            <span>{isId ? "Contoh" : "Demo"}</span>
          </button>

          <button
            type="submit"
            className="cta-primary-polish inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-sm bg-cleared px-4 font-mono text-[11px] font-semibold whitespace-nowrap uppercase tracking-wider text-on-cleared transition-all hover:brightness-110 sm:flex-initial"
          >
            <span>{t("landing_suite.launcher_cta")}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </form>

      {track === "trading" ? (
        <div className="no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto px-0.5">
          {QUICK_TICKERS.map((tk) => (
            <button
              key={tk}
              type="button"
              onClick={() => {
                setSymbol(tk);
                router.push(
                  `/terminal/audit?track=trading&symbol=${encodeURIComponent(tk)}`
                );
              }}
              className={cn(
                "shrink-0 rounded-xs border px-2 py-0.5 font-mono text-[10px] transition-colors",
                symbol.trim().toUpperCase() === tk
                  ? "border-cleared/45 bg-cleared/10 text-cleared"
                  : "border-hairline bg-canvas text-text-muted hover:text-text-primary"
              )}
            >
              {tk}
            </button>
          ))}
        </div>
      ) : (
        <div className="no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto px-0.5">
          {(track === "business" ? QUICK_BUSINESS_CHIPS : QUICK_CASHFLOW_CHIPS).map(
            (chip) => {
              const label = isId ? chip.labelId : chip.labelEn;
              return (
                <button
                  key={chip.labelId}
                  type="button"
                  onClick={() => {
                    queuePrefillInput(track, chip.input);
                    router.push(`/terminal/audit?track=${track}`);
                  }}
                  className="min-h-[32px] shrink-0 rounded-xs border border-hairline bg-canvas px-2.5 py-1 font-mono text-[10.5px] text-text-muted transition-colors hover:border-cleared/45 hover:text-cleared"
                >
                  {label}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
