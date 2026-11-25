import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
import { HeroSection } from "@/components/HeroSection";
import { EmpiricalEvidenceSection } from "@/components/sections/EmpiricalEvidenceSection";
import { FounderMemoSection } from "@/components/sections/FounderMemoSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { RoadmapSection } from "@/components/sections/RoadmapSection";
import { KineticMarquee } from "@/components/ui/KineticMarquee";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function MarketingHomePage() {
  const { context: macroContext } = await getCachedMacroFeed();

  return (
    <>
      <HeroSection />
      <KineticMarquee />
      <HowItWorksSection macroContext={macroContext} />
      <CommitteeShowcase />
      <FounderMemoSection />
      <EmpiricalEvidenceSection />
      <RoadmapSection />
    </>
  );
}
