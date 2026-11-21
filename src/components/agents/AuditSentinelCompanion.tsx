"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Terminal } from "lucide-react";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type SentinelMood = "observing" | "skeptical" | "alert" | "cleared";

/**
 * Scroll-Following "Anti-Yes-Man" Audit Sentinel Companion.
 * Tracks cursor with its geometric visor, reacts in real time to live calculator
 * scores / flags / Monte Carlo ruin risk, and follows the user across page sections.
 */
export function AuditSentinelCompanion() {
  const { t } = useTranslation();
  const { auditPhase, auditResponse, liveRiskSnapshot } = useAuditUI();

  const [section, setSection] = useState<string>("hero");
  const [minimized, setMinimized] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Track active section as user scrolls
  useEffect(() => {
    const ids = [
      "audit-workspace-slot",
      "cara-kerja",
      "committee-showcase",
      "memo",
      "riset",
      "roadmap",
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0.05 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScrollTop = () => {
      if (window.scrollY < 260) setSection("hero");
    };
    window.addEventListener("scroll", onScrollTop, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollTop);
    };
  }, []);

  // Subtle visor reticle cursor tracking
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      setEyeOffset({
        x: Math.max(-3.2, Math.min(3.2, nx * 3.2)),
        y: Math.max(-2.2, Math.min(2.2, ny * 2.2)),
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Derive mood & live contextual commentary
  let mood: SentinelMood = "observing";
  let message = t("sentinel.msg_hero");

  if (auditPhase === "scanning" || auditPhase === "debating") {
    mood = "skeptical";
    message = t("sentinel.msg_auditing");
  } else if (auditPhase === "verdict" && auditResponse) {
    const status = auditResponse.verdict.verdict_status;
    if (status === "REJECTED") {
      mood = "alert";
      message = t("sentinel.msg_verdict_rejected");
    } else if (status === "CONDITIONAL") {
      mood = "skeptical";
      message = t("sentinel.msg_verdict_conditional");
    } else {
      mood = "cleared";
      message = t("sentinel.msg_verdict_cleared");
    }
  } else if (section === "audit-workspace-slot" && liveRiskSnapshot) {
    const { score, flags, ruinPct } = liveRiskSnapshot;
    if (score < 45 || ruinPct > 40) {
      mood = "alert";
      message = `${t("sentinel.live_alert_prefix")} ${ruinPct.toFixed(0)}% · ${t("sentinel.live_alert_suffix")}`;
    } else if (flags.includes("SL_INSIDE_MARKET_NOISE")) {
      mood = "alert";
      message = t("sentinel.live_atr_noise");
    } else if (flags.length > 0 || score < 75) {
      mood = "skeptical";
      message = `${t("sentinel.live_score_prefix")} ${score}/100 · ${flags[0] ?? t("sentinel.live_tighten")}`;
    } else {
      mood = "cleared";
      message = `${t("sentinel.live_cleared_prefix")} (${score}/100).`;
    }
  } else if (section === "cara-kerja") {
    message = t("sentinel.msg_methodology");
  } else if (section === "committee-showcase") {
    mood = "skeptical";
    message = t("sentinel.msg_committee");
  } else if (section === "memo") {
    message = t("sentinel.msg_memo");
  } else if (section === "riset" || section === "roadmap") {
    mood = "cleared";
    message = t("sentinel.msg_research");
  }

  // Override with rotating anti-yes-man quip when user taps the sentinel
  const tapQuips = [
    t("sentinel.quip_1"),
    t("sentinel.quip_2"),
    t("sentinel.quip_3"),
  ];
  const displayMessage =
    tapCount > 0 ? tapQuips[(tapCount - 1) % tapQuips.length] : message;

  const accentStroke =
    mood === "alert"
      ? "var(--status-rejected)"
      : mood === "skeptical"
        ? "var(--status-conditional)"
        : mood === "cleared"
          ? "var(--status-cleared)"
          : "#38BDF8";

  const statusTag =
    mood === "alert"
      ? "VETO ALERT"
      : mood === "skeptical"
        ? "SKEPTICAL"
        : mood === "cleared"
          ? "CALIBRATED"
          : "AUDITOR";

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden flex-col items-end gap-2 md:flex">
      <AnimatePresence mode="wait">
        {!minimized && (
          <motion.div
            key={displayMessage}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="surface-specular w-[264px] rounded-sm border border-active-border bg-surface/95 p-3 backdrop-blur-md"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span
                className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: accentStroke }}
              >
                {statusTag}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent(COMMAND_PALETTE_OPEN_EVENT)
                    )
                  }
                  title="⌘K"
                  className="inline-flex h-5 items-center gap-0.5 rounded-xs border border-hairline bg-obsidian px-1.5 font-mono text-[9px] text-text-muted transition-colors hover:text-text-primary"
                >
                  <Terminal className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>⌘K</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  aria-label={t("sentinel.minimize_label")}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-xs border border-hairline bg-obsidian text-text-muted transition-colors hover:text-text-primary"
                >
                  <Minus className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-text-primary">
              {displayMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Geometric Auditor Avatar Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => {
          if (minimized) {
            setMinimized(false);
          } else {
            setTapCount((c) => c + 1);
          }
        }}
        title={t("sentinel.tap_hint")}
        aria-label={t("sentinel.tap_hint")}
        className={cn(
          "surface-specular relative flex h-12 w-12 items-center justify-center rounded-sm border bg-obsidian/95 shadow-xl backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cleared",
          mood === "alert"
            ? "border-rejected/70"
            : mood === "skeptical"
              ? "border-conditional/70"
              : mood === "cleared"
                ? "border-cleared/70"
                : "border-active-border"
        )}
      >
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          {/* Outer Octagonal Auditor Crest */}
          <polygon
            points="11,3 25,3 33,11 33,25 25,33 11,33 3,25 3,11"
            stroke={accentStroke}
            strokeWidth="1.5"
            fill="var(--bg-surface)"
          />
          {/* Visor Housing */}
          <rect
            x="8"
            y="13"
            width="20"
            height={mood === "skeptical" ? "8" : "10"}
            rx="2"
            fill="var(--bg-obsidian)"
            stroke={accentStroke}
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          {/* Cursor-Tracking Reticle Eyes */}
          <g
            transform={`translate(${eyeOffset.x.toFixed(1)}, ${eyeOffset.y.toFixed(1)})`}
          >
            <rect
              x="12.5"
              y={mood === "skeptical" ? "15.5" : "16"}
              width="3.5"
              height={mood === "skeptical" ? "2.8" : "4"}
              rx="1"
              fill={accentStroke}
            />
            <rect
              x="20"
              y={mood === "skeptical" ? "15.5" : "16"}
              width="3.5"
              height={mood === "skeptical" ? "2.8" : "4"}
              rx="1"
              fill={accentStroke}
            />
          </g>
        </svg>
      </motion.button>
    </div>
  );
}
