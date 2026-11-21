"use client";

import { useTranslation } from "@/context/LanguageContext";

function TerminalChrome({
  filename,
  children,
}: {
  filename: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-active-border/80 bg-surface shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-hairline bg-obsidian px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-rejected/55" />
          <span className="h-2 w-2 rounded-full bg-conditional/55" />
          <span className="h-2 w-2 rounded-full bg-cleared/55" />
        </div>
        <span className="font-mono text-[10px] tracking-wider text-text-muted">
          {filename}
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

/**
 * 4-Step Alternating Zig-Zag Product Walkthrough (#cara-kerja)
 * showcasing deterministic math, Hermes macro radar, Pre-Mortem diff, and bias mirror.
 */
export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section
      id="cara-kerja"
      className="mx-auto mt-8 w-full max-w-5xl rounded-sm border border-hairline bg-surface/85 p-5 backdrop-blur-xs md:mt-12 md:p-8 lg:p-10"
    >
      {/* Centered Editorial Header */}
      <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center md:mb-14">
        <span className="mb-3 inline-flex items-center rounded-full border border-active-border bg-obsidian/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
          {t("how_it_works.eyebrow")}
        </span>
        <h2 className="font-editorial text-3xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-4xl">
          {t("how_it_works.title")}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          {t("how_it_works.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-12 md:gap-16">
        {/* Step 01: Text Left, Terminal Mockup Right */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-cleared">01</span>
              <span className="rounded-xs border border-cleared/35 bg-cleared/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cleared">
                {t("how_it_works.step1.badge")}
              </span>
            </div>
            <h3 className="font-editorial text-2xl font-medium text-text-primary">
              {t("how_it_works.step1.title")}
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              {t("how_it_works.step1.body")}
            </p>
          </div>

          <div className="lg:col-span-7">
            <TerminalChrome filename={t("how_it_works.step1.terminal_file")}>
              <div className="flex flex-col gap-2.5 font-mono text-xs tabular-nums">
                <div className="flex items-center justify-between border-b border-hairline pb-2 text-[11px] text-text-muted">
                  <span>EXECUTION: PURE_TS_ENGINE</span>
                  <span className="text-cleared">0.84 ms</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xs border border-hairline bg-obsidian p-2.5">
                    <span className="block text-[10px] text-text-muted">BEP UNITS</span>
                    <span className="mt-1 block text-sm font-semibold text-text-primary">224 / mo</span>
                  </div>
                  <div className="rounded-xs border border-hairline bg-obsidian p-2.5">
                    <span className="block text-[10px] text-text-muted">RUNWAY (50%)</span>
                    <span className="mt-1 block text-sm font-semibold text-conditional">3.9 MO</span>
                  </div>
                  <div className="col-span-2 rounded-xs border border-hairline bg-obsidian p-2.5 sm:col-span-1">
                    <span className="block text-[10px] text-text-muted">SCORE LOCK</span>
                    <span className="mt-1 block text-sm font-semibold text-rejected">50 / 100</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="rounded-xs border border-rejected/40 bg-rejected/10 px-2 py-0.5 text-[10px] font-semibold text-rejected">
                    FLAG: BELOW_BEP_TARGET
                  </span>
                  <span className="rounded-xs border border-conditional/40 bg-conditional/10 px-2 py-0.5 text-[10px] font-semibold text-conditional">
                    FLAG: FRAGILE_RUNWAY
                  </span>
                </div>
              </div>
            </TerminalChrome>
          </div>
        </div>

        {/* Step 02: Terminal Mockup Left, Text Right */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <TerminalChrome filename={t("how_it_works.step2.terminal_file")}>
              <div className="flex flex-col gap-3 font-mono text-xs tabular-nums">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">BRANCH: data-feed · CRON 00:00 UTC</span>
                  <span className="rounded-xs border border-rejected/40 bg-rejected/10 px-2 py-0.5 text-[10px] font-semibold text-rejected">
                    RISK_OFF
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: "USD/IDR", v: "Rp 18,263", c: "+0.00%", tone: "text-text-muted" },
                    { k: "IHSG", v: "5,146.33", c: "-0.92%", tone: "text-rejected" },
                    { k: "GOLD", v: "$3,539", c: "+0.00%", tone: "text-text-muted" },
                    { k: "BTC", v: "$57,932", c: "-6.33%", tone: "text-rejected" },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between rounded-xs border border-hairline bg-obsidian px-3 py-2"
                    >
                      <span className="text-[10px] text-text-muted">{row.k}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-text-primary">{row.v}</span>
                        <span className={`text-[10px] ${row.tone}`}>{row.c}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TerminalChrome>
          </div>

          <div className="order-1 flex flex-col gap-3 lg:order-2 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-conditional">02</span>
              <span className="rounded-xs border border-conditional/35 bg-conditional/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-conditional">
                {t("how_it_works.step2.badge")}
              </span>
            </div>
            <h3 className="font-editorial text-2xl font-medium text-text-primary">
              {t("how_it_works.step2.title")}
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              {t("how_it_works.step2.body")}
            </p>
          </div>
        </div>

        {/* Step 03: Text Left, Contrast Terminal Right */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-rejected">03</span>
              <span className="rounded-xs border border-rejected/35 bg-rejected/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-rejected">
                {t("how_it_works.step3.badge")}
              </span>
            </div>
            <h3 className="font-editorial text-2xl font-medium text-text-primary">
              {t("how_it_works.step3.title")}
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              {t("how_it_works.step3.body")}
            </p>
          </div>

          <div className="lg:col-span-7">
            <TerminalChrome filename={t("how_it_works.step3.terminal_file")}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xs border border-hairline bg-obsidian/70 p-3.5">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {t("how_it_works.step3.left_label")}
                  </span>
                  <p className="font-sans text-xs leading-relaxed text-text-muted">
                    {t("how_it_works.step3.left_text")}
                  </p>
                </div>
                <div className="rounded-xs border border-rejected/45 bg-rejected/8 p-3.5">
                  <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-wider text-rejected">
                    {t("how_it_works.step3.right_label")}
                  </span>
                  <p className="font-sans text-xs leading-relaxed text-text-primary">
                    {t("how_it_works.step3.right_text")}
                  </p>
                </div>
              </div>
            </TerminalChrome>
          </div>
        </div>

        {/* Step 04: Mirror + Slider Mockup Left, Text Right */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <TerminalChrome filename={t("how_it_works.step4.terminal_file")}>
              <div className="flex flex-col gap-4 font-mono text-xs tabular-nums">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-text-muted">CONVICTION VS. REALITY</span>
                  <span className="rounded-xs border border-rejected/50 bg-rejected/10 px-2 py-0.5 text-[10px] font-semibold text-rejected">
                    {t("how_it_works.step4.bias_tag")}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-secondary">
                      {t("how_it_works.step4.conviction_bar")}
                    </span>
                    <span className="text-text-primary">85%</span>
                  </div>
                  <div className="h-2 w-full rounded-xs bg-surface">
                    <div className="h-full w-[85%] rounded-xs bg-ink-secondary" />
                  </div>

                  <div className="mt-1 flex justify-between text-[11px]">
                    <span className="text-text-secondary">
                      {t("how_it_works.step4.resilience_bar")}
                    </span>
                    <span className="text-rejected">42%</span>
                  </div>
                  <div className="h-2 w-full rounded-xs bg-surface">
                    <div className="h-full w-[42%] rounded-xs bg-rejected" />
                  </div>
                </div>

                <div className="rounded-xs border border-hairline bg-obsidian p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px]">
                    <span className="text-text-muted">
                      {t("how_it_works.step4.slider_label")}
                    </span>
                    <span className="font-semibold text-conditional">-35%</span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-xs bg-surface">
                    <div className="h-full w-[58%] rounded-xs bg-cleared" />
                    <span className="absolute left-[58%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-obsidian bg-cleared" />
                  </div>
                </div>
              </div>
            </TerminalChrome>
          </div>

          <div className="order-1 flex flex-col gap-3 lg:order-2 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-cleared">04</span>
              <span className="rounded-xs border border-cleared/35 bg-cleared/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cleared">
                {t("how_it_works.step4.badge")}
              </span>
            </div>
            <h3 className="font-editorial text-2xl font-medium text-text-primary">
              {t("how_it_works.step4.title")}
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              {t("how_it_works.step4.body")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
