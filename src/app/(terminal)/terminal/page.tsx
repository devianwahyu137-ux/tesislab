import { TerminalOverviewClient } from "@/components/terminal/TerminalOverviewClient";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function TerminalOverviewPage() {
  const { context: macroContext } = await getCachedMacroFeed();
  return <TerminalOverviewClient macroContext={macroContext} />;
}
