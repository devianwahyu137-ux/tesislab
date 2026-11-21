"use client";

import { ArrowUp, Cpu, Terminal } from "lucide-react";
import { AuditSentinelCompanion } from "@/components/agents/AuditSentinelCompanion";
import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/navigation/CommandPalette";
import { VirtualWarRoomOffice } from "@/components/office/VirtualWarRoomOffice";
import { EmpiricalEvidenceSection } from "@/components/sections/EmpiricalEvidenceSection";
import { FounderMemoSection } from "@/components/sections/FounderMemoSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { RoadmapSection } from "@/components/sections/RoadmapSection";
import { KineticMarquee } from "@/components/ui/KineticMarquee";
import { AuditWorkspace } from "@/components/workspace/AuditWorkspace";
import { XRayArchitectureDrawer } from "@/components/xray/XRayArchitectureDrawer";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";

export interface WorkspaceSlotAndFooterProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

/**
 * Centered Institutional War-Room Terminal shell featuring the Live Virtual Office,
 * single-source AuditWorkspace, 4-Step Walkthrough, Veto Protocol Dossier,
 * Founder's Memo, Empirical Evidence, Roadmap, Professional Fast-Nav Footer, and X-Ray Inspector.
 */
export function WorkspaceSlotAndFooter({
  macroContext,
  macroOrigin,
}: WorkspaceSlotAndFooterProps) {
  const { t } = useTranslation();
  const { setActiveTrack, toggleXrayMode } = useAuditUI();

  const handleJumpToTrack = (track: AuditTrack) => {
    setActiveTrack(track);
    const el = document.getElementById("audit-workspace-slot");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <section
        id="audit-workspace-slot"
        className="surface-specular mx-auto w-full max-w-6xl overflow-hidden rounded-sm border border-active-border/80 bg-surface"
      >
        {/* Full-Frame 3D Isometric Institutional War-Room Office */}
        <VirtualWarRoomOffice
          macroContext={macroContext}
          macroOrigin={macroOrigin}
        />

        {/* Centralized Audit Workspace Body */}
        <div id="audit-workspace-form-slot" className="p-3.5 sm:p-6 md:p-8">
          <AuditWorkspace />
        </div>
      </section>

      <KineticMarquee />

      <HowItWorksSection macroContext={macroContext} />

      <CommitteeShowcase />

      <FounderMemoSection />

      <EmpiricalEvidenceSection />

      <RoadmapSection />

      {/* Professional Institutional Footer with Balanced 4-Column Layout */}
      <footer className="mx-auto w-full max-w-6xl border-t border-hairline pt-10 pb-16">
        <div className="grid grid-cols-1 gap-8 pb-8 sm:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand & System Status */}
          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <span className="font-editorial text-xl font-bold tracking-tight text-text-primary">
                TesisLab.
              </span>
              <span className="rounded-xs border border-cleared/35 bg-cleared/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cleared">
                tesislab.app
              </span>
            </div>
            <p className="max-w-sm font-sans text-xs leading-relaxed text-text-secondary">
              {t("footer.tagline")}
            </p>
            <div className="mt-1 inline-flex w-fit items-center gap-2 rounded-xs border border-hairline bg-obsidian px-2.5 py-1 font-mono text-[10px] text-text-muted">
              <span
                className="h-1.5 w-1.5 rounded-full bg-cleared"
                aria-hidden="true"
              />
              <span>v1.0 LIVE · DECIMAL.JS · HERMES</span>
            </div>
          </div>

          {/* Column 2: Fast Section Navigation */}
          <div className="flex flex-col gap-2.5 lg:col-span-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {t("footer.nav_title")}
            </span>
            <nav
              aria-label="Footer navigation"
              className="flex flex-col gap-1.5 font-sans text-xs text-text-secondary"
            >
              <a
                href="#audit-workspace-slot"
                className="w-fit transition-colors hover:text-cleared"
              >
                {t("nav.link_warroom")}
              </a>
              <a
                href="#cara-kerja"
                className="w-fit transition-colors hover:text-cleared"
              >
                {t("nav.link_how")}
              </a>
              <a
                href="#committee-showcase"
                className="w-fit transition-colors hover:text-cleared"
              >
                {t("nav.link_committee")}
              </a>
              <a
                href="#memo"
                className="w-fit transition-colors hover:text-cleared"
              >
                {t("footer.link_manifesto")}
              </a>
              <a
                href="#riset"
                className="w-fit transition-colors hover:text-cleared"
              >
                {t("nav.link_research")}
              </a>
              <a
                href="#roadmap"
                className="w-fit transition-colors hover:text-cleared"
              >
                Roadmap
              </a>
            </nav>
          </div>

          {/* Column 3: Fast 1-Click Audit Launchers */}
          <div className="flex flex-col gap-2.5 lg:col-span-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {t("footer.quick_launch_title")}
            </span>
            <div className="flex flex-col gap-1.5">
              {(["trading", "business", "cashflow"] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => handleJumpToTrack(track)}
                  className="flex items-center justify-between rounded-xs border border-hairline bg-obsidian px-3 py-2 text-left font-mono text-[11px] font-medium text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
                >
                  <span>{t(`tracks.${track}.name`)}</span>
                  <span className="text-[10px] opacity-60">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 4: Quick Tools & Shortcuts */}
          <div className="flex flex-col gap-2.5 lg:col-span-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {t("footer.tools_title")}
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent(COMMAND_PALETTE_OPEN_EVENT)
                  )
                }
                className="flex items-center justify-between rounded-xs border border-hairline bg-surface px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-cleared" aria-hidden="true" />
                  <span>{t("nav.search_btn")}</span>
                </span>
                <kbd className="rounded-xs border border-hairline bg-obsidian px-1.5 py-0.5 text-[9px] text-text-muted">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                onClick={toggleXrayMode}
                className="flex items-center justify-between rounded-xs border border-hairline bg-surface px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-cleared/50 hover:text-text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-conditional" aria-hidden="true" />
                  <span>{t("nav.xray_label")}</span>
                </span>
                <span className="text-[9px] uppercase text-text-muted">Inspect</span>
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center justify-between rounded-xs border border-hairline bg-surface px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("footer.back_to_top")}</span>
                </span>
                <span className="text-[9px] text-text-muted">↑</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Authoritative Disclaimer & Copyright */}
        <div className="flex flex-col justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <p className="max-w-3xl font-mono text-[11px] leading-relaxed text-ink-muted">
            {t("verdict.disclaimer")}
          </p>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            © 2026 TesisLab.
          </span>
        </div>
      </footer>

      <XRayArchitectureDrawer
        macroContext={macroContext}
        macroOrigin={macroOrigin}
      />

      <AuditSentinelCompanion />
    </>
  );
}
