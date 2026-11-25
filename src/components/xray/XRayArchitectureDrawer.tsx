"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Cpu,
  Play,
  Radio,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
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
 * Human-friendly + Developer-verifiable X-Ray Transparency Drawer.
 * Clearly explains HOW TesisLab separates deterministic math from AI prose,
 * lets first-time users trigger an instant demo audit right from inside the drawer,
 * and keeps raw JSON cleanly tucked inside a collapsible developer inspector.
 */
export function XRayArchitectureDrawer({
  macroContext,
  macroOrigin,
}: XRayArchitectureDrawerProps) {
  const { locale, t } = useTranslation();
  const {
    isXrayMode,
    toggleXrayMode,
    auditResponse,
    lastTrack,
    activeTrack,
    triggerDemo,
  } = useAuditUI();

  const [jsonTab, setJsonTab] = useState<"verdict" | "metrics">("verdict");
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const isId = locale === "id";
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
      toast.success(t("toast.json_copied"));
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleRunInstantDemo = () => {
    triggerDemo();
    toast.info(t("xray.demo_triggered"));
  };

  const stages = [
    {
      step: "01",
      title: t("xray.step1_title"),
      desc: t("xray.step1_desc"),
      status: auditResponse ? "VERIFIED" : "READY",
      metric: `Track: ${track.toUpperCase()}`,
      active: Boolean(auditResponse),
      accent: "text-sky-400 border-sky-400/35 bg-sky-400/10",
      Icon: ShieldCheck,
    },
    {
      step: "02",
      title: t("xray.step2_title"),
      desc: t("xray.step2_desc"),
      status: telemetry ? `${telemetry.calc_ms.toFixed(2)} ms` : "STANDBY",
      metric: telemetry
        ? `Score: ${metrics?.baseline_score ?? "-"}/100`
        : "Decimal.js · 0% Halusinasi",
      active: Boolean(telemetry),
      accent: "text-cleared border-cleared/35 bg-cleared/10",
      Icon: Cpu,
    },
    {
      step: "03",
      title: t("xray.step3_title"),
      desc: t("xray.step3_desc"),
      status: macroOrigin === "remote_data_feed" ? "LIVE" : "SNAPSHOT",
      metric: `Regime: ${telemetry?.macro_regime ?? macroContext.synthesis.macro_regime}`,
      active: true,
      accent: "text-conditional border-conditional/35 bg-conditional/10",
      Icon: Radio,
    },
    {
      step: "04",
      title: t("xray.step4_title"),
      desc: t("xray.step4_desc"),
      status: telemetry
        ? `${telemetry.llm_ms.toFixed(0)} ms`
        : "STANDBY",
      metric: telemetry
        ? `Engine: ${telemetry.model_used}`
        : isId
          ? "Menunggu sidang dimulai"
          : "Waiting for hearing",
      active: Boolean(telemetry),
      accent: "text-rejected border-rejected/35 bg-rejected/10",
      Icon: Scale,
    },
  ] as const;

  return (
    <Drawer.Root
      open={isXrayMode}
      onOpenChange={(open) => {
        if (open !== isXrayMode) toggleXrayMode();
      }}
      direction="right"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-xs" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[540px] flex-col overflow-hidden border-l border-active-border bg-surface outline-none"
        >
          <Drawer.Title className="sr-only">
            {t("xray.drawer_title")}
          </Drawer.Title>

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
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-active-border bg-surface text-text-secondary transition-colors hover:text-text-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          {/* Scrollable Body */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 pb-6">
            {/* Plain-Language "Why X-Ray?" Explainer Banner */}
            <div className="rounded-md border border-cleared/35 bg-cleared/8 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cleared">
                  {t("xray.why_title")}
                </span>
                <span className="rounded-xs border border-cleared/35 bg-obsidian/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-cleared">
                  {auditResponse ? "100% TERVERIFIKASI" : "SIAP AUDIT"}
                </span>
              </div>
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-text-primary">
                {t("xray.why_body")}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-obsidian">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    auditResponse ? "w-full bg-cleared" : "w-1/4 bg-sky-400/80"
                  )}
                />
              </div>
            </div>

            {/* 4 Clean Human-Readable Verification Stages with Timeline Connector */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                {t("xray.pipeline_title")}
              </span>

              <div className="relative flex flex-col gap-2.5 pl-2">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-6 bottom-6 left-[27px] w-px bg-gradient-to-b from-sky-400/40 via-cleared/40 to-rejected/30"
                />
                {stages.map((st) => {
                  const Icon = st.Icon;
                  return (
                    <div
                      key={st.step}
                      className={cn(
                        "relative flex items-start gap-3 rounded-md border bg-obsidian p-3.5 transition-colors",
                        st.active ? "border-active-border" : "border-hairline"
                      )}
                    >
                      <span
                        className={cn(
                          "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xs border",
                          st.accent
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-sans text-xs font-semibold text-text-primary">
                            {st.step}. {st.title}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-xs border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                              st.active
                                ? "border-cleared/40 bg-cleared/10 text-cleared"
                                : "border-hairline bg-surface text-text-muted"
                            )}
                          >
                            {st.status}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-[11.5px] leading-relaxed text-text-secondary">
                          {st.desc}
                        </p>
                        <span className="mt-1.5 inline-block font-mono text-[10.5px] text-text-muted">
                          {st.metric}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Audit Proof Summary OR Hint */}
            {!auditResponse ? (
              <div className="rounded-md border border-dashed border-active-border bg-obsidian/70 p-4">
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("xray.empty_state_hint")}
                </p>
              </div>
            ) : (
              <>
                {/* Live Audit Proof Summary */}
                <div className="flex flex-col gap-3 rounded-sm border border-hairline bg-obsidian p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                      {t("xray.flags_title")}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-cleared">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      <span>{verdict?.audit_id}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {verdict?.xray_trace.deterministic_flags.length ? (
                      verdict.xray_trace.deterministic_flags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded-xs border border-conditional/40 bg-conditional/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-conditional"
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

                  <div className="border-t border-hairline pt-2.5">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      {t("xray.reasoning_label")}
                    </span>
                    <p className="font-sans text-xs leading-relaxed text-text-secondary">
                      {verdict?.xray_trace.reasoning_summary}
                    </p>
                  </div>
                </div>

                {/* Collapsible Developer Raw JSON Inspector */}
                <div className="overflow-hidden rounded-sm border border-hairline bg-obsidian">
                  <button
                    type="button"
                    onClick={() => setShowRawJson((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface/60 hover:text-text-primary"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Code2 className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                      <span>{t("xray.raw_payload_title")}</span>
                    </span>
                    {showRawJson ? (
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>

                  {showRawJson && (
                    <div className="border-t border-hairline">
                      <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
                        <div className="flex gap-1.5">
                          {(["verdict", "metrics"] as const).map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setJsonTab(tab)}
                              className={cn(
                                "h-8 rounded-xs border px-3 font-mono text-[10px] uppercase tracking-wider transition-colors",
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
                          className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-hairline bg-surface px-2.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary hover:text-text-primary"
                        >
                          {copied ? (
                            <Check
                              className="h-3 w-3 text-cleared"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>
                            {copied
                              ? t("xray.copied_btn")
                              : t("xray.copy_json_btn")}
                          </span>
                        </button>
                      </div>

                      <pre className="max-h-64 overflow-auto p-3.5 font-mono text-[11px] leading-relaxed text-text-secondary">
                        {activeJsonString}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sticky Action Footer (Never overlapped by bottom-right toast) */}
          <footer className="border-t border-hairline bg-obsidian/95 px-5 py-3.5">
            <button
              type="button"
              onClick={handleRunInstantDemo}
              className="cta-primary-polish inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-md bg-cleared px-4 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared transition-all hover:brightness-105"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>{t("xray.run_demo_btn")}</span>
            </button>
          </footer>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
