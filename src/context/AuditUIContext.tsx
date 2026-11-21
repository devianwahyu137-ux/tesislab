"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export type AuditPhase = "idle" | "scanning" | "debating" | "verdict";
export type AgentRole = "data_analyst" | "risk_manager" | "committee_chair";
export type AgentSnippets = Partial<Record<AgentRole, string>>;

interface AuditUIContextValue {
  isXrayMode: boolean;
  toggleXrayMode: () => void;
  activeTrack: AuditTrack;
  setActiveTrack: (track: AuditTrack) => void;
  demoTriggerCount: number;
  triggerDemo: () => void;
  auditPhase: AuditPhase;
  setAuditPhase: (phase: AuditPhase) => void;
  activeAgent: AgentRole | null;
  setActiveAgent: (agent: AgentRole | null) => void;
  agentSnippets: AgentSnippets;
  setAgentSnippets: (snippets: AgentSnippets) => void;
}

const AuditUIContext = createContext<AuditUIContextValue | null>(null);

/**
 * Manages cross-component UI state for X-Ray Architecture Mode,
 * active audit track, committee deliberation phase, and instant demo triggers.
 */
export function AuditUIProvider({ children }: { children: ReactNode }) {
  const [isXrayMode, setIsXrayMode] = useState(false);
  const [activeTrack, setActiveTrack] = useState<AuditTrack>("business");
  const [demoTriggerCount, setDemoTriggerCount] = useState(0);
  const [auditPhase, setAuditPhase] = useState<AuditPhase>("idle");
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [agentSnippets, setAgentSnippets] = useState<AgentSnippets>({});

  const toggleXrayMode = useCallback(() => {
    setIsXrayMode((prev) => !prev);
  }, []);

  const triggerDemo = useCallback(() => {
    setDemoTriggerCount((prev) => prev + 1);
    setAuditPhase("scanning");
    setActiveAgent("data_analyst");
  }, []);

  const value = useMemo<AuditUIContextValue>(
    () => ({
      isXrayMode,
      toggleXrayMode,
      activeTrack,
      setActiveTrack,
      demoTriggerCount,
      triggerDemo,
      auditPhase,
      setAuditPhase,
      activeAgent,
      setActiveAgent,
      agentSnippets,
      setAgentSnippets,
    }),
    [
      isXrayMode,
      toggleXrayMode,
      activeTrack,
      demoTriggerCount,
      triggerDemo,
      auditPhase,
      activeAgent,
      agentSnippets,
    ]
  );

  return (
    <AuditUIContext.Provider value={value}>{children}</AuditUIContext.Provider>
  );
}

/** Hook to access TesisLab cross-component UI state. */
export function useAuditUI(): AuditUIContextValue {
  const ctx = useContext(AuditUIContext);
  if (!ctx) {
    throw new Error("useAuditUI must be used within an AuditUIProvider");
  }
  return ctx;
}
