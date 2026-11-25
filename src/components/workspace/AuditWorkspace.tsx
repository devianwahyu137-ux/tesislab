"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CandlestickChart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  Gauge,
  GitBranch,
  GitCompare,
  GripVertical,
  Layers,
  Loader2,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  WandSparkles,
} from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { PrecisionSlider } from "@/components/ui/PrecisionSlider";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StatusStamp, type StatusStampVariant } from "@/components/ui/StatusStamp";
import { AuditHistoryPanel } from "@/components/workspace/AuditHistoryPanel";
import { CausalFaultTreePanel } from "@/components/workspace/CausalFaultTreePanel";
import { FormattedNumberInput } from "@/components/workspace/FormattedNumberInput";
import { LivePreAuditPanel } from "@/components/workspace/LivePreAuditPanel";
import { StressSliderPanel } from "@/components/workspace/StressSliderPanel";
import { TickerSearchCombobox } from "@/components/workspace/TickerSearchCombobox";
import { TradingPriceChart } from "@/components/workspace/TradingPriceChart";
import { VerdictCard } from "@/components/workspace/VerdictCard";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { getDemoPresetByTrack } from "@/lib/agents/demoPresets";
import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import {
  appendAuditHistory,
  clearAuditHistory,
  loadAuditHistory,
  type AuditHistoryEntry,
} from "@/lib/auditHistory";
import type {
  BusinessAuditInput,
  CashflowAuditInput,
  TradeAuditInput,
} from "@/lib/calculators";
import {
  autoHealBusinessInput,
  autoHealCashflowInput,
  autoHealTradingInput,
} from "@/lib/quant/flagDiagnostics";
import type { MarketTechnicals } from "@/lib/quant/technicalIndicators";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const TRACK_META: readonly {
  id: AuditTrack;
  Icon: typeof Activity;
}[] = [
  { id: "trading", Icon: Activity },
  { id: "business", Icon: Briefcase },
  { id: "cashflow", Icon: Wallet },
];

const SAMPLE_TRADING: TradeAuditInput = {
  asset_symbol: "BBCA.JK",
  direction: "LONG",
  total_capital: 25_000_000,
  position_size_pct: 40,
  entry_price: 5_550,
  take_profit: 5_850,
  stop_loss: 5_200,
  round_trip_fee_pct: 0.4,
  rationale: "FOMO mengejar pantulan teknikal saat IHSG sedang koreksi tajam.",
};

function roundPriceForScale(price: number): number {
  if (price >= 1000) return Math.round(price / 5) * 5;
  if (price >= 100) return Math.round(price);
  return Number(price.toFixed(2));
}

const SAMPLE_BUSINESS: BusinessAuditInput = {
  initial_capital: 30_000_000,
  monthly_fixed_cost: 14_500_000,
  selling_price: 220_000,
  unit_cogs: 155_000,
  target_monthly_units: 210,
  platform_commission_pct: 0,
  include_umkm_tax: true,
  business_concept:
    "Ekspansi booth ritel batik modern dengan sewa tetap mal Rp14,5 jt/bulan.",
};

const SAMPLE_CASHFLOW: CashflowAuditInput = {
  monthly_net_income: 12_000_000,
  current_monthly_expenses: 7_500_000,
  existing_debt_installment: 0,
  new_monthly_installment: 4_200_000,
  installment_months: 12,
  flat_interest_pct_per_month: 1.5,
  liquid_emergency_fund: 15_000_000,
  decision_purpose: "Cicilan laptop kerja dan perangkat produksi selama 12 bulan.",
};

const DEMO_PRESET_MAP: Record<AuditTrack, string> = {
  trading: "demo_trading_bbca",
  business: "demo_business_batik",
  cashflow: "demo_cashflow_gadget",
};

const TRAP_PRESETS: readonly {
  track: AuditTrack;
  conviction: number;
}[] = [
  { track: "trading", conviction: 80 },
  { track: "business", conviction: 85 },
  { track: "cashflow", conviction: 80 },
];

type MobilePaneTab = "input" | "telemetry" | "causal" | "verdict";
type RightPaneSubTab = "telemetry" | "causal" | "verdict";
type InputComplexityMode = "guided" | "pro";

function getScoreTextTone(score: number): string {
  if (score >= 75) return "text-cleared text-glow-emerald";
  if (score >= 50) return "text-conditional text-glow-amber";
  return "text-rejected text-glow-crimson";
}

function getLiveStampVariant(score: number, flagCount: number): StatusStampVariant {
  if (score < 45) return "REJECTED";
  if (score >= 75 && flagCount === 0) return "CLEARED";
  return "CONDITIONAL";
}

export interface AuditWorkspaceProps {
  variant?: "default" | "terminal";
  initialTrack?: AuditTrack;
  initialSymbol?: string;
  autoRunDemo?: boolean;
}

/**
 * Interactive 3-Track Pre-Mortem Audit Workstation with:
 * - Guided (Beginner) vs. Pro Quant progressive disclosure modes
 * - Universal 1-Click Auto-Heal across Trading, Business/UMKM, & Cashflow
 * - Zero-Overlap Right Pane with Pinned Score Header + 3 Crisp Sub-Tabs
 */
