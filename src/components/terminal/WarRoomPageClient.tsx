"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  Play,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { VirtualWarRoomOffice } from "@/components/office/VirtualWarRoomOffice";
import type {
  OfficeCommandEvent,
  OfficeInteractionId,
} from "@/components/office/WarRoom3DCanvas";
import { SpotlightCard, type SpotlightTone } from "@/components/ui/SpotlightCard";
import { StatusStamp } from "@/components/ui/StatusStamp";
import { useAuditUI } from "@/context/AuditUIContext";
import { useTranslation } from "@/context/LanguageContext";
import { getDemoPresetByTrack } from "@/lib/agents/demoPresets";
import type { CommitteeAuditResponse } from "@/lib/agents/orchestrator";
import type { MacroFeedOrigin } from "@/lib/macroFeed";
import type { MarketContext } from "@/lib/schemas/macroContextSchema";
import type { AuditTrack } from "@/lib/schemas/verdictSchema";
import { cn } from "@/lib/utils";

const PRESET_MAP: Record<AuditTrack, string> = {
  trading: "demo_trading_bbca",
  business: "demo_business_batik",
  cashflow: "demo_cashflow_gadget",
};

interface InterrogationCase {
  id: string;
  track: AuditTrack;
  officeAction: OfficeInteractionId;
  questionId: string;
  questionEn: string;
  quantReplyId: string;
  quantReplyEn: string;
  riskReplyId: string;
  riskReplyEn: string;
  chairReplyId: string;
  chairReplyEn: string;
  prefill: Record<string, unknown>;
}

const INTERROGATION_CASES: readonly InterrogationCase[] = [
  {
    id: "idr-shock",
    track: "trading",
    officeAction: "wall_screen",
    questionId: "Apa dampak koreksi tajam IHSG & pelemahan Rupiah ke posisi saham saya?",
    questionEn: "How does an IDX sell-off & IDR volatility impact my stock setup?",
    quantReplyId:
      "Rentang ATR-14 harian saham perbankan melebar ~1,4× saat asing keluar. Stop-Loss di bawah 1,5× ATR memiliki peluang >62% tersapu ekor candle.",
    quantReplyEn:
      "Daily ATR-14 widens ~1.4x during foreign outflows. Stops narrower than 1.5x ATR face a >62% noise stop-out probability.",
    riskReplyId:
      "Masuk 40% modal sekaligus saat pasar RISK_OFF memicu asimetri buruk: dua kali gagal berturut-turut langsung menggerus psikologi eksekusi.",
    riskReplyEn:
      "Deploying 40% capital in RISK_OFF creates severe drawdown asymmetry on back-to-back stop-outs.",
    chairReplyId:
      "Putusan: Potong ukuran posisi ke batas risiko <= 1,5% modal dan lebarkan R:R bersih minimal 1 : 2,0 sebelum eksekusi.",
    chairReplyEn:
      "Ruling: Cut position size to <= 1.5% capital risk and require Net R:R >= 1:2.0 before execution.",
    prefill: {
      asset_symbol: "BBCA.JK",
      direction: "LONG",
      total_capital: 40_000_000,
      position_size_pct: 22,
      entry_price: 9_100,
      take_profit: 9_850,
      stop_loss: 8_730,
      round_trip_fee_pct: 0.4,
      rationale: "Uji ketahanan posisi saat volatilitas IHSG meningkat.",
    },
  },
  {
    id: "umkm-rampup",
    track: "business",
    officeAction: "whiteboard",
    questionId: "Bagaimana jika 3 bulan pertama buka ruko ternyata pembeli sepi 50%?",
    questionEn: "What happens if opening 3-month foot traffic is 50% below target?",
    quantReplyId:
      "Dengan sewa tetap Rp14,5 Jt/bulan dan komisi aplikasi 18%, titik impas (BEP) naik tajam sehingga kas defisit sejak hari pertama.",
    quantReplyEn:
      "With Rp14.5M fixed rent and 18% app commission, unit BEP spikes and triggers immediate monthly cash burn.",
    riskReplyId:
      "38% usaha ritel baru tutup di bulan ke-4 karena seluruh modal habis dipakai renovasi awal tanpa menyisakan bantalan kas masa sepi.",
    riskReplyEn:
      "38% of new retail ventures fail by month 4 because renovation capex leaves zero buffer for slow ramp-up.",
    chairReplyId:
      "Putusan: Wajib siapkan cadangan kas operasional minimal 6 bulan beban tetap atau mulai dari skema sewa ringan / cloud kitchen.",
    chairReplyEn:
      "Ruling: Lock >= 6 months fixed-overhead reserve or start with a low-rent cloud kitchen model.",
    prefill: {
      initial_capital: 55_000_000,
      monthly_fixed_cost: 14_500_000,
      selling_price: 35_000,
      unit_cogs: 15_000,
      target_monthly_units: 900,
      platform_commission_pct: 18,
      include_umkm_tax: true,
      business_concept: "Simulasi Ruko Kuliner Masa Ramp-Up 3 Bulan Awal",
    },
  },
  {
    id: "paylater-trap",
    track: "cashflow",
    officeAction: "meeting_table",
    questionId: "Seberapa berbahaya cicilan PayLater bunga flat 1,75%/bulan bagi gaji saya?",
    questionEn: "How dangerous is a 1.75%/month flat-rate PayLater loan on my salary?",
    quantReplyId:
      "Bunga flat 1,75%/bulan selama 12 bulan setara dengan Bunga Efektif Tahunan (APR) ~37,1%/tahun—lebih dari 3× lipat bunga kredit bank sehat.",
    quantReplyEn:
      "1.75%/mo flat over 12 months equals ~37.1% True Effective APR—more than 3x standard bank financing.",
    riskReplyId:
      "Jika digabung cicilan lama, Total DSR menembus >34% gaji bersih (melewati batas sehat 30% OJK), menyisakan ruang darurat yang sangat rapuh.",
    riskReplyEn:
      "Combined with existing obligations, Total DSR breaches OJK's 30% safe cap, leaving fragile shock capacity.",
    chairReplyId:
      "Putusan: Tunda pembelian kredit berbunga flat tinggi atau gunakan DP tunai agar porsi cicilan total terkunci <= 25% gaji.",
    chairReplyEn:
      "Ruling: Reject high flat-rate credit or increase down-payment until combined DSR sits <= 25%.",
    prefill: {
      monthly_net_income: 12_500_000,
      current_monthly_expenses: 7_200_000,
      existing_debt_installment: 1_800_000,
      new_monthly_installment: 2_450_000,
      installment_months: 12,
      flat_interest_pct_per_month: 1.75,
      liquid_emergency_fund: 15_000_000,
      decision_purpose: "Audit Beban Bunga Efektif PayLater 1,75%/Bln",
    },
  },
];

