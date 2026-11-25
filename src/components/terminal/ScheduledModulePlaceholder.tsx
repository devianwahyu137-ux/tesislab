"use client";

import Link from "next/link";
import { ArrowUpRight, Layers } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export interface ScheduledModulePlaceholderProps {
  code: string;
  titleId: string;
  titleEn: string;
  summaryId: string;
  summaryEn: string;
  specs: readonly string[];
}

export function ScheduledModulePlaceholder({
  code,
  titleId,
  titleEn,
  summaryId,
  summaryEn,
  specs,
}: ScheduledModulePlaceholderProps) {
  const { locale, t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-5 sm:p-8">
      <div className="terminal-panel flex flex-col gap-4 rounded-md p-6">
        <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-conditional">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {code} · {t("terminal.upcoming_sprint_tag")}
            </span>
          </span>
          <span className="rounded-xs border border-hairline bg-obsidian px-2 py-0.5 font-mono text-[10px] text-text-muted">
            TERMINAL LAB
          </span>
        </div>

        <h2 className="font-editorial text-2xl font-medium text-text-primary sm:text-3xl">
          {locale === "id" ? titleId : titleEn}
        </h2>

        <p className="editorial-measure font-sans text-sm leading-relaxed text-text-secondary">
          {locale === "id" ? summaryId : summaryEn}
        </p>

        <ul className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
          {specs.map((spec) => (
            <li
              key={spec}
              className="rounded-sm border border-hairline bg-obsidian px-3 py-2 font-mono text-[11px] text-text-secondary"
            >
              {spec}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 border-t border-hairline pt-4">
          <Link
            href="/terminal/audit"
            className="cta-primary-polish inline-flex min-h-[38px] items-center gap-2 rounded-sm bg-cleared px-4 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared"
          >
            <span>{t("terminal.nav_audit")}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
