"use client";

import { useTranslation } from "@/context/LanguageContext";

/**
 * Editorial Kinetic Manifesto Marquee breaking the visual monotony between
 * the interactive War-Room workspace and the lower methodology sections.
 */
export function KineticMarquee() {
  const { locale } = useTranslation();

  const phrases =
    locale === "en"
      ? [
          "MATH HOLDS SUPREME VETO",
          "STRESS-TEST BEFORE CAPITAL MOVES",
          "ZERO NUMERICAL HALLUCINATION",
          "1,000-PATH MONTE CARLO",
        ]
      : [
          "MATEMATIKA MEMEGANG VETO",
          "UJI SEBELUM MODAL KELUAR",
          "NOL HALUSINASI ANGKA",
          "MONTE CARLO 1.000 SKENARIO",
        ];

  return (
    <div
      aria-hidden="true"
      className="relative my-4 w-full overflow-hidden border-y border-hairline/80 bg-surface/50 py-3.5 select-none"
    >
      <div className="animate-marquee-scroll flex w-max items-center gap-8 whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center gap-8">
            {phrases.map((text, idx) => (
              <div key={`${dup}-${idx}`} className="flex items-center gap-8">
                <span
                  className={
                    idx % 2 === 0
                      ? "font-editorial text-2xl font-medium tracking-tight text-ink-primary sm:text-3xl"
                      : "font-editorial text-2xl font-medium italic tracking-tight text-ink-muted/45 sm:text-3xl"
                  }
                >
                  {text}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-cleared/70" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
