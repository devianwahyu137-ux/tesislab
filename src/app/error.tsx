"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="rounded-sm border border-rejected/45 bg-rejected/12 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-rejected">
        SYSTEM RECOVERY
      </span>
      <h1 className="font-editorial text-2xl font-medium text-text-primary sm:text-3xl">
        Terjadi Gangguan Saat Memuat Halaman
      </h1>
      <p className="font-sans text-sm leading-relaxed text-text-secondary">
        {error.message || "Komponen mengalami galat tak terduga."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={reset}
          className="cta-primary-polish inline-flex min-h-[40px] items-center rounded-md bg-cleared px-4 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared"
        >
          Coba Muat Ulang
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[40px] items-center rounded-md border border-hairline bg-surface px-4 font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
