"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import {
  Activity,
  ArrowLeft,
  BookMarked,
  Boxes,
  FileSpreadsheet,
  FlaskConical,
  GitCompare,
  LayoutGrid,
  Menu,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
import { TerminalInteractiveBackdrop } from "@/components/terminal/TerminalInteractiveBackdrop";
import { XRayArchitectureDrawer } from "@/components/xray/XRayArchitectureDrawer";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface TerminalAppShellProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
  children: React.ReactNode;
}

const SIDEBAR_STORAGE_KEY = "tesislab_sidebar_collapsed_v1";
const BG_MOTION_STORAGE_KEY = "tesislab_bg_motion_v1";

export function TerminalAppShell({
  macroContext,
  macroOrigin,
  children,
}: TerminalAppShellProps) {
  const pathname = usePathname();
  const { locale, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { isXrayMode, toggleXrayMode, liveRiskSnapshot } = useAuditUI();

  const [collapsed, setCollapsed] = useState(false);
  const [bgMotionEnabled, setBgMotionEnabled] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isId = locale === "id";

  useEffect(() => {
    const tId = setTimeout(() => {
      try {
        if (window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1") {
          setCollapsed(true);
        }
        if (window.localStorage.getItem(BG_MOTION_STORAGE_KEY) === "0") {
          setBgMotionEnabled(false);
        }
      } catch {
        // Ignore storage read errors
      }
    }, 0);
    return () => clearTimeout(tId);
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  const handleToggleBgMotion = () => {
    setBgMotionEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(BG_MOTION_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  const coreLinks = [
    {
      href: "/terminal",
      label: t("terminal.nav_overview"),
      desc: isId ? "Pusat komando & makro" : "Command center & macro",
      Icon: LayoutGrid,
      exact: true,
    },
    {
      href: "/terminal/audit",
      label: t("terminal.nav_audit"),
      desc: isId ? "Uji Trading, UMKM, Kas" : "Trading, SME & Cashflow",
      Icon: SlidersHorizontal,
      exact: false,
    },
    {
      href: "/terminal/war-room",
      label: t("terminal.nav_warroom"),
      desc: isId ? "Sidang komite visual 3D" : "3D live committee studio",
      Icon: Boxes,
      exact: false,
    },
  ] as const;

  const labLinks = [
    {
      href: "/terminal/compare",
      label: t("terminal.nav_compare"),
      desc: isId ? "Adu stres Skenario A vs B" : "Head-to-head stress arena",
      Icon: GitCompare,
      exact: false,
    },
    {
      href: "/terminal/import",
      label: t("terminal.nav_import"),
      desc: isId ? "Pindai mutasi CSV lokal" : "Local CSV bank scanner",
      Icon: FileSpreadsheet,
      exact: false,
    },
    {
      href: "/terminal/portfolio",
      label: t("terminal.nav_portfolio"),
      desc: isId ? "Matriks Pearson & VaR 95%" : "Pearson matrix & 95% VaR",
      Icon: Network,
      exact: false,
    },
    {
      href: "/terminal/journal",
      label: t("terminal.nav_journal"),
      desc: isId ? "Arsip vonis & Brier Score" : "Decision ledger & Brier",
      Icon: BookMarked,
      exact: false,
    },
  ] as const;

  const allTerminalLinks = [...coreLinks, ...labLinks];

  const isActiveHref = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activeModuleTitle =
    allTerminalLinks.find((item) => isActiveHref(item.href, item.exact))
      ?.label ?? t("terminal.nav_overview");

  const regime = macroContext.synthesis.macro_regime;
  const regimeTone =
    regime === "RISK_OFF"
      ? "border-rejected/50 bg-rejected/14 text-rejected shadow-[0_0_16px_-4px_rgba(239,68,68,0.35)]"
      : regime === "RISK_ON"
        ? "border-cleared/50 bg-cleared/14 text-cleared shadow-[0_0_16px_-4px_rgba(16,185,129,0.35)]"
        : "border-conditional/50 bg-conditional/14 text-conditional shadow-[0_0_16px_-4px_rgba(245,158,11,0.35)]";

  const liveScore = liveRiskSnapshot?.score ?? null;
  const liveScoreTone =
    liveScore === null
      ? "border-hairline bg-surface text-text-secondary"
      : liveScore >= 75
        ? "border-cleared/50 bg-cleared/12 text-cleared"
        : liveScore >= 50
          ? "border-conditional/50 bg-conditional/12 text-conditional"
          : "border-rejected/50 bg-rejected/12 text-rejected";

  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;
  const isRemoteLive = macroOrigin === "remote_data_feed";

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-canvas text-text-primary md:h-dvh md:overflow-hidden">
      {/* Interactive Simplex Vector Flow-Field & Cursor-Magnetic Telemetry Grid */}
      <TerminalInteractiveBackdrop
        macroRegime={regime}
        motionEnabled={bgMotionEnabled}
      />

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* iPad Compact Glass Icon Rail (768px - 1023px) */}
        <aside
          aria-label="Terminal navigation rail"
          className="hidden w-[64px] shrink-0 flex-col justify-between border-r border-hairline bg-rail/88 py-3 backdrop-blur-xl md:flex lg:hidden"
        >
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/"
              title="TesisLab"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-cleared/35 bg-surface font-editorial text-lg font-bold text-text-primary shadow-sm transition-all hover:border-cleared hover:text-cleared"
            >
              T<span className="text-cleared">.</span>
            </Link>

            <div className="h-px w-8 bg-hairline" />

            <nav className="flex flex-col items-center gap-2">
              {allTerminalLinks.map(({ href, label, Icon, exact }) => {
                const active = isActiveHref(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-md border transition-all",
                      active
                        ? "border-cleared/55 bg-cleared/16 text-cleared shadow-[0_0_18px_-4px_rgba(16,185,129,0.45)]"
                        : "border-transparent text-text-secondary hover:border-hairline hover:bg-surface hover:text-text-primary"
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute top-2 -left-1.5 h-5 w-1 rounded-r-full bg-cleared"
                      />
                    )}
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-2 pb-6">
            <Link
              href="/methodology"
              title={t("terminal.nav_methodology")}
              className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <FlaskConical className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              title={t("terminal.nav_home")}
              className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <ArrowLeft className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
          </div>
        </aside>

        {/* Desktop Expandable Luminous Sidebar (>= 1024px) */}
        <aside
          aria-label="Terminal sidebar"
          className={cn(
            "hidden shrink-0 flex-col justify-between border-r border-hairline bg-rail/86 backdrop-blur-xl transition-[width] duration-200 lg:flex",
            collapsed ? "w-[68px]" : "w-[248px]"
          )}
        >
          <div className="flex flex-col gap-5 p-3.5">
            {/* Brand + Collapse Toggle */}
            <div className="flex h-10 items-center justify-between gap-2 px-1">
              {!collapsed ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 font-editorial text-xl font-semibold tracking-tight text-text-primary transition-colors hover:text-cleared"
                >
                  <span>
                    TesisLab<span className="text-cleared">.</span>
                  </span>
                  <span className="rounded-sm border border-cleared/45 bg-cleared/14 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cleared shadow-[0_0_12px_-3px_rgba(16,185,129,0.4)]">
                    PRO SUITE
                  </span>
                </Link>
              ) : (
                <Link
                  href="/"
                  title="TesisLab"
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-md border border-cleared/35 bg-surface font-editorial text-lg font-bold text-text-primary hover:text-cleared"
                >
                  T<span className="text-cleared">.</span>
                </Link>
              )}

              {!collapsed && (
                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  title={t("terminal.collapse_sidebar")}
                  aria-label={t("terminal.collapse_sidebar")}
                  className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
                >
                  <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {collapsed && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                title={t("terminal.collapse_sidebar")}
                aria-label={t("terminal.collapse_sidebar")}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-text-secondary transition-colors hover:text-text-primary"
              >
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {/* Group 1: Core Workstations */}
            <div className="flex flex-col gap-1.5">
              {!collapsed && (
                <span className="px-2.5 pb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  {t("terminal.group_core")}
                </span>
              )}
              {coreLinks.map(({ href, label, Icon, exact }) => {
                const active = isActiveHref(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "relative flex min-h-[40px] items-center gap-3 rounded-md border px-3 font-sans text-[13px] font-medium transition-all",
                      collapsed && "justify-center px-0",
                      active
                        ? "border-cleared/50 bg-cleared/14 font-semibold text-cleared shadow-[0_0_20px_-6px_rgba(16,185,129,0.4)]"
                        : "border-transparent text-text-secondary hover:border-hairline/80 hover:bg-surface/85 hover:text-text-primary"
                    )}
                  >
                    {active && !collapsed && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cleared shadow-[0_0_10px_rgba(16,185,129,0.85)]"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-cleared" : "text-text-muted"
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Group 2: Intelligence & Labs */}
            <div className="flex flex-col gap-1.5 border-t border-hairline pt-4">
              {!collapsed && (
                <span className="px-2.5 pb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  {t("terminal.group_intelligence")}
                </span>
              )}
              {labLinks.map(({ href, label, Icon, exact }) => {
                const active = isActiveHref(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "relative flex min-h-[40px] items-center gap-3 rounded-md border px-3 font-sans text-[13px] font-medium transition-all",
                      collapsed && "justify-center px-0",
                      active
                        ? "border-cleared/50 bg-cleared/14 font-semibold text-cleared shadow-[0_0_20px_-6px_rgba(16,185,129,0.4)]"
                        : "border-transparent text-text-secondary hover:border-hairline/80 hover:bg-surface/85 hover:text-text-primary"
                    )}
                  >
                    {active && !collapsed && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cleared shadow-[0_0_10px_rgba(16,185,129,0.85)]"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-cleared" : "text-text-muted"
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bottom Utility Links (pb-16 clears any bottom-left dev pill cleanly) */}
          <div className="flex flex-col gap-1 border-t border-hairline p-3.5 pb-16">
            <Link
              href="/methodology"
              title={collapsed ? t("terminal.nav_methodology") : undefined}
              className={cn(
                "flex min-h-[38px] items-center gap-2.5 rounded-md px-3 font-sans text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary",
                collapsed && "justify-center px-0"
              )}
            >
              <FlaskConical
                className="h-4 w-4 shrink-0 text-text-muted"
                aria-hidden="true"
              />
              {!collapsed && (
                <span className="truncate">{t("terminal.nav_methodology")}</span>
              )}
            </Link>
            <Link
              href="/"
              title={collapsed ? t("terminal.nav_home") : undefined}
              className={cn(
                "flex min-h-[38px] items-center gap-2.5 rounded-md px-3 font-sans text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary",
                collapsed && "justify-center px-0"
              )}
            >
              <ArrowLeft
                className="h-4 w-4 shrink-0 text-text-muted"
                aria-hidden="true"
              />
              {!collapsed && (
                <span className="truncate">{t("terminal.nav_home")}</span>
              )}
            </Link>
          </div>
        </aside>

        {/* Main Viewport Column */}
        <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
          {/* Persistent Luminous Institutional Topbar */}
          <header className="sticky top-0 z-30 flex h-13 shrink-0 items-center justify-between gap-2 border-b border-hairline bg-obsidian/86 px-3.5 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* Mobile Brand */}
              <Link
                href="/"
                className="font-editorial text-lg font-bold text-text-primary md:hidden"
              >
                TesisLab<span className="text-cleared">.</span>
              </Link>
              <span
                className="h-4 w-px bg-hairline md:hidden"
                aria-hidden="true"
              />

              <h1 className="truncate font-sans text-[13.5px] font-semibold tracking-tight text-text-primary sm:text-[15px]">
                {activeModuleTitle}
              </h1>

              <span
                className={cn(
                  "hidden shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider sm:inline-flex",
                  regimeTone
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isRemoteLive ? "bg-cleared" : "bg-conditional"
                  )}
                  aria-hidden="true"
                />
                <span>{regime}</span>
              </span>
            </div>

            {/* Inline Macro Readout (XL Desktop) */}
            <div className="hidden items-center gap-4 rounded-md border border-hairline/80 bg-surface/65 px-3.5 py-1 font-mono text-[11.5px] tabular-nums text-text-secondary 2xl:flex">
              <span>
                USD/IDR{" "}
                <strong className="font-semibold text-text-primary">
                  Rp{Math.round(USD_IDR.price).toLocaleString("id-ID")}
                </strong>
              </span>
              <span className="h-3 w-px bg-hairline" aria-hidden="true" />
              <span>
                IHSG{" "}
                <strong
                  className={cn(
                    "font-semibold",
                    IHSG.change_pct >= 0 ? "text-cleared" : "text-rejected"
                  )}
                >
                  {IHSG.price.toFixed(0)} ({IHSG.change_pct >= 0 ? "+" : ""}
                  {IHSG.change_pct.toFixed(2)}%)
                </strong>
              </span>
              <span className="h-3 w-px bg-hairline" aria-hidden="true" />
              <span>
                GOLD{" "}
                <strong className="font-semibold text-text-primary">
                  ${Math.round(GOLD_USD.price).toLocaleString("en-US")}
                </strong>
              </span>
              <span className="h-3 w-px bg-hairline" aria-hidden="true" />
              <span>
                BTC{" "}
                <strong
                  className={cn(
                    "font-semibold",
                    BTC_USD.change_pct >= 0 ? "text-cleared" : "text-rejected"
                  )}
                >
                  ${Math.round(BTC_USD.price).toLocaleString("en-US")}
                </strong>
              </span>
            </div>

            {/* Right Controls (Replaces overlapping bottom-right Sentinel pill!) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {liveScore !== null && (
                <Link
                  href="/terminal/audit"
                  title={
                    isId
                      ? "Skor Ketahanan Rencana Aktif — Klik untuk kembali ke Audit"
                      : "Active Plan Resilience Score — Click to open Audit"
                  }
                  className={cn(
                    "hidden h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[11px] font-bold tabular-nums transition-all hover:brightness-110 md:inline-flex",
                    liveScoreTone
                  )}
                >
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{liveScore}/100</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent(COMMAND_PALETTE_OPEN_EVENT)
                  )
                }
                aria-label={t("command.trigger_label")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 font-sans text-xs font-medium text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
              >
                <Search
                  className="h-3.5 w-3.5 text-text-secondary"
                  aria-hidden="true"
                />
                <kbd className="hidden font-mono text-[11px] text-text-muted sm:inline">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={handleToggleBgMotion}
                aria-pressed={bgMotionEnabled}
                title={
                  isId
                    ? "Aktifkan / Jeda Latar Vektor Interaktif"
                    : "Toggle Interactive Flow-Field Background"
                }
                className={cn(
                  "hidden h-8 items-center gap-1 rounded-md border px-2 font-mono text-[10.5px] font-semibold uppercase tracking-wider transition-colors sm:inline-flex",
                  bgMotionEnabled
                    ? "border-cleared/45 bg-cleared/12 text-cleared"
                    : "border-hairline bg-surface text-text-muted hover:text-text-primary"
                )}
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>FX</span>
              </button>

              <button
                type="button"
                onClick={toggleXrayMode}
                aria-pressed={isXrayMode}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider transition-colors",
                  isXrayMode
                    ? "border-cleared/60 bg-cleared/14 text-cleared"
                    : "border-hairline bg-surface text-text-secondary hover:text-text-primary"
                )}
              >
                <ScanLine className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span className="hidden sm:inline">{t("nav.xray_label")}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={t("nav.theme_toggle_label")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface text-text-secondary transition-colors hover:text-text-primary"
              >
                {theme === "dark" ? (
                  <Sun
                    className="h-3.5 w-3.5 text-conditional"
                    aria-hidden="true"
                  />
                ) : (
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>

              <LanguageSwitcher />
            </div>
          </header>

          {/* Module Workspace Content */}
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* Mobile Fixed Luminous Bottom Navigation Bar (< 768px) — Zero Floating Overlap */}
      <nav
        aria-label="Mobile terminal navigation"
        className="fixed right-0 bottom-0 left-0 z-40 grid h-16 grid-cols-4 border-t border-hairline bg-obsidian/95 px-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        {coreLinks.map(({ href, label, Icon, exact }) => {
          const active = isActiveHref(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 font-sans text-[11px] font-medium transition-colors",
                active
                  ? "font-semibold text-cleared"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-10 rounded-b-full bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                />
              )}
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="max-w-[82px] truncate">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 font-sans text-[11px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span>{t("terminal.more_modules")}</span>
        </button>
      </nav>

      {/* Vaul Mobile All-Modules Drawer with Rich Descriptions */}
      <Drawer.Root open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-50 flex max-h-[85dvh] flex-col rounded-t-xl border-t border-active-border bg-surface p-4 text-text-primary outline-none">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-hairline" />
            <div className="mb-3 flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <Drawer.Title className="font-sans text-sm font-bold text-text-primary">
                  {t("terminal.shell_badge")}
                </Drawer.Title>
                <p className="font-sans text-xs text-text-muted">
                  {isId
                    ? "Pilih salah satu dari 7 ruang kerja spesialis"
                    : "Jump to any of the 7 specialized workstations"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-md border border-hairline bg-obsidian p-1.5 text-text-secondary hover:text-text-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 overflow-y-auto pb-3 sm:grid-cols-2">
              {allTerminalLinks.map(({ href, label, desc, Icon, exact }) => {
                const active = isActiveHref(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      active
                        ? "border-cleared/55 bg-cleared/12 text-cleared"
                        : "border-hairline bg-obsidian text-text-primary hover:border-active-border"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                        active
                          ? "border-cleared/45 bg-cleared/15 text-cleared"
                          : "border-hairline bg-surface text-text-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate font-sans text-[13px] font-semibold">
                        {label}
                      </span>
                      <span className="block truncate font-sans text-[11.5px] text-text-muted">
                        {desc}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
              <Link
                href="/methodology"
                onClick={() => setMobileDrawerOpen(false)}
                className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary hover:text-cleared"
              >
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("terminal.nav_methodology")}</span>
              </Link>
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary hover:text-cleared"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("terminal.nav_home")}</span>
              </Link>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <XRayArchitectureDrawer
        macroContext={macroContext}
        macroOrigin={macroOrigin}
      />
    </div>
  );
}
