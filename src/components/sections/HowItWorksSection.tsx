"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Background,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useTranslation } from "@/context/LanguageContext";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import { cn } from "@/lib/utils";

type GraphNodeId = "n1" | "n2" | "n3" | "n4" | "n5";

export interface HowItWorksSectionProps {
  macroContext: MarketContext;
}

const REVEAL_PROPS = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 as const },
  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
};

/**
 * Compact 4-Layer Methodology & Horizontal Interactive Architecture Graph (#cara-kerja).
 */
export function HowItWorksSection({ macroContext }: HowItWorksSectionProps) {
  const { t } = useTranslation();
  const [selectedNode, setSelectedNode] = useState<GraphNodeId>("n2");
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

  const handleFlowInit = useCallback((instance: ReactFlowInstance) => {
    rfInstanceRef.current = instance;
    requestAnimationFrame(() => {
      void instance.fitView({ padding: 0.14 });
    });
  }, []);

  const regime = macroContext.synthesis.macro_regime;
  const regimeTone =
    regime === "RISK_OFF"
      ? "border-rejected/40 bg-rejected/10 text-rejected"
      : regime === "RISK_ON"
        ? "border-cleared/40 bg-cleared/10 text-cleared"
        : "border-conditional/40 bg-conditional/10 text-conditional";

  const { USD_IDR, IHSG, GOLD_USD, BTC_USD } = macroContext.indicators;
  const liveMacroRows = [
    {
      k: "USD/IDR",
      v: `Rp ${Math.round(USD_IDR.price).toLocaleString("en-US")}`,
      tone: "text-text-primary",
    },
    {
      k: "IHSG",
      v: `${IHSG.price.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${IHSG.change_pct >= 0 ? "+" : ""}${IHSG.change_pct.toFixed(2)}%)`,
      tone: IHSG.change_pct < 0 ? "text-rejected" : "text-cleared",
    },
    {
      k: "GOLD",
      v: `$${Math.round(GOLD_USD.price).toLocaleString("en-US")}`,
      tone: "text-text-primary",
    },
    {
      k: "BTC",
      v: `$${Math.round(BTC_USD.price).toLocaleString("en-US")} (${BTC_USD.change_pct >= 0 ? "+" : ""}${BTC_USD.change_pct.toFixed(2)}%)`,
      tone: BTC_USD.change_pct < 0 ? "text-rejected" : "text-cleared",
    },
  ];

  const graphNodes: Node[] = useMemo(() => {
    const specs: { id: GraphNodeId; x: number; y: number }[] = [
      { id: "n1", x: 0, y: 24 },
      { id: "n2", x: 220, y: 24 },
      { id: "n3", x: 440, y: 24 },
      { id: "n4", x: 660, y: 24 },
      { id: "n5", x: 880, y: 24 },
    ];
    return specs.map((item) => {
      const isSelected = selectedNode === item.id;
      return {
        id: item.id,
        position: { x: item.x, y: item.y },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: t(`how_it_works.graph_nodes.${item.id}.label`) },
        style: {
          width: 186,
          borderRadius: 4,
          padding: "10px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: isSelected ? 600 : 500,
          textAlign: "center",
          whiteSpace: "nowrap",
          background: "var(--bg-obsidian)",
          color: isSelected ? "var(--status-cleared)" : "var(--text-primary)",
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
  }, [selectedNode, t]);

  const graphEdges: Edge[] = useMemo(
    () => [
      {
        id: "e1-2",
        source: "n1",
        target: "n2",
        type: "straight",
        animated: true,
        style: { stroke: "var(--status-cleared)", strokeWidth: 1.5 },
      },
      {
        id: "e2-3",
        source: "n2",
        target: "n3",
        type: "straight",
        animated: true,
        style: { stroke: "var(--status-conditional)", strokeWidth: 1.5 },
      },
      {
        id: "e3-4",
        source: "n3",
        target: "n4",
        type: "straight",
        animated: true,
        style: { stroke: "var(--status-cleared)", strokeWidth: 1.5 },
      },
      {
        id: "e4-5",
        source: "n4",
        target: "n5",
        type: "straight",
        animated: true,
        style: { stroke: "var(--status-cleared)", strokeWidth: 1.5 },
      },
    ],
    []
  );

  return (
    <section
      id="cara-kerja"
      className="mx-auto w-full max-w-6xl border-t border-hairline py-12 md:py-16"
    >
      {/* Clean Editorial Header */}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center md:mb-10">
        <span className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-cleared">
          {t("how_it_works.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("how_it_works.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("how_it_works.subtitle")}
        </p>
      </div>

      {/* Horizontal Interactive Architecture Graph (@xyflow/react) */}
      <div className="mb-8 overflow-hidden rounded-sm border border-active-border/80 bg-surface shadow-xl shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-obsidian px-4 py-2.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
            {t("how_it_works.graph_title")}
          </span>
          <span className="font-mono text-[10px] text-text-muted">
            {t("how_it_works.graph_hint")}
          </span>
        </div>

        <div className="h-[156px] w-full bg-canvas sm:h-[172px]">
          <ReactFlow
            nodes={graphNodes}
            edges={graphEdges}
            onInit={handleFlowInit}
            onNodeClick={(_, node) => {
              const id = node.id as GraphNodeId;
              if (
                id === "n1" ||
                id === "n2" ||
                id === "n3" ||
                id === "n4" ||
                id === "n5"
              ) {
                setSelectedNode(id);
              }
            }}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnDrag={false}
            minZoom={0.2}
            maxZoom={1.1}
            fitView
            fitViewOptions={{ padding: 0.14, minZoom: 0.2, maxZoom: 1 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} color="var(--border-hairline)" />
          </ReactFlow>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-obsidian px-4 py-3">
          <span className="font-mono text-xs font-semibold text-cleared">
            {t(`how_it_works.graph_nodes.${selectedNode}.label`)}
          </span>
          <p className="font-sans text-xs leading-relaxed text-text-secondary">
            {t(`how_it_works.graph_nodes.${selectedNode}.spec`)}
          </p>
        </div>
      </div>

      {/* Compact 2x2 Editorial Bento Grid (eliminates 1.5 screens of zig-zag bloat) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Layer 01: Deterministic Math */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cleared">
                    01 · {t("how_it_works.step1.badge")}
                  </span>
                  <span className="font-mono text-[10px] text-cleared">0.84 ms</span>
                </div>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step1.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step1.body")}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-hairline pt-3 font-mono text-xs tabular-nums">
                <div className="rounded-xs border border-hairline bg-obsidian p-2">
                  <span className="block text-[9px] text-text-muted">BEP UNITS</span>
                  <span className="mt-0.5 block font-semibold text-text-primary">
                    224 / mo
                  </span>
                </div>
                <div className="rounded-xs border border-hairline bg-obsidian p-2">
                  <span className="block text-[9px] text-text-muted">RUNWAY</span>
                  <span className="mt-0.5 block font-semibold text-conditional">
                    3.9 MO
                  </span>
                </div>
                <div className="rounded-xs border border-hairline bg-obsidian p-2">
                  <span className="block text-[9px] text-text-muted">SCORE LOCK</span>
                  <span className="mt-0.5 block font-semibold text-rejected">
                    50 / 100
                  </span>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Layer 02: Hermes Macro Radar */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-conditional">
                    02 · {t("how_it_works.step2.badge")}
                  </span>
                  <span
                    className={cn(
                      "rounded-xs border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      regimeTone
                    )}
                  >
                    {regime}
                  </span>
                </div>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step2.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step2.body")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-hairline pt-3 font-mono text-[11px] tabular-nums">
                {liveMacroRows.map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between rounded-xs border border-hairline bg-obsidian px-2.5 py-1.5"
                  >
                    <span className="text-[10px] text-text-muted">{row.k}</span>
                    <span className={`font-semibold ${row.tone}`}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Layer 03: Pre-Mortem Diff */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-bold text-rejected">
                  03 · {t("how_it_works.step3.badge")}
                </span>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step3.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step3.body")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 border-t border-hairline pt-3 sm:grid-cols-2">
                <div className="rounded-xs border border-hairline bg-obsidian p-2.5">
                  <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-text-muted">
                    {t("how_it_works.step3.left_label")}
                  </span>
                  <p className="font-sans text-[11px] leading-relaxed text-text-muted">
                    {t("how_it_works.step3.left_text")}
                  </p>
                </div>
                <div className="rounded-xs border border-rejected/40 bg-rejected/8 p-2.5">
                  <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-wider text-rejected">
                    {t("how_it_works.step3.right_label")}
                  </span>
                  <p className="font-sans text-[11px] leading-relaxed text-text-primary">
                    {t("how_it_works.step3.right_text")}
                  </p>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Layer 04: Optimism Bias Mirror & Stress Slider */}
        <motion.div {...REVEAL_PROPS}>
          <SpotlightCard className="h-full p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cleared">
                    04 · {t("how_it_works.step4.badge")}
                  </span>
                  <span className="rounded-xs border border-rejected/45 bg-rejected/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rejected">
                    {t("how_it_works.step4.bias_tag")}
                  </span>
                </div>
                <h3 className="font-editorial text-xl font-medium text-text-primary">
                  {t("how_it_works.step4.title")}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {t("how_it_works.step4.body")}
                </p>
              </div>

              <div className="flex flex-col gap-2 border-t border-hairline pt-3 font-mono text-[11px] tabular-nums">
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    {t("how_it_works.step4.conviction_bar")}
                  </span>
                  <span className="text-text-primary">85%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-xs bg-elevated">
                  <div className="h-full w-[85%] rounded-xs bg-text-primary/75" />
                </div>

                <div className="mt-1 flex justify-between">
                  <span className="text-text-secondary">
                    {t("how_it_works.step4.resilience_bar")}
                  </span>
                  <span className="text-rejected">42%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-xs bg-elevated">
                  <div className="h-full w-[42%] rounded-xs bg-rejected" />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
}
