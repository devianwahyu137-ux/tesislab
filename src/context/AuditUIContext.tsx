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

interface AuditUIContextValue {
  isXrayMode: boolean;
  toggleXrayMode: () => void;
  activeTrack: AuditTrack;
  setActiveTrack: (track: AuditTrack) => void;
  demoTriggerCount: number;
  triggerDemo: () => void;
}

const AuditUIContext = createContext<AuditUIContextValue | null>(null);

/**
 * Manages cross-component UI state for X-Ray Architecture Mode,
 * active audit track, and instant demo triggers.
 */
export function AuditUIProvider({ children }: { children: ReactNode }) {
  const [isXrayMode, setIsXrayMode] = useState(false);
  const [activeTrack, setActiveTrack] = useState<AuditTrack>("business");
  const [demoTriggerCount, setDemoTriggerCount] = useState(0);

  const toggleXrayMode = useCallback(() => {
    setIsXrayMode((prev) => !prev);
  }, []);

  const triggerDemo = useCallback(() => {
    setDemoTriggerCount((prev) => prev + 1);
  }, []);

  const value = useMemo<AuditUIContextValue>(
    () => ({
      isXrayMode,
      toggleXrayMode,
      activeTrack,
      setActiveTrack,
      demoTriggerCount,
      triggerDemo,
    }),
    [isXrayMode, toggleXrayMode, activeTrack, demoTriggerCount, triggerDemo]
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
