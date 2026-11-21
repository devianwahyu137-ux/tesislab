"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Terminal } from "lucide-react";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * Clean, unobtrusive Floating Quick-Action Dock at bottom-right.
 * Replaces the permanently-open speech bubble with two crisp, high-utility controls:
 * 1) Live Risk Score / Command Palette shortcut (⌘K)
 * 2) Smooth Back-to-Top button once scrolled down.
 */
export function AuditSentinelCompanion() {
  const { t } = useTranslation();
  const { liveRiskSnapshot } = useAuditUI();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const score = liveRiskSnapshot?.score ?? null;
  const dotTone =
    score === null
      ? "bg-cleared"
      : score >= 75
        ? "bg-cleared"
        : score >= 50
          ? "bg-conditional"
          : "bg-rejected";

  return (
    <div className="fixed right-3 bottom-3 z-40 flex items-center gap-1.5 sm:right-4 sm:bottom-4 sm:gap-2">
      {/* Compact Command Palette + Live Score Trigger */}
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT))
        }
        aria-label={t("command.trigger_label")}
        title={t("command.trigger_label")}
        className="surface-specular inline-flex h-9 items-center gap-1.5 rounded-full border border-active-border/90 bg-obsidian/92 px-3 font-mono text-[10px] font-semibold text-text-primary shadow-lg shadow-black/30 backdrop-blur-md transition-colors hover:border-cleared/60 hover:text-cleared sm:h-10 sm:gap-2 sm:px-3.5 sm:text-[11px]"
      >
        <span
          className={cn("h-2 w-2 rounded-full", dotTone)}
          aria-hidden="true"
        />
        {score !== null && (
          <span className="hidden tabular-nums text-text-secondary sm:inline">
            {score}/100
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-text-muted">
          <Terminal className="h-3 w-3" aria-hidden="true" />
          <span>⌘K</span>
        </span>
      </button>

      {/* Smooth Back-to-Top Button (only visible after scrolling) */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t("footer.back_to_top")}
            title={t("footer.back_to_top")}
            className="surface-specular inline-flex h-10 w-10 items-center justify-center rounded-full border border-active-border/90 bg-obsidian/90 text-text-secondary shadow-lg shadow-black/30 backdrop-blur-md transition-colors hover:border-cleared/60 hover:text-cleared"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