export function AuditWorkspace({
  variant = "default",
  initialTrack,
  initialSymbol,
  autoRunDemo = false,
}: AuditWorkspaceProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const isId = locale === "id";
  const {
    activeTrack,
    setActiveTrack,
    demoTriggerCount,
    auditPhase,
    setAuditPhase,
    setActiveAgent,
    userConviction,
    setUserConviction,
    auditResponse,
    liveRiskSnapshot,
    prefillPayload,
    queuePrefillInput,
    setAuditOutcome,
    resetAudit,
  } = useAuditUI();

  const [tradingInput, setTradingInput] = useState<TradeAuditInput>(() =>
    initialSymbol
      ? { ...SAMPLE_TRADING, asset_symbol: initialSymbol.trim().toUpperCase() }
      : SAMPLE_TRADING
  );
  const [businessInput, setBusinessInput] =
    useState<BusinessAuditInput>(SAMPLE_BUSINESS);
  const [cashflowInput, setCashflowInput] =
    useState<CashflowAuditInput>(SAMPLE_CASHFLOW);

  const [inputMode, setInputMode] = useState<InputComplexityMode>("guided");
  const [showChart, setShowChart] = useState(true);
  const [rightTab, setRightTab] = useState<RightPaneSubTab>("telemetry");
  const [mobileTab, setMobileTab] = useState<MobilePaneTab>("input");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [liveQuote, setLiveQuote] = useState<{
    symbol: string;
    price: number;
    change_pct: number;
    currency: string;
  } | null>(null);
  const [marketTechnicals, setMarketTechnicals] =
    useState<MarketTechnicals | null>(null);
  const [historyEntries, setHistoryEntries] = useState<AuditHistoryEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDemoCountRef = useRef(0);
  const lastPrefillNonceRef = useRef(0);
  const didInitParamsRef = useRef(false);

  // Consume cross-module prefill payloads from /terminal, /terminal/import, or /terminal/compare
  useEffect(() => {
    if (
      prefillPayload &&
      prefillPayload.nonce !== lastPrefillNonceRef.current
    ) {
      lastPrefillNonceRef.current = prefillPayload.nonce;
      const tId = setTimeout(() => {
        setActiveTrack(prefillPayload.track);
        if (prefillPayload.track === "trading") {
          setTradingInput(
            prefillPayload.input as unknown as TradeAuditInput
          );
        } else if (prefillPayload.track === "business") {
          setBusinessInput(
            prefillPayload.input as unknown as BusinessAuditInput
          );
        } else {
          setCashflowInput(
            prefillPayload.input as unknown as CashflowAuditInput
          );
        }
        setRightTab("telemetry");
      }, 0);
      return () => clearTimeout(tId);
    }
  }, [prefillPayload, setActiveTrack]);

  useEffect(() => {
    const tId = setTimeout(() => setHistoryEntries(loadAuditHistory()), 0);
    return () => clearTimeout(tId);
  }, []);

  const clearPhaseTimer = () => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  };

  useEffect(() => clearPhaseTimer, []);

  const getActiveInput = useCallback(
    (track: AuditTrack): Record<string, unknown> => {
      if (track === "trading") {
        return {
          ...tradingInput,
          rationale:
            tradingInput.rationale.trim() ||
            (isId
              ? "Evaluasi posisi sebelum eksekusi modal."
              : "Pre-execution risk evaluation."),
          ...(marketTechnicals?.atr_pct
            ? { atr_pct: marketTechnicals.atr_pct }
            : {}),
        };
      }
      if (track === "business") {
        return {
          ...businessInput,
          business_concept:
            businessInput.business_concept.trim() ||
            (isId ? "Rencana usaha & ekspansi UMKM." : "SME venture evaluation."),
        };
      }
      return {
        ...cashflowInput,
        decision_purpose:
          cashflowInput.decision_purpose.trim() ||
          (isId
            ? "Evaluasi komitmen cicilan & arus kas."
            : "Household debt & cashflow check."),
      };
    },
    [tradingInput, businessInput, cashflowInput, marketTechnicals, isId]
  );

  const handleLoadSample = useCallback(
    (track: AuditTrack = activeTrack) => {
      if (track === "trading") setTradingInput(SAMPLE_TRADING);
      else if (track === "business") setBusinessInput(SAMPLE_BUSINESS);
      else setCashflowInput(SAMPLE_CASHFLOW);
      setErrorMessage(null);
    },
    [activeTrack]
  );

  const applyDemoPresetInput = useCallback(
    (track: AuditTrack): Record<string, unknown> => {
      const preset = getDemoPresetByTrack(track);
      if (preset.track === "trading") {
        setTradingInput({ ...preset.input, round_trip_fee_pct: 0.4 });
      } else if (preset.track === "business") {
        setBusinessInput({ ...preset.input });
      } else {
        setCashflowInput({ ...preset.input });
      }
      setErrorMessage(null);
      return { ...preset.input };
    },
    []
  );

  const handleApplyTrap = useCallback(
    (track: AuditTrack, conviction: number) => {
      setActiveTrack(track);
      handleLoadSample(track);
      setUserConviction(conviction);
      setRightTab("telemetry");
      setMobileTab("input");
      toast.info(`${t("toast.trap_loaded")}: ${t(`form.traps.${track}.label`)}`);
    },
    [handleLoadSample, setActiveTrack, setUserConviction, t]
  );

  const handleAutoHeal = useCallback(() => {
    if (activeTrack === "trading") {
      setTradingInput((prev) =>
        autoHealTradingInput(prev, marketTechnicals?.atr_pct)
      );
      toast.success(
        isId
          ? "Parameter Trading dikalibrasi otomatis ke R:R 1:2,3 & batas risiko < 2% modal."
          : "Trading setup auto-calibrated to 1:2.3 R:R & < 2% capital risk."
      );
      return;
    }
    if (activeTrack === "business") {
      setBusinessInput((prev) => autoHealBusinessInput(prev));
      toast.success(
        isId
          ? "Struktur UMKM dikalibrasi otomatis: margin bersih sehat, target > BEP, & napas kas 6 bulan."
          : "SME unit economics auto-healed: healthy net margin, BEP buffer, & 6-month runway."
      );
      return;
    }
    setCashflowInput((prev) => autoHealCashflowInput(prev));
    toast.success(
      isId
        ? "Arus kas dikalibrasi otomatis ke batas aman DSR OJK ≤ 28% & dana darurat 6 bulan."
        : "Cashflow auto-calibrated to OJK ≤ 28% DSR cap & 6-month emergency reserve."
    );
  }, [activeTrack, marketTechnicals?.atr_pct, isId]);

  const handleFetchLiveQuote = useCallback(
    async (overrideSymbol?: string) => {
      const symbol = (overrideSymbol ?? tradingInput.asset_symbol)
        .trim()
        .toUpperCase();
      if (!symbol) return;
      setIsFetchingQuote(true);
      try {
        const res = await fetch(
          `/api/quote?symbol=${encodeURIComponent(symbol)}`
        );
        const data = (await res.json()) as {
          symbol?: string;
          price?: number;
          change_pct?: number;
          currency?: string;
          message?: string;
        };
        if (!res.ok || typeof data.price !== "number") {
          toast.error(data.message ?? t("quote.toast_error"));
          return;
        }
        const nextEntry =
          data.price >= 100
            ? Math.round(data.price)
            : Number(data.price.toFixed(2));
        const resolvedSymbol = data.symbol ?? symbol;
        const changePct = data.change_pct ?? 0;
        const currency = data.currency ?? "USD";

        setTradingInput((prev) => {
          const isLong = prev.direction === "LONG";
          const autoTp = roundPriceForScale(
            nextEntry * (isLong ? 1.06 : 0.94)
          );
          const autoSl = roundPriceForScale(
            nextEntry * (isLong ? 0.96 : 1.04)
          );
          return {
            ...prev,
            asset_symbol: resolvedSymbol,
            entry_price: nextEntry,
            take_profit: autoTp,
            stop_loss: autoSl,
            round_trip_fee_pct: resolvedSymbol.endsWith(".JK") ? 0.4 : 0.2,
          };
        });
        setLiveQuote({
          symbol: resolvedSymbol,
          price: nextEntry,
          change_pct: changePct,
          currency,
        });
        const sign = changePct >= 0 ? "+" : "";
        toast.success(
          `${t("quote.toast_success")}: ${resolvedSymbol} @ ${nextEntry.toLocaleString("id-ID")} ${currency} (${sign}${changePct.toFixed(2)}%)`
        );
      } catch {
        toast.error(t("quote.toast_error"));
      } finally {
        setIsFetchingQuote(false);
      }
    },
    [tradingInput.asset_symbol, t]
  );

  const handleDirectionChange = useCallback((nextDir: "LONG" | "SHORT") => {
    setTradingInput((prev) => {
      if (prev.direction === nextDir) return prev;
      const entry = Math.max(0.0001, prev.entry_price || 1);
      const tpDistPct = Math.max(
        0.015,
        Math.abs(prev.take_profit - entry) / entry
      );
      const slDistPct = Math.max(
        0.01,
        Math.abs(prev.stop_loss - entry) / entry
      );
      const isLong = nextDir === "LONG";
      return {
        ...prev,
        direction: nextDir,
        take_profit: roundPriceForScale(
          entry * (isLong ? 1 + tpDistPct : 1 - tpDistPct)
        ),
        stop_loss: roundPriceForScale(
          entry * (isLong ? 1 - slDistPct : 1 + slDistPct)
        ),
      };
    });
  }, []);

  const handleApplyTradingPreset = useCallback(
    (rrMultiple: number, autoSafeSize: boolean) => {
      setTradingInput((prev) => {
        const entry = Math.max(
          0.0001,
          marketTechnicals?.last_close || prev.entry_price || 1
        );
        const slPct = marketTechnicals?.atr_pct
          ? Math.max(
              1.5,
              Math.min(12, Number((marketTechnicals.atr_pct * 1.5).toFixed(2)))
            )
          : 4;
        const tpPct = slPct * rrMultiple;
        const isLong = prev.direction === "LONG";
        const nextSl = roundPriceForScale(
          entry * (isLong ? 1 - slPct / 100 : 1 + slPct / 100)
        );
        const nextTp = roundPriceForScale(
          entry * (isLong ? 1 + tpPct / 100 : 1 - tpPct / 100)
        );
        const safeSize = autoSafeSize
          ? Math.max(1, Math.min(100, Math.floor((2 / slPct) * 100)))
          : prev.position_size_pct;

        return {
          ...prev,
          entry_price: roundPriceForScale(entry),
          take_profit: nextTp,
          stop_loss: nextSl,
          position_size_pct: safeSize,
        };
      });
      toast.success(
        autoSafeSize
          ? t("form.trading.preset_optimal_toast")
          : `${t("form.trading.preset_rr_toast")} 1:${rrMultiple.toFixed(1)}`
      );
    },
    [marketTechnicals, t]
  );

  const handleApplySafeSizeOnly = useCallback(() => {
    setTradingInput((prev) => {
      const entry = Math.max(0.0001, prev.entry_price || 1);
      const slDistPct = (Math.abs(entry - prev.stop_loss) / entry) * 100;
      if (slDistPct <= 0) return prev;
      const safeSize = Math.max(
        1,
        Math.min(100, Math.floor((2 / slDistPct) * 100))
      );
      return { ...prev, position_size_pct: safeSize };
    });
    toast.success(t("form.trading.safe_size_toast"));
  }, [t]);

  const handleSyncMarketPrice = useCallback(() => {
    const marketPrice = marketTechnicals?.last_close;
    if (!marketPrice || marketPrice <= 0) {
      void handleFetchLiveQuote();
      return;
    }
    setTradingInput((prev) => {
      const entry = Math.max(0.0001, prev.entry_price || marketPrice);
      const tpDistPct = Math.max(
        0.02,
        Math.abs(prev.take_profit - entry) / entry
      );
      const slDistPct = Math.max(
        0.015,
        Math.abs(prev.stop_loss - entry) / entry
      );
      const isLong = prev.direction === "LONG";
      const syncedEntry = roundPriceForScale(marketPrice);
      return {
        ...prev,
        entry_price: syncedEntry,
        take_profit: roundPriceForScale(
          syncedEntry * (isLong ? 1 + tpDistPct : 1 - tpDistPct)
        ),
        stop_loss: roundPriceForScale(
          syncedEntry * (isLong ? 1 - slDistPct : 1 + slDistPct)
        ),
      };
    });
    toast.success(t("form.trading.sync_price_toast"));
  }, [marketTechnicals, handleFetchLiveQuote, t]);

  const tpDeltaPct =
    tradingInput.entry_price > 0
      ? ((tradingInput.take_profit - tradingInput.entry_price) /
          tradingInput.entry_price) *
        100
      : 0;
  const slDeltaPct =
    tradingInput.entry_price > 0
      ? ((tradingInput.stop_loss - tradingInput.entry_price) /
          tradingInput.entry_price) *
        100
      : 0;

  const executeAudit = useCallback(
    async (opts: {
      mode: "live" | "demo";
      track: AuditTrack;
      convictionOverride?: number;
      inputOverride?: Record<string, unknown>;
    }) => {
      clearPhaseTimer();
      setIsSubmitting(true);
      setErrorMessage(null);
      setAuditPhase("scanning");
      setActiveAgent("data_analyst");

      phaseTimerRef.current = setTimeout(() => {
        setAuditPhase("debating");
        setActiveAgent("risk_manager");
      }, 450);

      const inputPayload = opts.inputOverride ?? getActiveInput(opts.track);
      const convictionUsed = opts.convictionOverride ?? userConviction;

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: opts.mode,
            preset_id:
              opts.mode === "demo" ? DEMO_PRESET_MAP[opts.track] : undefined,
            track: opts.track,
            locale,
            input: inputPayload,
          }),
        });

        const data = (await res.json()) as
          | CommitteeAuditResponse
          | { error?: string; message?: string };

        clearPhaseTimer();

        if (!res.ok || !("verdict" in data)) {
          setAuditPhase("idle");
          setActiveAgent(null);
          setErrorMessage(
            ("message" in data && data.message) || t("form.api_error_fallback")
          );
          return;
        }

        const authoritativeInput = data.resolved_input ?? inputPayload;
        setAuditOutcome(data, authoritativeInput, opts.track, convictionUsed);
        if (variant === "terminal") {
          setRightTab("verdict");
          setMobileTab("verdict");
        }
        setHistoryEntries(
          appendAuditHistory({
            audit_id: data.verdict.audit_id,
            track: opts.track,
            timestamp: new Date().toISOString(),
            verdict_status: data.verdict.verdict_status,
            score: data.verdict.score,
            submitted_conviction: convictionUsed,
            ruin_probability_pct: data.monte_carlo.ruin_probability_pct,
            headline_verdict: data.verdict.headline_verdict,
            blind_spots: data.verdict.premortem_blind_spots,
            actionable_fix: data.verdict.actionable_fix,
            input_snapshot: authoritativeInput,
          })
        );
        toast.success(t("toast.audit_done"));
      } catch {
        clearPhaseTimer();
        setAuditPhase("idle");
        setActiveAgent(null);
        setErrorMessage(t("form.api_error_fallback"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      getActiveInput,
      locale,
      setActiveAgent,
      setAuditOutcome,
      setAuditPhase,
      t,
      userConviction,
      variant,
    ]
  );

  // Hydrate initial URL query params (?track=...&symbol=...&demo=1) once on mount
  useEffect(() => {
    if (didInitParamsRef.current) return;
    didInitParamsRef.current = true;
    const tId = setTimeout(() => {
      const targetTrack = initialTrack ?? activeTrack;
      if (initialTrack && initialTrack !== activeTrack) {
        setActiveTrack(initialTrack);
      }
      if (initialSymbol && targetTrack === "trading") {
        void handleFetchLiveQuote(initialSymbol);
      }
      if (autoRunDemo) {
        const syncedInput = applyDemoPresetInput(targetTrack);
        const presetConviction = 80;
        setUserConviction(presetConviction);
        void executeAudit({
          mode: "demo",
          track: targetTrack,
          convictionOverride: presetConviction,
          inputOverride: syncedInput,
        });
      }
    }, 0);
    return () => clearTimeout(tId);
  }, [
    initialTrack,
    initialSymbol,
    autoRunDemo,
    activeTrack,
    setActiveTrack,
    handleFetchLiveQuote,
    applyDemoPresetInput,
    setUserConviction,
    executeAudit,
  ]);

  // Listen for "Run Instant Demo" trigger and sync form inputs with DemoPreset
  useEffect(() => {
    if (
      demoTriggerCount > 0 &&
      demoTriggerCount !== lastDemoCountRef.current
    ) {
      lastDemoCountRef.current = demoTriggerCount;
      const tId = setTimeout(() => {
        const presetConviction =
          TRAP_PRESETS.find((p) => p.track === activeTrack)?.conviction ?? 80;
        const syncedInput = applyDemoPresetInput(activeTrack);
        setUserConviction(presetConviction);
        void executeAudit({
          mode: "demo",
          track: activeTrack,
          convictionOverride: presetConviction,
          inputOverride: syncedInput,
        });
      }, 0);
      return () => clearTimeout(tId);
    }
  }, [
    demoTriggerCount,
    activeTrack,
    applyDemoPresetInput,
    setUserConviction,
    executeAudit,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeAudit({ mode: "live", track: activeTrack });
  };

  const handleReset = () => {
    clearPhaseTimer();
    setErrorMessage(null);
    resetAudit();
  };

  const liveScore = liveRiskSnapshot?.score ?? 55;
  const liveFlagCount = liveRiskSnapshot?.flags.length ?? 0;
  const liveRuinPct = liveRiskSnapshot?.ruinPct ?? 0;
  const liveStampVariant = getLiveStampVariant(liveScore, liveFlagCount);
  const liveStampKey = liveStampVariant.toLowerCase() as
    | "cleared"
    | "conditional"
    | "rejected";

  const formNode = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 1. Luminous 3-Track Selector + Mode Switcher */}
      <div className="flex flex-col gap-3.5 border-b border-hairline pb-4">
        <div
          role="tablist"
          aria-label={t("form.select_track_label")}
          className="grid grid-cols-3 gap-1.5 rounded-lg border border-hairline bg-obsidian/90 p-1.5"
        >
          {TRACK_META.map(({ id, Icon }) => {
            const isSelected = activeTrack === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setActiveTrack(id);
                  setErrorMessage(null);
                }}
                className={cn(
                  "relative flex min-h-[42px] items-center justify-center gap-2 rounded-md px-2 py-2 font-sans text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared sm:px-3 sm:text-[13px]",
                  isSelected
                    ? "text-cleared"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId="active-audit-track-tab"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-md border border-cleared/50 bg-cleared/14 shadow-[0_0_20px_-6px_rgba(16,185,129,0.45)]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 hidden h-4 w-4 shrink-0 sm:inline",
                    isSelected ? "text-cleared" : "text-text-muted"
                  )}
                  aria-hidden="true"
                />
                <span className="relative z-10 truncate">
                  {t(`tracks.${id}.name`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Guided vs. Pro Quant Mode Toggle + Quick Real-World Trap Presets */}
        <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
          <div className="inline-flex w-fit items-center gap-1 rounded-md border border-hairline bg-obsidian p-1">
            <button
              type="button"
              onClick={() => setInputMode("guided")}
              className={cn(
                "inline-flex min-h-[30px] items-center gap-1.5 rounded-xs px-2.5 font-sans text-xs font-semibold transition-colors",
                inputMode === "guided"
                  ? "bg-cleared/16 text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isId ? "Mode Ringkas" : "Guided Mode"}</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("pro")}
              className={cn(
                "inline-flex min-h-[30px] items-center gap-1.5 rounded-xs px-2.5 font-sans text-xs font-semibold transition-colors",
                inputMode === "pro"
                  ? "bg-cleared/16 text-cleared"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isId ? "Mode Lengkap (Pro)" : "Pro Quant Mode"}</span>
            </button>
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="inline-flex shrink-0 items-center gap-1 font-sans text-xs font-medium text-text-muted">
              <Flame className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
              <span>{isId ? "Kasus Cepat:" : "Quick Case:"}</span>
            </span>
            {TRAP_PRESETS.map((trap) => {
              const isSelected = activeTrack === trap.track;
              return (
                <button
                  key={trap.track}
                  type="button"
                  onClick={() => handleApplyTrap(trap.track, trap.conviction)}
                  className={cn(
                    "inline-flex min-h-[28px] shrink-0 items-center rounded-md border px-2.5 py-0.5 font-sans text-xs whitespace-nowrap transition-colors",
                    isSelected
                      ? "border-active-border bg-surface font-semibold text-text-primary"
                      : "border-hairline bg-obsidian text-text-secondary hover:border-active-border hover:text-text-primary"
                  )}
                >
                  <span>{t(`form.traps.${trap.track}.label`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TRACK 1: MARKET & TRADING */}
      {activeTrack === "trading" && (
        <div className="flex flex-col gap-4">
          {/* Collapsible 90-Day Candlestick Chart */}
          <div className="terminal-panel overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-hairline bg-obsidian/85 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <CandlestickChart
                  className="h-4 w-4 text-cleared"
                  aria-hidden="true"
                />
                <span className="font-sans text-xs font-bold text-text-primary">
                  {isId
                    ? `Grafik Harga & Level TP/SL (${tradingInput.asset_symbol || "—"})`
                    : `Live Price & TP/SL Levels (${tradingInput.asset_symbol || "—"})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChart((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-xs border border-hairline bg-surface px-2.5 py-1 font-sans text-[11px] font-medium text-text-secondary hover:text-text-primary"
              >
                <span>
                  {showChart
                    ? isId
                      ? "Ciutkan"
                      : "Collapse"
                    : isId
                      ? "Tampilkan Grafik"
                      : "Show Chart"}
                </span>
                {showChart ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {showChart && (
              <div className="p-2 sm:p-3">
                <TradingPriceChart
                  symbol={tradingInput.asset_symbol}
                  entryPrice={tradingInput.entry_price}
                  takeProfit={tradingInput.take_profit}
                  stopLoss={tradingInput.stop_loss}
                  onTechnicalsLoaded={setMarketTechnicals}
                />
              </div>
            )}
          </div>

          {/* Step 01: Aset & Modal */}
          <SpotlightCard tone="emerald" className="gap-4 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-hairline/75 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cleared/16 font-mono text-xs font-bold text-cleared">
                  01
                </span>
                <h3 className="font-sans text-sm font-bold text-text-primary">
                  {isId
                    ? "Pilih Aset & Ukuran Modal Anda"
                    : "Select Asset & Capital Allocation"}
                </h3>
              </div>
              <span className="font-sans text-xs text-text-muted">
                {isId ? "Saham BEI (.JK), Kripto, Emas" : "IDX, Crypto, Gold"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-symbol"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.trading.asset_symbol")}
                </label>

                <TickerSearchCombobox
                  value={tradingInput.asset_symbol}
                  onChange={(sym) =>
                    setTradingInput((prev) => ({
                      ...prev,
                      asset_symbol: sym,
                      round_trip_fee_pct: sym.trim().toUpperCase().endsWith(".JK")
                        ? 0.4
                        : 0.2,
                    }))
                  }
                  onSelectSymbol={(sym) => {
                    setTradingInput((prev) => ({ ...prev, asset_symbol: sym }));
                    void handleFetchLiveQuote(sym);
                  }}
                  onFetchLive={() => void handleFetchLiveQuote()}
                  isFetchingQuote={isFetchingQuote}
                />

                {liveQuote && (
                  <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-cleared/40 bg-cleared/10 px-3 py-1.5 font-mono text-xs tabular-nums">
                    <span className="font-sans text-[11px] font-bold text-cleared">
                      {t("quote.live_badge")} · {liveQuote.symbol}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary">
                        <NumberFlow
                          value={liveQuote.price}
                          locales="id-ID"
                          suffix={` ${liveQuote.currency}`}
                        />
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          liveQuote.change_pct >= 0
                            ? "text-cleared"
                            : "text-rejected"
                        )}
                      >
                        ({liveQuote.change_pct >= 0 ? "+" : ""}
                        {liveQuote.change_pct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-sans text-[13px] font-semibold text-text-primary">
                  {t("form.trading.direction")}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(["LONG", "SHORT"] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => handleDirectionChange(dir)}
                      className={cn(
                        "min-h-[44px] rounded-md border font-mono text-xs font-bold uppercase tracking-wider transition-all",
                        tradingInput.direction === dir
                          ? dir === "LONG"
                            ? "border-cleared/65 bg-cleared/16 text-cleared shadow-[0_0_16px_-4px_rgba(16,185,129,0.4)]"
                            : "border-rejected/65 bg-rejected/16 text-rejected shadow-[0_0_16px_-4px_rgba(239,68,68,0.4)]"
                          : "border-hairline bg-obsidian text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {dir === "LONG"
                        ? isId
                          ? "▲ BELI (LONG)"
                          : "▲ LONG"
                        : isId
                          ? "▼ JUAL (SHORT)"
                          : "▼ SHORT"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-capital"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.trading.total_capital")}
                </label>
                <FormattedNumberInput
                  id="trade-capital"
                  prefix="Rp"
                  value={tradingInput.total_capital}
                  onChange={(val) =>
                    setTradingInput({ ...tradingInput, total_capital: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-size"
                  className="flex items-center justify-between font-sans text-[13px] font-semibold text-text-primary"
                >
                  <span>{t("form.trading.position_size_pct")}</span>
                  <span className="font-mono text-xs font-normal text-text-muted">
                    Rp{" "}
                    {Math.round(
                      (tradingInput.total_capital *
                        tradingInput.position_size_pct) /
                        100
                    ).toLocaleString("id-ID")}
                  </span>
                </label>
                <FormattedNumberInput
                  id="trade-size"
                  allowDecimal
                  suffix="%"
                  value={tradingInput.position_size_pct}
                  onChange={(val) =>
                    setTradingInput({
                      ...tradingInput,
                      position_size_pct: val,
                    })
                  }
                />
              </div>
            </div>
          </SpotlightCard>

          {/* Step 02: Titik Masuk, Target Untung & Batas Rugi */}
          <SpotlightCard tone="sky" className="gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline/75 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-400/16 font-mono text-xs font-bold text-sky-400">
                  02
                </span>
                <h3 className="font-sans text-sm font-bold text-text-primary">
                  {isId
                    ? "Tentukan Harga Beli, Target Untung, & Batas Rugi"
                    : "Set Entry, Take-Profit, & Stop-Loss Levels"}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleSyncMarketPrice}
                className="inline-flex items-center gap-1.5 rounded-md border border-sky-400/40 bg-sky-400/10 px-2.5 py-1 font-sans text-xs font-semibold text-sky-400 transition-colors hover:bg-sky-400/18"
              >
                <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("form.trading.preset_sync_market")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-entry"
                  className="flex items-center justify-between font-sans text-[13px] font-semibold text-text-primary"
                >
                  <span>{t("form.trading.entry_price")}</span>
                  <span className="font-mono text-[11px] font-bold text-sky-400">
                    ENTRY
                  </span>
                </label>
                <FormattedNumberInput
                  id="trade-entry"
                  allowDecimal
                  value={tradingInput.entry_price}
                  onChange={(val) =>
                    setTradingInput({ ...tradingInput, entry_price: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-tp"
                  className="flex items-center justify-between font-sans text-[13px] font-semibold text-text-primary"
                >
                  <span>{t("form.trading.take_profit")}</span>
                  <span className="font-mono text-[11px] font-bold tabular-nums text-cleared">
                    {tpDeltaPct >= 0 ? "+" : ""}
                    {tpDeltaPct.toFixed(1)}%
                  </span>
                </label>
                <FormattedNumberInput
                  id="trade-tp"
                  allowDecimal
                  value={tradingInput.take_profit}
                  onChange={(val) =>
                    setTradingInput({ ...tradingInput, take_profit: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="trade-sl"
                  className="flex items-center justify-between font-sans text-[13px] font-semibold text-text-primary"
                >
                  <span>{t("form.trading.stop_loss")}</span>
                  <span className="font-mono text-[11px] font-bold tabular-nums text-rejected">
                    {slDeltaPct >= 0 ? "+" : ""}
                    {slDeltaPct.toFixed(1)}%
                  </span>
                </label>
                <FormattedNumberInput
                  id="trade-sl"
                  allowDecimal
                  value={tradingInput.stop_loss}
                  onChange={(val) =>
                    setTradingInput({ ...tradingInput, stop_loss: val })
                  }
                />
              </div>
            </div>

            {/* 1-Click Smart Calibration Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hairline bg-obsidian/85 px-3.5 py-2.5">
              <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-text-secondary">
                <Sparkles className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{isId ? "Bantu Hitung Cepat:" : "Quick Calibrate:"}</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTradingPreset(2, true)}
                  className="inline-flex items-center gap-1 rounded-md border border-cleared/50 bg-cleared/14 px-3 py-1 font-sans text-xs font-semibold text-cleared transition-colors hover:bg-cleared/22"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span>{t("form.trading.preset_optimal")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTradingPreset(1.5, false)}
                  className="rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-xs text-text-secondary hover:text-text-primary"
                >
                  R:R 1:1.5
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTradingPreset(3, false)}
                  className="rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-xs text-text-secondary hover:text-text-primary"
                >
                  R:R 1:3.0
                </button>
                <button
                  type="button"
                  onClick={handleApplySafeSizeOnly}
                  className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-1 font-sans text-xs font-medium text-text-secondary hover:border-cleared/50 hover:text-cleared"
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("form.trading.preset_safe_size")}</span>
                </button>
              </div>
            </div>

            {inputMode === "pro" ? (
              <div className="grid grid-cols-1 gap-4 border-t border-hairline/75 pt-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="trade-fee"
                    className="flex items-center justify-between gap-2 font-sans text-[13px] font-semibold text-text-primary"
                  >
                    <span>{t("form.trading.round_trip_fee_pct")}</span>
                    <span className="font-mono text-xs text-text-muted">
                      IDX ~0.40%
                    </span>
                  </label>
                  <FormattedNumberInput
                    id="trade-fee"
                    allowDecimal
                    suffix="%"
                    value={tradingInput.round_trip_fee_pct ?? 0.4}
                    onChange={(val) =>
                      setTradingInput({
                        ...tradingInput,
                        round_trip_fee_pct: Math.min(5, Math.max(0, val)),
                      })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="trade-rationale"
                    className="font-sans text-[13px] font-semibold text-text-primary"
                  >
                    {t("form.trading.rationale")}
                  </label>
                  <input
                    id="trade-rationale"
                    type="text"
                    value={tradingInput.rationale}
                    onChange={(e) =>
                      setTradingInput({
                        ...tradingInput,
                        rationale: e.target.value,
                      })
                    }
                    placeholder={t("form.trading.rationale_ph")}
                    className="min-h-[44px] w-full rounded-md border border-hairline bg-input px-3.5 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-cleared/70 focus:outline-none focus:ring-2 focus:ring-cleared/20"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline/70 bg-obsidian/65 px-3 py-2 font-sans text-xs text-text-muted">
                <span>
                  {isId
                    ? `Otomatis menghitung Fee Sekuritas (${(tradingInput.round_trip_fee_pct ?? 0.4).toFixed(2)}%) & Lot BEI.`
                    : `Auto-applying ${(tradingInput.round_trip_fee_pct ?? 0.4).toFixed(2)}% round-trip brokerage fee & IDX lot sizing.`}
                </span>
                <button
                  type="button"
                  onClick={() => setInputMode("pro")}
                  className="font-semibold text-cleared hover:underline"
                >
                  {isId ? "Ubah Fee & Catatan →" : "Edit Fee & Rationale →"}
                </button>
              </div>
            )}
          </SpotlightCard>
        </div>
      )}

      {/* TRACK 2: BUSINESS & UMKM */}
      {activeTrack === "business" && (
        <div className="flex flex-col gap-4">
          <SpotlightCard tone="emerald" className="gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-hairline/75 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cleared/16 font-mono text-xs font-bold text-cleared">
                01
              </span>
              <h3 className="font-sans text-sm font-bold text-text-primary">
                {isId
                  ? "Modal Awal & Beban Operasional Bulanan"
                  : "Initial Capital & Monthly Fixed Overhead"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="biz-concept"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.business.business_concept")}
                </label>
                <input
                  id="biz-concept"
                  type="text"
                  value={businessInput.business_concept}
                  onChange={(e) =>
                    setBusinessInput({
                      ...businessInput,
                      business_concept: e.target.value,
                    })
                  }
                  placeholder={t("form.business.business_concept_ph")}
                  className="min-h-[44px] w-full rounded-md border border-hairline bg-input px-3.5 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-cleared/70 focus:outline-none focus:ring-2 focus:ring-cleared/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="biz-capital"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.business.initial_capital")}
                </label>
                <FormattedNumberInput
                  id="biz-capital"
                  prefix="Rp"
                  value={businessInput.initial_capital}
                  onChange={(val) =>
                    setBusinessInput({ ...businessInput, initial_capital: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="biz-fixed"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.business.monthly_fixed_cost")}
                </label>
                <FormattedNumberInput
                  id="biz-fixed"
                  prefix="Rp"
                  value={businessInput.monthly_fixed_cost}
                  onChange={(val) =>
                    setBusinessInput({
                      ...businessInput,
                      monthly_fixed_cost: val,
                    })
                  }
                />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard tone="sky" className="gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-hairline/75 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-400/16 font-mono text-xs font-bold text-sky-400">
                02
              </span>
              <h3 className="font-sans text-sm font-bold text-text-primary">
                {isId
                  ? "Harga Jual, Modal Bahan Baku (HPP), & Target Unit"
                  : "Unit Pricing, COGS, & Monthly Sales Target"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="biz-price"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.business.selling_price")}
                </label>
                <FormattedNumberInput
                  id="biz-price"
                  prefix="Rp"
                  value={businessInput.selling_price}
                  onChange={(val) =>
                    setBusinessInput({ ...businessInput, selling_price: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="biz-cogs"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.business.unit_cogs")}
                </label>
                <FormattedNumberInput
                  id="biz-cogs"
                  prefix="Rp"
                  value={businessInput.unit_cogs}
                  onChange={(val) =>
                    setBusinessInput({ ...businessInput, unit_cogs: val })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="biz-units"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.business.target_monthly_units")}
                </label>
                <FormattedNumberInput
                  id="biz-units"
                  suffix="unit"
                  value={businessInput.target_monthly_units}
                  onChange={(val) =>
                    setBusinessInput({
                      ...businessInput,
                      target_monthly_units: val,
                    })
                  }
                />
              </div>
            </div>

            {inputMode === "pro" ? (
              <div className="grid grid-cols-1 gap-4 border-t border-hairline/75 pt-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="biz-commission"
                    className="font-sans text-[13px] font-semibold text-text-primary"
                  >
                    {t("form.business.platform_commission_pct")}
                  </label>
                  <FormattedNumberInput
                    id="biz-commission"
                    allowDecimal
                    suffix="%"
                    value={businessInput.platform_commission_pct ?? 0}
                    onChange={(val) =>
                      setBusinessInput({
                        ...businessInput,
                        platform_commission_pct: Math.min(50, Math.max(0, val)),
                      })
                    }
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 self-end rounded-md border border-hairline bg-obsidian px-3.5 py-2.5 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={Boolean(businessInput.include_umkm_tax)}
                    onChange={(e) =>
                      setBusinessInput({
                        ...businessInput,
                        include_umkm_tax: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="font-sans text-xs font-semibold text-text-primary">
                    {t("form.business.include_umkm_tax")}
                  </span>
                </label>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline/70 bg-obsidian/65 px-3 py-2 font-sans text-xs text-text-muted">
                <span>
                  {isId
                    ? `Komisi Aplikasi: ${businessInput.platform_commission_pct ?? 0}% · PPh UMKM 0,5%: ${businessInput.include_umkm_tax ? "Aktif" : "Nonaktif"}`
                    : `Platform Fee: ${businessInput.platform_commission_pct ?? 0}% · 0.5% SME Tax: ${businessInput.include_umkm_tax ? "On" : "Off"}`}
                </span>
                <button
                  type="button"
                  onClick={() => setInputMode("pro")}
                  className="font-semibold text-cleared hover:underline"
                >
                  {isId
                    ? "Atur Komisi GoFood/Shopee & Pajak →"
                    : "Adjust App Fee & Tax →"}
                </button>
              </div>
            )}
          </SpotlightCard>
        </div>
      )}

      {/* TRACK 3: PERSONAL CASHFLOW */}
      {activeTrack === "cashflow" && (
        <div className="flex flex-col gap-4">
          <SpotlightCard tone="emerald" className="gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-hairline/75 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cleared/16 font-mono text-xs font-bold text-cleared">
                01
              </span>
              <h3 className="font-sans text-sm font-bold text-text-primary">
                {isId
                  ? "Penghasilan Bersih, Biaya Hidup, & Dana Darurat"
                  : "Net Monthly Income, Living Expenses, & Reserve"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="cash-purpose"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.cashflow.decision_purpose")}
                </label>
                <input
                  id="cash-purpose"
                  type="text"
                  value={cashflowInput.decision_purpose}
                  onChange={(e) =>
                    setCashflowInput({
                      ...cashflowInput,
                      decision_purpose: e.target.value,
                    })
                  }
                  placeholder={t("form.cashflow.decision_purpose_ph")}
                  className="min-h-[44px] w-full rounded-md border border-hairline bg-input px-3.5 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-cleared/70 focus:outline-none focus:ring-2 focus:ring-cleared/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cash-income"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.cashflow.monthly_net_income")}
                </label>
                <FormattedNumberInput
                  id="cash-income"
                  prefix="Rp"
                  value={cashflowInput.monthly_net_income}
                  onChange={(val) =>
                    setCashflowInput({
                      ...cashflowInput,
                      monthly_net_income: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cash-expenses"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.cashflow.current_monthly_expenses")}
                </label>
                <FormattedNumberInput
                  id="cash-expenses"
                  prefix="Rp"
                  value={cashflowInput.current_monthly_expenses}
                  onChange={(val) =>
                    setCashflowInput({
                      ...cashflowInput,
                      current_monthly_expenses: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="cash-emergency"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.cashflow.liquid_emergency_fund")}
                </label>
                <FormattedNumberInput
                  id="cash-emergency"
                  prefix="Rp"
                  value={cashflowInput.liquid_emergency_fund}
                  onChange={(val) =>
                    setCashflowInput({
                      ...cashflowInput,
                      liquid_emergency_fund: val,
                    })
                  }
                />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard tone="amber" className="gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-hairline/75 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/16 font-mono text-xs font-bold text-conditional">
                02
              </span>
              <h3 className="font-sans text-sm font-bold text-text-primary">
                {isId
                  ? "Rencana Cicilan Baru & Konversi Bunga"
                  : "New Installment Plan & Effective APR Check"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cash-installment"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.cashflow.new_monthly_installment")}
                </label>
                <FormattedNumberInput
                  id="cash-installment"
                  prefix="Rp"
                  value={cashflowInput.new_monthly_installment}
                  onChange={(val) =>
                    setCashflowInput({
                      ...cashflowInput,
                      new_monthly_installment: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cash-months"
                  className="font-sans text-[13px] font-semibold text-text-primary"
                >
                  {t("form.cashflow.installment_months")}
                </label>
                <FormattedNumberInput
                  id="cash-months"
                  suffix={isId ? "bln" : "mo"}
                  value={cashflowInput.installment_months}
                  onChange={(val) =>
                    setCashflowInput({
                      ...cashflowInput,
                      installment_months: Math.max(1, val),
                    })
                  }
                />
              </div>
            </div>

            {inputMode === "pro" ? (
              <div className="grid grid-cols-1 gap-4 border-t border-hairline/75 pt-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="cash-existing-debt"
                    className="font-sans text-[13px] font-semibold text-text-primary"
                  >
                    {t("form.cashflow.existing_debt_installment")}
                  </label>
                  <FormattedNumberInput
                    id="cash-existing-debt"
                    prefix="Rp"
                    value={cashflowInput.existing_debt_installment ?? 0}
                    onChange={(val) =>
                      setCashflowInput({
                        ...cashflowInput,
                        existing_debt_installment: val,
                      })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="cash-flat-rate"
                    className="font-sans text-[13px] font-semibold text-text-primary"
                  >
                    {t("form.cashflow.flat_interest_pct")}
                  </label>
                  <FormattedNumberInput
                    id="cash-flat-rate"
                    allowDecimal
                    suffix="%/bln"
                    value={cashflowInput.flat_interest_pct_per_month ?? 0}
                    onChange={(val) =>
                      setCashflowInput({
                        ...cashflowInput,
                        flat_interest_pct_per_month: Math.min(
                          25,
                          Math.max(0, val)
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline/70 bg-obsidian/65 px-3 py-2 font-sans text-xs text-text-muted">
                <span>
                  {isId
                    ? `Cicilan Lama: Rp${(cashflowInput.existing_debt_installment ?? 0).toLocaleString("id-ID")} · Bunga Flat: ${cashflowInput.flat_interest_pct_per_month ?? 0}%/bln`
                    : `Existing Debt: Rp${(cashflowInput.existing_debt_installment ?? 0).toLocaleString("id-ID")} · Flat Rate: ${cashflowInput.flat_interest_pct_per_month ?? 0}%/mo`}
                </span>
                <button
                  type="button"
                  onClick={() => setInputMode("pro")}
                  className="font-semibold text-cleared hover:underline"
                >
                  {isId
                    ? "Tambah Cicilan Lama & Cek Bunga Flat →"
                    : "Edit Existing Debt & Flat Rate →"}
                </button>
              </div>
            )}
          </SpotlightCard>
        </div>
      )}

      {/* Step 03: Initial Conviction Calibration Slider */}
      <SpotlightCard tone="neutral" className="gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface font-mono text-xs font-bold text-cleared">
              03
            </span>
            <div>
              <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-text-muted">
                <Gauge className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                <span>{t("conviction.slider_title")}</span>
              </span>
              <label
                htmlFor="initial-conviction-slider"
                className="font-sans text-sm font-bold text-text-primary"
              >
                {t("conviction.slider_question")}
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md border border-hairline bg-obsidian px-2.5 py-1 font-sans text-xs font-semibold text-text-secondary">
              {userConviction <= 40
                ? t("conviction.level_low")
                : userConviction <= 70
                  ? t("conviction.level_mid")
                  : t("conviction.level_high")}
            </span>
            <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
              {userConviction}%
            </span>
          </div>
        </div>

        <PrecisionSlider
          id="initial-conviction-slider"
          min={10}
          max={100}
          step={5}
          value={userConviction}
          onValueChange={setUserConviction}
          tone={userConviction > 75 ? "conditional" : "cleared"}
          ticks={[25, 55, 85]}
          ariaLabel={t("conviction.slider_question")}
        />

        <div className="flex justify-between font-mono text-xs text-text-muted">
          <span>10%</span>
          <span>55%</span>
          <span>100%</span>
        </div>
      </SpotlightCard>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-rejected/45 bg-rejected/12 p-3.5 font-sans text-xs text-rejected"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mobile/iPad Inline Live Score Strip while editing Inputs */}
      {variant === "terminal" && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-obsidian/90 px-3.5 py-2.5 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-text-secondary">
              {isId ? "Skor Ketahanan Live:" : "Live Score:"}
            </span>
            <span
              className={cn(
                "font-mono text-base font-bold tabular-nums",
                getScoreTextTone(liveScore)
              )}
            >
              {liveScore}/100
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab("telemetry")}
            className="font-sans text-xs font-semibold text-cleared hover:underline"
          >
            {isId
              ? liveFlagCount > 0
                ? `Lihat ${liveFlagCount} Celah →`
                : "Lihat Telemetri →"
              : "View Telemetry →"}
          </button>
        </div>
      )}

      {/* Submit, Compare & Reset Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-hairline bg-obsidian px-4 font-sans text-xs font-semibold text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("form.clear_btn")}</span>
          </button>

          {variant === "terminal" && (
            <button
              type="button"
              onClick={() => {
                queuePrefillInput(activeTrack, getActiveInput(activeTrack));
                router.push("/terminal/compare");
              }}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-400/10 px-3.5 font-sans text-xs font-semibold text-sky-400 transition-colors hover:bg-sky-400/18"
            >
              <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isId ? "Adu di A vs B" : "Compare A vs B"}</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="cta-primary-polish inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-cleared px-6 font-sans text-[13.5px] font-bold text-on-cleared transition-all hover:brightness-105 disabled:opacity-75 sm:flex-initial"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          <span>
            {isSubmitting
              ? t("form.submitting_btn")
              : t("form.submit_audit_btn")}
          </span>
          {!isSubmitting && (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Live 3-Stage Committee Deliberation Stepper while Auditing */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 gap-2.5 rounded-lg border border-cleared/40 bg-obsidian/92 p-3.5 sm:grid-cols-3"
          >
            {(
              [
                {
                  code: "DIV-01",
                  label: t("form.deliberation_step_1"),
                  active: auditPhase === "scanning",
                  done: auditPhase === "debating" || auditPhase === "verdict",
                },
                {
                  code: "DIV-02",
                  label: t("form.deliberation_step_2"),
                  active: auditPhase === "debating",
                  done: auditPhase === "verdict",
                },
                {
                  code: "DIV-03",
                  label: t("form.deliberation_step_3"),
                  active: false,
                  done: auditPhase === "verdict",
                },
              ] as const
            ).map((step) => (
              <div
                key={step.code}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border px-3 py-2.5 font-sans text-xs",
                  step.done
                    ? "border-cleared/45 bg-cleared/12 font-semibold text-cleared"
                    : step.active
                      ? "border-conditional/50 bg-conditional/12 font-semibold text-conditional"
                      : "border-hairline bg-surface text-text-muted"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : step.active ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-text-muted/40" />
                )}
                <div className="min-w-0">
                  <span className="block font-mono text-[10px] font-bold">
                    {step.code}
                  </span>
                  <span className="block truncate">{step.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );

  const buildTelemetryNode = (compactHeader: boolean) => (
    <LivePreAuditPanel
      activeTrack={activeTrack}
      tradingInput={tradingInput}
      businessInput={businessInput}
      cashflowInput={cashflowInput}
      userConviction={userConviction}
      marketTechnicals={marketTechnicals}
      onAutoHeal={handleAutoHeal}
      compactHeader={compactHeader}
    />
  );

  const verdictAndLedgerNode = (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {auditResponse ? (
          <motion.div
            key={auditResponse.verdict.audit_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <SpotlightCard tone="emerald" className="gap-4 p-4 sm:p-5">
              <div className="border-b border-hairline pb-3">
                <h3 className="font-sans text-sm font-bold text-text-primary sm:text-[15px]">
                  {t("warroom.transcript_title")}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                {(
                  [
                    { role: "data_analyst", code: "DIV-01" },
                    { role: "risk_manager", code: "DIV-02" },
                    { role: "committee_chair", code: "DIV-03" },
                  ] as const
                ).map(({ role, code }) => (
                  <div
                    key={role}
                    className="flex flex-col gap-3 rounded-lg border border-hairline bg-obsidian/90 p-4"
                  >
                    <div className="flex items-center gap-2.5 border-b border-hairline pb-2.5">
                      <AgentAvatar
                        role={role}
                        phase="verdict"
                        isActive
                        size={34}
                      />
                      <div className="min-w-0">
                        <span className="block font-mono text-[10.5px] font-bold text-cleared">
                          {code}
                        </span>
                        <span className="block truncate font-sans text-xs font-bold text-text-primary">
                          {t(`agents.roles.${role}.name`)}
                        </span>
                      </div>
                    </div>
                    <p className="font-sans text-[12.5px] leading-relaxed text-text-secondary">
                      {auditResponse.verdict.agent_deliberation[role]}
                    </p>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            <VerdictCard />
            <div id="stress-slider-slot">
              <StressSliderPanel />
            </div>
          </motion.div>
        ) : (
          <SpotlightCard tone="sky" className="gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-400/12 px-3 py-1 font-mono text-[11px] font-bold text-sky-400">
                SIAGA SIDANG KOMITE 3 DIVISI
              </span>
              <h3 className="font-editorial text-xl font-medium text-text-primary sm:text-2xl">
                {isId
                  ? "Belum Ada Putusan Sidang Resmi untuk Sesi Ini"
                  : "No Official Committee Verdict Yet"}
              </h3>
              <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
                {isId
                  ? "Klik tombol di bawah untuk memanggil 3 divisi komite (Analis Data, Manajer Risiko Pre-Mortem, dan Ketua Komite) guna memetakan 3 titik buta mematikan, membuka What-If Stress Slider, serta menerbitkan Kartu Vonis PDF/PNG."
                  : "Convene the 3-division committee to generate the 3 Pre-Mortem failure vectors, unlock the interactive What-If Stress Slider, and issue an exportable PDF/PNG Verdict Card."}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    void executeAudit({ mode: "live", track: activeTrack })
                  }
                  className="cta-primary-polish inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-cleared px-5 font-sans text-[13px] font-bold text-on-cleared"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  <span>
                    {isId
                      ? "Panggil Sidang Komite Sekarang"
                      : "Convene Committee Hearing Now"}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </SpotlightCard>
        )}
      </AnimatePresence>

      <AuditHistoryPanel
        entries={historyEntries}
        showEmptyState
        onClear={() => {
          clearAuditHistory();
          setHistoryEntries([]);
        }}
      />
    </div>
  );

  // TERMINAL MODE: Desktop Resizable Split-Pane (Zero-Overlap Sub-Tabs) + Mobile/iPad 4-Tab Bar
  if (variant === "terminal") {
    return (
      <div className="flex h-full flex-col">
        {/* Mobile & iPad 4-Tab Segmented Switcher (< 1024px) */}
        <div className="sticky top-0 z-20 border-b border-hairline bg-obsidian/94 px-3 py-2 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-hairline bg-canvas p-1">
            {(
              [
                { id: "input", label: isId ? "Input" : "Inputs" },
                {
                  id: "telemetry",
                  label: `${isId ? "Skor" : "Live"} (${liveScore})`,
                },
                { id: "causal", label: isId ? "Kausal" : "Graph" },
                {
                  id: "verdict",
                  label: `${isId ? "Vonis" : "Verdict"}${auditResponse ? " ●" : ""}`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={cn(
                  "min-h-[36px] rounded-md px-1.5 font-sans text-xs font-semibold transition-colors",
                  mobileTab === tab.id
                    ? "bg-cleared/16 text-cleared shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3.5 sm:p-5 lg:hidden">
          {/* Keep LivePreAuditPanel mounted in hidden div when on other mobile tabs so liveRiskSnapshot stays live! */}
          <div className={cn(mobileTab !== "telemetry" && "hidden")}>
            {buildTelemetryNode(false)}
          </div>
          {mobileTab === "input" && formNode}
          {mobileTab === "causal" && <CausalFaultTreePanel />}
          {mobileTab === "verdict" && verdictAndLedgerNode}
        </div>

        {/* Desktop Resizable Horizontal Split-Pane (>= 1024px) */}
        <div className="hidden min-h-0 flex-1 lg:block">
          <Group
            id="tesislab-audit-split"
            orientation="horizontal"
            className="h-full w-full"
          >
            <Panel
              id="audit-left-pane"
              defaultSize="55%"
              minSize="38%"
              className="h-full overflow-y-auto p-6"
            >
              {formNode}
            </Panel>

            <Separator className="group relative flex w-2.5 items-center justify-center bg-canvas/80 transition-colors hover:bg-cleared/18 data-[separator=active]:bg-cleared/28">
              <div className="h-full w-px bg-hairline transition-colors group-hover:bg-cleared/70" />
              <GripVertical
                className="pointer-events-none absolute h-4 w-4 text-text-muted opacity-70 group-hover:text-cleared group-hover:opacity-100"
                aria-hidden="true"
              />
            </Separator>

            <Panel
              id="audit-right-pane"
              defaultSize="45%"
              minSize="34%"
              className="flex h-full flex-col overflow-hidden bg-obsidian/55"
            >
              {/* Pinned Top Telemetry Header + 3 Zero-Overlap Sub-Tabs */}
              <div className="z-20 shrink-0 border-b border-hairline bg-obsidian/92 px-5 py-3.5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1 font-mono tabular-nums">
                      <span
                        className={cn(
                          "text-3xl font-bold tracking-tight",
                          getScoreTextTone(liveScore)
                        )}
                      >
                        <NumberFlow value={liveScore} />
                      </span>
                      <span className="text-xs text-text-muted">/100</span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans text-[11px] font-semibold text-text-secondary">
                        {isId ? "Skor Ketahanan Live" : "Live Resilience Score"}
                      </span>
                      <span className="font-mono text-[11px] text-text-muted">
                        Ruin {liveRuinPct.toFixed(1)}% · {liveFlagCount}{" "}
                        {isId ? "Peringatan" : "Flag(s)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {liveFlagCount > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoHeal}
                        title={
                          isId
                            ? "Perbaiki otomatis ke ambang aman"
                            : "Auto-heal parameters"
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-cleared/50 bg-cleared/14 px-2.5 font-sans text-xs font-semibold text-cleared transition-colors hover:bg-cleared/22"
                      >
                        <WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isId ? "Auto-Heal" : "Auto-Heal"}</span>
                      </button>
                    )}

                    <StatusStamp
                      variant={liveStampVariant}
                      label={t(`verdict.status.${liveStampKey}`)}
                    />
                  </div>
                </div>

                {/* 3 Crisp Sub-Tabs */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-lg border border-hairline bg-canvas/90 p-1">
                  <button
                    type="button"
                    onClick={() => setRightTab("telemetry")}
                    className={cn(
                      "inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-md px-2 font-sans text-xs font-semibold transition-colors",
                      rightTab === "telemetry"
                        ? "bg-surface text-cleared shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {isId ? "Telemetri & Simulasi" : "Live Telemetry"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightTab("causal")}
                    className={cn(
                      "inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-md px-2 font-sans text-xs font-semibold transition-colors",
                      rightTab === "causal"
                        ? "bg-surface text-cleared shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <GitBranch className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {isId ? "Pohon Kausal" : "Causal Graph"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightTab("verdict")}
                    className={cn(
                      "inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-md px-2 font-sans text-xs font-semibold transition-colors",
                      rightTab === "verdict"
                        ? "bg-surface text-cleared shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {isId ? "Vonis & Stress" : "Verdict & Stress"}
                    </span>
                    {auditResponse && (
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full bg-cleared shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Independent Scroll Body — Zero Overlap Possible */}
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {/* Keep LivePreAuditPanel mounted when viewing Causal/Verdict so liveRiskSnapshot updates continuously */}
                <div className={cn(rightTab !== "telemetry" && "hidden")}>
                  {buildTelemetryNode(true)}
                </div>
                {rightTab === "causal" && <CausalFaultTreePanel />}
                {rightTab === "verdict" && verdictAndLedgerNode}
              </div>
            </Panel>
          </Group>
        </div>
      </div>
    );
  }

  // Default Marketing Mode
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">{formNode}</div>
        <div className="lg:col-span-5">{buildTelemetryNode(false)}</div>
      </div>
      <CausalFaultTreePanel />
      {verdictAndLedgerNode}
    </div>
  );
}
