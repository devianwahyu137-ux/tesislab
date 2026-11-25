"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  FileSpreadsheet,
  Lock,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
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
    cls: "border-cleared/40 bg-cleared/10 text-cleared",
  },
  FIXED_COST: {
    labelId: "Biaya Tetap",
    labelEn: "Fixed Cost",
    cls: "border-sky-400/40 bg-sky-400/10 text-sky-400",
  },
  VARIABLE_COGS: {
    labelId: "HPP / Variabel",
    labelEn: "COGS / Variable",
    cls: "border-conditional/40 bg-conditional/10 text-conditional",
  },
  DEBT_INSTALLMENT: {
    labelId: "Cicilan Utang",
    labelEn: "Debt Service",
    cls: "border-rejected/45 bg-rejected/10 text-rejected",
  },
  DISCRETIONARY: {
    labelId: "Diskresioner / Bocor",
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

  const summary = useMemo(() => analyzeFinancialCsv(rawCsv), [rawCsv]);

  const handleLoadSample = (key: "household" | "umkm") => {
    setActivePreset(key);
    setRawCsv(SAMPLE_CSV_DATASETS[key].csv);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      if (content.trim()) {
        setRawCsv(content);
        toast.success(
          isId
            ? `File ${file.name} berhasil dipindai lokal di browser.`
            : `Parsed ${file.name} locally in browser.`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleSendToAudit = (target: "cashflow" | "business") => {
    const payload =
      target === "cashflow"
        ? (summary.suggestedCashflowInput as unknown as Record<string, unknown>)
        : (summary.suggestedBusinessInput as unknown as Record<string, unknown>);
    queuePrefillInput(target, payload);
    toast.success(
      isId
        ? "Data CSV berhasil dikirim ke Workstation Audit."
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      {/* Header + Privacy Guarantee */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cleared">
            <Lock className="h-3 w-3" aria-hidden="true" />
            <span>
              {isId
                ? "100% LOKAL DI BROWSER · PAPAPARSE · NOL UPLOAD SERVER"
                : "100% IN-BROWSER · PAPAPARSE · ZERO SERVER UPLOAD"}
            </span>
          </span>
          <h2 className="mt-1 font-editorial text-2xl font-medium text-text-primary sm:text-3xl">
            {isId
              ? "Smart CSV Mutasi Rekening & Buku Kas UMKM."
              : "Smart CSV Bank Statement & SME Ledger Scanner."}
          </h2>
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
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-active-border bg-surface px-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-primary transition-colors hover:border-cleared/50 hover:text-cleared"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? "Unggah File .CSV" : "Upload .CSV File"}</span>
          </button>

          {(["household", "umkm"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleLoadSample(key)}
              className={cn(
                "min-h-[36px] rounded-sm border px-3 font-mono text-[10.5px] uppercase tracking-wider transition-colors",
                activePreset === key
                  ? "border-cleared/45 bg-cleared/12 font-semibold text-cleared"
                  : "border-hairline bg-obsidian text-text-muted hover:text-text-primary"
              )}
            >
              {key === "household"
                ? isId
                  ? "Contoh Mutasi Gaji"
                  : "Sample Payroll CSV"
                : isId
                  ? "Contoh Kas UMKM"
                  : "Sample SME CSV"}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Diagnostic Readout Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "Total Arus Masuk" : "Total Inflow"}
          </span>
          <span className="mt-1 block text-lg font-bold text-cleared sm:text-xl">
            Rp {Math.round(summary.totalInflow).toLocaleString("id-ID")}
          </span>
        </div>

        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "Biaya Tetap & HPP" : "Fixed & COGS"}
          </span>
          <span className="mt-1 block text-lg font-bold text-text-primary sm:text-xl">
            Rp{" "}
            {Math.round(
              summary.fixedOutflow + summary.variableCogsOutflow
            ).toLocaleString("id-ID")}
          </span>
        </div>

        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "DSR Cicilan Aktif" : "Active Debt DSR"}
          </span>
          <span
            className={cn(
              "mt-1 block text-lg font-bold sm:text-xl",
              summary.ojkDsrPct > 30 ? "text-rejected" : "text-cleared"
            )}
          >
            {summary.ojkDsrPct.toFixed(1)}% (Rp{" "}
            {Math.round(summary.debtOutflow / 1_000_000).toFixed(1)}M)
          </span>
        </div>

        <div className="terminal-panel rounded-md p-4 font-mono tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {isId ? "Surplus / Defisit Bersih" : "Net Surplus / Deficit"}
          </span>
          <span
            className={cn(
              "mt-1 block text-lg font-bold sm:text-xl",
              summary.netCashflow >= 0 ? "text-cleared" : "text-rejected"
            )}
          >
            {summary.netCashflow < 0 ? "-" : "+"}Rp{" "}
            {Math.abs(Math.round(summary.netCashflow)).toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Outflow Composition Bar + 1-Click Pipe Actions */}
      <div className="terminal-panel flex flex-col gap-4 rounded-md p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet
              className="h-4 w-4 text-cleared"
              aria-hidden="true"
            />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-primary">
              {isId
                ? `Komposisi Pengeluaran (${summary.rows.length} Baris Terdeteksi)`
                : `Outflow Decomposition (${summary.rows.length} Rows Parsed)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSendToAudit("cashflow")}
              className="cta-primary-polish inline-flex min-h-[36px] items-center gap-1.5 rounded-sm bg-cleared px-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-on-cleared"
            >
              <span>{isId ? "Audit sebagai Cashflow" : "Audit as Cashflow"}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleSendToAudit("business")}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-cleared/45 bg-cleared/10 px-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-cleared hover:bg-cleared/20"
            >
              <span>{isId ? "Audit sebagai UMKM" : "Audit as SME"}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex h-2.5 w-full overflow-hidden rounded-xs bg-obsidian">
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
      </div>

      {/* Split Editor & Classified Transaction Ledger */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="terminal-panel flex flex-col gap-2 rounded-md p-4 lg:col-span-5">
          <label
            htmlFor="raw-csv-editor"
            className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary"
          >
            {isId
              ? "Editor CSV Mentah (Tempel dari Mutasi Bank / Excel)"
              : "Raw CSV Buffer (Paste Bank Statement / Spreadsheet)"}
          </label>
          <textarea
            id="raw-csv-editor"
            rows={12}
            value={rawCsv}
            onChange={(e) => setRawCsv(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-obsidian p-3 font-mono text-[11px] leading-relaxed text-text-primary focus:border-cleared/60 focus:outline-none"
          />
        </div>

        <div className="terminal-panel overflow-hidden rounded-md lg:col-span-7">
          <div className="border-b border-hairline bg-obsidian px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary">
            {isId
              ? "Klasifikasi Otomatis Transaksi"
              : "Automated Transaction Classification"}
          </div>
          <div className="max-h-[340px] divide-y divide-hairline overflow-y-auto">
            {summary.rows.map((row) => {
              const badge = CATEGORY_BADGES[row.category];
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <span className="block truncate font-sans font-medium text-text-primary">
                      {row.description}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted">
                      {row.date}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "rounded-xs border px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase",
                        badge.cls
                      )}
                    >
                      {isId ? badge.labelId : badge.labelEn}
                    </span>
                    <span
                      className={cn(
                        "w-28 text-right font-mono font-semibold tabular-nums",
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
        </div>
      </div>
    </div>
  );
}
