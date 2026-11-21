#!/usr/bin/env python3
"""
TesisLab Daily Macro Harvester (Zero-Dependency Standard Library).
Fetches public market indicators and RSS headlines, synthesizes a bilingual
macro regime summary (via Gemini/OpenRouter free tiers or deterministic rules),
and writes `data/market_context.json` with graceful degradation.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT_SEC = 10

INDICATORS_CONFIG: dict[str, dict[str, Any]] = {
    "USD_IDR": {"symbol": "IDR=X", "fallback_price": 15850.0, "fallback_change_pct": 0.0},
    "IHSG": {"symbol": "^JKSE", "fallback_price": 7200.0, "fallback_change_pct": 0.0},
    "GOLD_USD": {"symbol": "GC=F", "fallback_price": 2650.0, "fallback_change_pct": 0.0},
    "BTC_USD": {"symbol": "BTC-USD", "fallback_price": 85000.0, "fallback_change_pct": 0.0},
}

RSS_FEEDS = [
    "https://www.cnbcindonesia.com/market/rss",
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^JKSE,BTC-USD,GC=F&region=US&lang=en-US",
]

VALID_REGIMES = {"RISK_ON", "CAUTIOUS", "RISK_OFF"}


def http_get_text(url: str, headers: dict[str, str] | None = None) -> str:
    req_headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers, method="GET")
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as resp:
        return resp.read().decode("utf-8", errors="replace")


def http_post_json(
    url: str, payload: dict[str, Any], headers: dict[str, str] | None = None
) -> dict[str, Any]:
    req_headers = {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
    }
    if headers:
        req_headers.update(headers)
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=req_headers, method="POST")
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def fetch_yahoo_indicator(key: str, cfg: dict[str, Any]) -> dict[str, Any]:
    symbol = cfg["symbol"]
    encoded = urllib.parse.quote(symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?interval=1d&range=5d"

    try:
        raw = http_get_text(url, headers={"Accept": "application/json"})
        data = json.loads(raw)
        result = data["chart"]["result"][0]
        meta = result["meta"]
        price = float(meta["regularMarketPrice"])
        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose")

        if prev_close and float(prev_close) > 0:
            change_pct = ((price - float(prev_close)) / float(prev_close)) * 100.0
        else:
            closes = [
                c for c in result.get("indicators", {}).get("quote", [{}])[0].get("close", [])
                if c is not None
            ]
            if len(closes) >= 2 and closes[-2] > 0:
                change_pct = ((closes[-1] - closes[-2]) / closes[-2]) * 100.0
            else:
                change_pct = 0.0

        return {
            "symbol": symbol,
            "price": round(price, 2),
            "change_pct": round(change_pct, 2),
            "status": "live",
        }
    except Exception:
        return {
            "symbol": symbol,
            "price": cfg["fallback_price"],
            "change_pct": cfg["fallback_change_pct"],
            "status": "fallback",
        }


def fetch_rss_headlines(limit: int = 5) -> list[str]:
    headlines: list[str] = []
    for feed_url in RSS_FEEDS:
        if len(headlines) >= limit:
            break
        try:
            xml_text = http_get_text(feed_url)
            root = ET.fromstring(xml_text)
            for item in root.findall(".//item/title"):
                if item.text:
                    cleaned = re.sub(r"\s+", " ", item.text).strip()
                    if cleaned and cleaned not in headlines:
                        headlines.append(cleaned[:180])
                    if len(headlines) >= limit:
                        break
        except Exception:
            continue

    if not headlines:
        headlines.append("No live RSS headlines available; using baseline macro reference.")
    return headlines


def clamp_text(text: str, max_len: int) -> str:
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 3].rstrip() + "..."


def deterministic_synthesis(
    indicators: dict[str, dict[str, Any]],
) -> dict[str, str]:
    usd_idr = indicators["USD_IDR"]
    ihsg = indicators["IHSG"]
    gold = indicators["GOLD_USD"]
    btc = indicators["BTC_USD"]

    risk_off_signals = 0
    if ihsg["change_pct"] <= -1.0:
        risk_off_signals += 1
    if usd_idr["change_pct"] >= 0.5 or usd_idr["price"] >= 16200:
        risk_off_signals += 1
    if btc["change_pct"] <= -3.5:
        risk_off_signals += 1
    if gold["change_pct"] >= 1.2 and ihsg["change_pct"] < 0:
        risk_off_signals += 1

    if risk_off_signals >= 2:
        regime = "RISK_OFF"
    elif risk_off_signals == 1 or abs(btc["change_pct"]) >= 3.0:
        regime = "CAUTIOUS"
    else:
        regime = "RISK_ON"

    summary_id = clamp_text(
        f"USD/IDR di {usd_idr['price']:,.0f} ({usd_idr['change_pct']:+.2f}%), "
        f"IHSG {ihsg['price']:,.0f} ({ihsg['change_pct']:+.2f}%), "
        f"Emas ${gold['price']:,.0f} ({gold['change_pct']:+.2f}%), "
        f"BTC ${btc['price']:,.0f} ({btc['change_pct']:+.2f}%). Rezim pasar: {regime}.",
        220,
    )
    summary_en = clamp_text(
        f"USD/IDR at {usd_idr['price']:,.0f} ({usd_idr['change_pct']:+.2f}%), "
        f"IHSG {ihsg['price']:,.0f} ({ihsg['change_pct']:+.2f}%), "
        f"Gold ${gold['price']:,.0f} ({gold['change_pct']:+.2f}%), "
        f"BTC ${btc['price']:,.0f} ({btc['change_pct']:+.2f}%). Regime: {regime}.",
        220,
    )

    if regime == "RISK_OFF":
        alert_id = "Tekanan nilai tukar dan pelemahan ekuitas menuntut batas risiko lebih ketat dan cadangan likuiditas."
        alert_en = "Currency pressure and equity weakness warrant tighter risk limits and higher cash buffers."
    elif regime == "CAUTIOUS":
        alert_id = "Volatilitas lintas aset meningkat; hindari leverage berlebih dan verifikasi margin pengaman."
        alert_en = "Cross-asset volatility is elevated; avoid excess leverage and verify safety margins."
    else:
        alert_id = "Kondisi likuiditas relatif stabil; tetap disiplin pada rasio risiko dan batas dana darurat."
        alert_en = "Liquidity conditions appear stable; maintain strict risk sizing and emergency reserve discipline."

    return {
        "macro_regime": regime,
        "summary_id": summary_id,
        "summary_en": summary_en,
        "key_risk_alert_id": clamp_text(alert_id, 140),
        "key_risk_alert_en": clamp_text(alert_en, 140),
    }


def extract_json_object(raw_text: str) -> dict[str, Any]:
    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        raise ValueError("No JSON object found in LLM response")
    return json.loads(match.group(0))


def validate_synthesis(candidate: dict[str, Any]) -> dict[str, str]:
    regime = str(candidate.get("macro_regime", "")).upper().strip()
    if regime not in VALID_REGIMES:
        raise ValueError(f"Invalid macro_regime: {regime}")

    required = ("summary_id", "summary_en", "key_risk_alert_id", "key_risk_alert_en")
    for field in required:
        if not str(candidate.get(field, "")).strip():
            raise ValueError(f"Missing synthesis field: {field}")

    return {
        "macro_regime": regime,
        "summary_id": clamp_text(candidate["summary_id"], 220),
        "summary_en": clamp_text(candidate["summary_en"], 220),
        "key_risk_alert_id": clamp_text(candidate["key_risk_alert_id"], 140),
        "key_risk_alert_en": clamp_text(candidate["key_risk_alert_en"], 140),
    }


def synthesize_with_llm(
    indicators: dict[str, dict[str, Any]], headlines: list[str]
) -> dict[str, str] | None:
    prompt = (
        "Summarize today's macro context strictly from the provided numbers and headlines. "
        "Return ONLY valid JSON with keys: macro_regime ('RISK_ON'|'CAUTIOUS'|'RISK_OFF'), "
        "summary_id (<=220 chars, Indonesian), summary_en (<=220 chars, English), "
        "key_risk_alert_id (<=140 chars, Indonesian), key_risk_alert_en (<=140 chars, English).\n\n"
        f"Indicators: {json.dumps(indicators)}\n"
        f"Headlines: {json.dumps(headlines)}"
    )

    google_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if google_key:
        try:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-2.0-flash:generateContent?key={urllib.parse.quote(google_key)}"
            )
            res = http_post_json(
                url,
                {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                },
            )
            text = res["candidates"][0]["content"]["parts"][0]["text"]
            return validate_synthesis(extract_json_object(text))
        except Exception:
            pass

    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if openrouter_key:
        try:
            res = http_post_json(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{"role": "user", "content": prompt}],
                },
                headers={"Authorization": f"Bearer {openrouter_key}"},
            )
            text = res["choices"][0]["message"]["content"]
            return validate_synthesis(extract_json_object(text))
        except Exception:
            pass

    return None


def main() -> None:
    indicators = {
        key: fetch_yahoo_indicator(key, cfg) for key, cfg in INDICATORS_CONFIG.items()
    }
    headlines = fetch_rss_headlines(limit=5)

    live_count = sum(1 for v in indicators.values() if v["status"] == "live")
    source_status = "live" if live_count > 0 else "fallback"

    synthesis = synthesize_with_llm(indicators, headlines)
    if synthesis is None:
        synthesis = deterministic_synthesis(indicators)

    output = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source_status": source_status,
        "indicators": indicators,
        "headlines": headlines,
        "synthesis": synthesis,
    }

    repo_root = Path(__file__).resolve().parents[2]
    out_path = repo_root / "data" / "market_context.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Wrote {out_path} (source_status={source_status}, live_indicators={live_count}/4)")


if __name__ == "__main__":
    main()
