import { HeroSection } from "@/components/HeroSection";
import { AntiYesManLedgerSection } from "@/components/sections/AntiYesManLedgerSection";
import { FounderMemoSection } from "@/components/sections/FounderMemoSection";
import { PlatformSuiteShowcase } from "@/components/sections/PlatformSuiteShowcase";
import { RoadmapSection } from "@/components/sections/RoadmapSection";
import { KineticMarquee } from "@/components/ui/KineticMarquee";

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <KineticMarquee />
      <PlatformSuiteShowcase />
      <AntiYesManLedgerSection />
      <FounderMemoSection />
      <RoadmapSection />
    </>
  );
}
