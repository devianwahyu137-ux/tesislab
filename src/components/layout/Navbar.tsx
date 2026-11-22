"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Moon, ScanLine, Search, Sun } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
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
 * Refined Swiss Institutional Top Navbar with clean brand identity,
 * smooth spring active-section links, dedicated Search/⌘K pill,
 * unified Live Status + WIB clock, X-Ray Inspector toggle, Theme & Language controls.
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
    <header className="sticky top-0 z-40 w-full border-b border-hairline/90 bg-obsidian/96 backdrop-blur-xs">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-14 sm:gap-3 sm:px-5 md:px-8">
        {/* Left: Brand Mark + Primary Anchor Links */}
        <div className="flex items-center gap-2.5 md:gap-5">
          <a
            href="#"
            className="group inline-flex items-center gap-1.5 font-editorial text-lg font-semibold tracking-tight text-text-primary transition-colors hover:text-cleared sm:gap-2 sm:text-xl md:text-[22px]"
          >
            <span>TesisLab.</span>
            <span
              title={isRemoteLive ? t("nav.macro_live") : t("nav.macro_fallback")}
              className={cn(
                "h-2 w-2 rounded-full",
                isRemoteLive
                  ? "bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.75)]"
                  : "bg-conditional"
              )}
              aria-hidden="true"
            />
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
                    "relative inline-flex h-9 items-center rounded-md px-3 font-sans text-[13px] font-medium tracking-[-0.01em] transition-colors",
                    isCurrent
                      ? "text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {isCurrent && (
                    <motion.span
                      layoutId="navbar-active-tab"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-md border border-active-border/60 bg-surface/90"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right: Clean Search Trigger + Unified Live Clock + X-Ray + Theme + Language */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Clear, Familiar Search Bar Button */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT))
            }
            aria-label={t("command.trigger_label")}
            title={t("command.trigger_label")}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-hairline bg-surface/85 px-2 font-sans text-xs text-text-muted transition-colors hover:border-active-border hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:h-9 sm:px-3"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden="true" />
            <span className="hidden lg:inline">{t("nav.search_btn")}</span>
            <kbd className="hidden rounded-xs border border-hairline bg-obsidian px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
              ⌘K
            </kbd>
          </button>

          {/* Unified Compact Live Status + WIB Clock (Desktop XL) */}
          <div
            suppressHydrationWarning
            className="hidden h-9 items-center gap-2 rounded-md border border-hairline bg-surface/60 px-2.5 font-mono text-[10px] tracking-wider text-text-secondary tabular-nums xl:inline-flex"
          >
            <span
              className={cn(
                "font-semibold",
                isRemoteLive ? "text-cleared" : "text-conditional"
              )}
            >
              {isRemoteLive
                ? t("nav.macro_live_short")
                : t("nav.macro_fallback_short")}
            </span>
            <span className="h-3 w-px bg-hairline" aria-hidden="true" />
            <span>{wibTime}</span>
          </div>

          {/* X-Ray Transparency Toggle */}
          <button
            type="button"
            onClick={toggleXrayMode}
            aria-pressed={isXrayMode}
            title={t("nav.xray_hint")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:h-9 sm:px-3 sm:text-[11px]",
              isXrayMode
                ? "border-cleared/60 bg-cleared/12 text-cleared shadow-[0_0_12px_rgba(16,185,129,0.18)]"
                : "border-hairline bg-surface/85 text-text-secondary hover:border-cleared/45 hover:text-text-primary"
            )}
          >
            <ScanLine className="h-3.5 w-3.5 shrink-0 text-cleared" aria-hidden="true" />
            <span className="hidden sm:inline">{t("nav.xray_label")}</span>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("nav.theme_toggle_label")}
            title={t("nav.theme_toggle_label")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface/85 text-text-secondary transition-colors hover:border-active-border hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared sm:h-9 sm:w-9"
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
