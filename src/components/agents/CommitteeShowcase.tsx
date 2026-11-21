"use client";

import { useState } from "react";
import {
  AgentAvatar,
  type AgentStance,
} from "@/components/agents/AgentAvatar";
import type { AgentRole } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const ROLES: readonly AgentRole[] = [
  "data_analyst",
  "risk_manager",
  "committee_chair",
];

const STANCES: readonly AgentStance[] = [
  "standby",
  "calculating",
  "skeptical",
  "alarmed",
  "conditional",
  "cleared",
];

const STANCE_ACCENT: Record<AgentStance, string> = {
  standby: "border-active-border text-text-secondary bg-obsidian/70",
  calculating: "border-cleared/50 text-cleared bg-cleared/10",
  skeptical: "border-conditional/50 text-conditional bg-conditional/10",
  alarmed: "border-rejected/50 text-rejected bg-rejected/10",
  conditional: "border-conditional/50 text-conditional bg-conditional/10",
  cleared: "border-cleared/50 text-cleared bg-cleared/10",
};

/**
 * Interactive Committee Expression Gallery (#committee-showcase).
 * Lets visitors explore all 3 analysts across 6 math-driven hearing stances.
 */
export function CommitteeShowcase() {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<AgentRole>("data_analyst");
  const [selectedStance, setSelectedStance] =
    useState<AgentStance>("skeptical");

  return (
    <section
      id="committee-showcase"
      className="mt-6 w-full rounded-sm border border-hairline bg-surface/85 p-5 backdrop-blur-xs md:mt-10 md:p-8 lg:p-10"
    >
      {/* Centered Editorial Header */}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center md:mb-10">
        <span className="mb-3 inline-flex items-center rounded-full border border-active-border bg-obsidian/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
          {t("showcase.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("showcase.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("showcase.subtitle")}
        </p>
      </div>

      {/* 2-Column Interactive Stage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Character Spotlight Stage */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* 3 Analyst Selector Tabs */}
          <div
            role="tablist"
            aria-label={t("agents.chamber_title")}
            className="grid grid-cols-3 gap-2"
          >
            {ROLES.map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "min-h-[44px] rounded-sm border px-2 py-2 font-mono text-[10px] uppercase leading-tight tracking-wider transition-colors sm:text-[11px]",
                    isSelected
                      ? "border-cleared/60 bg-cleared/12 font-semibold text-cleared"
                      : "border-hairline bg-obsidian/80 text-text-secondary hover:border-active-border hover:text-text-primary"
                  )}
                >
                  {t(`agents.roles.${role}.name`)}
                </button>
              );
            })}
          </div>

          {/* Spotlight Canvas */}
          <div className="bg-blueprint-grid relative flex flex-1 flex-col items-center justify-between overflow-hidden rounded-sm border border-hairline p-5 md:p-6">
            <div
              aria-hidden="true"
              className="ambient-spotlight-emerald pointer-events-none absolute inset-0"
            />

            {/* Speech Bubble */}
            <div className="relative z-10 mb-5 w-full rounded-sm border border-active-border bg-obsidian/95 p-4 shadow-lg shadow-black/40">
              <p className="font-editorial text-base leading-snug text-text-primary md:text-lg">
                &ldquo;{t(`showcase.quotes.${selectedRole}.${selectedStance}`)}&rdquo;
              </p>
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-active-border bg-obsidian"
              />
            </div>

            {/* Large Expressive Portrait */}
            <div className="relative z-10 my-2 flex items-center justify-center">
              <AgentAvatar
                role={selectedRole}
                stance={selectedStance}
                isActive
                size={192}
                className="h-40 w-40 md:h-48 md:w-48"
              />
            </div>

            {/* Active Role & Stance Trigger Footer */}
            <div className="relative z-10 mt-5 w-full border-t border-hairline/80 pt-4 text-center">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                <span className="font-sans text-sm font-semibold text-text-primary">
                  {t(`agents.roles.${selectedRole}.name`)}
                </span>
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                    STANCE_ACCENT[selectedStance]
                  )}
                >
                  {t(`showcase.stances.${selectedStance}.label`)}
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                <span className="font-mono text-[11px] text-text-muted">
                  {t("showcase.trigger_prefix")}{" "}
                </span>
                {t(`showcase.stances.${selectedStance}.trigger`)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 6 Interactive Stance Cards */}
        <div className="flex flex-col gap-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
              {t("showcase.hover_hint")}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              06 / 06
            </span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
            {STANCES.map((stance) => {
              const isSelected = selectedStance === stance;
              return (
                <button
                  key={stance}
                  type="button"
                  onMouseEnter={() => setSelectedStance(stance)}
                  onFocus={() => setSelectedStance(stance)}
                  onClick={() => setSelectedStance(stance)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex min-h-[136px] flex-col items-center justify-center gap-2.5 rounded-sm border p-3.5 text-center transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
                    isSelected
                      ? "border-active-border bg-elevated shadow-md shadow-black/40"
                      : "border-hairline bg-obsidian/75 hover:border-active-border hover:bg-elevated/60"
                  )}
                >
                  <AgentAvatar
                    role={selectedRole}
                    stance={stance}
                    isActive={isSelected}
                    size={64}
                    className="h-14 w-14 transition-transform group-hover:scale-105 sm:h-16 sm:w-16"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold uppercase tracking-wider",
                        isSelected ? "text-text-primary" : "text-text-secondary"
                      )}
                    >
                      {t(`showcase.stances.${stance}.label`)}
                    </span>
                    <span className="font-sans text-[11px] text-text-muted">
                      {t(`showcase.stances.${stance}.short`)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
