import { TerminalAppShell } from "@/components/terminal/TerminalAppShell";
import { getCachedMacroFeed } from "@/lib/cachedMacroFeed";

export default async function TerminalGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { context: macroContext, origin: macroOrigin } =
    await getCachedMacroFeed();

  return (
    <TerminalAppShell macroContext={macroContext} macroOrigin={macroOrigin}>
      {children}
    </TerminalAppShell>
  );
}
