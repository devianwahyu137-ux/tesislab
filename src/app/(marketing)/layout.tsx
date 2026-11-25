import { AuditSentinelCompanion } from "@/components/agents/AuditSentinelCompanion";
import { FinancialLedgerCanvas } from "@/components/layout/FinancialLedgerCanvas";
import { MacroTickerBar } from "@/components/layout/MacroTickerBar";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Navbar } from "@/components/layout/Navbar";
import { XRayArchitectureDrawer } from "@/components/xray/XRayArchitectureDrawer";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { context: macroContext, origin: macroOrigin } =
    await getCachedMacroFeed();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-canvas text-ink-primary">
      <FinancialLedgerCanvas />
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navbar macroOrigin={macroOrigin} />
        <MacroTickerBar macroContext={macroContext} />

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-2.5 py-3 sm:gap-6 sm:px-5 sm:py-5 md:px-8 md:py-6">
          {children}
          <MarketingFooter />
        </main>
      </div>

      <XRayArchitectureDrawer
        macroContext={macroContext}
        macroOrigin={macroOrigin}
      />
      <AuditSentinelCompanion />
    </div>
  );
}
