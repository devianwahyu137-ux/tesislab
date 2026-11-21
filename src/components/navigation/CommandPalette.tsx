"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Activity,
  Briefcase,
  Cpu,
  Flame,
  Globe,
  Moon,
  Navigation,
  Search,
  Sun,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export const COMMAND_PALETTE_OPEN_EVENT = "tesislab:open-command-palette";

/**
 * Global Cmd+K / Ctrl+K Institutional Command Palette powered by cmdk.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
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

  const jumpTo = (selector: string) => {
    setOpen(false);
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-obsidian/75 px-4 pt-[12vh] backdrop-blur-xs"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-sm border border-active-border bg-surface shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="TesisLab Command Palette"
          className="flex flex-col"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2.5 border-b border-hairline bg-obsidian px-3.5 py-3">
            <Search
              className="h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <Command.Input
              autoFocus
              placeholder={t("command.placeholder")}
              className="w-full bg-transparent font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <kbd className="rounded-xs border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[340px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center font-mono text-xs text-text-muted">
              {t("command.empty")}
            </Command.Empty>

            {/* Group 1: Audit Tracks */}
            <Command.Group
              heading={t("command.group_tracks")}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              <Command.Item
                value="trading market audit saham kripto"
                onSelect={() => selectTrack("trading")}
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <Activity className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{t("tracks.trading.name")}</span>
              </Command.Item>
              <Command.Item
                value="business umkm sme audit booth"
                onSelect={() => selectTrack("business")}
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <Briefcase className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{t("tracks.business.name")}</span>
              </Command.Item>
              <Command.Item
                value="cashflow personal cicilan dsr"
                onSelect={() => selectTrack("cashflow")}
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <Wallet className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{t("tracks.cashflow.name")}</span>
              </Command.Item>
            </Command.Group>

            {/* Group 2: Real-World Trap Presets */}
            <Command.Group
              heading={t("command.group_traps")}
              className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              {(["trading", "business", "cashflow"] as const).map((track) => (
                <Command.Item
                  key={track}
                  value={`trap jebakan ${track} ${t(`form.traps.${track}.label`)}`}
                  onSelect={() => runTrapDemo(track)}
                  className="flex cursor-pointer items-center justify-between gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
                    <span>{t(`form.traps.${track}.label`)}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-text-muted">
                    {t(`form.traps.${track}.tag`)}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Group 3: System Controls */}
            <Command.Group
              heading={t("command.group_actions")}
              className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
            >
              <Command.Item
                value="xray architecture inspector telemetry"
                onSelect={() => {
                  setOpen(false);
                  toggleXrayMode();
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <Cpu className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{t("command.action_xray")}</span>
              </Command.Item>
              <Command.Item
                value="theme dark light mode tema terang gelap"
                onSelect={() => {
                  toggleTheme();
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
                )}
                <span>{t("command.action_theme")}</span>
              </Command.Item>
              <Command.Item
                value="language bahasa id en indonesia english"
                onSelect={() => {
                  setLocale(locale === "id" ? "en" : "id");
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
              >
                <Globe className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                <span>{t("command.action_lang")}</span>
              </Command.Item>
            </Command.Group>

            {/* Group 4: Page Navigation */}
            <Command.Group
              heading={t("command.group_sections")}
              className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-text-muted"
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
                  className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 font-sans text-xs text-text-secondary aria-selected:bg-elevated aria-selected:text-text-primary"
                >
                  <Navigation className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                  <span>{t(`command.${sec.key}`)}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
