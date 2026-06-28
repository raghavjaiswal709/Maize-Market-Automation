#!/usr/bin/env python3
"""
Daily Maize Market Report Generator
Phase 1 — Python gathers real data (Yahoo Finance + DuckDuckGo)
Phase 2 — GPT-4o generates the full warehouse JSON report
"""

import glob, json, os, re, sys, time
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


# ── Yahoo Finance price fetch ─────────────────────────────────────────────────

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


# ── DuckDuckGo search (renamed package: ddgs) ─────────────────────────────────

def ddg_search(query: str, max_results: int = 4) -> list[dict]:
    try:
        from ddgs import DDGS
    except ImportError:
        from duckduckgo_search import DDGS  # fallback for older installs
    for attempt in range(3):
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
            if results:
                return results
        except Exception as e:
            print(f"  DDG attempt {attempt+1} failed: {e}", flush=True)
            time.sleep(2 + attempt * 2)
    return []


def fmt(results: list[dict]) -> str:
    if not results:
        return "  (no results)"
    out = []
    for i, r in enumerate(results, 1):
        body = (r.get("body") or "")[:350]
        out.append(f"  [{i}] {r.get('title','')}\n      {r.get('href','')}\n      {body}")
    return "\n".join(out)


# ── Phase 1: gather all research data ────────────────────────────────────────

def gather(today: str, my: str) -> str:
    """Returns a single string with all real-time market data."""
    parts = []

    print("Fetching Yahoo Finance prices...", flush=True)
    cbot  = fetch_yahoo("ZC=F")
    crude = fetch_yahoo("BZ=F")
    inr   = fetch_yahoo("USDINR=X")
    parts.append(f"""=== LIVE PRICES ({today}) ===
CBOT Corn (ZC=F)  : {cbot.get('price','N/A')} {cbot.get('currency','USX/BU')} | chg: {cbot.get('change_pct','N/A')}% | prev: {cbot.get('prev_close','N/A')}
Brent Crude (BZ=F): {crude.get('price','N/A')} {crude.get('currency','USD')} | chg: {crude.get('change_pct','N/A')}% | prev: {crude.get('prev_close','N/A')}
USD/INR (USDINR=X): {inr.get('price','N/A')}""")

    queries = [
        ("bihar_spot",      f"makka bhav aaj Bihar mandi Purnea Katihar maize price {my}"),
        ("bihar_wholesale", f"maize wholesale price Bihar trader warehouse {my}"),
        ("indore_price",    f"maize corn price Indore Madhya Pradesh mandi {my}"),
        ("ncdex_futures",   f"NCDEX maize futures price June September 2026 {my}"),
        ("cbot_news",       f"CBOT corn futures ZC price today {today}"),
        ("ethanol_e20",     f"India E20 E30 ethanol mandate maize distillery demand {my}"),
        ("ddgs_policy",     f"India DDGS GM approval FSSAI maize import duty 2026"),
        ("crude_news",      f"Brent crude oil price today Iran OPEC {today}"),
        ("bihar_arrivals",  f"Bihar rabi maize harvest arrivals mandi tapering {my}"),
        ("imd_weather",     f"IMD Bihar weather forecast heatwave flood {today}"),
        ("brazil_wasde",    f"Brazil corn safrinha harvest USDA WASDE estimate {my}"),
        ("aida_isma",       f"AIDA ISMA ethanol industry E30 India {my}"),
        ("poultry_demand",  f"India poultry aquaculture feed maize demand {my}"),
        ("india_policy",    f"India maize import export duty MSP procurement {my}"),
        ("china_corn",      f"China corn import demand purchase 2026"),
        ("global_supply",   f"USDA corn crop global supply demand estimate {my}"),
        ("ukraine_grain",   f"Ukraine corn export Black Sea shipment {my}"),
        ("india_us_trade",  f"India US trade deal agriculture corn DDGS tariff {my}"),
        ("india_news",      f"India maize corn market news {my}"),
        ("rupee_macro",     f"Indian rupee USD rate agriculture import cost {today}"),
    ]

    print(f"Running {len(queries)} searches...", flush=True)
    for key, q in queries:
        results = ddg_search(q)
        parts.append(f"\n=== {key.upper()}: {q} ===\n{fmt(results)}")
        time.sleep(0.7)

    return "\n".join(parts)


