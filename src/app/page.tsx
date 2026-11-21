"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/context/LanguageContext";

export default function Home() {
  const { locale, t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col justify-between bg-[#0B0D10] px-6 py-8 text-zinc-100 md:px-12">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between border-b border-[#1E242B] pb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
            TesisLab // i18n
          </span>
          <span className="border border-[#1E242B] bg-[#12161B] px-2 py-0.5 font-mono text-[11px] uppercase text-emerald-400">
            {t("nav.macro_status")}: {locale.toUpperCase()}
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="mx-auto my-12 w-full max-w-4xl border border-[#1E242B] bg-[#12161B] p-8 md:p-12">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
          {t("meta.title")}
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
          {t("hero.headline")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
          {t("hero.subheadline")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="inline-flex min-h-[44px] items-center border border-emerald-500/40 bg-emerald-500/10 px-5 font-mono text-xs uppercase tracking-wider text-emerald-300">
            {t("hero.cta_primary")}
          </span>
          <span className="inline-flex min-h-[44px] items-center border border-[#1E242B] bg-[#0B0D10] px-5 font-mono text-xs uppercase tracking-wider text-zinc-300">
            {t("hero.cta_demo")}
          </span>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-4xl border-t border-[#1E242B] pt-6">
        <p className="font-mono text-xs leading-relaxed text-zinc-500">
          {t("verdict.disclaimer")}
        </p>
      </footer>
    </main>
  );
}
