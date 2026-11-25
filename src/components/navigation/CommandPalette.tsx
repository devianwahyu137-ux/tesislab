"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  BookMarked,
  Boxes,
  Briefcase,
  CornerDownLeft,
  Cpu,
  FileSpreadsheet,
  Flame,
  FlaskConical,
  GitCompare,
  Globe,
  Home,
  LayoutGrid,
  Moon,
  Network,
  Search,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export const COMMAND_PALETTE_OPEN_EVENT = "tesislab:open-command-palette";

/**
 * Global Cmd+K / Ctrl+K Institutional Multi-Route Command Palette powered by cmdk.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { locale, setLocale, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { setActiveTrack, toggleXrayMode } = useAuditUI();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onCustomOpen);
    };
  }, []);

  const closePalette = () => {
    setOpen(false);
    setSearch("");
  };

  const navigateTo = (href: string) => {
    closePalette();
    router.push(href);
  };

  const selectTrack = (track: AuditTrack) => {
    setActiveTrack(track);
    navigateTo(`/terminal/audit?track=${track}`);
  };

  const runTrapDemo = (track: AuditTrack) => {
    setActiveTrack(track);
    navigateTo(`/terminal/audit?track=${track}&demo=1`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-obsidian/75 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={closePalette}
    >
      <div
        className="surface-specular w-full max-w-xl overflow-hidden rounded-md border border-active-border bg-surface shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-gradient-to-r from-cleared via-cleared/40 to-transparent"
        />

        <Command
          label="TesisLab Command Palette"
          className="flex flex-col"
          onKeyDown={(e) => {
            if (e.key === "Escape") closePalette();
          }}
        >
          <div className="flex items-center gap-3 border-b border-hairline bg-obsidian px-4 py-3.5">
            <Search
              className="h-4 w-4 shrink-0 text-cleared"
              aria-hidden="true"
            />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder={t("command.placeholder")}
              className="w-full bg-transparent font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="rounded-xs p-1 text-text-muted transition-colors hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <kbd className="rounded-xs border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2.5">
            <Command.Empty className="py-10 text-center font-mono text-xs text-text-muted">
              {t("command.empty")}
            </Command.Empty>

            {/* Group 1: Audit Tracks */}
            <Command.Group
              heading={t("command.group_tracks")}
              className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              {(
                [
                  {
                    id: "trading",
                    value: "trading market audit saham kripto bbca btc",
                    Icon: Activity,
                  },
                  {
                    id: "business",
                    value: "business umkm sme audit booth bep runway",
                    Icon: Briefcase,
                  },
                  {
                    id: "cashflow",
                    value: "cashflow personal cicilan dsr dana darurat",
                    Icon: Wallet,
                  },
                ] as const
              ).map(({ id, value, Icon }) => (
                <Command.Item
                  key={id}
                  value={value}
                  onSelect={() => selectTrack(id)}
                  className="group flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-cleared/30 bg-cleared/10 text-cleared">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-sans text-xs font-medium text-text-primary">
                        {t(`tracks.${id}.name`)}
                      </span>
                      <span className="block truncate font-sans text-[11px] text-text-muted">
                        {t(`tracks.${id}.description`)}
                      </span>
                    </div>
                  </div>
                  <CornerDownLeft
                    className="h-3.5 w-3.5 shrink-0 text-text-muted opacity-0 transition-opacity group-aria-selected:opacity-100"
                    aria-hidden="true"
                  />
                </Command.Item>
              ))}
            </Command.Group>

            {/* Group 2: Terminal Workstations & Pages */}
            <Command.Group
              heading={t("command.group_sections")}
              className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              {[
                {
                  href: "/terminal",
                  label: t("terminal.nav_overview"),
                  kw: "terminal overview command center",
                  Icon: LayoutGrid,
                },
                {
                  href: "/terminal/war-room",
                  label: t("terminal.nav_warroom"),
                  kw: "3d war room ruang sidang komite hermes",
                  Icon: Boxes,
                },
                {
                  href: "/terminal/compare",
                  label: t("terminal.nav_compare"),
                  kw: "compare komparasi skenario a vs b",
                  Icon: GitCompare,
                },
                {
                  href: "/terminal/import",
                  label: t("terminal.nav_import"),
                  kw: "import csv mutasi bank excel umkm",
                  Icon: FileSpreadsheet,
                },
                {
                  href: "/terminal/portfolio",
                  label: t("terminal.nav_portfolio"),
                  kw: "portfolio korelasi var kelly",
                  Icon: Network,
                },
                {
                  href: "/terminal/journal",
                  label: t("terminal.nav_journal"),
                  kw: "journal jurnal brier score riwayat",
                  Icon: BookMarked,
                },
                {
                  href: "/methodology",
                  label: t("nav.link_methodology"),
                  kw: "methodology metodologi riset protokol",
                  Icon: FlaskConical,
                },
                {
                  href: "/",
                  label: t("nav.back_home"),
                  kw: "home beranda landing",
                  Icon: Home,
                },
              ].map(({ href, label, kw, Icon }) => (
                <Command.Item
                  key={href}
                  value={`${label} ${kw}`}
                  onSelect={() => navigateTo(href)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-text-muted">
                    {href}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Group 3: Real-World Trap Presets */}
            <Command.Group
              heading={t("command.group_traps")}
              className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              {(["trading", "business", "cashflow"] as const).map((track) => (
                <Command.Item
                  key={track}
                  value={`trap jebakan demo ${track} ${t(`form.traps.${track}.label`)}`}
                  onSelect={() => runTrapDemo(track)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
                >
                  <div className="flex items-center gap-2.5">
                    <Flame
                      className="h-3.5 w-3.5 text-conditional"
                      aria-hidden="true"
                    />
                    <span>{t(`form.traps.${track}.label`)}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-conditional">
                    DEMO
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Group 4: System Controls */}
            <Command.Group
              heading={t("command.group_actions")}
              className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              <Command.Item
                value="xray inspector architecture transparency"
                onSelect={() => {
                  closePalette();
                  toggleXrayMode();
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <Cpu className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{t("command.action_xray")}</span>
              </Command.Item>

              <Command.Item
                value="theme dark light terang gelap"
                onSelect={() => {
                  closePalette();
                  toggleTheme();
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                )}
                <span>{t("command.action_theme")}</span>
              </Command.Item>

              <Command.Item
                value="language bahasa indonesia english id en"
                onSelect={() => {
                  closePalette();
                  setLocale(locale === "id" ? "en" : "id");
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <Globe className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <span>{t("command.action_lang")}</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
