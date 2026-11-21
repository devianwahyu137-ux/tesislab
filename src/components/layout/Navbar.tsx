"use client";

import { useSyncExternalStore } from "react";
import { ScanLine } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  macroOrigin: MacroFeedOrigin;
}

function formatWibClock(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hh = parts.find((p) => p.type === "hour")?.value ?? "--";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "--";
  return `${hh}.${mm} WIB`;
}

let cachedClock = "--.-- WIB";
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function subscribeClock(callback: () => void): () => void {
  clockListeners.add(callback);
  if (typeof window !== "undefined" && !clockTimer) {
    const sync = () => {
      const next = formatWibClock();
      if (next !== cachedClock) {
        cachedClock = next;
        clockListeners.forEach((cb) => cb());
      }
    };
    const initTimer = setTimeout(sync, 0);
    clockTimer = setInterval(sync, 15_000);
    return () => {
      clearTimeout(initTimer);
      clockListeners.delete(callback);
      if (clockListeners.size === 0 && clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
      }
    };
  }
  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

function getClientClockSnapshot(): string {
  return cachedClock;
}

function getServerClockSnapshot(): string {
  return "--.-- WIB";
}

/**
 * Compact Swiss Editorial Terminal top bar with quick anchors,
 * live WIB market clock, macro feed status, X-Ray toggle, and language switcher.
 */
export function Navbar({ macroOrigin }: NavbarProps) {
  const { t } = useTranslation();
  const { isXrayMode, toggleXrayMode } = useAuditUI();
  const wibTime = useSyncExternalStore(
    subscribeClock,
    getClientClockSnapshot,
    getServerClockSnapshot
  );

  const isRemoteLive = macroOrigin === "remote_data_feed";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-obsidian/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-8">
        {/* Left: Brand Mark + Quick Anchor Links */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="font-editorial text-xl font-medium tracking-tight text-text-primary transition-colors hover:text-cleared md:text-[22px]"
          >
            TesisLab.
          </a>

          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-hairline md:inline-block"
          />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            <a
              href="#audit-workspace-slot"
              className="inline-flex min-h-[40px] items-center rounded-sm px-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              {t("nav.link_warroom")}
            </a>
            <a
              href="#cara-kerja"
              className="inline-flex min-h-[40px] items-center rounded-sm px-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              {t("nav.link_how")}
            </a>
            <a
              href="#committee-showcase"
              className="inline-flex min-h-[40px] items-center rounded-sm px-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              {t("nav.link_committee")}
            </a>
          </nav>
        </div>

        {/* Right: Live WIB Clock + Macro Stamp + X-Ray Toggle + Language Switcher */}
        <div className="flex items-center gap-2">
          <span className="hidden items-center rounded-sm border border-hairline bg-surface/80 px-2.5 py-1.5 font-mono text-[11px] tracking-wider text-text-secondary tabular-nums sm:inline-flex">
            {wibTime}
          </span>

          <StatusStamp
            variant={isRemoteLive ? "CLEARED" : "CONDITIONAL"}
            label={
              isRemoteLive
                ? t("nav.macro_live_short")
                : t("nav.macro_fallback_short")
            }
            className="hidden lg:inline-flex"
          />

          <button
            type="button"
            onClick={toggleXrayMode}
            aria-pressed={isXrayMode}
            title={t("nav.xray_hint")}
            className={cn(
              "inline-flex min-h-[42px] items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:px-3",
              isXrayMode
                ? "border-cleared/60 bg-cleared/12 text-cleared"
                : "border-hairline bg-surface text-text-secondary hover:border-active-border hover:text-text-primary"
            )}
          >
            <ScanLine className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t("nav.xray_label")}</span>
          </button>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
