import { describe, expect, it } from "vitest";
import { decodeSharedDossier, encodeSharedDossier } from "@/lib/dossierShare";
import { analyzeFinancialCsv } from "@/lib/csvAnalyzer";
import {
  checkAuditRateLimit,
  checkMarketApiRateLimit,
  extractClientIp,
} from "@/lib/rateLimit";

describe("Security Rate Limiters & IP Extraction", () => {
  it("extracts client IP from x-forwarded-for or falls back cleanly", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    expect(extractClientIp(req)).toBe("203.0.113.10");

    const localReq = new Request("https://example.com");
    expect(extractClientIp(localReq)).toBe("local-dev");
  });

  it("enforces per-minute audit rate limit (10 req/min)", () => {
    const ip = `audit-test-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      expect(checkAuditRateLimit(ip).allowed).toBe(true);
    }
    const blocked = checkAuditRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it("enforces per-minute market proxy rate limit (60 req/min)", () => {
    const ip = `market-test-${Date.now()}`;
    for (let i = 0; i < 60; i++) {
      expect(checkMarketApiRateLimit(ip).allowed).toBe(true);
    }
    const blocked = checkMarketApiRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
  });
});

describe("Dossier Share & CSV Edge Cases", () => {
  it("rejects malformed or tampered dossier tokens safely", () => {
    expect(decodeSharedDossier(null)).toBeNull();
    expect(decodeSharedDossier("")).toBeNull();
    expect(decodeSharedDossier("corrupted-invalid-lzstring-payload")).toBeNull();

    const valid = encodeSharedDossier({
      audit_id: "TL-TEST-01",
      track: "trading",
      verdict_status: "CLEARED",
      score: 85,
      submitted_conviction: 80,
      ruin_probability_pct: 4.5,
      p5_ending_value: 92_000_000,
      macro_regime: "CAUTIOUS",
      headline_verdict: "Test verdict",
      blind_spots: ["Gap down", "Sector overlap", "Liquidity"],
      actionable_fix: "Keep stop-loss active.",
      timestamp: "2026-11-26T00:00:00Z",
    });
    expect(decodeSharedDossier(valid)?.id).toBe("TL-TEST-01");
  });

  it("handles empty or malformed CSV input without throwing", () => {
    const empty = analyzeFinancialCsv("");
    expect(empty.rows.length).toBe(0);
    expect(empty.totalInflow).toBe(0);

    const malformed = analyzeFinancialCsv("col1,col2\nfoo,bar\n");
    expect(malformed.rows.length).toBe(0);
  });
});
