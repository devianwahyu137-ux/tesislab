#!/usr/bin/env python3
"""
TesisLab Daily Macro Harvester (Zero-Dependency Standard Library).
Multi-source public market indicator fetcher with graceful degradation,
RSS headline collector, and bilingual macro synthesis into data/market_context.json.
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
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT_SEC = 8

RSS_FEEDS = [
    "https://www.cnbcindonesia.com/market/rss",
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^JKSE,BTC-USD,GC=F&region=US&lang=en-US",
]

VALID_REGIMES = {"RISK_ON", "CAUTIOUS", "RISK_OFF"}


def load_dotenv_local(repo_root: Path) -> None:
    """Load key=value pairs from .env.local into os.environ without overwriting existing vars."""
    env_path = repo_root / ".env.local"
    if not env_path.is_file():
        return
    try:
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and val:
                os.environ.setdefault(key, val)
    except Exception:
        pass


def http_get_text(url: str, headers: dict[str, str] | None = None) -> str:
    req_headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json,text/html,application/xml,text/xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }
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


def _yahoo_chart(symbol: str) -> tuple[float, float] | None:
    encoded = urllib.parse.quote(symbol, safe="")
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{encoded}?interval=1d&range=5d"
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
            c
            for c in result.get("indicators", {}).get("quote", [{}])[0].get("close", [])
            if c is not None
        ]
        if len(closes) >= 2 and closes[-2] > 0:
            change_pct = ((closes[-1] - closes[-2]) / closes[-2]) * 100.0
        else:
            change_pct = 0.0

    return round(price, 2), round(change_pct, 2)


def _google_finance_quote(quote_path: str) -> tuple[float, float] | None:
    url = f"https://www.google.com/finance/quote/{quote_path}"
    html = http_get_text(url)
    price_match = re.search(r'data-last-price="([0-9.,]+)"', html)
    if not price_match:
        return None
    price = float(price_match.group(1).replace(",", ""))
    pct_match = re.search(
        r'data-last-normal-market-change-percent="([-0-9.,]+)"', html
    )
    change_pct = float(pct_match.group(1).replace(",", "")) if pct_match else 0.0
    return round(price, 2), round(change_pct, 2)


def fetch_usd_idr() -> dict[str, Any]:
    try:
        data = json.loads(
            http_get_text("https://api.frankfurter.app/latest?from=USD&to=IDR")
        )
        return {
            "symbol": "IDR=X",
            "price": round(float(data["rates"]["IDR"]), 2),
            "change_pct": 0.0,
            "status": "live",
            "source": "frankfurter",
        }
    except Exception:
        pass

    try:
        data = json.loads(http_get_text("https://open.er-api.com/v6/latest/USD"))
        return {
            "symbol": "IDR=X",
            "price": round(float(data["rates"]["IDR"]), 2),
            "change_pct": 0.0,
            "status": "live",
            "source": "open-er-api",
        }
    except Exception:
        pass

    try:
        res = _yahoo_chart("IDR=X")
        if res:
            return {
                "symbol": "IDR=X",
                "price": res[0],
                "change_pct": res[1],
                "status": "live",
                "source": "yahoo",
            }
    except Exception:
        pass

    return {
        "symbol": "IDR=X",
        "price": 18250.0,
        "change_pct": 0.0,
        "status": "fallback",
        "source": "fallback",
    }


def fetch_btc_usd() -> dict[str, Any]:
    try:
        url = (
            "https://api.coingecko.com/api/v3/simple/price"
            "?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
        )
        data = json.loads(http_get_text(url))
        btc = data["bitcoin"]
        return {
            "symbol": "BTC-USD",
            "price": round(float(btc["usd"]), 2),
            "change_pct": round(float(btc.get("usd_24h_change", 0.0)), 2),
            "status": "live",
            "source": "coingecko",
        }
    except Exception:
        pass

    try:
        data = json.loads(
            http_get_text("https://api.kraken.com/0/public/Ticker?pair=XBTUSD")
        )
        pair_data = next(iter(data["result"].values()))
        last_price = float(pair_data["c"][0])
        open_price = float(pair_data["o"])
        change_pct = (
            ((last_price - open_price) / open_price) * 100.0 if open_price > 0 else 0.0
        )
        return {
            "symbol": "BTC-USD",
            "price": round(last_price, 2),
            "change_pct": round(change_pct, 2),
            "status": "live",
            "source": "kraken",
        }
    except Exception:
        pass

    return {
        "symbol": "BTC-USD",
        "price": 58000.0,
        "change_pct": 0.0,
        "status": "fallback",
        "source": "fallback",
    }


def fetch_gold_usd() -> dict[str, Any]:
    # 1. Gold-API public spot feed
    try:
        data = json.loads(http_get_text("https://api.gold-api.com/price/XAU"))
        price = float(data["price"])
        return {
            "symbol": "GC=F",
            "price": round(price, 2),
            "change_pct": 0.0,
            "status": "live",
            "source": "gold-api",
        }
    except Exception:
        pass

    # 2. Swissquote public BBO feed
    try:
        data = json.loads(
            http_get_text(
                "https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD"
            )
        )
        spread = data[0]["spreadProfilePrices"][0]
        mid = (float(spread["bid"]) + float(spread["ask"])) / 2.0
        return {
            "symbol": "GC=F",
            "price": round(mid, 2),
            "change_pct": 0.0,
            "status": "live",
            "source": "swissquote",
        }
    except Exception:
        pass

    # 3. Yahoo Finance query2
    try:
        res = _yahoo_chart("GC=F")
        if res:
            return {
                "symbol": "GC=F",
                "price": res[0],
                "change_pct": res[1],
                "status": "live",
                "source": "yahoo",
            }
    except Exception:
        pass

    return {
        "symbol": "GC=F",
        "price": 3800.0,
        "change_pct": 0.0,
        "status": "fallback",
        "source": "fallback",
    }


def fetch_ihsg() -> dict[str, Any]:
    # 1. TradingView Indonesia public scanner
    try:
        res = http_post_json(
            "https://scanner.tradingview.com/indonesia/scan",
            {
                "symbols": {"tickers": ["IDX:COMPOSITE"], "query": {"types": []}},
                "columns": ["close", "change"],
            },
        )
        row = res["data"][0]["d"]
        return {
            "symbol": "^JKSE",
            "price": round(float(row[0]), 2),
            "change_pct": round(float(row[1]), 2),
            "status": "live",
            "source": "tradingview",
        }
    except Exception:
        pass

    # 2. Yahoo Finance query2
    try:
        res = _yahoo_chart("^JKSE")
        if res:
            return {
                "symbol": "^JKSE",
                "price": res[0],
                "change_pct": res[1],
                "status": "live",
                "source": "yahoo",
            }
    except Exception:
        pass

    # 3. Google Finance HTML
    try:
        res = _google_finance_quote("COMPOSITE:IDX")
        if res:
            return {
                "symbol": "^JKSE",
                "price": res[0],
                "change_pct": res[1],
                "status": "live",
                "source": "google-finance",
            }
    except Exception:
        pass

    return {
        "symbol": "^JKSE",
        "price": 4850.0,
        "change_pct": 0.0,
        "status": "fallback",
        "source": "fallback",
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
    if ihsg["change_pct"] <= -0.8:
        risk_off_signals += 1
    if usd_idr["change_pct"] >= 0.5 or usd_idr["price"] >= 16500:
        risk_off_signals += 1
    if btc["change_pct"] <= -3.5:
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
                f"gemini-2.5-flash:generateContent?key={urllib.parse.quote(google_key)}"
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
        except urllib.error.HTTPError as err:
            print(f"[macro_harvester] Gemini synthesis HTTP error: {err.code} {err.reason}")
        except Exception as err:
            print(f"[macro_harvester] Gemini synthesis failed: {type(err).__name__}: {err}")

    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if openrouter_key:
        try:
            res = http_post_json(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    "model": "openrouter/free",
                    "messages": [{"role": "user", "content": prompt}],
                },
                headers={"Authorization": f"Bearer {openrouter_key}"},
            )
            text = res["choices"][0]["message"]["content"]
            return validate_synthesis(extract_json_object(text))
        except urllib.error.HTTPError as err:
            print(f"[macro_harvester] OpenRouter synthesis HTTP error: {err.code} {err.reason}")
        except Exception as err:
            print(f"[macro_harvester] OpenRouter synthesis failed: {type(err).__name__}: {err}")

    return None


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    load_dotenv_local(repo_root)

    indicators = {
        "USD_IDR": fetch_usd_idr(),
        "IHSG": fetch_ihsg(),
        "GOLD_USD": fetch_gold_usd(),
        "BTC_USD": fetch_btc_usd(),
    }
    headlines = fetch_rss_headlines(limit=5)

    live_count = sum(1 for v in indicators.values() if v["status"] == "live")
    if live_count == len(indicators):
        source_status = "live"
    elif live_count > 0:
        source_status = "partial"
    else:
        source_status = "fallback"

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

    out_path = repo_root / "data" / "market_context.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Wrote {out_path} (source_status={source_status}, live_indicators={live_count}/4)")


if __name__ == "__main__":
    main()
