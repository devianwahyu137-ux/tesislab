"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useTranslation } from "@/context/LanguageContext";
import { decodeSharedDossier } from "@/lib/dossierShare";

export function PublicDossierClient() {
  const searchParams = useSearchParams();
  const { locale, t } = useTranslation();
  const isId = locale === "id";

  const token = searchParams.get("d");
  const dossier = decodeSharedDossier(token);

  if (!dossier) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-16 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-conditional">
          DOSSIER NOT FOUND OR INVALID LINK
        </span>
        <h1 className="font-editorial text-2xl font-medium text-text-primary sm:text-3xl">
          {isId
            ? "Tautan Dossier Audit Tidak Valid atau Terpotong."
            : "This Audit Dossier Link Is Invalid or Incomplete."}
        </h1>
        <Link
          href="/terminal/audit"
          className="cta-primary-polish inline-flex min-h-[42px] items-center gap-2 rounded-sm bg-cleared px-5 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared"
        >
          <span>{t("nav.open_terminal")}</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const statusKey = dossier.st.toLowerCase() as
    | "cleared"
    | "conditional"
    | "rejected";
  const gap = dossier.cv - dossier.sc;

  const handleCopyCurrentLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(
        isId ? "Tautan Dossier disalin!" : "Dossier URL copied to clipboard!"
      );
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6 sm:py-10">
      <div className="terminal-panel overflow-hidden rounded-md border-t-2 border-t-cleared p-5 sm:p-8">
        {/* Top Verification Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusStamp
              variant={dossier.st}
              label={t(`verdict.status.${statusKey}`)}
            />
            <span className="rounded-xs border border-hairline bg-obsidian px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider text-text-secondary">
              {t(`tracks.${dossier.tr}.name`)}
            </span>
            <span className="font-mono text-[10.5px] text-text-muted">
              REF: {dossier.id} · {dossier.ts}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleCopyCurrentLink()}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm border border-hairline bg-obsidian px-3 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary hover:border-cleared/50 hover:text-cleared"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isId ? "Salin Link" : "Copy Link"}</span>
          </button>
        </div>

        {/* Headline & Score */}
        <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <h1 className="max-w-2xl font-editorial text-2xl font-medium leading-[1.18] text-text-primary sm:text-3xl">
            {dossier.hl}
          </h1>

          <div className="shrink-0 font-mono tabular-nums sm:text-right">
            <span className="block text-[10px] uppercase tracking-widest text-text-muted">
              {t("form.score_label")}
            </span>
            <span className="text-4xl font-bold text-cleared sm:text-5xl">
              {dossier.sc}
            </span>
            <span className="text-sm text-text-muted">/100</span>
          </div>
        </div>

        {/* Key Telemetry Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-sm border border-hairline bg-obsidian p-4 font-mono text-xs tabular-nums sm:grid-cols-4">
          <div>
            <span className="block text-[10px] text-text-muted">
              {t("conviction.your_conviction")}
            </span>
            <span className="mt-0.5 block text-sm font-bold text-text-primary">
              {dossier.cv}%
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-text-muted">
              {t("live_preview.gap_label")}
            </span>
            <span className="mt-0.5 block text-sm font-bold text-conditional">
              {gap >= 0 ? `+${gap}%` : `${gap}%`}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-text-muted">
              Monte Carlo Ruin
            </span>
            <span className="mt-0.5 block text-sm font-bold text-rejected">
              {dossier.rn.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-text-muted">
              Hermes Regime
            </span>
            <span className="mt-0.5 block text-sm font-bold text-cleared">
              {dossier.rg}
            </span>
          </div>
        </div>

        {/* 3 Pre-Mortem Blind Spots */}
        <div className="mt-6">
          <span className="mb-3 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.15em] text-text-muted">
            {t("verdict.blind_spots_title")}
          </span>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {dossier.bs.map((spot, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1.5 rounded-sm border border-hairline bg-obsidian p-4"
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-conditional">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  <span>0{idx + 1}</span>
                </span>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {spot}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mandatory Mitigation */}
        <div className="mt-6 flex items-start gap-3 rounded-sm border border-cleared/40 bg-cleared/10 p-4">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
            aria-hidden="true"
          />
          <div>
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-cleared">
              {t("verdict.actionable_fix_title")}
            </span>
            <p className="mt-1 font-sans text-xs leading-relaxed text-text-primary sm:text-sm">
              {dossier.fx}
            </p>
          </div>
        </div>

        {/* Conversion CTA */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
          <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
            <ShieldCheck className="h-4 w-4 text-cleared" aria-hidden="true" />
            <span>
              {isId
                ? "Diverifikasi oleh Mesin Deterministik Decimal.js TesisLab"
                : "Verified by TesisLab Decimal.js Deterministic Engine"}
            </span>
          </div>

          <Link
            href={`/terminal/audit?track=${dossier.tr}`}
            className="cta-primary-polish inline-flex min-h-[40px] items-center gap-2 rounded-sm bg-cleared px-5 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared"
          >
            <span>
              {isId ? "Uji Rencana Anda Sendiri" : "Audit Your Own Plan"}
            </span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
