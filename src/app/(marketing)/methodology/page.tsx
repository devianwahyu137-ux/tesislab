import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
import { EmpiricalEvidenceSection } from "@/components/sections/EmpiricalEvidenceSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function MethodologyPage() {
  const { context: macroContext } = await getCachedMacroFeed();

  return (
    <div className="flex flex-col gap-4">
      <HowItWorksSection macroContext={macroContext} />
      <CommitteeShowcase />
      <EmpiricalEvidenceSection />
    </div>
  );
}
