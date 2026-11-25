"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import {
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
  Sun,
  X,
} from "lucide-react";
import { AuditSentinelCompanion } from "@/components/agents/AuditSentinelCompanion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
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

export function TerminalAppShell({
  macroContext,
  macroOrigin,
  children,
}: TerminalAppShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { isXrayMode, toggleXrayMode } = useAuditUI();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const tId = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (raw === "1") setCollapsed(true);
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

  const coreLinks = [
    {
      href: "/terminal",
      label: t("terminal.nav_overview"),
      Icon: LayoutGrid,
      exact: true,
    },
    {
      href: "/terminal/audit",
      label: t("terminal.nav_audit"),
      Icon: SlidersHorizontal,
      exact: false,
    },
    {
      href: "/terminal/war-room",
      label: t("terminal.nav_warroom"),
      Icon: Boxes,
      exact: false,
    },
  ] as const;

  const labLinks = [
    {
      href: "/terminal/compare",
      label: t("terminal.nav_compare"),
      Icon: GitCompare,
      exact: false,
    },
    {
      href: "/terminal/import",
      label: t("terminal.nav_import"),
      Icon: FileSpreadsheet,
      exact: false,
    },
    {
      href: "/terminal/portfolio",
      label: t("terminal.nav_portfolio"),
      Icon: Network,
      exact: false,
    },
    {
      href: "/terminal/journal",
      label: t("terminal.nav_journal"),
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
      ? "border-rejected/40 bg-rejected/10 text-rejected"
      : regime === "RISK_ON"
        ? "border-cleared/40 bg-cleared/10 text-cleared"
        : "border-conditional/40 bg-conditional/10 text-conditional";

  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;
  const isRemoteLive = macroOrigin === "remote_data_feed";

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas text-text-primary md:h-dvh md:overflow-hidden">
      <div className="flex min-h-0 flex-1">
        {/* iPad Compact Icon Rail (768px - 1023px) */}
        <aside
          aria-label="Terminal navigation rail"
          className="hidden w-[60px] shrink-0 flex-col justify-between border-r border-hairline bg-rail py-3 md:flex lg:hidden"
        >
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/"
              title="TesisLab"
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-hairline bg-surface font-editorial text-base font-bold text-text-primary transition-colors hover:border-cleared/50 hover:text-cleared"
            >
              T<span className="text-cleared">.</span>
            </Link>

            <div className="h-px w-7 bg-hairline" />

            <nav className="flex flex-col items-center gap-1.5">
              {allTerminalLinks.map(({ href, label, Icon, exact }) => {
                const active = isActiveHref(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-sm border transition-colors",
                      active
                        ? "border-cleared/50 bg-cleared/12 text-cleared"
                        : "border-transparent text-text-muted hover:bg-surface hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <Link
              href="/methodology"
              title={t("terminal.nav_methodology")}
              className="flex h-9 w-9 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              title={t("terminal.nav_home")}
              className="flex h-9 w-9 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>

        {/* Desktop Expandable Institutional Sidebar (>= 1024px) */}
        <aside
          aria-label="Terminal sidebar"
          className={cn(
            "hidden shrink-0 flex-col justify-between border-r border-hairline bg-rail transition-[width] duration-200 lg:flex",
            collapsed ? "w-[64px]" : "w-[232px]"
          )}
        >
          <div className="flex flex-col gap-4 p-3">
            {/* Brand + Collapse Toggle */}
            <div className="flex h-9 items-center justify-between gap-2 px-1">
              {!collapsed ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 font-editorial text-lg font-semibold tracking-tight text-text-primary hover:text-cleared"
                >
                  <span>TesisLab.</span>
                  <span className="rounded-xs border border-cleared/35 bg-cleared/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-cleared">
                    TERM
                  </span>
                </Link>
              ) : (
                <Link
                  href="/"
                  title="TesisLab"
                  className="mx-auto font-editorial text-lg font-bold text-text-primary hover:text-cleared"
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
                  className="rounded-xs p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
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
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-xs border border-hairline bg-surface text-text-muted transition-colors hover:text-text-primary"
              >
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {/* Group 1: Core Workstations */}
            <div className="flex flex-col gap-1">
              {!collapsed && (
                <span className="px-2 pb-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
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
                      "flex min-h-[36px] items-center gap-2.5 rounded-sm border px-2.5 font-sans text-xs font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "border-cleared/45 bg-cleared/12 text-cleared"
                        : "border-transparent text-text-secondary hover:bg-surface hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Group 2: Intelligence & Labs */}
            <div className="flex flex-col gap-1 border-t border-hairline pt-3">
              {!collapsed && (
                <span className="px-2 pb-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
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
                      "flex min-h-[36px] items-center gap-2.5 rounded-sm border px-2.5 font-sans text-xs font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "border-cleared/45 bg-cleared/12 text-cleared"
                        : "border-transparent text-text-secondary hover:bg-surface hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bottom Utility Links */}
          <div className="flex flex-col gap-1 border-t border-hairline p-3">
            <Link
              href="/methodology"
              title={collapsed ? t("terminal.nav_methodology") : undefined}
              className={cn(
                "flex min-h-[34px] items-center gap-2.5 rounded-sm px-2.5 font-sans text-xs text-text-muted transition-colors hover:bg-surface hover:text-text-primary",
                collapsed && "justify-center px-0"
              )}
            >
              <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span className="truncate">{t("terminal.nav_methodology")}</span>
              )}
            </Link>
            <Link
              href="/"
              title={collapsed ? t("terminal.nav_home") : undefined}
              className={cn(
                "flex min-h-[34px] items-center gap-2.5 rounded-sm px-2.5 font-sans text-xs text-text-muted transition-colors hover:bg-surface hover:text-text-primary",
                collapsed && "justify-center px-0"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span className="truncate">{t("terminal.nav_home")}</span>
              )}
            </Link>
          </div>
        </aside>

        {/* Main Viewport Column */}
        <div className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0">
          {/* Persistent Institutional Topbar */}
          <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-hairline bg-obsidian/95 px-3 backdrop-blur-xs sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* Mobile Brand */}
              <Link
                href="/"
                className="font-editorial text-base font-bold text-text-primary md:hidden"
              >
                TesisLab<span className="text-cleared">.</span>
              </Link>
              <span className="h-3.5 w-px bg-hairline md:hidden" aria-hidden="true" />

              <h1 className="truncate font-sans text-xs font-semibold tracking-tight text-text-primary sm:text-sm">
                {activeModuleTitle}
              </h1>

              <span
                className={cn(
                  "hidden shrink-0 items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider sm:inline-flex",
                  regimeTone
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isRemoteLive ? "bg-cleared" : "bg-conditional"
                  )}
                  aria-hidden="true"
                />
                <span>{regime}</span>
              </span>
            </div>

            {/* Inline Macro Readout (XL Desktop) */}
            <div className="hidden items-center gap-4 font-mono text-[10.5px] tabular-nums text-text-secondary xl:flex">
              <span>
                USD/IDR{" "}
                <strong className="text-text-primary">
                  Rp{Math.round(USD_IDR.price).toLocaleString("id-ID")}
                </strong>
              </span>
              <span>
                IHSG{" "}
                <strong
                  className={
                    IHSG.change_pct >= 0 ? "text-cleared" : "text-rejected"
                  }
                >
                  {IHSG.price.toFixed(0)} ({IHSG.change_pct >= 0 ? "+" : ""}
                  {IHSG.change_pct.toFixed(2)}%)
                </strong>
              </span>
              <span>
                GOLD{" "}
                <strong className="text-text-primary">
                  ${Math.round(GOLD_USD.price).toLocaleString("en-US")}
                </strong>
              </span>
              <span>
                BTC{" "}
                <strong
                  className={
                    BTC_USD.change_pct >= 0 ? "text-cleared" : "text-rejected"
                  }
                >
                  ${Math.round(BTC_USD.price).toLocaleString("en-US")}
                </strong>
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent(COMMAND_PALETTE_OPEN_EVENT)
                  )
                }
                aria-label={t("command.trigger_label")}
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-hairline bg-surface px-2 font-sans text-xs text-text-muted transition-colors hover:border-active-border hover:text-text-primary sm:px-2.5"
              >
                <Search className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                <kbd className="hidden font-mono text-[10px] sm:inline">⌘K</kbd>
              </button>

              <button
                type="button"
                onClick={toggleXrayMode}
                aria-pressed={isXrayMode}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-sm border px-2 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors sm:px-2.5",
                  isXrayMode
                    ? "border-cleared/60 bg-cleared/12 text-cleared"
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
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-hairline bg-surface text-text-secondary transition-colors hover:text-text-primary"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
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

      {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Mobile terminal navigation"
        className="fixed right-0 bottom-0 left-0 z-40 grid h-14 grid-cols-4 border-t border-hairline bg-obsidian/98 px-1 backdrop-blur-md md:hidden"
      >
        {coreLinks.map(({ href, label, Icon, exact }) => {
          const active = isActiveHref(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 font-mono text-[9.5px] font-medium transition-colors",
                active ? "text-cleared" : "text-text-muted hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="max-w-[74px] truncate">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 font-mono text-[9.5px] font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span>{t("terminal.more_modules")}</span>
        </button>
      </nav>

      {/* Vaul Mobile All-Modules Drawer */}
      <Drawer.Root open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-50 flex flex-col rounded-t-lg border-t border-active-border bg-surface p-4 text-text-primary outline-none">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" />
            <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2.5">
              <Drawer.Title className="font-mono text-xs font-semibold uppercase tracking-wider text-text-primary">
                {t("terminal.shell_badge")}
              </Drawer.Title>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-xs p-1 text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-3">
              {allTerminalLinks.map(({ href, label, Icon, exact }) => {
                const active = isActiveHref(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-sm border p-3 font-sans text-xs font-medium",
                      active
                        ? "border-cleared/50 bg-cleared/12 text-cleared"
                        : "border-hairline bg-obsidian text-text-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
              <Link
                href="/methodology"
                onClick={() => setMobileDrawerOpen(false)}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-cleared"
              >
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("terminal.nav_methodology")}</span>
              </Link>
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-cleared"
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
      <AuditSentinelCompanion />
    </div>
  );
}
