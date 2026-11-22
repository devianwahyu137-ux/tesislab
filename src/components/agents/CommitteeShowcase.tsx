"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, RotateCcw, ShieldAlert, Zap } from "lucide-react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StatusStamp } from "@/components/ui/StatusStamp";
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

const ROLE_ACCENT: Record<
  AgentRole,
  {
    topBar: string;
    badge: string;
  }
> = {
  data_analyst: {
    topBar: "border-t-cleared",
    badge: "border-cleared/40 bg-cleared/10 text-cleared",
  },
  risk_manager: {
    topBar: "border-t-rejected",
    badge: "border-rejected/40 bg-rejected/10 text-rejected",
  },
  committee_chair: {
    topBar: "border-t-conditional",
    badge: "border-conditional/40 bg-conditional/10 text-conditional",
  },
};

function highlightRuleSeverity(rule: string): {
  condition: string;
  action: string;
  severity: "hard" | "warn";
  tone: string;
} {
  const [left, right] = rule.split("->").map((s) => s.trim());
  const action = right ?? "";
  if (/VETO|REJECT|ALARM|BLOCK/.test(action)) {
    return {
      condition: left ?? rule,
      action,
      severity: "hard",
      tone: "text-rejected",
    };
  }
  return {
    condition: left ?? rule,
    action,
    severity: "warn",
    tone: "text-conditional",
  };
}

/**
 * Interactive Institutional Committee Mandate & Veto Protocol Simulator (#committee-showcase).
 * Users can click any mathematical threshold rule to trip a live veto gate and observe
 * how the 3 divisions lock the final verdict.
 */
