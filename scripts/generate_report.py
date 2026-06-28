#!/usr/bin/env python3
"""
Daily Maize Market Report Generator — Phase 1: gather real data, Phase 2: GPT-4o generates JSON.

Phase 1: Python fetches live prices (Yahoo Finance) + news (DuckDuckGo) — no extra API key needed.
Phase 2: All gathered data is passed to GPT-4o (Chat Completions) to produce the warehouse JSON.
"""

import glob
import json
import os
import re
import sys
import time
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


# ── Live price fetch (Yahoo Finance public JSON endpoint) ─────────────────────

def fetch_yahoo(symbol: str) -> dict:
    import requests
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1d&interval=1d"
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=12)
        r.raise_for_status()
        meta = r.json()["chart"]["result"][0]["meta"]
        return {
            "symbol": symbol,
            "name": meta.get("shortName", symbol),
            "price": meta.get("regularMarketPrice") or meta.get("previousClose"),
            "currency": meta.get("currency", ""),
            "change_pct": round(meta.get("regularMarketChangePercent", 0), 2),
            "prev_close": meta.get("previousClose"),
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}


# ── Web search (DuckDuckGo, no API key) ───────────────────────────────────────

def ddg_search(query: str, max_results: int = 5) -> list[dict]:
    from duckduckgo_search import DDGS
    for attempt in range(3):
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
            if results:
                return results
        except Exception as e:
            print(f"  DDG attempt {attempt + 1} failed ({e})", flush=True)
            time.sleep(2 + attempt * 2)
    return []


def format_results(results: list[dict]) -> str:
    if not results:
        return "  (no results)"
    lines = []
    for i, r in enumerate(results, 1):
        body = (r.get("body") or "")[:400]
        lines.append(f"  [{i}] {r.get('title','')}\n      {r.get('href','')}\n      {body}")
    return "\n".join(lines)


# ── Gather all research data ──────────────────────────────────────────────────

def gather_data(today: str, month_year: str) -> str:
    sections = []

    # ── Live financial prices ──────────────────────────────────────────────────
    print("Fetching Yahoo Finance prices ...", flush=True)
    cbot  = fetch_yahoo("ZC=F")       # CBOT Corn
    crude = fetch_yahoo("BZ=F")       # Brent Crude
    inr   = fetch_yahoo("USDINR=X")  # USD/INR

    sections.append(f"""
══ LIVE PRICES (Yahoo Finance, {today}) ══
CBOT Corn    : {cbot.get('price','N/A')} {cbot.get('currency','USX/BU')}  |  change: {cbot.get('change_pct','N/A')}%  |  prev close: {cbot.get('prev_close','N/A')}
Brent Crude  : {crude.get('price','N/A')} {crude.get('currency','USD')}    |  change: {crude.get('change_pct','N/A')}%  |  prev close: {crude.get('prev_close','N/A')}
USD/INR Rate : {inr.get('price','N/A')}
""")

    # ── Web search queries ─────────────────────────────────────────────────────
    queries = [
        # Kadam 2 — Bihar spot prices
        ("bihar_price_a",   f"makka bhav aaj Bihar mandi Purnea Katihar maize price today {month_year}"),
        ("bihar_price_b",   f"maize wholesale price Bihar warehouse trader {month_year}"),
        ("indore_price",    f"maize corn price Indore MP mandi {month_year}"),
        # Kadam 3 — YouTube / video news
        ("youtube_a",       f"maize makka mandi bhav Bihar Purnea aaj YouTube {month_year}"),
        ("youtube_b",       f"NCDEX maize futures price today hedge YouTube {month_year}"),
        ("youtube_c",       f"makka rate today Bihar mandi wholesale YouTube {month_year}"),
        # Kadam 4 — NCDEX
        ("ncdex",           f"NCDEX maize futures price today June September 2026 {month_year}"),
        # Kadam 5 — CBOT / global
        ("cbot_news",       f"CBOT corn futures price today ZC {today}"),
        # Kadam 6 — E20/E30 / crude / DDGS
        ("ethanol_e20",     f"India E20 ethanol mandate April 2026 maize distillery demand {month_year}"),
        ("ddgs_policy",     f"India DDGS GM status FSSAI approval maize import duty 2026"),
        ("crude_news",      f"crude oil price today Brent WTI Iran OPEC {today}"),
        # Kadam 7 — Bihar arrivals
        ("bihar_arrivals",  f"Bihar rabi maize harvest arrivals mandi {month_year}"),
        # Kadam 8 — IMD weather
        ("imd_bihar",       f"IMD weather Bihar forecast heatwave flood {today}"),
        # Kadam 9 — Brazil / WASDE
        ("brazil_wasde",    f"Brazil corn safrinha harvest 2026 WASDE USDA crop estimate {month_year}"),
        # Kadam 10 — Industry associations
        ("aida_isma",       f"AIDA ISMA ethanol industry E30 India {month_year}"),
        ("poultry_demand",  f"India poultry aquaculture feed maize demand {month_year}"),
        # Kadam 11 — Global sweep (20 queries collapsed to 6 key ones)
        ("india_policy",    f"India maize import export duty procurement MSP {month_year}"),
        ("china_corn",      f"China corn import demand purchase 2026"),
        ("ukraine_grain",   f"Ukraine corn export Black Sea Russia {month_year}"),
        ("india_us_trade",  f"India US trade deal agriculture tariff corn DDGS {month_year}"),
        ("global_supply",   f"USDA corn crop estimate global supply demand {month_year}"),
        ("india_news",      f"India maize corn news today {month_year}"),
    ]

    print(f"Running {len(queries)} web searches ...", flush=True)
    for key, query in queries:
        results = ddg_search(query, max_results=4)
        sections.append(f"\n══ SEARCH [{key}]: {query} ══\n{format_results(results)}")
        time.sleep(0.8)   # be gentle with DDG

    return "\n".join(sections)


