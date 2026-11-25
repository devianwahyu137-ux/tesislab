"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookMarked,
  Boxes,
  Briefcase,
  FileSpreadsheet,
  GitCompare,
  Network,
  Play,
  Radio,
  Wallet,
} from "lucide-react";
import { AuditHistoryPanel } from "@/components/workspace/AuditHistoryPanel";
import { useTranslation } from "@/context/LanguageContext";
import {
  clearAuditHistory,
  loadAuditHistory,
  type AuditHistoryEntry,
} from "@/lib/auditHistory";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface TerminalOverviewClientProps {
  macroContext: MarketContext;
}

export function TerminalOverviewClient({
  macroContext,
}: TerminalOverviewClientProps) {
  const { locale, t } = useTranslation();
  const [entries, setEntries] = useState<AuditHistoryEntry[]>([]);

  useEffect(() => {
    const tId = setTimeout(() => setEntries(loadAuditHistory()), 0);
    return () => clearTimeout(tId);
  }, []);

  const regime = macroContext.synthesis.macro_regime;
  const macroSummary =
    locale === "en"
      ? macroContext.synthesis.summary_en
      : macroContext.synthesis.summary_id;
  const macroAlert =
    locale === "en"
      ? macroContext.synthesis.key_risk_alert_en
      : macroContext.synthesis.key_risk_alert_id;

  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;

  const macroCards = [
    {
      label: "USD / IDR",
      value: `Rp ${Math.round(USD_IDR.price).toLocaleString("id-ID")}`,
      delta: `${USD_IDR.change_pct >= 0 ? "+" : ""}${USD_IDR.change_pct.toFixed(2)}%`,
      tone: USD_IDR.change_pct > 0.3 ? "text-conditional" : "text-text-primary",
    },
    {
      label: "IHSG (IDX)",
      value: IHSG.price.toLocaleString("id-ID", { maximumFractionDigits: 2 }),
      delta: `${IHSG.change_pct >= 0 ? "+" : ""}${IHSG.change_pct.toFixed(2)}%`,
      tone: IHSG.change_pct >= 0 ? "text-cleared" : "text-rejected",
    },
    {
      label: "GOLD (XAU)",
      value: `$${Math.round(GOLD_USD.price).toLocaleString("en-US")}`,
      delta: `${GOLD_USD.change_pct >= 0 ? "+" : ""}${GOLD_USD.change_pct.toFixed(2)}%`,
      tone: "text-text-primary",
    },
    {
      label: "BTC / USD",
      value: `$${Math.round(BTC_USD.price).toLocaleString("en-US")}`,
      delta: `${BTC_USD.change_pct >= 0 ? "+" : ""}${BTC_USD.change_pct.toFixed(2)}%`,
      tone: BTC_USD.change_pct >= 0 ? "text-cleared" : "text-rejected",
    },
  ] as const;

  const primaryTracks = [
    {
      id: "trading",
      href: "/terminal/audit?track=trading",
      demoHref: "/terminal/audit?track=trading&demo=1",
      Icon: Activity,
      tag: "IDX LOTS · FEE · ATR-14 · KELLY",
    },
    {
      id: "business",
      href: "/terminal/audit?track=business",
      demoHref: "/terminal/audit?track=business&demo=1",
      Icon: Briefcase,
      tag: "BEP · RAMP-UP 3M · PPH UMKM 0,5%",
    },
    {
      id: "cashflow",
      href: "/terminal/audit?track=cashflow",
      demoHref: "/terminal/audit?track=cashflow&demo=1",
      Icon: Wallet,
      tag: "OJK DSR · TRUE EFFECTIVE APR",
    },
  ] as const;

  const suiteModules = [
    {
      href: "/terminal/war-room",
      title: t("terminal.nav_warroom"),
      desc:
        locale === "id"
          ? "Simulasi visual 3D ruang komite interaktif & inspeksi stasiun Hermes."
          : "Full-screen interactive 3D committee office & live Hermes desk telemetry.",
      Icon: Boxes,
      live: true,
    },
    {
      href: "/terminal/compare",
      title: t("terminal.nav_compare"),
      desc:
        locale === "id"
          ? "Adu ketahanan Skenario A vs Skenario B secara berdampingan."
          : "Side-by-side head-to-head stress comparison between Option A and Option B.",
      Icon: GitCompare,
      live: false,
    },
    {
      href: "/terminal/import",
      title: t("terminal.nav_import"),
      desc:
        locale === "id"
          ? "Ekstraksi CSV mutasi bank & arus kas UMKM 100% lokal di browser."
          : "100% local browser CSV bank statement & SME cashflow ingestion.",
      Icon: FileSpreadsheet,
      live: false,
    },
    {
      href: "/terminal/portfolio",
      title: t("terminal.nav_portfolio"),
      desc:
        locale === "id"
          ? "Matriks korelasi multi-aset, Value-at-Risk (VaR 95%), dan alokasi Kelly."
          : "Multi-asset Pearson correlation matrix, 95% VaR, and Kelly sizing.",
      Icon: Network,
      live: false,
    },
    {
      href: "/terminal/journal",
      title: t("terminal.nav_journal"),
      desc:
        locale === "id"
          ? "Buku besar riwayat keputusan penuh & pelacak skor akurasi Brier."
          : "Persistent decision ledger & post-mortem Brier calibration tracker.",
      Icon: BookMarked,
      live: false,
    },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      {/* Header + Macro Pulse */}
      <section className="flex flex-col gap-4 border-b border-hairline pb-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
              {t("terminal.overview_eyebrow")}
            </span>
            <h2 className="mt-1 font-editorial text-2xl font-medium tracking-tight text-text-primary sm:text-3xl">
              {t("terminal.overview_title")}
            </h2>
            <p className="editorial-measure mt-1.5 font-sans text-xs leading-relaxed text-text-secondary sm:text-sm">
              {t("terminal.overview_subtitle")}
            </p>
          </div>

          <Link
            href="/terminal/audit"
            className="cta-primary-polish inline-flex min-h-[40px] w-fit shrink-0 items-center gap-2 rounded-sm bg-cleared px-4 font-mono text-xs font-semibold whitespace-nowrap uppercase tracking-wider text-on-cleared transition-all hover:brightness-105"
          >
            <span>{t("terminal.nav_audit")}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>

        {/* Hermes Macro Strip + 4 Indicator Readouts */}
        <div className="terminal-panel rounded-md p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-primary">
                HERMES MACRO RADAR · {regime}
              </span>
            </div>
            <span className="font-mono text-[10px] text-conditional">
              {macroAlert}
            </span>
          </div>

          <p className="mb-3.5 font-sans text-xs leading-relaxed text-text-secondary">
            {macroSummary}
          </p>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {macroCards.map((card) => (
              <div
                key={card.label}
                className="flex flex-col gap-0.5 rounded-sm border border-hairline bg-obsidian px-3 py-2.5 font-mono tabular-nums"
              >
                <span className="text-[10px] text-text-muted">{card.label}</span>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-text-primary">
                    {card.value}
                  </span>
                  <span className={cn("text-[10.5px] font-semibold", card.tone)}>
                    {card.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Primary 3-Track Audit Launchers */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {primaryTracks.map(({ id, href, demoHref, Icon, tag }) => (
          <div
            key={id}
            className="terminal-panel flex flex-col justify-between gap-4 rounded-md p-4 transition-colors hover:border-active-border"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-cleared/35 bg-cleared/10 text-cleared">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-[9.5px] tracking-wider text-text-muted">
                  {tag}
                </span>
              </div>

              <h3 className="font-sans text-sm font-semibold text-text-primary">
                {t(`tracks.${id}.name`)}
              </h3>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {t(`tracks.${id}.description`)}
              </p>
            </div>

            <div className="flex items-center gap-2 border-t border-hairline pt-3">
              <Link
                href={href}
                className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1.5 rounded-xs border border-cleared/45 bg-cleared/12 px-3 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-cleared transition-colors hover:bg-cleared/20"
              >
                <span>{t("terminal.launch_module")}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href={demoHref}
                className="inline-flex min-h-[34px] items-center justify-center gap-1 rounded-xs border border-hairline bg-obsidian px-2.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
              >
                <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                <span>Demo</span>
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Suite Modules Grid */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {suiteModules.map(({ href, title, desc, Icon, live }) => (
          <Link
            key={href}
            href={href}
            className="terminal-panel group flex flex-col justify-between gap-3 rounded-md p-3.5 transition-colors hover:border-cleared/45"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    live ? "text-cleared" : "text-conditional"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "font-mono text-[9px] font-semibold uppercase tracking-wider",
                    live ? "text-cleared" : "text-text-muted"
                  )}
                >
                  {live ? "LIVE" : "LAB"}
                </span>
              </div>
              <span className="font-sans text-xs font-semibold text-text-primary group-hover:text-cleared">
                {title}
              </span>
              <p className="font-sans text-[11px] leading-relaxed text-text-muted">
                {desc}
              </p>
            </div>
          </Link>
        ))}
      </section>

      {/* Recent Session Audit History */}
      <AuditHistoryPanel
        entries={entries}
        onClear={() => {
          clearAuditHistory();
          setEntries([]);
        }}
      />
    </div>
  );
}
