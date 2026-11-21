"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Cpu, X } from "lucide-react";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

export interface XRayArchitectureDrawerProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

/**
 * Slide-over / bottom-sheet technical inspector for X-Ray Architecture Mode.
 * Completely hidden when isXrayMode === false. Never exposes secret env vars.
 */
export function XRayArchitectureDrawer({
  macroContext,
  macroOrigin,
}: XRayArchitectureDrawerProps) {
  const { t } = useTranslation();
  const { isXrayMode, toggleXrayMode, auditResponse, lastTrack, activeTrack } =
    useAuditUI();

  const [jsonTab, setJsonTab] = useState<"verdict" | "metrics">("verdict");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isXrayMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleXrayMode();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isXrayMode, toggleXrayMode]);

  const telemetry = auditResponse?.telemetry;
  const verdict = auditResponse?.verdict;
  const metrics = auditResponse?.metrics;
  const track = lastTrack ?? activeTrack;

  const activeJsonString = auditResponse
    ? JSON.stringify(jsonTab === "verdict" ? verdict : metrics, null, 2)
    : "";

  const handleCopyJson = async () => {
    if (!activeJsonString) return;
    try {
      await navigator.clipboard.writeText(activeJsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
  };

  const pipelineSteps = [
    {
      step: "01",
      name: "Input Schema (Zod)",
      detail: `track=${track} // validated`,
    },
    {
      step: "02",
      name: t("xray.calc_latency_label"),
      detail: telemetry ? `${telemetry.calc_ms.toFixed(2)} ms` : "standby",
    },
    {
      step: "03",
      name: t("xray.macro_source_label"),
      detail: `${telemetry?.macro_origin ?? macroOrigin} // ${telemetry?.macro_regime ?? macroContext.synthesis.macro_regime}`,
    },
    {
      step: "04",
      name: t("xray.llm_latency_label"),
      detail: telemetry
        ? `${telemetry.model_used} (${telemetry.llm_ms.toFixed(0)} ms)${telemetry.fallback_reason ? ` [${telemetry.fallback_reason}]` : ""}`
        : "standby",
    },
  ];

  return (
    <AnimatePresence>
      {isXrayMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("xray.drawer_title")}
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={toggleXrayMode}
            aria-hidden="true"
            className="fixed inset-0 bg-obsidian/80 backdrop-blur-xs"
          />

          {/* Drawer Panel: Right slide-over on md+, bottom sheet on mobile */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="relative z-10 mt-auto flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-sm border-t border-hairline bg-surface md:mt-0 md:h-full md:max-h-none md:w-[540px] md:rounded-none md:border-l md:border-t-0"
          >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-hairline bg-obsidian px-5 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cleared">
              <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{t("xray.drawer_title")}</span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-secondary">
              {t("xray.drawer_subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleXrayMode}
            aria-label={t("xray.close_btn")}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-sm border border-active-border bg-surface text-text-secondary transition-colors hover:text-text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <TerminalDivider label={t("xray.pipeline_title")} />

          {/* 4-Stage Monoline Pipeline */}
          <ol className="flex flex-col gap-2">
            {pipelineSteps.map((item) => (
              <li
                key={item.step}
                className="flex items-center justify-between gap-3 rounded-sm border border-hairline bg-obsidian px-3.5 py-2.5 font-mono text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-cleared">{item.step}</span>
                  <span className="truncate text-text-secondary">
                    {item.name}
                  </span>
                </div>
                <span className="shrink-0 text-right tabular-nums text-text-primary">
                  {item.detail}
                </span>
              </li>
            ))}
          </ol>

          {!auditResponse ? (
            <div className="rounded-sm border border-dashed border-hairline bg-obsidian/60 p-4 font-mono text-xs leading-relaxed text-text-muted">
              {t("xray.empty_state_hint")}
            </div>
          ) : (
            <>
              <TerminalDivider label={t("xray.flags_title")} />

              <div className="flex flex-col gap-3 rounded-sm border border-hairline bg-obsidian p-4">
                <div className="flex flex-wrap gap-1.5">
                  {verdict?.xray_trace.deterministic_flags.length ? (
                    verdict.xray_trace.deterministic_flags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-sm border border-conditional/40 bg-conditional/10 px-2 py-0.5 font-mono text-[11px] text-conditional"
                      >
                        {flag}
                      </span>
                    ))
                  ) : (
                    <span className="font-mono text-xs text-cleared">
                      {t("xray.no_flags")}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-hairline pt-2.5">
                  {verdict?.xray_trace.macro_factors_used.map((factor) => (
                    <span
                      key={factor}
                      className="rounded-sm border border-hairline bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary"
                    >
                      {factor}
                    </span>
                  ))}
                </div>

                <div className="border-t border-hairline pt-2.5">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {t("xray.reasoning_label")}
                  </span>
                  <p className="font-sans text-xs leading-relaxed text-text-secondary">
                    {verdict?.xray_trace.reasoning_summary}
                  </p>
                </div>
              </div>

              <TerminalDivider label={t("xray.raw_payload_title")} />

              {/* JSON Contract Inspector */}
              <div className="flex flex-col rounded-sm border border-hairline bg-obsidian">
                <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
                  <div className="flex gap-1.5">
                    {(["verdict", "metrics"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setJsonTab(tab)}
                        className={cn(
                          "min-h-[44px] rounded-sm border px-3 font-mono text-[11px] uppercase tracking-wider transition-colors",
                          jsonTab === tab
                            ? "border-active-border bg-elevated text-text-primary"
                            : "border-transparent text-text-muted hover:text-text-secondary"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm border border-hairline bg-surface px-3 font-mono text-[11px] uppercase tracking-wider text-text-secondary hover:text-text-primary"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>
                      {copied
                        ? t("xray.copied_btn")
                        : t("xray.copy_json_btn")}
                    </span>
                  </button>
                </div>

                <pre className="max-h-72 overflow-auto p-3.5 font-mono text-[11px] leading-relaxed text-text-secondary">
                  {activeJsonString}
                </pre>
              </div>
            </>
          )}
        </div>
      </motion.aside>
    </div>
      )}
    </AnimatePresence>
  );
}
