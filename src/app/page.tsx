"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { MetricReadout } from "@/components/ui/MetricReadout";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { useTranslation } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen w-full bg-obsidian text-text-primary">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
        {/* Top Terminal Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
              TesisLab // SYS-03
            </span>
            <StatusStamp
              variant="LIVE FEED"
              label={t("nav.macro_status")}
            />
          </div>
          <LanguageSwitcher />
        </header>

        {/* Hero Typography Showcase */}
        <EditorialPanel indexCode="PM-2026.01">
          <div className="flex flex-col gap-4">
            <h1 className="font-editorial max-w-3xl text-3xl font-medium leading-[1.15] tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              {t("hero.headline")}
            </h1>
            <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary md:text-base">
              {t("hero.subheadline")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex min-h-[44px] items-center rounded-sm border border-cleared/40 bg-cleared/10 px-5 font-mono text-xs uppercase tracking-wider text-cleared">
                {t("hero.cta_primary")}
              </span>
              <span className="inline-flex min-h-[44px] items-center rounded-sm border border-active-border bg-obsidian px-5 font-mono text-xs uppercase tracking-wider text-text-secondary">
                {t("hero.cta_demo")}
              </span>
            </div>
          </div>
        </EditorialPanel>

        <TerminalDivider label={t("common.stress_test_title")} />

        {/* Responsive Primitives Grid: 1 col Mobile, 2 col iPad, 3 col Desktop */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <EditorialPanel
            title={t("tracks.trading.name")}
            indexCode="TRK-01"
          >
            <div className="flex flex-col gap-4">
              <StatusStamp
                variant="CLEARED"
                label={t("verdict.status.cleared")}
              />
              <MetricReadout
                label="Risk / Reward"
                value="1 : 2.85"
                subtext="Max Drawdown 1.50% / trade"
                tone="cleared"
              />
              <TerminalDivider />
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {t("tracks.trading.description")}
              </p>
            </div>
          </EditorialPanel>

          <EditorialPanel
            title={t("tracks.business.name")}
            indexCode="TRK-02"
          >
            <div className="flex flex-col gap-4">
              <StatusStamp
                variant="CONDITIONAL"
                label={t("verdict.status.conditional")}
              />
              <MetricReadout
                label="Cash Runway"
                value="4.2 MO"
                subtext="BEP: 1,420 units / month"
                tone="conditional"
              />
              <TerminalDivider />
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {t("tracks.business.description")}
              </p>
            </div>
          </EditorialPanel>

          <EditorialPanel
            title={t("tracks.cashflow.name")}
            indexCode="TRK-03"
            className="md:col-span-2 lg:col-span-1"
          >
            <div className="flex flex-col gap-4">
              <StatusStamp
                variant="REJECTED"
                label={t("verdict.status.rejected")}
              />
              <MetricReadout
                label="Debt Service Ratio"
                value="48.60%"
                subtext="Emergency Reserve: 1.8 MO"
                tone="rejected"
              />
              <TerminalDivider />
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {t("tracks.cashflow.description")}
              </p>
            </div>
          </EditorialPanel>
        </section>

        {/* Footer Disclaimer */}
        <footer className="border-t border-hairline pt-5">
          <p className="font-mono text-xs leading-relaxed text-text-muted">
            {t("verdict.disclaimer")}
          </p>
        </footer>
      </div>
    </main>
  );
}
