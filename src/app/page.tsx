import { cacheLife } from "next/cache";
import { HeroSection } from "@/components/HeroSection";
import { MacroTickerBar } from "@/components/layout/MacroTickerBar";
import { Navbar } from "@/components/layout/Navbar";
import { WorkspaceSlotAndFooter } from "@/components/layout/WorkspaceSlotAndFooter";
import { getDailyMacroContext } from "@/lib/macroFeed";

async function getCachedMacroFeed() {
  "use cache";
  cacheLife("minutes");
  return getDailyMacroContext();
}

export default async function Home() {
  const { context: macroContext, origin: macroOrigin } =
    await getCachedMacroFeed();

  return (
    <div className="bg-blueprint-grid flex min-h-screen w-full flex-col overflow-x-hidden text-ink-primary">
      <Navbar macroOrigin={macroOrigin} />
      <MacroTickerBar macroContext={macroContext} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <HeroSection />
        <WorkspaceSlotAndFooter
          macroContext={macroContext}
          macroOrigin={macroOrigin}
        />
      </main>
    </div>
  );
}
