"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const MethodologyGate3D = dynamic(
  () => import("@/components/sections/MethodologyGate3D"),
  {
    ssr: false,
    loading: () => (
      <div className="terminal-panel flex h-[280px] w-full items-center justify-center rounded-lg">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          MEMUAT VISUALISASI 3D GERBANG RISIKO...
        </span>
      </div>
    ),
  }
);

export function MethodologyHeaderClient() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-3 pb-4 sm:pt-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cleared sm:text-[11px]">
            {t("methodology_page.eyebrow")}
          </span>
          <h1 className="mt-2 max-w-3xl font-editorial text-2xl font-medium leading-[1.1] tracking-tight text-text-primary sm:text-4xl lg:text-[2.85rem]">
            {t("methodology_page.title")}
          </h1>
          <p className="editorial-measure mt-2.5 font-sans text-xs leading-relaxed text-text-secondary sm:text-sm">
            {t("methodology_page.subtitle")}
          </p>
        </div>

        <Link
          href="/terminal/audit"
          className="cta-primary-polish inline-flex min-h-[40px] w-fit shrink-0 items-center gap-2 rounded-sm bg-cleared px-4 font-mono text-xs font-semibold whitespace-nowrap uppercase tracking-wider text-on-cleared"
        >
          <span>{t("nav.open_terminal")}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>

      <MethodologyGate3D />
    </section>
  );
}
