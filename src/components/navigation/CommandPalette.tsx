"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Activity,
  Briefcase,
  CornerDownLeft,
  Cpu,
  Flame,
  Globe,
  Moon,
  Navigation,
  Search,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export const COMMAND_PALETTE_OPEN_EVENT = "tesislab:open-command-palette";

/**
 * Global Cmd+K / Ctrl+K Institutional Search & Command Palette powered by cmdk.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { locale, setLocale, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { setActiveTrack, triggerDemo, toggleXrayMode } = useAuditUI();

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

  const jumpTo = (selector: string) => {
    closePalette();
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const selectTrack = (track: AuditTrack) => {
    setActiveTrack(track);
    jumpTo("#audit-workspace-slot");
  };

  const runTrapDemo = (track: AuditTrack) => {
    setActiveTrack(track);
    toast.info(`${t("toast.trap_loaded")}: ${t(`form.traps.${track}.label`)}`);
    triggerDemo();
    jumpTo("#audit-workspace-slot");
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
        {/* Top Emerald Accent Hairline */}
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
          {/* Search Input Header */}
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

          {/* Command List */}
          <Command.List className="max-h-[380px] overflow-y-auto p-2.5">
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

            {/* Group 2: Real-World Trap Presets */}
            <Command.Group
              heading={t("command.group_traps")}
              className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              {(["trading", "business", "cashflow"] as const).map((track) => (
                <Command.Item
                  key={track}
                  value={`trap jebakan ${track} ${t(`form.traps.${track}.label`)}`}
                  onSelect={() => runTrapDemo(track)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-conditional/30 bg-conditional/10 text-conditional">
                      <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="font-medium text-text-primary">
                      {t(`form.traps.${track}.label`)}
                    </span>
                  </div>
                  <span className="rounded-xs border border-hairline bg-obsidian px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                    {t(`form.traps.${track}.tag`)}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Group 3: System Controls */}
            <Command.Group
              heading={t("command.group_actions")}
              className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              <Command.Item
                value="xray transparansi architecture inspector telemetry"
                onSelect={() => {
                  closePalette();
                  toggleXrayMode();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-cleared/30 bg-cleared/10 text-cleared">
                  <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>{t("command.action_xray")}</span>
              </Command.Item>
              <Command.Item
                value="theme dark light mode tema terang gelap"
                onSelect={() => {
                  toggleTheme();
                  closePalette();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-hairline bg-obsidian text-conditional">
                  {theme === "dark" ? (
                    <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </span>
                <span>{t("command.action_theme")}</span>
              </Command.Item>
              <Command.Item
                value="language bahasa id en indonesia english"
                onSelect={() => {
                  setLocale(locale === "id" ? "en" : "id");
                  closePalette();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-hairline bg-obsidian text-text-secondary">
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>{t("command.action_lang")}</span>
              </Command.Item>
            </Command.Group>

            {/* Group 4: Page Navigation */}
            <Command.Group
              heading={t("command.group_sections")}
              className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              {(
                [
                  { id: "#audit-workspace-slot", key: "section_warroom" },
                  { id: "#cara-kerja", key: "section_how" },
                  { id: "#committee-showcase", key: "section_committee" },
                  { id: "#memo", key: "section_memo" },
                  { id: "#riset", key: "section_research" },
                ] as const
              ).map((sec) => (
                <Command.Item
                  key={sec.id}
                  value={`${sec.key} ${t(`command.${sec.key}`)}`}
                  onSelect={() => jumpTo(sec.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-2 font-sans text-xs text-text-secondary transition-colors aria-selected:bg-elevated aria-selected:text-text-primary"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-hairline bg-obsidian text-text-muted">
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{t(`command.${sec.key}`)}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer Keyboard Legend */}
          <div className="flex items-center justify-between border-t border-hairline bg-obsidian px-4 py-2 font-mono text-[10px] text-text-muted">
            <div className="flex items-center gap-3">
              <span>↑↓ {t("command.hint_nav")}</span>
              <span>↵ {t("command.hint_select")}</span>
              <span>ESC {t("command.hint_close")}</span>
            </div>
            <span className="font-semibold text-text-secondary">TesisLab.</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
