import { WarRoomPageClient } from "@/components/terminal/WarRoomPageClient";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function TerminalWarRoomPage() {
  const { context: macroContext, origin: macroOrigin } =
    await getCachedMacroFeed();

  return (
    <WarRoomPageClient macroContext={macroContext} macroOrigin={macroOrigin} />
  );
}
