import { CommitteeShowcase } from "@/components/agents/CommitteeShowcase";
import { EmpiricalEvidenceSection } from "@/components/sections/EmpiricalEvidenceSection";
import { FormulaSpecificationSection } from "@/components/sections/FormulaSpecificationSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { MethodologyHeaderClient } from "@/components/sections/MethodologyHeaderClient";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function MethodologyPage() {
  const { context: macroContext } = await getCachedMacroFeed();

  return (
    <div className="flex flex-col gap-2">
      <MethodologyHeaderClient />
      <HowItWorksSection macroContext={macroContext} />
      <FormulaSpecificationSection />
      <CommitteeShowcase />
      <EmpiricalEvidenceSection />
    </div>
  );
}
