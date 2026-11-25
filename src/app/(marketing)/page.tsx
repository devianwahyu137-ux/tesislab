import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
import { HeroSection } from "@/components/HeroSection";
import { AntiYesManLedgerSection } from "@/components/sections/AntiYesManLedgerSection";
import { EmpiricalEvidenceSection } from "@/components/sections/EmpiricalEvidenceSection";
import { FounderMemoSection } from "@/components/sections/FounderMemoSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { InteractiveRiskLeakSimulator } from "@/components/sections/InteractiveRiskLeakSimulator";
import { PlatformSuiteShowcase } from "@/components/sections/PlatformSuiteShowcase";
import { RoadmapSection } from "@/components/sections/RoadmapSection";
import { KineticMarquee } from "@/components/ui/KineticMarquee";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function MarketingHomePage() {
  const { context: macroContext } = await getCachedMacroFeed();

  return (
    <>
      <HeroSection />
      <KineticMarquee />
      <PlatformSuiteShowcase />
      <AntiYesManLedgerSection />
      <InteractiveRiskLeakSimulator />
      <HowItWorksSection macroContext={macroContext} />
      <CommitteeShowcase />
      <EmpiricalEvidenceSection />
      <FounderMemoSection />
      <RoadmapSection />
    </>
  );
}
