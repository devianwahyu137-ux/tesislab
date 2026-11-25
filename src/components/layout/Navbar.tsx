"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight, Moon, ScanLine, Search, Sun } from "lucide-react";
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
 * Multi-page Institutional Marketing Navbar connecting Landing (`/`),
 * Methodology (`/methodology`), 3D War-Room (`/terminal/war-room`),
 * and the Primary Terminal Launch CTA (`/terminal/audit`).
 */
export function Navbar({ macroOrigin }: NavbarProps) {
  const pathname = usePathname();
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

  const isRemoteLive = macroOrigin === "remote_data_feed";

  const navItems = [
    { href: "/", label: t("nav.back_home"), match: pathname === "/" },
    {
      href: "/methodology",
      label: t("nav.link_methodology"),
      match: pathname.startsWith("/methodology"),
    },
    {
      href: "/terminal/war-room",
      label: t("nav.link_warroom"),
      match: pathname.startsWith("/terminal/war-room"),
    },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline/90 bg-obsidian/95 backdrop-blur-xs">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-14 sm:gap-3 sm:px-5 md:px-8">
        {/* Left: Brand Mark + Multi-Page Navigation */}
        <div className="flex items-center gap-2.5 md:gap-5">
          <Link
            href="/"
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
          </Link>

          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-hairline md:inline-block"
          />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex h-9 items-center rounded-md px-3 font-sans text-[13px] font-medium tracking-[-0.01em] transition-colors",
                  item.match
                    ? "bg-surface text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Search + Clock + X-Ray + Theme + Language + Launch Terminal CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT))
            }
            aria-label={t("command.trigger_label")}
            title={t("command.trigger_label")}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-hairline bg-surface/85 px-2 font-sans text-xs text-text-muted transition-colors hover:border-active-border hover:text-text-primary sm:h-9 sm:px-2.5"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden="true" />
            <kbd className="hidden rounded-xs border border-hairline bg-obsidian px-1.5 py-0.5 font-mono text-[10px] text-text-muted lg:inline">
              ⌘K
            </kbd>
          </button>

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

          <button
            type="button"
            onClick={toggleXrayMode}
            aria-pressed={isXrayMode}
            title={t("nav.xray_hint")}
            className={cn(
              "hidden h-8 items-center gap-1.5 rounded-md border px-2 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors sm:inline-flex sm:h-9 sm:px-2.5",
              isXrayMode
                ? "border-cleared/60 bg-cleared/12 text-cleared"
                : "border-hairline bg-surface/85 text-text-secondary hover:border-cleared/45 hover:text-text-primary"
            )}
          >
            <ScanLine className="h-3.5 w-3.5 shrink-0 text-cleared" aria-hidden="true" />
            <span className="hidden lg:inline">{t("nav.xray_label")}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("nav.theme_toggle_label")}
            title={t("nav.theme_toggle_label")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface/85 text-text-secondary transition-colors hover:text-text-primary sm:h-9 sm:w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-conditional" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <LanguageSwitcher />

          <Link
            href="/terminal/audit"
            className="cta-primary-polish inline-flex h-8 items-center gap-1 rounded-md bg-cleared px-2.5 font-sans text-[11px] font-semibold text-on-cleared transition-all hover:brightness-110 sm:h-9 sm:px-3.5 sm:text-xs"
          >
            <span>{t("nav.open_terminal")}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <motion.div
        aria-hidden="true"
        style={{ scaleX: smoothProgress }}
        className="h-[2px] w-full origin-left bg-gradient-to-r from-cleared/50 via-cleared to-cleared/80"
      />
    </header>
  );
}