# ── Build the final prompt ────────────────────────────────────────────────────

def build_prompt(today: str, report_id: str, research_data: str, prior: dict | None) -> str:
    with open("public/instruction.txt", encoding="utf-8") as f:
        instruction = f.read()

    prior_block = ""
    if prior:
        try:
            pp = prior.get("current_prices", {}).get("purnea", {}).get("value", 1850)
            ps = prior.get("market_sentiment", {}).get("overall", "neutral")
            pc = prior.get("market_sentiment", {}).get("confidence", 60)
            pd = prior.get("date", "unknown")
            prior_block = f"""
KADAM 1 — PICHLI REPORT SE VALUES (directly use these):
  prior_purnea_price     : {pp}
  prior_confidence       : {pc}
  prior_sentiment        : {ps}
  prior_report_date      : {pd}
  prior_breakeven_ref    : {pp + 66}
  prior_ddgs_gm_status   : pending
"""
        except Exception:
            pass

    return f"""TODAY'S DATE: {today}
REPORT _id   : {report_id}

{prior_block}
══════════════════════════════════════════════════════════
REAL-TIME MARKET RESEARCH DATA (fetched right now on {today})
══════════════════════════════════════════════════════════
{research_data}
══════════════════════════════════════════════════════════

{instruction}

══════════════════════════════════════════════════════════
MANDATORY OVERRIDES FOR THIS AUTOMATED RUN
══════════════════════════════════════════════════════════

1. USE the REAL-TIME MARKET RESEARCH DATA above for all prices, news, and analysis.
   Do NOT use placeholder prices. Extract actual values from the search results above.

2. date field must be exactly "{today}". _id must be "{report_id}".

3. ALL text fields (explanations, summaries, advice, live_news_raw) must be in HINDI ONLY.
   No English. No Hinglish. Technical terms must be explained in Hindi brackets.

4. OUTPUT FORMAT — return ONLY a valid JSON object:
   • First character: {{
   • Last character: }}
   • NO markdown fences (no ```json)
   • NO preamble or explanation before {{
   • NO text after the final }}

5. Schema from BHAAG B is mandatory — include warehouse_economics, hedge_recommendation,
   urgency_flag, quality_risk, import_parity_price in every run.

6. Kadam 1 prior values are provided above.
   Kadam 2-11 research data is in the REAL-TIME block above — use it.

Generate the complete JSON report now.
"""


# ── Load previous report ──────────────────────────────────────────────────────

