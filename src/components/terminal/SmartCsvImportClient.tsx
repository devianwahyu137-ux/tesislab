"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Flame,
  Lock,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import {
  analyzeFinancialCsv,
  SAMPLE_CSV_DATASETS,
  type LedgerCategory,
} from "@/lib/csvAnalyzer";
import { cn } from "@/lib/utils";

const CATEGORY_BADGES: Record<
  LedgerCategory,
  { labelId: string; labelEn: string; cls: string }
> = {
  INCOME: {
    labelId: "Pemasukan",
    labelEn: "Inflow",
    cls: "border-cleared/45 bg-cleared/12 text-cleared",
  },
  FIXED_COST: {
    labelId: "Biaya Tetap",
    labelEn: "Fixed Cost",
    cls: "border-sky-400/45 bg-sky-400/12 text-sky-400",
  },
  VARIABLE_COGS: {
    labelId: "HPP / Bahan",
    labelEn: "COGS / Variable",
    cls: "border-conditional/45 bg-conditional/12 text-conditional",
  },
  DEBT_INSTALLMENT: {
    labelId: "Cicilan Utang",
    labelEn: "Debt Service",
    cls: "border-rejected/50 bg-rejected/12 text-rejected",
  },
  DISCRETIONARY: {
    labelId: "Konsumtif / Bocor",
    labelEn: "Discretionary",
    cls: "border-hairline bg-surface text-text-secondary",
  },
};