# ── Phase 2: build focused GPT-4o prompt ─────────────────────────────────────

SCHEMA_PROMPT = """
You are an expert Indian agricultural commodity analyst. Generate a COMPLETE daily Maize Market Report JSON for a WAREHOUSE OPERATOR (godown malik) storing 50,000–500,000 quintals of maize in Bihar.

OUTPUT: ONLY a valid JSON object. No markdown. No explanation. First char: { Last char: }

The JSON must have EXACTLY these 16 top-level keys:
_id, timestamp, date, time, day_of_week,
current_prices, prior_day_reference,
live_news_raw, news_items, video_news,
market_sentiment, predictions_10_day,
recommendations, factors, data_sources, metadata

LANGUAGE: ALL text fields must be in HINDI ONLY. No English. No Hinglish.
Technical terms: explain in Hindi brackets on first use.
Example: "NCDEX (National Commodity & Derivatives Exchange — yani Delhi ka bada commodity bazaar)"

══ REQUIRED FIELDS AND RULES ══

current_prices must include:
  bihar_avg        : {value: INT, hinglish: "HINDI explanation"}
  purnea           : {value: INT, hinglish: "HINDI explanation"}
  indore           : {value: INT, hinglish: "HINDI explanation"}
  all_india_avg    : {value: INT, hinglish: "HINDI explanation"}
  ncdex_maize_feed_futures: {value: INT, contract: STR, range_low: INT, range_high: INT, prev_close: INT, signal: STR, hinglish: STR}
  cbot_corn_active : {value_cents_per_bushel: FLOAT, ticker: STR, day_change: STR, hinglish: STR}
  crude_oil        : {value_usd_per_barrel: FLOAT, benchmark: STR, day_change: STR, hinglish: STR}
  msp              : {value: 2410, msp_gap: INT, msp_gap_pct: FLOAT, hinglish: STR}
  warehouse_economics: {
    assumed_procurement_cost: INT (default 1850),
    daily_carry_cost: 22,
    breakeven_price_1month: INT (procurement + 660),
    breakeven_price_2month: INT (procurement + 1320),
    breakeven_price_3month: INT (procurement + 1980),
    indore_bihar_gap: INT,
    import_parity_price: INT,
    domestic_import_gap: INT,
    explanation: "HINDI string"
  }

news_items: EXACTLY 8 items. Each item:
  {id, title, date, category, impact, severity, explanation}
  explanation MUST have 4 Hindi sections:
    **KYA HUA:** [facts]
    **ISKA MATLAB KYA HAI:** [analysis with numbers]
    **AAPKE STORED MAIZE PAR ASAR:** [warehouse impact in ₹]
    **GODOWN OPERATOR KE LIYE KAAM:** [action items]

  Required categories (one each):
  1. NCDEX futures movement + hedging signal
  2. Bihar rabi arrival status + sell window
  3. E20/E30 ethanol mandate + distillery demand
  4. International (CBOT/Brazil/WASDE) + import parity
  5. India-US trade / DDGS GM status
  6. IMD Bihar weather + storage quality risk
  7. Crude oil / geopolitical update
  8. MSP gap + warehouse financing / WR pledge value

video_news: 10 to 15 items. Each:
  {id, title, url, source, channel, published_at, published_display, duration, thumbnail_url, description, relevance, tags}
  description: minimum 50 Hindi words.
  Use real YouTube/web URLs from search results. No invented VIDEO_IDs.

live_news_raw: Hindi string, minimum 400 words. Cover all market angles.

market_sentiment:
  {overall: STR, emoji: STR, confidence: INT, text: "60+ Hindi words", summary: "80+ Hindi words with godown P&L framing"}
  overall values: strongly_bearish | moderately_bearish | mildly_bearish | neutral | mildly_bullish | moderately_bullish | strongly_bullish

predictions_10_day: EXACTLY 10 items (days 1–10 from today):
  Each: {day, date, date_display, day_name, price, change, cumulative_carry, net_pnl_per_qtl, action_signal, trend, trend_text}
  cumulative_carry = day × 22
  net_pnl_per_qtl = price - 1850 - cumulative_carry
  action_signal: "BECHO" if net_pnl_per_qtl < 0, "HOLD KARO" if positive+up, "HEDGE KARO" if positive+falling
  Sunday: change = 0. Saturday: change = half normal.
  trend_text: minimum 30 Hindi words with net P&L line.

recommendations:
  holders: {action, action_text, reason, advice (80+ Hindi words with carry cost calc), target_sell_price, target_date,
            hedge_recommendation: {action, contract, lots_per_lakh_quintal, hedge_price, hedge_margin_per_qtl, explanation}}
  buyers:  {action, action_text, reason, advice (80+ Hindi words), target_buy_price, target_date}

factors: {bearish: [list of Hindi strings], bullish: [list of Hindi strings], neutral: [list of Hindi strings]}
  Each factor: minimum 50 Hindi words.

data_sources: list of strings

metadata:
  report_version: "7.0_warehouse_operator_hindi_exhaustive"
  assumed_procurement_cost: INT
  daily_carry_cost: 22
  breakeven_1m, breakeven_2m, breakeven_3m: INT
  warehouse_quality_risk: "low" | "medium" | "high"
  urgency_flag: "CRITICAL_SELL" | "HEDGE_ADVISED" | "MONITOR" | "HOLD_SAFE"
  ncdex_hedge_recommendation: "HINDI string"
  ncdex_hedge_price: INT
  import_parity_price: INT
  domestic_import_gap: INT
  languages: ["hindi"]

══ CARRYING COST MODEL ══
Daily carry cost: ₹22/quintal/day
Default procurement: ₹1,850/quintal
Break-even formula: procurement + (days × 22)
Every explanation must state: "Agar aapne ₹X mein kharida aur Y din se rakha hai, break-even ₹Z hai. Aaj bazaar ₹W hai."

══ SENTIMENT SCORING ══
Score these 11 factors (see below) and map to sentiment:
1. Bihar arrival status: off_season=0, pre_arrival=-1, commencing=-2, peak=-3, tapering=-1
2. NCDEX signal: Strong Buy=+2, Buy=+1, Neutral=0, Sell=-1, Strong Sell=-2
3. NCDEX vs spot gap: >50 upar=+2, 10-50 upar=+1, flat=0, 10-50 neeche=-1, >50 neeche=-2
4. DDGS/import: no quota=0, GM pending=-1, GM approved=-2
5. E20/E30: >30 din bache=0, 15-30 din=+1, <15 din=+2, post-E20 <30 din=+1
6. MSP gap: spot>MSP-100=0, 100-300 neeche=-1, >300 neeche=-1
7. International: CBOT up+Brazil problem=+1, flat+Brazil ok=-1, CBOT down+big Brazil=-2
8. IMD Bihar: no alert=0, yellow=+1, orange=+2, red=+3
9. Poultry/feed demand: growing=+1, DDGS substitution=-1, GM approved=-2
10. 7-day price momentum: >30 up=+2, 10-30 up=+1, flat=0, 10-30 down=-1, >30 down=-2
11. Crude oil: >$90=+1, $75-90=0, $60-75=0, <$60=-1

Total score → sentiment:
≤-12: strongly_bearish (85-92%)
-11 to -7: moderately_bearish (70-80%)
-6 to -3: mildly_bearish (55-65%)
-2 to +2: neutral (50-55%)
+3 to +6: mildly_bullish (55-65%)
+7 to +10: moderately_bullish (70-80%)
≥+11: strongly_bullish (85-92%)
"""


