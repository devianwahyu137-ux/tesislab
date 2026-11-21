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
        <div id="audit-workspace-form-slot" className="p-5 sm:p-7 md:p-8">
          <AuditWorkspace />
        </div>
      </section>

      <KineticMarquee />

      <HowItWorksSection macroContext={macroContext} />

      <CommitteeShowcase />

      <FounderMemoSection />

      <EmpiricalEvidenceSection />

      <RoadmapSection />

      {/* Professional Institutional Footer with Fast 1-Click Navigation */}
      <footer className="mx-auto w-full max-w-6xl border-t border-hairline pt-10 pb-12">
        <div className="grid grid-cols-1 gap-8 pb-8 md:grid-cols-12">
          {/* Column 1: Brand & System Status */}
          <div className="flex flex-col gap-3 md:col-span-5">
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
              <span>v1.0 LIVE · DECIMAL.JS · HERMES RADAR</span>
            </div>
          </div>

          {/* Column 2: Fast Section Navigation */}
          <div className="flex flex-col gap-2.5 md:col-span-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {t("footer.nav_title")}
            </span>
            <nav
              aria-label="Footer navigation"
              className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-sans text-xs text-text-secondary md:grid-cols-1"
            >
              <a
                href="#audit-workspace-slot"
                className="transition-colors hover:text-cleared"
              >
                {t("nav.link_warroom")}
              </a>
              <a
                href="#cara-kerja"
                className="transition-colors hover:text-cleared"
              >
                {t("nav.link_how")}
              </a>
              <a
                href="#committee-showcase"
                className="transition-colors hover:text-cleared"
              >
                {t("nav.link_committee")}
              </a>
              <a href="#memo" className="transition-colors hover:text-cleared">
                {t("memo.badge")}
              </a>
              <a href="#riset" className="transition-colors hover:text-cleared">
                {t("nav.link_research")}
              </a>
              <a
                href="#roadmap"
                className="transition-colors hover:text-cleared"
              >
                Roadmap
              </a>
            </nav>
          </div>

          {/* Column 3: Fast 1-Click Audit Launchers & Tools */}
          <div className="flex flex-col gap-2.5 md:col-span-4">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {t("footer.quick_launch_title")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(["trading", "business", "cashflow"] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => handleJumpToTrack(track)}
                  className="rounded-xs border border-hairline bg-obsidian px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
                >
                  {t(`tracks.${track}.name`)}
                </button>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent(COMMAND_PALETTE_OPEN_EVENT)
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xs border border-hairline bg-surface px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
              >
                <Terminal className="h-3 w-3 text-cleared" aria-hidden="true" />
                <span>⌘K Palette</span>
              </button>
              <button
                type="button"
                onClick={toggleXrayMode}
                className="inline-flex items-center gap-1.5 rounded-xs border border-hairline bg-surface px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
              >
                <Cpu className="h-3 w-3 text-conditional" aria-hidden="true" />
                <span>X-Ray</span>
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-1 rounded-xs border border-hairline bg-surface px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-cleared/50 hover:text-cleared"
              >
                <ArrowUp className="h-3 w-3" aria-hidden="true" />
                <span>{t("footer.back_to_top")}</span>
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
