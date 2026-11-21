import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { MacroTickerBar } from "@/components/layout/MacroTickerBar";
import { Navbar } from "@/components/layout/Navbar";
import { WorkspaceSlotAndFooter } from "@/components/layout/WorkspaceSlotAndFooter";
import { getDailyMacroContext } from "@/lib/macroFeed";

async function TesisLabPageContent() {
  const { context: macroContext, origin: macroOrigin } =
    await getDailyMacroContext();

  return (
    <>
      <Navbar macroOrigin={macroOrigin} />
      <MacroTickerBar macroContext={macroContext} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <HeroSection />
        <WorkspaceSlotAndFooter macroContext={macroContext} />
      </main>
    </>
  );
}

function TesisLabPageFallback() {
  return (
    <>
      <Navbar macroOrigin="local_snapshot" />
      <div className="h-[45px] w-full border-b border-hairline bg-surface/70" />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <HeroSection />
      </main>
    </>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-obsidian text-text-primary">
      <Suspense fallback={<TesisLabPageFallback />}>
        <TesisLabPageContent />
      </Suspense>
    </div>
  );
}
