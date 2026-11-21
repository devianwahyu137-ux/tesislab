"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import type { AgentRole } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const DIVISIONS: readonly AgentRole[] = [
  "data_analyst",
  "risk_manager",
  "committee_chair",
];

const TRACKS: readonly AuditTrack[] = ["trading", "business", "cashflow"];

function highlightRuleSeverity(rule: string): {
  condition: string;
  action: string;
  tone: string;
} {
  const [left, right] = rule.split("->").map((s) => s.trim());
  const action = right ?? "";
  let tone = "text-text-secondary";
  if (/VETO|REJECT|ALARM|BLOCK/.test(action)) {
    tone = "text-rejected";
  } else if (/WARN|FLAG|GATE/.test(action)) {
    tone = "text-conditional";
  }
  return { condition: left ?? rule, action, tone };
}

/**
 * Institutional Committee Mandate & Veto Protocol Dossier (#committee-showcase).
 * Demonstrates hard deterministic rules enforced by each division per audit track.
 */
export function CommitteeShowcase() {
  const { dict, t } = useTranslation();
  const [selectedTrack, setSelectedTrack] = useState<AuditTrack>("trading");

  return (
    <section
      id="committee-showcase"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-12 md:py-16"
    >
      {/* Centered Editorial Header */}
      <div className="mx-auto mb-7 flex max-w-2xl flex-col items-center text-center">
        <span className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-cleared">
          {t("protocol.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("protocol.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("protocol.subtitle")}
        </p>
      </div>

      {/* Track Selector Toggle */}
      <div className="mb-6 flex justify-center">
        <div
          role="tablist"
          aria-label={t("form.select_track_label")}
          className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-sm border border-hairline bg-obsidian p-1"
        >
          {TRACKS.map((track) => {
            const isSelected = selectedTrack === track;
            return (
              <button
                key={track}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedTrack(track)}
                className={cn(
                  "relative min-h-[44px] rounded-sm px-4 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
                  isSelected
                    ? "font-semibold text-cleared"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId="protocol-track-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-sm bg-elevated"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">
                  {t(`tracks.${track}.name`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Institutional Division Dossier Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {DIVISIONS.map((role, idx) => {
          const rules = dict.protocol.rules[selectedTrack][role];

          return (
            <motion.article
              key={role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.42,
                delay: idx * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col justify-between gap-5 rounded-sm border border-hairline bg-obsidian/85 p-5"
            >
              <div className="flex flex-col gap-4">
                {/* Division Header: Code + Emblem + Role Name */}
                <div className="flex items-center gap-3.5 border-b border-hairline pb-4">
                  <AgentAvatar role={role} phase="idle" isActive size={52} />
                  <div className="min-w-0">
                    <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      {t(`protocol.divisions.${role}.code`)}
                    </span>
                    <h3 className="mt-0.5 font-sans text-sm font-semibold text-text-primary">
                      {t(`agents.roles.${role}.name`)}
                    </h3>
                  </div>
                </div>

                {/* Mandate */}
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t(`protocol.divisions.${role}.mandate`)}
                </p>
              </div>

              {/* Hard Mathematical Veto Rules Block */}
              <div className="rounded-sm border border-hairline bg-surface/90 p-3.5">
                <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                  <ShieldAlert
                    className="h-3.5 w-3.5 text-conditional"
                    aria-hidden="true"
                  />
                  <span>{t("protocol.rules_label")}</span>
                </div>
                <ul className="flex flex-col gap-2 font-mono text-[11px] tabular-nums">
                  {rules.map((rule, idx) => {
                    const parsed = highlightRuleSeverity(rule);
                    return (
                      <li
                        key={idx}
                        className="flex flex-col gap-0.5 rounded-xs border border-hairline/80 bg-obsidian px-2.5 py-2"
                      >
                        <span className="text-text-secondary">
                          {parsed.condition}
                        </span>
                        {parsed.action && (
                          <span className={cn("font-semibold", parsed.tone)}>
                            → {parsed.action}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
