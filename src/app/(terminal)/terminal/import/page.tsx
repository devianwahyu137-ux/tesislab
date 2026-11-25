import { ScheduledModulePlaceholder } from "@/components/terminal/ScheduledModulePlaceholder";

export default function ImportPage() {
  return (
    <ScheduledModulePlaceholder
      code="MOD-CSV"
      titleId="Smart CSV Mutasi & Kas UMKM Scanner"
      titleEn="Zero-Server Smart CSV Statement Scanner"
      summaryId="Ekstraksi mutasi rekening dan arus kas usaha 100% lokal di browser menggunakan PapaParse tanpa pernah mengunggah data sensitif ke server."
      summaryEn="100% client-side CSV bank mutation and SME cashflow parser powered by PapaParse with zero server uploads."
      specs={[
        "PapaParse RFC-4180 Local Engine",
        "Auto Fixed-Cost & Burn Detection",
        "Indonesian Sample CSV Generator",
        "1-Click Pipe to Audit Workstation",
      ]}
    />
  );
}
