"use client";

import Link from "next/link";
import { ArrowUp, Cpu, Terminal } from "lucide-react";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Multi-route Institutional Footer for the `(marketing)` route group.
 */
export function MarketingFooter() {
  const { t } = useTranslation();
  const { toggleXrayMode } = useAuditUI();

  return (
    <footer className="surface-specular relative mx-auto mt-6 mb-8 w-full max-w-6xl overflow-hidden rounded-md border border-hairline px-5 pt-10 pb-10 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-cleared/45 to-transparent"
      />
      <div className="grid grid-cols-1 gap-8 pb-8 sm:grid-cols-2 lg:grid-cols-12">
        {/* Column 1: Brand & System Status */}
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="font-editorial text-xl font-bold tracking-tight text-text-primary hover:text-cleared"
            >
              TesisLab.
            </Link>
            <span className="rounded-xs border border-cleared/35 bg-cleared/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cleared">
              tesislab.app
            </span>
          </div>
          <p className="max-w-sm font-sans text-xs leading-relaxed text-text-secondary">
            {t("footer.tagline")}
          </p>
          <div className="mt-1 inline-flex w-fit items-center gap-2 rounded-xs border border-hairline bg-obsidian px-2.5 py-1 font-mono text-[10px] text-text-muted">
            <span
              className="h-1.5 w-1.5 rounded-full bg-cleared"
              aria-hidden="true"
            />
            <span>v2.0 MULTI-TERMINAL · DECIMAL.JS · HERMES</span>
          </div>
        </div>

        {/* Column 2: Platform Pages */}
        <div className="flex flex-col gap-2.5 lg:col-span-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            {t("footer.nav_title")}
          </span>
          <nav
            aria-label="Footer navigation"
            className="flex flex-col gap-2 font-sans text-[13px] text-text-secondary"
          >
            <Link
              href="/terminal"
              className="w-fit transition-colors hover:text-cleared"
            >
              {t("terminal.nav_overview")}
            </Link>
            <Link
              href="/terminal/audit"
              className="w-fit transition-colors hover:text-cleared"
            >
              {t("terminal.nav_audit")}
            </Link>
            <Link
              href="/terminal/war-room"
              className="w-fit transition-colors hover:text-cleared"
            >
              {t("nav.link_warroom")}
            </Link>
            <Link
              href="/methodology"
              className="w-fit transition-colors hover:text-cleared"
            >
              {t("nav.link_methodology")}
            </Link>
            <Link
              href="/#memo"
              className="w-fit transition-colors hover:text-cleared"
            >
              {t("footer.link_manifesto")}
            </Link>
            <Link
              href="/#roadmap"
              className="w-fit transition-colors hover:text-cleared"
            >
              Roadmap
            </Link>
          </nav>
        </div>

        {/* Column 3: Direct 1-Click Workstation Launchers */}
        <div className="flex flex-col gap-2.5 lg:col-span-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            {t("footer.quick_launch_title")}
          </span>
          <div className="flex flex-col gap-1.5">
            {(["trading", "business", "cashflow"] as const).map((track) => (
              <Link
                key={track}
                href={`/terminal/audit?track=${track}`}
                className="flex items-center justify-between rounded-xs border border-hairline bg-obsidian px-3 py-2 text-left font-mono text-[11px] font-medium text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
              >
                <span>{t(`tracks.${track}.name`)}</span>
                <span className="text-[10px] opacity-60">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Column 4: Quick Tools & Shortcuts */}
        <div className="flex flex-col gap-2.5 lg:col-span-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            {t("footer.tools_title")}
          </span>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent(COMMAND_PALETTE_OPEN_EVENT)
                )
              }
              className="flex items-center justify-between rounded-xs border border-hairline bg-surface px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
            >
              <span className="inline-flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{t("nav.search_btn")}</span>
              </span>
              <kbd className="rounded-xs border border-hairline bg-obsidian px-1.5 py-0.5 text-[9px] text-text-muted">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={toggleXrayMode}
              className="flex items-center justify-between rounded-xs border border-hairline bg-surface px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-cleared/50 hover:text-text-primary"
            >
              <span className="inline-flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
                <span>{t("nav.xray_label")}</span>
              </span>
              <span className="text-[9px] uppercase text-text-muted">Inspect</span>
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center justify-between rounded-xs border border-hairline bg-surface px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("footer.back_to_top")}</span>
              </span>
              <span className="text-[9px] text-text-muted">↑</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Authoritative Disclaimer & Copyright */}
      <div className="flex flex-col justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
        <p className="max-w-3xl font-mono text-[11px] leading-relaxed text-ink-muted">
          {t("verdict.disclaimer")}
        </p>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
          © 2026 TesisLab.
        </span>
      </div>
    </footer>
  );
}
