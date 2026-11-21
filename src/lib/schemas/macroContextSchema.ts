import { z } from "zod";

export const MacroRegimeSchema = z.enum(["RISK_ON", "CAUTIOUS", "RISK_OFF"]);
export type MacroRegime = z.infer<typeof MacroRegimeSchema>;

export const SourceStatusSchema = z.enum(["live", "partial", "fallback"]);
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

export const IndicatorSnapshotSchema = z.object({
  symbol: z.string().min(1),
  price: z.number().finite(),
  change_pct: z.number().finite(),
  status: z.enum(["live", "fallback"]),
  source: z.string().min(1).optional(),
});
export type IndicatorSnapshot = z.infer<typeof IndicatorSnapshotSchema>;

export const MacroSynthesisSchema = z.object({
  macro_regime: MacroRegimeSchema,
  summary_id: z.string().min(1),
  summary_en: z.string().min(1),
  key_risk_alert_id: z.string().min(1),
  key_risk_alert_en: z.string().min(1),
});

export const MarketContextSchema = z.object({
  updated_at: z.string().min(1),
  source_status: SourceStatusSchema,
  indicators: z.object({
    USD_IDR: IndicatorSnapshotSchema,
    IHSG: IndicatorSnapshotSchema,
    GOLD_USD: IndicatorSnapshotSchema,
    BTC_USD: IndicatorSnapshotSchema,
  }),
  headlines: z.array(z.string()),
  synthesis: MacroSynthesisSchema,
});

export type MarketContext = z.infer<typeof MarketContextSchema>;
