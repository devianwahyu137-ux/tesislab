import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicDossierClient } from "@/components/dossier/PublicDossierClient";
import { decodeSharedDossier } from "@/lib/dossierShare";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const token = params.d ?? "";
  const dossier = decodeSharedDossier(token);

  const title = dossier
    ? `${dossier.id} (${dossier.sc}/100 · ${dossier.st}) — TesisLab Dossier`
    : "TesisLab — Shared Pre-Mortem Audit Dossier";
  const description =
    dossier?.hl ??
    "Deterministic Pre-Mortem financial risk audit and 3-division veto dossier.";
  const ogUrl = token
    ? `/api/og?d=${encodeURIComponent(token)}`
    : "/api/og";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function SharedDossierPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-text-muted">
          VERIFYING SHARED DOSSIER PAYLOAD...
        </div>
      }
    >
      <PublicDossierClient />
    </Suspense>
  );
}
