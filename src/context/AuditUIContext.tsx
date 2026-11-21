"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "framer-motion";
import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export type AuditPhase = "idle" | "scanning" | "debating" | "verdict";
export type AgentRole = "data_analyst" | "risk_manager" | "committee_chair";
export type AgentSnippets = Partial<Record<AgentRole, string>>;

const DEFAULT_CONVICTION = 75;

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
  userConviction: number;
  setUserConviction: (val: number) => void;
  submittedConviction: number;
  auditResponse: CommitteeAuditResponse | null;
  lastSubmittedInput: Record<string, unknown> | null;
  lastTrack: AuditTrack | null;
  setAuditOutcome: (
    response: CommitteeAuditResponse,
    input: Record<string, unknown>,
    track?: AuditTrack,
    conviction?: number
  ) => void;
  resetAudit: () => void;
}

const AuditUIContext = createContext<AuditUIContextValue | null>(null);

/**
 * Manages cross-component UI state for X-Ray Architecture Mode,
 * active audit track, conviction calibration, committee deliberation phase, and audit outcomes.
 */
export function AuditUIProvider({ children }: { children: ReactNode }) {
  const [isXrayMode, setIsXrayMode] = useState(false);
  const [activeTrack, setActiveTrack] = useState<AuditTrack>("business");
  const [demoTriggerCount, setDemoTriggerCount] = useState(0);
  const [auditPhase, setAuditPhase] = useState<AuditPhase>("idle");
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [agentSnippets, setAgentSnippets] = useState<AgentSnippets>({});
  const [userConviction, setUserConvictionState] =
    useState<number>(DEFAULT_CONVICTION);
  const [submittedConviction, setSubmittedConviction] =
    useState<number>(DEFAULT_CONVICTION);
  const [auditResponse, setAuditResponse] =
    useState<CommitteeAuditResponse | null>(null);
  const [lastSubmittedInput, setLastSubmittedInput] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [lastTrack, setLastTrack] = useState<AuditTrack | null>(null);

  const toggleXrayMode = useCallback(() => {
    setIsXrayMode((prev) => !prev);
  }, []);

  const setUserConviction = useCallback((val: number) => {
    const clamped = Math.max(10, Math.min(100, Math.round(val)));
    setUserConvictionState(clamped);
  }, []);

  const triggerDemo = useCallback(() => {
    setDemoTriggerCount((prev) => prev + 1);
    setAuditPhase("scanning");
    setActiveAgent("data_analyst");
  }, []);

  const setAuditOutcome = useCallback(
    (
      response: CommitteeAuditResponse,
      input: Record<string, unknown>,
      track?: AuditTrack,
      conviction?: number
    ) => {
      setAuditResponse(response);
      setLastSubmittedInput(input);
      setLastTrack(track ?? activeTrack);
      setSubmittedConviction(conviction ?? userConviction);
      setAuditPhase("verdict");
      setActiveAgent("committee_chair");
      setAgentSnippets({
        data_analyst: response.verdict.agent_deliberation.data_analyst,
        risk_manager: response.verdict.agent_deliberation.risk_manager,
        committee_chair: response.verdict.agent_deliberation.committee_chair,
      });
    },
    [activeTrack, userConviction]
  );

  const resetAudit = useCallback(() => {
    setAuditResponse(null);
    setLastSubmittedInput(null);
    setLastTrack(null);
    setUserConvictionState(DEFAULT_CONVICTION);
    setSubmittedConviction(DEFAULT_CONVICTION);
    setAuditPhase("idle");
    setActiveAgent(null);
    setAgentSnippets({});
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
      userConviction,
      setUserConviction,
      submittedConviction,
      auditResponse,
      lastSubmittedInput,
      lastTrack,
      setAuditOutcome,
      resetAudit,
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
      userConviction,
      setUserConviction,
      submittedConviction,
      auditResponse,
      lastSubmittedInput,
      lastTrack,
      setAuditOutcome,
      resetAudit,
    ]
  );

  return (
    <MotionConfig reducedMotion="user">
      <AuditUIContext.Provider value={value}>{children}</AuditUIContext.Provider>
    </MotionConfig>
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