def load_prior() -> dict | None:
    files = sorted(glob.glob("public/reports/maize_warehouse_report_*.json"), reverse=True)
    if not files:
        return None
    try:
        with open(files[0], encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# ── Extract JSON from model output ────────────────────────────────────────────

def extract_json(text: str) -> str:
    text = text.strip()
    # Strip markdown fences
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n?```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()
    start = text.find("{")
    end   = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in model output")
    return text[start : end + 1]


# ── Basic structural validation ───────────────────────────────────────────────

def validate(data: dict) -> list[str]:
    issues = []
    if len(data.get("news_items", [])) == 0:
        issues.append("news_items is empty")
    if len(data.get("predictions_10_day", [])) < 10:
        issues.append(f"only {len(data.get('predictions_10_day', []))} predictions (need 10)")
    for k in ("market_sentiment", "current_prices", "recommendations", "metadata"):
        if k not in data:
            issues.append(f"missing key: {k}")
    return issues


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY is not set", file=sys.stderr)
        sys.exit(1)

    now_ist    = datetime.now(IST)
    today      = now_ist.strftime("%Y-%m-%d")
    month_year = now_ist.strftime("%B %Y")          # e.g. "June 2026"
    report_id  = now_ist.strftime("%Y%m%d_%H%M%S") + "_WAREHOUSE"
    file_path  = f"public/reports/maize_warehouse_report_{today}.json"

    # Skip if a valid report already exists for today
    if os.path.exists(file_path):
        try:
            with open(file_path, encoding="utf-8") as f:
                existing = json.load(f)
            if existing.get("date") == today and existing.get("news_items"):
                print(f"Valid report for {today} already exists — skipping.")
                sys.exit(0)
        except Exception:
            pass

    os.makedirs("public/reports", exist_ok=True)

    prior = load_prior()
    print(f"Prior report : {prior.get('date') if prior else 'None'}", flush=True)

    # ── Phase 1: gather research data ─────────────────────────────────────────
    print(f"\n=== Phase 1: Gathering market data for {today} ({month_year}) ===", flush=True)
    research = gather_data(today, month_year)
    print(f"Research data: {len(research):,} chars", flush=True)

    # ── Phase 2: build prompt and call GPT-4o ─────────────────────────────────
    prompt = build_prompt(today, report_id, research, prior)
    print(f"Prompt length: {len(prompt):,} chars (~{len(prompt)//4:,} tokens)", flush=True)

    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    print("\n=== Phase 2: Calling GPT-4o to generate JSON report ===", flush=True)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert Indian agricultural commodity analyst. "
                    "Your output must be ONLY a valid JSON object — no markdown, no explanation, "
                    "no preamble. First char: { Last char: }"
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=16000,
        temperature=0.2,
    )

    raw = response.choices[0].message.content or ""
    usage = response.usage
    print(f"Output: {len(raw):,} chars | Tokens: {usage.prompt_tokens} prompt + {usage.completion_tokens} completion", flush=True)

    if not raw:
        print("ERROR: GPT-4o returned empty output", file=sys.stderr)
        sys.exit(1)

    # ── Parse JSON ────────────────────────────────────────────────────────────
    try:
        json_str = extract_json(raw)
        data = json.loads(json_str)
    except Exception as e:
        print(f"ERROR parsing JSON: {e}", file=sys.stderr)
        print("Raw output (first 1500 chars):", file=sys.stderr)
        print(raw[:1500], file=sys.stderr)
        sys.exit(1)

    # Enforce correct values
    data["date"] = today
    if not data.get("_id"):
        data["_id"] = report_id

    # Validate
    issues = validate(data)
    if issues:
        print(f"WARNING — validation issues: {issues}", file=sys.stderr)

    # ── Write file ────────────────────────────────────────────────────────────
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n=== Report saved: {file_path} ===", flush=True)
    print(f"  _id         : {data.get('_id')}", flush=True)
    print(f"  date        : {data.get('date')}", flush=True)
    print(f"  news_items  : {len(data.get('news_items', []))}", flush=True)
    print(f"  video_news  : {len(data.get('video_news', []))}", flush=True)
    print(f"  predictions : {len(data.get('predictions_10_day', []))}", flush=True)
    print(f"  sentiment   : {data.get('market_sentiment', {}).get('overall', 'N/A')}", flush=True)
    print("JSON VALID", flush=True)


if __name__ == "__main__":
    main()
