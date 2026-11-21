"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Moon, ScanLine, Sun } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
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
    const initTimer = setTimeout(sync, 250);
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
 * live WIB clock, macro stamp, X-Ray toggle, Light/Dark theme switch, and language switcher.
 */
export function Navbar({ macroOrigin }: NavbarProps) {
  const { t } = useTranslation();
  const { isXrayMode, toggleXrayMode } = useAuditUI();
  const { theme, toggleTheme } = useTheme();
  const wibTime = useSyncExternalStore(
    subscribeClock,
    getClientClockSnapshot,
    getServerClockSnapshot
  );

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  });

  const [activeSection, setActiveSection] = useState<string>(
    "audit-workspace-slot"
  );

  useEffect(() => {
    const sectionIds = [
      "audit-workspace-slot",
      "cara-kerja",
      "committee-showcase",
      "riset",
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0.05 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const isRemoteLive = macroOrigin === "remote_data_feed";

  const navItems = [
    { id: "audit-workspace-slot", label: t("nav.link_warroom") },
    { id: "cara-kerja", label: t("nav.link_how") },
    { id: "committee-showcase", label: t("nav.link_committee") },
    { id: "riset", label: t("nav.link_research") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-obsidian/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-8">
        {/* Left: Brand Mark + Quick Anchor Links */}
        <div className="flex items-center gap-3 md:gap-4">
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
            className="hidden items-center gap-0.5 md:flex"
          >
            {navItems.map((item) => {
              const isCurrent = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    "inline-flex min-h-[40px] items-center rounded-sm px-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                    isCurrent
                      ? "bg-surface font-semibold text-cleared"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right: Live WIB Clock + Macro Stamp + X-Ray Toggle + Theme Toggle + Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            suppressHydrationWarning
            className="hidden items-center rounded-sm border border-hairline bg-surface/80 px-2.5 py-1.5 font-mono text-[11px] tracking-wider text-text-secondary tabular-nums xl:inline-flex"
          >
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
            onClick={() =>
              window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT))
            }
            aria-label={t("command.trigger_label")}
            title={t("command.trigger_label")}
            className="hidden min-h-[40px] items-center gap-1 rounded-sm border border-hairline bg-surface px-2.5 font-mono text-[11px] tracking-wider text-text-secondary transition-colors hover:border-active-border hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:inline-flex"
          >
            <span>⌘K</span>
          </button>

          <button
            type="button"
            onClick={toggleXrayMode}
            aria-pressed={isXrayMode}
            title={t("nav.xray_hint")}
            className={cn(
              "inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:px-3",
              isXrayMode
                ? "border-cleared/60 bg-cleared/12 text-cleared"
                : "border-hairline bg-surface text-text-secondary hover:border-active-border hover:text-text-primary"
            )}
          >
            <ScanLine className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden xs:inline sm:inline">{t("nav.xray_label")}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("nav.theme_toggle_label")}
            title={t("nav.theme_toggle_label")}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-sm border border-hairline bg-surface text-text-secondary transition-colors hover:border-active-border hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <LanguageSwitcher />
        </div>
      </div>

      {/* Ultra-thin Spring Scroll Progress Indicator */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: smoothProgress }}
        className="h-[1.5px] w-full origin-left bg-cleared/80"
      />
    </header>
  );
}
