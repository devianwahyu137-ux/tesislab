import { ScheduledModulePlaceholder } from "@/components/terminal/ScheduledModulePlaceholder";

export default function JournalPage() {
  return (
    <ScheduledModulePlaceholder
      code="MOD-JOURNAL"
      titleId="Buku Besar Keputusan & Kalibrasi Brier Score"
      titleEn="Decision Ledger & Brier Calibration Tracker"
      summaryId="Arsip lengkap seluruh Dossier audit Anda disertai pencatatan hasil nyata (Post-Mortem Outcome) untuk mengukur akurasi psikologis Brier Score."
      summaryEn="Full historical dossier archive paired with real-world outcome logging to quantify your personal probabilistic Brier Score calibration."
      specs={[
        "Full Snapshot Dossier Replay",
        "Post-Mortem Outcome Tracker",
        "Probabilistic Brier Score Curve",
        "Shareable Dossier Links",
      ]}
    />
  );
}
