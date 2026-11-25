import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="rounded-sm border border-conditional/45 bg-conditional/12 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-conditional">
        404 · HALAMAN TIDAK DITEMUKAN
      </span>
      <h1 className="font-editorial text-3xl font-medium text-text-primary">
        Rute Tidak Tersedia
      </h1>
      <p className="font-sans text-sm leading-relaxed text-text-secondary">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="cta-primary-polish inline-flex min-h-[40px] items-center rounded-md bg-cleared px-4 font-mono text-xs font-semibold uppercase tracking-wider text-on-cleared"
        >
          Beranda TesisLab
        </Link>
        <Link
          href="/terminal/audit"
          className="inline-flex min-h-[40px] items-center rounded-md border border-hairline bg-surface px-4 font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary"
        >
          Buka Terminal Audit
        </Link>
      </div>
    </main>
  );
}
