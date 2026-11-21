"use client";

import { useMemo, useState } from "react";
import {
  Background,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Check, Copy, Cpu, X } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
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

type StageId = "01" | "02" | "03" | "04";

/**
 * Tactile Vaul drawer + interactive React Flow pipeline circuit inspector
 * for X-Ray Architecture Mode. Never exposes secret environment variables.
 */
export function XRayArchitectureDrawer({
  macroContext,
  macroOrigin,
}: XRayArchitectureDrawerProps) {
  const { t } = useTranslation();
  const { isXrayMode, toggleXrayMode, auditResponse, lastTrack, activeTrack } =
    useAuditUI();

  const [jsonTab, setJsonTab] = useState<"verdict" | "metrics">("verdict");
  const [selectedStage, setSelectedStage] = useState<StageId>("02");
  const [copied, setCopied] = useState(false);

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
      // Ignore clipboard failures in restricted contexts
    }
  };

  const stageDetails = useMemo(
    () =>
      ({
        "01": {
          step: "01",
          shortLabel: "01. Zod Schema",
          name: "Input Schema (Zod)",
          detail: `track=${track} // validated`,
        },
        "02": {
          step: "02",
          shortLabel: "02. TS Engine",
          name: t("xray.calc_latency_label"),
          detail: telemetry ? `${telemetry.calc_ms.toFixed(2)} ms` : "standby",
        },
        "03": {
          step: "03",
          shortLabel: "03. Hermes Feed",
          name: t("xray.macro_source_label"),
          detail: `${telemetry?.macro_origin ?? macroOrigin} // ${telemetry?.macro_regime ?? macroContext.synthesis.macro_regime}`,
        },
        "04": {
          step: "04",
          shortLabel: "04. Committee LLM",
          name: t("xray.llm_latency_label"),
          detail: telemetry
            ? `${telemetry.model_used} (${telemetry.llm_ms.toFixed(0)} ms)${telemetry.fallback_reason ? ` [${telemetry.fallback_reason}]` : ""}`
            : "standby",
        },
      }) satisfies Record<
        StageId,
        { step: StageId; shortLabel: string; name: string; detail: string }
      >,
    [track, t, telemetry, macroOrigin, macroContext.synthesis.macro_regime]
  );

  const flowNodes: Node[] = useMemo(() => {
    const ids: StageId[] = ["01", "02", "03", "04"];
    const positions: Record<StageId, { x: number; y: number }> = {
      "01": { x: 10, y: 12 },
      "02": { x: 245, y: 12 },
      "03": { x: 10, y: 108 },
      "04": { x: 245, y: 108 },
    };

    return ids.map((id) => {
      const st = stageDetails[id];
      const isSelected = selectedStage === id;
      return {
        id,
        position: positions[id],
        data: { label: `${st.shortLabel}\n${st.detail}` },
        style: {
          width: 205,
          borderRadius: 4,
          padding: "8px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          lineHeight: 1.4,
          whiteSpace: "pre-line",
          background: "var(--bg-obsidian)",
          color: "var(--text-primary)",
          border: isSelected
            ? "1.5px solid var(--status-cleared)"
            : "1px solid var(--border-active)",
          boxShadow: isSelected
            ? "0 0 0 1px var(--status-cleared)"
            : "none",
          cursor: "pointer",
        },
      };
    });
  }, [stageDetails, selectedStage]);

  const flowEdges: Edge[] = useMemo(
    () => [
      {
        id: "e1-2",
        source: "01",
        target: "02",
        animated: true,
        style: { stroke: "var(--status-cleared)", strokeWidth: 1.5 },
      },
      {
        id: "e2-3",
        source: "02",
        target: "03",
        animated: true,
        style: { stroke: "var(--status-conditional)", strokeWidth: 1.5 },
      },
      {
        id: "e3-4",
        source: "03",
        target: "04",
        animated: true,
        style: { stroke: "var(--status-cleared)", strokeWidth: 1.5 },
      },
    ],
    []
  );

  const activeStage = stageDetails[selectedStage];

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
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-hairline bg-surface outline-none"
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
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-sm border border-active-border bg-surface text-text-secondary transition-colors hover:text-text-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          {/* Scrollable Content */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            <TerminalDivider label={t("xray.pipeline_title")} />

            {/* Interactive React Flow 4-Stage Pipeline Diagram */}
            <div className="flex flex-col gap-2.5">
              <div className="h-[205px] w-full overflow-hidden rounded-sm border border-hairline bg-canvas">
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  onNodeClick={(_, node) => {
                    const id = node.id as StageId;
                    if (id in stageDetails) setSelectedStage(id);
                  }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  zoomOnScroll={false}
                  zoomOnPinch={false}
                  zoomOnDoubleClick={false}
                  panOnDrag={false}
                  fitView
                  fitViewOptions={{ padding: 0.16 }}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={18} size={1} color="var(--border-hairline)" />
                </ReactFlow>
              </div>

              {/* Clicked Node Telemetry Readout */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-active-border/80 bg-obsidian px-3.5 py-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-cleared">
                    {activeStage.step}
                  </span>
                  <span className="truncate text-text-secondary">
                    {activeStage.name}
                  </span>
                </div>
                <span className="shrink-0 tabular-nums text-text-primary">
                  {activeStage.detail}
                </span>
              </div>
              <span className="font-mono text-[10px] text-text-muted">
                {t("xray.node_hint")}
              </span>
            </div>

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
                        <Check
                          className="h-3.5 w-3.5 text-cleared"
                          aria-hidden="true"
                        />
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