export function CommitteeShowcase() {
  const { dict, t } = useTranslation();
  const [selectedTrack, setSelectedTrack] = useState<AuditTrack>("trading");
  const [trippedRules, setTrippedRules] = useState<Record<string, boolean>>({});

  const toggleRule = (key: string) => {
    setTrippedRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTrackSwitch = (track: AuditTrack) => {
    setSelectedTrack(track);
    setTrippedRules({});
  };

  // Compute live simulated gate outcome from clicked rules
  let hardVetoCount = 0;
  let warnCount = 0;
  for (const role of DIVISIONS) {
    const rules = dict.protocol.rules[selectedTrack][role];
    rules.forEach((rule, idx) => {
      const key = `${selectedTrack}:${role}:${idx}`;
      if (trippedRules[key]) {
        const parsed = highlightRuleSeverity(rule);
        if (parsed.severity === "hard") hardVetoCount += 1;
        else warnCount += 1;
      }
    });
  }

  const totalTripped = hardVetoCount + warnCount;
  const simulatedStatus =
    hardVetoCount > 0
      ? "REJECTED"
      : warnCount > 0
        ? "CONDITIONAL"
        : "CLEARED";
  const simulatedStatusKey = simulatedStatus.toLowerCase() as
    | "cleared"
    | "conditional"
    | "rejected";

  return (
    <section
      id="committee-showcase"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-8 sm:py-12 md:py-16"
    >
      {/* Centered Editorial Header */}
      <div className="mx-auto mb-5 flex max-w-2xl flex-col items-center text-center sm:mb-7">
        <span className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-cleared sm:mb-2.5 sm:text-[11px]">
          {t("protocol.eyebrow")}
        </span>
        <h2 className="font-editorial text-xl font-medium leading-[1.14] tracking-tight text-text-primary sm:text-3xl md:text-4xl">
          {t("protocol.title")}
        </h2>
        <p className="mt-2.5 font-sans text-xs leading-relaxed text-text-secondary sm:mt-3 sm:text-sm">
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
                onClick={() => handleTrackSwitch(track)}
                className={cn(
                  "relative min-h-[42px] rounded-sm px-4 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
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

      {/* 3-Column Interactive Division Dossier Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {DIVISIONS.map((role, idx) => {
          const rules = dict.protocol.rules[selectedTrack][role];
          const accent = ROLE_ACCENT[role];
          const roleTrippedCount = rules.filter(
            (_, rIdx) => trippedRules[`${selectedTrack}:${role}:${rIdx}`]
          ).length;

          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.42,
                delay: idx * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <SpotlightCard
                className={cn(
                  "relative h-full border-t-2 bg-obsidian/90 p-5 transition-colors",
                  accent.topBar,
                  roleTrippedCount > 0 && "border-rejected/45"
                )}
              >
                {/* Tactile Angled Auditor Ink Stamp when a rule in this division is tripped */}
                <AnimatePresence>
                  {roleTrippedCount > 0 && (
                    <motion.div
                      initial={{ scale: 1.5, opacity: 0, rotate: -18 }}
                      animate={{ scale: 1, opacity: 1, rotate: -9 }}
                      exit={{ scale: 0.85, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 24 }}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-3 right-3 z-20 rounded-xs border-2 border-rejected/80 bg-rejected/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-rejected shadow-sm backdrop-blur-xs"
                    >
                      VETO ×{roleTrippedCount}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex h-full flex-col justify-between gap-5">
                  <div className="flex flex-col gap-4">
                    {/* Division Header: Code + Emblem + Role Name + Authority Tag */}
                    <div className="flex items-start justify-between gap-3 border-b border-hairline pb-4">
                      <div className="flex items-center gap-3.5">
                        <AgentAvatar
                          role={role}
                          phase={roleTrippedCount > 0 ? "debating" : "idle"}
                          isActive
                          size={50}
                        />
                        <div className="min-w-0">
                          <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                            {t(`protocol.divisions.${role}.code`)}
                          </span>
                          <h3 className="mt-0.5 font-sans text-sm font-semibold text-text-primary">
                            {t(`agents.roles.${role}.name`)}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 rounded-xs border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                          accent.badge
                        )}
                      >
                        {t(`protocol.authority.${role}`)}
                      </span>
                    </div>

                    {/* Mandate */}
                    <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
                      {t(`protocol.divisions.${role}.mandate`)}
                    </p>
                  </div>

                  {/* Interactive Hard Mathematical Veto Rules Block */}
                  <div className="rounded-sm border border-hairline bg-surface/90 p-3.5">
                    <div className="mb-2.5 flex items-center justify-between gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldAlert
                          className="h-3.5 w-3.5 text-conditional"
                          aria-hidden="true"
                        />
                        <span>{t("protocol.rules_label")}</span>
                      </span>
                      <span className="text-[9px] font-normal tracking-normal text-text-muted">
                        {t("protocol.tap_to_test")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 font-mono text-[11px] tabular-nums">
                      {rules.map((rule, ruleIdx) => {
                        const parsed = highlightRuleSeverity(rule);
                        const ruleKey = `${selectedTrack}:${role}:${ruleIdx}`;
                        const isTripped = Boolean(trippedRules[ruleKey]);
                        return (
                          <button
                            key={ruleKey}
                            type="button"
                            onClick={() => toggleRule(ruleKey)}
                            aria-pressed={isTripped}
                            className={cn(
                              "flex w-full flex-col gap-1 rounded-xs border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cleared",
                              isTripped
                                ? parsed.severity === "hard"
                                  ? "border-rejected/70 bg-rejected/12"
                                  : "border-conditional/70 bg-conditional/12"
                                : "border-hairline/80 bg-obsidian hover:border-active-border"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-text-primary">
                                {parsed.condition}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-xs px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                  isTripped
                                    ? parsed.severity === "hard"
                                      ? "bg-rejected/20 text-rejected"
                                      : "bg-conditional/20 text-conditional"
                                    : "bg-surface text-text-muted"
                                )}
                              >
                                {isTripped ? "TRIPPED" : "PASS"}
                              </span>
                            </div>
                            {parsed.action && (
                              <span
                                className={cn(
                                  "text-[10px] font-semibold",
                                  parsed.tone
                                )}
                              >
                                → {parsed.action}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>

      {/* Live Interactive Veto Gate Simulation Strip */}
      <div
        className={cn(
          "mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-obsidian px-4 py-3.5 transition-shadow duration-300 sm:px-5",
          hardVetoCount > 0
            ? "glow-crimson border-rejected/50"
            : warnCount > 0
              ? "glow-amber border-conditional/50"
              : "glow-emerald border-cleared/35"
        )}
      >
        <div className="flex items-center gap-2.5">
          {totalTripped === 0 ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-cleared"
              aria-hidden="true"
            />
          ) : (
            <Zap
              className={cn(
                "h-4 w-4 shrink-0",
                hardVetoCount > 0 ? "text-rejected" : "text-conditional"
              )}
              aria-hidden="true"
            />
          )}
          <div className="font-mono text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-text-primary">
              {t("protocol.sim_gate_label")}:
            </span>{" "}
            <span className="text-text-secondary">
              {totalTripped === 0
                ? t("protocol.sim_gate_idle")
                : `${totalTripped} ${t("protocol.sim_gate_tripped")}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {totalTripped > 0 && (
            <button
              type="button"
              onClick={() => setTrippedRules({})}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-xs border border-hairline bg-surface px-2.5 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
          <StatusStamp
            variant={simulatedStatus}
            label={t(`verdict.status.${simulatedStatusKey}`)}
          />
        </div>
      </div>
    </section>
  );
}
