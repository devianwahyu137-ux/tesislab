import { ScheduledModulePlaceholder } from "@/components/terminal/ScheduledModulePlaceholder";

export default function ComparePage() {
  return (
    <ScheduledModulePlaceholder
      code="MOD-COMPARE"
      titleId="Arena Komparasi Skenario A vs. B"
      titleEn="Side-by-Side Scenario A vs. B Arena"
      summaryId="Modul perbandingan head-to-head dua keputusan finansial sekaligus dengan tabel pemenang deterministik dan kurva Stress Test ganda."
      summaryEn="Head-to-head comparison engine pitting Option A against Option B with deterministic delta scoring and dual resilience curves."
      specs={[
        "Decimal.js Dual-Engine Diff",
        "Dual Stress-Test Overlay",
        "Trading / UMKM / Cashflow Parity",
        "1-Click Winner Promotion",
      ]}
    />
  );
}