export interface WarRoomPageClientProps {
  macroContext: MarketContext;
  macroOrigin: MacroFeedOrigin;
}

export function WarRoomPageClient({
  macroContext,
  macroOrigin,
}: WarRoomPageClientProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const {
    activeTrack,
    setActiveTrack,
    auditPhase,
    setAuditPhase,
    setActiveAgent,
    auditResponse,
    agentSnippets,
    setAuditOutcome,
    queuePrefillInput,
  } = useAuditUI();

  const [isConvening, setIsConvening] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    INTERROGATION_CASES[0]!.id
  );
  const [replyMode, setReplyMode] = useState<"interrogation" | "verdict">(
    () => (auditResponse ? "verdict" : "interrogation")
  );
  const [officeCmdOverride, setOfficeCmdOverride] =
    useState<OfficeCommandEvent | null>(null);

  const isId = locale === "id";

  const activeCase =
    INTERROGATION_CASES.find((c) => c.id === selectedQuestionId) ??
    INTERROGATION_CASES[0]!;

  const handleSelectInterrogation = (item: InterrogationCase) => {
    setSelectedQuestionId(item.id);
    setReplyMode("interrogation");
    setActiveTrack(item.track);
    setOfficeCmdOverride((prev) => ({
      interaction: item.officeAction,
      nonce: (prev?.nonce ?? 100) + 1,
    }));
  };

  const handleConveneHearing = async (trackOverride?: AuditTrack) => {
    const targetTrack = trackOverride ?? activeTrack;
    setActiveTrack(targetTrack);
    setIsConvening(true);
    setAuditPhase("scanning");
    setActiveAgent("data_analyst");
    setOfficeCmdOverride((prev) => ({
      interaction: "meeting_table",
      nonce: (prev?.nonce ?? 100) + 1,
    }));

    const t1 = setTimeout(() => {
      setAuditPhase("debating");
      setActiveAgent("risk_manager");
    }, 550);

    try {
      const preset = getDemoPresetByTrack(targetTrack);
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "demo",
          preset_id: PRESET_MAP[targetTrack],
          track: targetTrack,
          locale,
          input: preset.input,
        }),
      });
      const data = (await res.json()) as CommitteeAuditResponse;
      clearTimeout(t1);
      if (res.ok && "verdict" in data) {
        setAuditOutcome(data, data.resolved_input, targetTrack, 80);
        setReplyMode("verdict");
        toast.success(t("toast.audit_done"));
      }
    } catch {
      clearTimeout(t1);
      setAuditPhase("idle");
      setActiveAgent(null);
    } finally {
      setIsConvening(false);
    }
  };

  const handleOpenCaseInWorkstation = (item: InterrogationCase) => {
    queuePrefillInput(item.track, item.prefill);
    router.push(`/terminal/audit?track=${item.track}`);
  };

  const roles: readonly {
    role: "data_analyst" | "risk_manager" | "committee_chair";
    code: string;
    tone: SpotlightTone;
    interrogationText: string;
  }[] = [
    {
      role: "data_analyst",
      code: "DIV-01 · QUANT",
      tone: "emerald",
      interrogationText: isId
        ? activeCase.quantReplyId
        : activeCase.quantReplyEn,
    },
    {
      role: "risk_manager",
      code: "DIV-02 · PRE-MORTEM",
      tone: "amber",
      interrogationText: isId ? activeCase.riskReplyId : activeCase.riskReplyEn,
    },
    {
      role: "committee_chair",
      code: "DIV-03 · PUTUSAN",
      tone: "sky",
      interrogationText: isId
        ? activeCase.chairReplyId
        : activeCase.chairReplyEn,
    },
  ];

  const statusKey = (
    auditResponse?.verdict.verdict_status ?? "CONDITIONAL"
  ).toLowerCase() as "cleared" | "conditional" | "rejected";

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Top Hearing Command Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cleared/40 bg-cleared/12 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-cleared">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("office.hud_label")}</span>
          </span>
          <h2 className="mt-2.5 font-editorial text-2xl font-medium text-text-primary sm:text-4xl">
            {t("agents.chamber_title")}
          </h2>
          <p className="mt-1.5 max-w-2xl font-sans text-[13.5px] leading-relaxed text-text-secondary sm:text-[15px]">
            {isId
              ? "Inspeksi ruang kerja 3D keempat agen secara langsung, panggil rapat sidang simulasi, atau uji pertanyaan kritis finansial di meja interogasi bawah."
              : "Inspect the live 3D studio of all four agents, convene an instant committee huddle, or run interactive stress cross-examinations below."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:shrink-0">
          <div className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-hairline bg-obsidian p-1">
            {(["trading", "business", "cashflow"] as const).map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => void handleConveneHearing(tr)}
                disabled={isConvening}
                className={cn(
                  "min-h-[34px] rounded-md px-2.5 font-sans text-xs font-semibold whitespace-nowrap transition-colors",
                  activeTrack === tr
                    ? "bg-cleared/16 text-cleared"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {tr === "trading"
                  ? "Trading"
                  : tr === "business"
                    ? "UMKM"
                    : "Cashflow"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleConveneHearing()}
            disabled={isConvening}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-cleared/50 bg-cleared/14 px-3.5 font-sans text-xs font-bold whitespace-nowrap text-cleared transition-colors hover:bg-cleared/22 disabled:opacity-60 sm:text-[13px]"
          >
            {isConvening ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            )}
            <span>
              {isId ? "Panggil Sidang Live" : "Convene Live Hearing"}
            </span>
          </button>

          <Link
            href={`/terminal/audit?track=${activeTrack}`}
            className="cta-primary-polish inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-cleared px-3.5 font-sans text-xs font-bold whitespace-nowrap text-on-cleared sm:text-[13px]"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>{t("terminal.nav_audit")}</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Full-Frame Interactive 3D War-Room Studio */}
      <SpotlightCard tone="emerald" className="overflow-hidden">
        <VirtualWarRoomOffice
          macroContext={macroContext}
          macroOrigin={macroOrigin}
          externalCommandOverride={officeCmdOverride}
        />
      </SpotlightCard>

      {/* Interactive Cross-Examination Console ("Meja Interogasi Komite 1-Klik") */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquareWarning
                className="h-4 w-4 text-conditional"
                aria-hidden="true"
              />
              <h3 className="font-sans text-base font-bold text-text-primary sm:text-lg">
                {isId
                  ? "Meja Uji Silang Komite — Pilih Pertanyaan Kritis (1-Klik)"
                  : "Interactive Committee Cross-Examination (1-Click)"}
              </h3>
            </div>
            <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
              {isId
                ? "Klik salah satu skenario tekanan di bawah untuk menggerakkan agen di ruang 3D dan membaca jawaban tajam tiap divisi."
                : "Select any real-world stress prompt below to animate the 3D agents and read each division's quantitative response."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCaseInWorkstation(activeCase)}
            className="inline-flex min-h-[38px] w-fit items-center gap-1.5 rounded-lg border border-cleared/45 bg-cleared/12 px-3.5 font-sans text-xs font-bold text-cleared transition-colors hover:bg-cleared/20"
          >
            <span>
              {isId
                ? "Uji Angka Kasus Ini di Workstation"
                : "Load Case into Audit Workstation"}
            </span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* 3 Clickable Stress Interrogation Prompts */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {INTERROGATION_CASES.map((item) => {
            const isSelected = item.id === activeCase.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectInterrogation(item)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
                  isSelected
                    ? "border-cleared/60 bg-cleared/12 shadow-[0_0_24px_-8px_rgba(16,185,129,0.4)]"
                    : "border-hairline bg-surface/80 hover:border-active-border"
                )}
              >
                <span className="rounded-sm border border-hairline bg-obsidian px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase text-cleared">
                  {item.track}
                </span>
                <span className="font-sans text-[13.5px] font-semibold leading-snug text-text-primary">
                  {isId ? item.questionId : item.questionEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3 Luminous Division Deliberation Cards */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {replyMode === "verdict" && auditResponse
              ? isId
                ? `MENAMPILKAN PUTUSAN SIDANG AKTIF (${auditResponse.verdict.audit_id})`
                : `SHOWING ACTIVE HEARING VERDICT (${auditResponse.verdict.audit_id})`
              : isId
                ? `MENJAWAB PERTANYAAN UJI SILANG (${activeCase.track.toUpperCase()})`
                : `ANSWERING CROSS-EXAMINATION (${activeCase.track.toUpperCase()})`}
          </span>

          {auditResponse && (
            <div className="inline-flex items-center gap-1 rounded-md border border-hairline bg-obsidian p-0.5">
              <button
                type="button"
                onClick={() => setReplyMode("interrogation")}
                className={cn(
                  "rounded-xs px-2.5 py-1 font-sans text-[11px] font-semibold transition-colors",
                  replyMode === "interrogation"
                    ? "bg-cleared/16 text-cleared"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {isId ? "Jawaban Uji Silang" : "Cross-Exam Reply"}
              </button>
              <button
                type="button"
                onClick={() => setReplyMode("verdict")}
                className={cn(
                  "rounded-xs px-2.5 py-1 font-sans text-[11px] font-semibold transition-colors",
                  replyMode === "verdict"
                    ? "bg-cleared/16 text-cleared"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {isId ? "Putusan Sidang Aktif" : "Active Hearing"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {roles.map(({ role, code, tone, interrogationText }) => {
            const liveText =
              replyMode === "verdict" && auditResponse
                ? auditResponse.verdict.agent_deliberation[role]
                : replyMode === "interrogation"
                  ? interrogationText
                  : agentSnippets[role] ?? interrogationText;
            return (
              <SpotlightCard
                key={role}
                tone={tone}
                className="gap-3.5 p-5"
              >
                <div className="flex items-center gap-3 border-b border-hairline pb-3">
                  <AgentAvatar
                    role={role}
                    phase={auditPhase}
                    isActive
                    size={40}
                  />
                  <div>
                    <span className="block font-mono text-[11px] font-bold tracking-wider text-cleared">
                      {code}
                    </span>
                    <h4 className="font-sans text-sm font-bold text-text-primary">
                      {t(`agents.roles.${role}.name`)}
                    </h4>
                  </div>
                </div>
                <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
                  {liveText}
                </p>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* Active Chamber Dossier Summary when a Hearing Verdict is Present */}
      {auditResponse && (
        <SpotlightCard tone="emerald" className="gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
            <div>
              <span className="font-mono text-xs font-semibold text-cleared">
                BERKAS SIDANG AKTIF · {auditResponse.verdict.audit_id}
              </span>
              <h3 className="mt-1 font-editorial text-xl font-medium text-text-primary sm:text-2xl">
                {auditResponse.verdict.headline_verdict}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-bold tabular-nums text-cleared text-glow-emerald">
                {auditResponse.verdict.score}/100
              </span>
              <StatusStamp
                variant={auditResponse.verdict.verdict_status}
                label={t(`verdict.status.${statusKey}`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {auditResponse.verdict.premortem_blind_spots.map((spot, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-lg border border-hairline bg-obsidian/90 p-4"
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-conditional">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>TITIK BUTA 0{idx + 1}</span>
                </span>
                <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
                  {spot}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cleared/45 bg-cleared/12 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-cleared"
                aria-hidden="true"
              />
              <p className="font-sans text-[13.5px] font-medium leading-relaxed text-text-primary">
                {auditResponse.verdict.actionable_fix}
              </p>
            </div>
            <Link
              href={`/terminal/audit?track=${activeTrack}`}
              className="cta-primary-polish inline-flex min-h-[38px] items-center gap-1.5 rounded-md bg-cleared px-4 font-sans text-xs font-bold whitespace-nowrap text-on-cleared"
            >
              <span>
                {isId ? "Buka di Workstation Audit" : "Open in Audit Workstation"}
              </span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </SpotlightCard>
      )}
    </div>
  );
}
