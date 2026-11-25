import { Suspense } from "react";
import { AuditWorkstationClient } from "@/components/terminal/AuditWorkstationClient";

export default function TerminalAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-text-muted">
          INITIALIZING AUDIT WORKSTATION...
        </div>
      }
    >
      <AuditWorkstationClient />
    </Suspense>
  );
}
