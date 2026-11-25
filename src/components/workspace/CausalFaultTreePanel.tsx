"use client";

import { memo, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, ShieldCheck } from "lucide-react";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface CausalNodeData extends Record<string, unknown> {
  badge: string;
  title: string;
  detail: string;
  tone: "cleared" | "conditional" | "rejected" | "sky";
}

type CausalNodeType = Node<CausalNodeData, "causal">;

const CausalNode = memo(function CausalNode({
  data,
  selected,
}: NodeProps<CausalNodeType>) {
  const toneBorder =
    data.tone === "cleared"
      ? "border-cleared/55 bg-obsidian"
      : data.tone === "rejected"
        ? "border-rejected/55 bg-obsidian"
        : data.tone === "conditional"
          ? "border-conditional/55 bg-obsidian"
          : "border-sky-400/55 bg-obsidian";

  const badgeTone =
    data.tone === "cleared"
      ? "text-cleared"
      : data.tone === "rejected"
        ? "text-rejected"
        : data.tone === "conditional"
          ? "text-conditional"
          : "text-sky-400";

  return (
    <div
      className={cn(
        "w-[220px] rounded-sm border px-3 py-2.5 shadow-md transition-all",
        toneBorder,
        selected && "ring-2 ring-cleared"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-none !bg-slate-400"
      />
      <span
        className={cn(
          "block font-mono text-[9px] font-bold uppercase tracking-[0.14em]",
          badgeTone
        )}
      >
        {data.badge}
      </span>
      <span className="mt-0.5 block font-sans text-xs font-semibold leading-snug text-text-primary">
        {data.title}
      </span>
      <p className="mt-1 line-clamp-2 font-sans text-[10.5px] leading-relaxed text-text-secondary">
        {data.detail}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-none !bg-emerald-400"
      />
    </div>
  );
});

const nodeTypes = { causal: CausalNode };

/**
 * Interactive Pre-Mortem Causal Fault Tree powered by `@xyflow/react`.
 * Maps how macro regimes, deterministic flags, and the 3 Pre-Mortem blind spots
 * propagate into tail-risk ruin and lock onto the mandatory mitigation rule.
 */
export function CausalFaultTreePanel() {
  const { locale } = useTranslation();
  const { auditResponse, lastTrack } = useAuditUI();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isId = locale === "id";

  const { nodes, edges } = useMemo(() => {
    if (!auditResponse) return { nodes: [] as CausalNodeType[], edges: [] as Edge[] };

    const { verdict, metrics, monte_carlo, telemetry } = auditResponse;
    const status = verdict.verdict_status;
    const rootTone: CausalNodeData["tone"] =
      status === "CLEARED"
        ? "cleared"
        : status === "CONDITIONAL"
          ? "conditional"
          : "rejected";

    const flags = metrics.deterministic_flags;
    const flagStr =
      flags.length > 0
        ? flags.join(", ")
        : isId
          ? "Seluruh ambang lulus"
          : "All hard gates passed";

    const builtNodes: CausalNodeType[] = [
      {
        id: "root",
        type: "causal",
        position: { x: 0, y: 115 },
        data: {
          badge: `THESIS · ${(lastTrack ?? "trading").toUpperCase()}`,
          title: `${verdict.score}/100 · ${status}`,
          detail: verdict.headline_verdict,
          tone: rootTone,
        },
      },
      {
        id: "macro",
        type: "causal",
        position: { x: 265, y: 35 },
        data: {
          badge: "HERMES MACRO GATE",
          title: `Regime: ${telemetry.macro_regime}`,
          detail: isId
            ? "Konteks likuiditas & volatilitas pasar harian yang mengkalibrasi batas risiko."
            : "Daily macro liquidity & volatility regime calibrating risk thresholds.",
          tone:
            telemetry.macro_regime === "RISK_OFF"
              ? "rejected"
              : telemetry.macro_regime === "RISK_ON"
                ? "cleared"
                : "conditional",
        },
      },
      {
        id: "math",
        type: "causal",
        position: { x: 265, y: 195 },
        data: {
          badge: `DECIMAL.JS · ${telemetry.calc_ms.toFixed(2)} MS`,
          title:
            flags.length > 0
              ? `${flags.length} Gate Flag(s)`
              : "Zero Violations",
          detail: flagStr,
          tone: flags.length > 0 ? "rejected" : "sky",
        },
      },
      ...verdict.premortem_blind_spots.map((spot, idx) => ({
        id: `bs-${idx}`,
        type: "causal" as const,
        position: { x: 535, y: idx * 115 },
        data: {
          badge: `PRE-MORTEM VECTOR 0${idx + 1}`,
          title: isId
            ? `Celah Kegagalan #${idx + 1}`
            : `Failure Vector #${idx + 1}`,
          detail: spot,
          tone: "conditional" as const,
        },
      })),
      {
        id: "tail",
        type: "causal",
        position: { x: 810, y: 40 },
        data: {
          badge: "MONTE CARLO 1,000 PATHS",
          title: `Ruin ${monte_carlo.ruin_probability_pct.toFixed(1)}%`,
          detail: `P5 Tail: Rp ${Math.round(monte_carlo.p5_ending_value).toLocaleString("id-ID")}`,
          tone:
            monte_carlo.ruin_probability_pct > 25
              ? "rejected"
              : monte_carlo.ruin_probability_pct > 10
                ? "conditional"
                : "cleared",
        },
      },
      {
        id: "mitigation",
        type: "causal",
        position: { x: 810, y: 195 },
        data: {
          badge: "MANDATORY MITIGATION LOCK",
          title: isId ? "Syarat Eksekusi" : "Execution Guardrail",
          detail: verdict.actionable_fix,
          tone: "cleared",
        },
      },
    ];

    const edgeColorWarn = "#f59e0b";
    const edgeColorDanger = "#ef4444";
    const edgeColorSafe = "#10b981";

    const builtEdges: Edge[] = [
      {
        id: "e-root-macro",
        source: "root",
        target: "macro",
        type: "smoothstep",
        animated: true,
        style: { stroke: edgeColorWarn, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColorWarn },
      },
      {
        id: "e-root-math",
        source: "root",
        target: "math",
        type: "smoothstep",
        animated: true,
        style: {
          stroke: flags.length > 0 ? edgeColorDanger : "#38bdf8",
          strokeWidth: 1.5,
        },
      },
      {
        id: "e-macro-bs0",
        source: "macro",
        target: "bs-0",
        type: "smoothstep",
        style: { stroke: edgeColorWarn, strokeWidth: 1.3 },
      },
      {
        id: "e-macro-bs1",
        source: "macro",
        target: "bs-1",
        type: "smoothstep",
        style: { stroke: edgeColorWarn, strokeWidth: 1.3 },
      },
      {
        id: "e-math-bs1",
        source: "math",
        target: "bs-1",
        type: "smoothstep",
        style: { stroke: edgeColorDanger, strokeWidth: 1.3 },
      },
      {
        id: "e-math-bs2",
        source: "math",
        target: "bs-2",
        type: "smoothstep",
        style: { stroke: edgeColorDanger, strokeWidth: 1.3 },
      },
      ...[0, 1, 2].map((idx) => ({
        id: `e-bs${idx}-tail`,
        source: `bs-${idx}`,
        target: "tail",
        type: "smoothstep",
        animated: monte_carlo.ruin_probability_pct > 15,
        style: { stroke: edgeColorDanger, strokeWidth: 1.3 },
      })),
      ...[0, 1, 2].map((idx) => ({
        id: `e-bs${idx}-mit`,
        source: `bs-${idx}`,
        target: "mitigation",
        type: "smoothstep",
        animated: true,
        style: { stroke: edgeColorSafe, strokeWidth: 1.4 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColorSafe },
      })),
    ];

    return { nodes: builtNodes, edges: builtEdges };
  }, [auditResponse, lastTrack, isId]);

  if (!auditResponse) return null;

  const activeNode =
    nodes.find((n) => n.id === selectedId) ??
    nodes.find((n) => n.id === "mitigation") ??
    nodes[0];

  return (
    <div className="terminal-panel overflow-hidden rounded-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-obsidian px-4 py-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.15em] text-text-primary">
            {isId
              ? "POHON KEGAGALAN KAUSAL PRE-MORTEM (INTERACTIVE GRAPH)"
              : "INTERACTIVE PRE-MORTEM CAUSAL FAULT TREE"}
          </span>
        </div>

        <span className="font-mono text-[10px] text-text-muted">
          {isId
            ? "Klik simpul untuk inspeksi rantai risiko · Geser & Zoom"
            : "Click any node to inspect causal vector · Pan & Zoom"}
        </span>
      </div>

      <div className="h-[340px] w-full bg-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          minZoom={0.45}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {activeNode && (
        <div className="flex items-start gap-2.5 border-t border-hairline bg-obsidian px-4 py-3">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-cleared">
              {activeNode.data.badge} · {activeNode.data.title}
            </span>
            <p className="mt-0.5 font-sans text-xs leading-relaxed text-text-secondary">
              {activeNode.data.detail}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