export function SmartCsvImportClient() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { queuePrefillInput } = useAuditUI();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isId = locale === "id";

  const [activePreset, setActivePreset] = useState<"household" | "umkm">(
    "household"
  );
  const [rawCsv, setRawCsv] = useState<string>(
    SAMPLE_CSV_DATASETS.household.csv
  );
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | LedgerCategory>(
    "ALL"
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const summary = useMemo(() => analyzeFinancialCsv(rawCsv), [rawCsv]);

  const filteredRows = useMemo(
    () =>
      categoryFilter === "ALL"
        ? summary.rows
        : summary.rows.filter((r) => r.category === categoryFilter),
    [summary.rows, categoryFilter]
  );

  // Detect largest discretionary / debt leak for actionable insight
  const topLeak = useMemo(() => {
    const outflows = summary.rows.filter(
      (r) =>
        r.amount < 0 &&
        (r.category === "DISCRETIONARY" || r.category === "DEBT_INSTALLMENT")
    );
    if (outflows.length === 0) return null;
    const sorted = [...outflows].sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
    );
    const biggest = sorted[0]!;
    const annualSavings30Pct = Math.round(Math.abs(biggest.amount) * 0.3 * 12);
    return {
      item: biggest,
      annualSavings30Pct,
      totalDiscretionaryAnnual: Math.round(
        summary.discretionaryOutflow * 0.35 * 12
      ),
    };
  }, [summary.rows, summary.discretionaryOutflow]);

  const handleLoadSample = (key: "household" | "umkm") => {
    setActivePreset(key);
    setCategoryFilter("ALL");
    setRawCsv(SAMPLE_CSV_DATASETS[key].csv);
    toast.info(
      isId
        ? `Contoh CSV ${key === "household" ? "Mutasi Gaji" : "Buku Kas UMKM"} dimuat.`
        : `Loaded ${key === "household" ? "Payroll" : "SME"} sample CSV.`
    );
  };

  const ingestFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      if (content.trim()) {
        setRawCsv(content);
        setCategoryFilter("ALL");
        toast.success(
          isId
            ? `File ${file.name} berhasil dipindai 100% lokal di browser.`
            : `Parsed ${file.name} 100% locally in browser.`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) ingestFile(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([rawCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tesislab-${activePreset}-sample.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      isId
        ? "File template .CSV berhasil diunduh."
        : "Downloaded .CSV template file."
    );
  };

  const handleSendToAudit = (target: "cashflow" | "business") => {
    const payload =
      target === "cashflow"
        ? (summary.suggestedCashflowInput as unknown as Record<string, unknown>)
        : (summary.suggestedBusinessInput as unknown as Record<string, unknown>);
    queuePrefillInput(target, payload);
    toast.success(
      isId
        ? "Angka mutasi berhasil dikirim ke Workstation Audit."
        : "CSV metrics piped to Audit Workstation."
    );
    router.push(`/terminal/audit?track=${target}`);
  };

  const totalOut =
    summary.fixedOutflow +
      summary.variableCogsOutflow +
      summary.debtOutflow +
      summary.discretionaryOutflow || 1;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header + Privacy Guarantee */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cleared/40 bg-cleared/12 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isId
                ? "100% PRIVASI LOKAL DI BROWSER · NOL UPLOAD SERVER"
                : "100% IN-BROWSER PRIVACY · ZERO SERVER UPLOAD"}
            </span>
          </span>
          <h2 className="mt-2.5 font-editorial text-2xl font-medium text-text-primary sm:text-4xl">
            {isId
              ? "Smart CSV Mutasi Rekening & Buku Kas UMKM."
              : "Smart CSV Bank Statement & SME Ledger Scanner."}
          </h2>
          <p className="mt-1.5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-text-secondary sm:text-[15px]">
            {isId
              ? "Unggah atau tempel file .CSV mutasi bank maupun pembukuan usaha Anda. Mesin lokal mengelompokkan arus kas otomatis dan mendeteksi titik kebocoran."
              : "Drop or paste bank/SME .CSV files. Everything is parsed locally in your browser with automatic cash-leak detection."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="cta-primary-polish inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-cleared px-4 font-sans text-xs font-bold text-on-cleared"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{isId ? "Unggah File .CSV" : "Upload .CSV File"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3.5 font-sans text-xs font-semibold text-text-secondary transition-colors hover:border-active-border hover:text-text-primary"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? "Unduh Contoh .CSV" : "Download .CSV"}</span>
          </button>

          {(["household", "umkm"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleLoadSample(key)}
              className={cn(
                "min-h-[40px] rounded-lg border px-3.5 font-sans text-xs font-semibold transition-colors",
                activePreset === key
                  ? "border-cleared/50 bg-cleared/14 text-cleared"
                  : "border-hairline bg-obsidian text-text-secondary hover:text-text-primary"
              )}
            >
              {key === "household"
                ? isId
                  ? "Contoh Mutasi Gaji"
                  : "Sample Payroll"
                : isId
                  ? "Contoh Kas UMKM"
                  : "Sample SME"}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Drag-and-Drop Strip */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) ingestFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-5 py-3.5 transition-all",
          isDragOver
            ? "border-cleared bg-cleared/14 text-cleared"
            : "border-active-border/75 bg-obsidian/70 hover:border-cleared/60"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cleared/40 bg-cleared/12 text-cleared">
            <Upload className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <span className="block font-sans text-xs font-bold text-text-primary sm:text-[13.5px]">
              {isId
                ? "Seret & Lepas File Mutasi (.CSV / .TSV) ke Sini atau Klik untuk Memilih"
                : "Drag & Drop Your Bank/SME .CSV File Here or Click to Browse"}
            </span>
            <span className="font-sans text-xs text-text-muted">
              {isId
                ? "Mendukung format ekspor BCA, Mandiri, BRI, BNI, maupun Excel kas harian."
                : "Supports Indonesian bank exports and standard Excel/Google Sheets CSVs."}
            </span>
          </div>
        </div>
        <span className="rounded-md border border-hairline bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-cleared">
          PapaParse Local Engine
        </span>
      </div>

      {/* 4 Luminous Diagnostic Readout Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <SpotlightCard tone="emerald" className="p-4 sm:p-5">
          <span className="font-sans text-xs font-medium text-text-secondary">
            {isId ? "Total Arus Kas Masuk" : "Total Cash Inflow"}
          </span>
          <span className="mt-1.5 block font-mono text-xl font-bold tabular-nums text-cleared sm:text-2xl">
            Rp {Math.round(summary.totalInflow).toLocaleString("id-ID")}
          </span>
        </SpotlightCard>

        <SpotlightCard tone="sky" className="p-4 sm:p-5">
          <span className="font-sans text-xs font-medium text-text-secondary">
            {isId ? "Biaya Tetap & Bahan Baku" : "Fixed & COGS Outflow"}
          </span>
          <span className="mt-1.5 block font-mono text-xl font-bold tabular-nums text-text-primary sm:text-2xl">
            Rp{" "}
            {Math.round(
              summary.fixedOutflow + summary.variableCogsOutflow
            ).toLocaleString("id-ID")}
          </span>
        </SpotlightCard>

        <SpotlightCard
          tone={summary.ojkDsrPct > 30 ? "crimson" : "emerald"}
          className="p-4 sm:p-5"
        >
          <span className="font-sans text-xs font-medium text-text-secondary">
            {isId ? "Rasio Cicilan Aktif (DSR OJK)" : "Active Debt DSR (OJK)"}
          </span>
          <span
            className={cn(
              "mt-1.5 block font-mono text-xl font-bold tabular-nums sm:text-2xl",
              summary.ojkDsrPct > 30 ? "text-rejected" : "text-cleared"
            )}
          >
            {summary.ojkDsrPct.toFixed(1)}%
          </span>
          <span className="mt-0.5 block font-sans text-[11.5px] text-text-muted">
            Rp {Math.round(summary.debtOutflow).toLocaleString("id-ID")} /{" "}
            {isId ? "bln" : "mo"}
          </span>
        </SpotlightCard>

        <SpotlightCard
          tone={summary.netCashflow >= 0 ? "emerald" : "crimson"}
          className="p-4 sm:p-5"
        >
          <span className="font-sans text-xs font-medium text-text-secondary">
            {isId ? "Sisa Kas Bersih" : "Net Surplus / Deficit"}
          </span>
          <span
            className={cn(
              "mt-1.5 block font-mono text-xl font-bold tabular-nums sm:text-2xl",
              summary.netCashflow >= 0 ? "text-cleared" : "text-rejected"
            )}
          >
            {summary.netCashflow < 0 ? "-" : "+"}Rp{" "}
            {Math.abs(Math.round(summary.netCashflow)).toLocaleString("id-ID")}
          </span>
        </SpotlightCard>
      </div>

      {/* Cash-Leak & Debt Alert Detector Card */}
      {topLeak && (
        <SpotlightCard tone="amber" className="p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-conditional/45 bg-conditional/14 text-conditional">
                {summary.ojkDsrPct > 30 ? (
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Flame className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <div>
                <h3 className="font-sans text-sm font-bold text-text-primary sm:text-[15px]">
                  {isId
                    ? `Detektor Kebocoran Terbesar: "${topLeak.item.description}" (-Rp ${Math.abs(Math.round(topLeak.item.amount)).toLocaleString("id-ID")})`
                    : `Largest Detected Cash Drain: "${topLeak.item.description}" (-Rp ${Math.abs(Math.round(topLeak.item.amount)).toLocaleString("id-ID")})`}
                </h3>
                <p className="mt-1 font-sans text-[13px] leading-relaxed text-text-secondary">
                  {isId
                    ? `Memangkas pos ini sebesar 30% saja berpotensi menyelamatkan kas Rp ${topLeak.annualSavings30Pct.toLocaleString("id-ID")} per tahun untuk memperkuat dana darurat atau modal usaha.`
                    : `Trimming this single outflow by 30% recovers Rp ${topLeak.annualSavings30Pct.toLocaleString("id-ID")} per year into your emergency reserve.`}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSendToAudit("cashflow")}
                className="cta-primary-polish inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-cleared px-4 font-sans text-xs font-bold text-on-cleared"
              >
                <span>
                  {isId ? "Audit sebagai Cashflow" : "Audit as Cashflow"}
                </span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => handleSendToAudit("business")}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-cleared/45 bg-cleared/12 px-4 font-sans text-xs font-bold text-cleared hover:bg-cleared/20"
              >
                <span>{isId ? "Audit sebagai UMKM" : "Audit as SME"}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-obsidian">
            <div
              className="bg-sky-400"
              style={{ width: `${(summary.fixedOutflow / totalOut) * 100}%` }}
              title="Fixed Cost"
            />
            <div
              className="bg-conditional"
              style={{
                width: `${(summary.variableCogsOutflow / totalOut) * 100}%`,
              }}
              title="Variable COGS"
            />
            <div
              className="bg-rejected"
              style={{ width: `${(summary.debtOutflow / totalOut) * 100}%` }}
              title="Debt Service"
            />
            <div
              className="bg-slate-500"
              style={{
                width: `${(summary.discretionaryOutflow / totalOut) * 100}%`,
              }}
              title="Discretionary"
            />
          </div>
        </SpotlightCard>
      )}

      {/* Split Editor & Classified Transaction Ledger */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <SpotlightCard tone="neutral" className="gap-3 p-5 xl:col-span-5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="raw-csv-editor"
              className="flex items-center gap-2 font-sans text-sm font-bold text-text-primary"
            >
              <FileSpreadsheet
                className="h-4 w-4 text-cleared"
                aria-hidden="true"
              />
              <span>
                {isId
                  ? "Editor CSV Mentah (Bisa Diedit Langsung)"
                  : "Editable Raw CSV Buffer"}
              </span>
            </label>
            <span className="font-mono text-xs text-text-muted">
              {summary.rows.length} {isId ? "baris" : "rows"}
            </span>
          </div>
          <textarea
            id="raw-csv-editor"
            rows={13}
            value={rawCsv}
            onChange={(e) => setRawCsv(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-obsidian p-3.5 font-mono text-xs leading-relaxed text-text-primary focus:border-cleared/65 focus:outline-none focus:ring-2 focus:ring-cleared/20"
          />
        </SpotlightCard>

        <SpotlightCard
          tone="emerald"
          className="overflow-hidden xl:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-obsidian/90 px-4 py-3.5">
            <span className="font-sans text-sm font-bold text-text-primary">
              {isId
                ? `Klasifikasi Otomatis Transaksi (${filteredRows.length})`
                : `Classified Transactions (${filteredRows.length})`}
            </span>

            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  "ALL",
                  "INCOME",
                  "FIXED_COST",
                  "VARIABLE_COGS",
                  "DEBT_INSTALLMENT",
                  "DISCRETIONARY",
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-sans text-[11px] font-semibold transition-colors",
                    categoryFilter === cat
                      ? "bg-cleared/16 text-cleared"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {cat === "ALL"
                    ? isId
                      ? "Semua"
                      : "All"
                    : isId
                      ? CATEGORY_BADGES[cat].labelId
                      : CATEGORY_BADGES[cat].labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[380px] divide-y divide-hairline overflow-y-auto">
            {filteredRows.map((row) => {
              const badge = CATEGORY_BADGES[row.category];
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] transition-colors hover:bg-surface/65"
                >
                  <div className="min-w-0">
                    <span className="block truncate font-sans font-semibold text-text-primary">
                      {row.description}
                    </span>
                    <span className="font-mono text-[11px] text-text-muted">
                      {row.date}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        "rounded-sm border px-2.5 py-0.5 font-sans text-[11px] font-semibold",
                        badge.cls
                      )}
                    >
                      {isId ? badge.labelId : badge.labelEn}
                    </span>
                    <span
                      className={cn(
                        "w-32 text-right font-mono font-bold tabular-nums",
                        row.amount >= 0 ? "text-cleared" : "text-text-primary"
                      )}
                    >
                      {row.amount >= 0 ? "+" : "-"}Rp{" "}
                      {Math.abs(Math.round(row.amount)).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