def build_prompt(today: str, report_id: str, research: str, prior: dict | None) -> str:
    day_name = datetime.now(IST).strftime("%A")

    prior_block = ""
    if prior:
        try:
            pp = prior.get("current_prices", {}).get("purnea", {}).get("value", 1850)
            ps = prior.get("market_sentiment", {}).get("overall", "neutral")
            pc = prior.get("market_sentiment", {}).get("confidence", 60)
            pd = prior.get("date", "")
            prior_block = f"""
PRIOR REPORT (Kadam 1 values):
  prior_purnea_price  : {pp}
  prior_confidence    : {pc}
  prior_sentiment     : {ps}
  prior_date          : {pd}
  purnea_delta        : calculate as (today_purnea - {pp})
"""
        except Exception:
            pass

    return f"""{SCHEMA_PROMPT}

══ TODAY'S REAL-TIME MARKET DATA ({today}, {day_name}) ══
Report _id : {report_id}
Date       : {today}
{prior_block}
{research}

══ GENERATE THE COMPLETE JSON REPORT NOW ══
Use ALL the real-time data above for prices, news items, and analysis.
Generate ALL 8 news_items, ALL 10 predictions, ALL required fields.
Output ONLY the JSON object. Start with {{ and end with }}
"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_prior() -> dict | None:
    files = sorted(glob.glob("public/reports/maize_warehouse_report_*.json"), reverse=True)
    if not files:
        return None
    try:
        with open(files[0], encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def extract_json(text: str) -> str:
    text = re.sub(r"^```(?:json)?\s*\n?", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"\n?```\s*$", "", text, flags=re.MULTILINE).strip()
    s, e = text.find("{"), text.rfind("}")
    if s == -1 or e <= s:
        raise ValueError("No JSON object found")
    return text[s:e+1]


def validate(data: dict) -> list[str]:
    issues = []
    if len(data.get("news_items", [])) < 8:
        issues.append(f"news_items: {len(data.get('news_items',[]))} (need 8)")
    if len(data.get("predictions_10_day", [])) < 10:
        issues.append(f"predictions_10_day: {len(data.get('predictions_10_day',[]))} (need 10)")
    for k in ("market_sentiment", "current_prices", "recommendations", "metadata", "live_news_raw"):
        if k not in data:
            issues.append(f"missing: {k}")
    return issues


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    now       = datetime.now(IST)
    today     = now.strftime("%Y-%m-%d")
    my        = now.strftime("%B %Y")
    report_id = now.strftime("%Y%m%d_%H%M%S") + "_WAREHOUSE"
    out_path  = f"public/reports/maize_warehouse_report_{today}.json"

    # Skip if already done today
    if os.path.exists(out_path):
        try:
            with open(out_path, encoding="utf-8") as f:
                ex = json.load(f)
            if ex.get("date") == today and len(ex.get("news_items", [])) >= 8:
                print(f"Complete report for {today} already exists — skipping.")
                sys.exit(0)
        except Exception:
            pass

    os.makedirs("public/reports", exist_ok=True)

    prior = load_prior()
    print(f"Prior report : {prior.get('date') if prior else 'None'}", flush=True)

    # Phase 1
    print(f"\n=== Phase 1: Gathering data for {today} ({my}) ===", flush=True)
    research = gather(today, my)
    print(f"Research : {len(research):,} chars", flush=True)

    # Phase 2
    prompt = build_prompt(today, report_id, research, prior)
    print(f"Prompt   : {len(prompt):,} chars (~{len(prompt)//4:,} tokens)", flush=True)

    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    print("\n=== Phase 2: GPT-4o generating JSON report ===", flush=True)

    response = client.chat.completions.create(
        model="gpt-5.5-pro-2026-04-23",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert Indian agricultural commodity analyst. "
                    "Output ONLY a valid JSON object — no markdown, no explanation. "
                    "Generate ALL required fields completely. Do not stop early. "
                    "First character must be { and last character must be }"
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=16000,
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or ""
    u   = response.usage
    print(f"Output   : {len(raw):,} chars | {u.prompt_tokens} prompt + {u.completion_tokens} completion tokens", flush=True)

    if not raw:
        print("ERROR: empty response from GPT-4o", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        try:
            data = json.loads(extract_json(raw))
        except Exception as e:
            print(f"ERROR: cannot parse JSON — {e}", file=sys.stderr)
            print("Preview:", raw[:1000], file=sys.stderr)
            sys.exit(1)

    data["date"] = today
    if not data.get("_id"):
        data["_id"] = report_id

    issues = validate(data)
    if issues:
        print(f"WARNING: {issues}", file=sys.stderr)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n=== Saved: {out_path} ===", flush=True)
    print(f"  news_items  : {len(data.get('news_items', []))}", flush=True)
    print(f"  video_news  : {len(data.get('video_news', []))}", flush=True)
    print(f"  predictions : {len(data.get('predictions_10_day', []))}", flush=True)
    print(f"  sentiment   : {data.get('market_sentiment', {}).get('overall', 'N/A')}", flush=True)
    print("JSON VALID", flush=True)


if __name__ == "__main__":
    main()
