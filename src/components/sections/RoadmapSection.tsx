"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const V1_LINKS = [
  "#audit-workspace-slot",
  "#audit-workspace-slot",
  "#audit-workspace-slot",
  "#cara-kerja",
] as const;

const V2_STAGES = ["PROTOTYPE", "DESIGN", "RESEARCH", "PLANNED"] as const;

/**
 * Interactive 2-column Product Release & Roadmap Board (#roadmap)
 * contrasting live free v1.0 modules (with 1-click launch links) against
 * upcoming v2.0 Pro modules (with interactive priority voting).
 */
export function RoadmapSection() {
  const { dict, t } = useTranslation();
  const [voted, setVoted] = useState<Record<number, boolean>>({});

  const handleToggleVote = (idx: number) => {
    setVoted((prev) => {
      const nextState = !prev[idx];
      if (nextState) {
        toast.success(t("roadmap.vote_toast"));
      }
      return { ...prev, [idx]: nextState };
    });
  };

  return (
    <section
      id="roadmap"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-8 sm:py-12 md:py-16"
    >
      {/* Centered Editorial Header */}
      <div className="mx-auto mb-6 flex max-w-2xl flex-col items-center text-center sm:mb-8">
        <span className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-cleared sm:mb-2.5 sm:text-[11px]">
          {t("roadmap.eyebrow")}
        </span>
        <h2 className="font-editorial text-2xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-3xl md:text-4xl">
          {t("roadmap.title")}
        </h2>
        <p className="mt-2.5 font-sans text-xs leading-relaxed text-text-secondary sm:mt-3 sm:text-sm">
          {t("roadmap.subtitle")}
        </p>
      </div>

      {/* 2-Column Interactive Release Board */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Left: v1.0 LIVE */}
        <div className="surface-specular flex flex-col gap-4 rounded-sm border border-active-border/70 border-t-2 border-t-cleared bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-2.5 border-b border-hairline pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cleared">
                <span
                  className="h-2 w-2 rounded-full bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  aria-hidden="true"
                />
                <span>{t("roadmap.v1_badge")}</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-cleared">
                4 / 4 LIVE
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-obsidian">
              <div className="h-full w-full rounded-full bg-cleared" />
            </div>
          </div>

          <ul className="flex flex-col gap-2.5">
            {dict.roadmap.v1_items.map((item, idx) => (
              <li key={idx}>
                <a
                  href={V1_LINKS[idx] ?? "#audit-workspace-slot"}
                  className="group flex items-start justify-between gap-3 rounded-xs border border-hairline/80 bg-obsidian/80 p-3 transition-colors hover:border-cleared/50 hover:bg-obsidian"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
                      aria-hidden="true"
                    />
                    <span className="font-sans text-xs leading-relaxed text-text-primary sm:text-sm">
                      {item}
                    </span>
                  </div>
                  <ArrowUpRight
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cleared"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: v2.0 PRO ROADMAP */}
        <div className="surface-specular overflow-hidden rounded-sm border border-hairline bg-surface">
          <div
            aria-hidden="true"
            className="caution-stripe-bar h-2 w-full border-b border-conditional/30"
          />
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-2.5 border-b border-hairline pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-conditional">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("roadmap.v2_badge")}</span>
                </span>
                <span className="rounded-xs border border-conditional/40 bg-conditional/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-conditional">
                  {t("roadmap.coming_soon")}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-obsidian">
                <div className="h-full w-[35%] rounded-full bg-conditional/80" />
              </div>
            </div>

            <ul className="flex flex-col gap-2.5">
              {dict.roadmap.v2_items.map((item, idx) => {
                const isVoted = Boolean(voted[idx]);
                const stage = V2_STAGES[idx] ?? "PLANNED";
                return (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-xs border border-hairline/80 bg-obsidian/60 p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Clock
                        className="mt-0.5 h-4 w-4 shrink-0 text-conditional"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col gap-1">
                        <span className="font-sans text-xs leading-relaxed text-text-secondary sm:text-sm">
                          {item}
                        </span>
                        <span className="w-fit rounded-xs border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                          {stage}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVote(idx)}
                      aria-pressed={isVoted}
                      title={t("roadmap.vote_hint")}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-xs border px-2 py-1 font-mono text-[10px] font-semibold transition-colors",
                        isVoted
                          ? "border-cleared/60 bg-cleared/15 text-cleared"
                          : "border-hairline bg-surface text-text-muted hover:border-conditional/50 hover:text-conditional"
                      )}
                    >
                      <ThumbsUp className="h-3 w-3" aria-hidden="true" />
                      <span>{isVoted ? "+1" : t("roadmap.vote_btn")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
