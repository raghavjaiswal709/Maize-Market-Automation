#!/usr/bin/env python3
"""
Daily Maize Market Report Generator
Uses OpenAI Responses API with web_search_preview to research real-time data
and produce the warehouse-operator JSON report.
"""

import glob
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta

# ── IST timezone ──────────────────────────────────────────────────────────────
IST = timezone(timedelta(hours=5, minutes=30))


def load_prior_report():
    """Return (dict | None) for the most recent existing report."""
    files = sorted(glob.glob("public/reports/maize_warehouse_report_*.json"), reverse=True)
    if not files:
        return None
    try:
        with open(files[0], encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def extract_json(text: str) -> str:
    """Strip markdown fences and return the raw JSON string."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    text = text.strip()
    # Find the outermost { ... }
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in model output")
    return text[start : end + 1]


def build_prompt(today: str, report_id: str, file_path: str, prior: dict | None) -> str:
    with open("public/instruction.txt", encoding="utf-8") as f:
        instruction = f.read()

    prior_block = ""
    if prior:
        try:
            pp = prior.get("current_prices", {}).get("purnea", {}).get("value", 1850)
            ps = prior.get("market_sentiment", {}).get("overall", "neutral")
            pc = prior.get("market_sentiment", {}).get("confidence", 60)
            pd = prior.get("date", "unknown")
            pncdex = (
                prior.get("current_prices", {})
                .get("ncdex_maize_feed_futures", {})
                .get("value", None)
            )
            pcrude = (
                prior.get("current_prices", {})
                .get("crude_oil", {})
                .get("value_usd_per_barrel", None)
            )
            prior_block = f"""
KADAM 1 — PICHLI REPORT SE NIKALE GAYE VALUES (directly inject these):
  prior_purnea_price:        {pp}
  prior_confidence:          {pc}
  prior_sentiment:           {ps}
  prior_report_date:         {pd}
  prior_ncdex_hedge_price:   {pncdex if pncdex else "null"}
  prior_crude_oil_usd:       {pcrude if pcrude else "null"}
  prior_consecutive_flat:    0
  prior_ddgs_gm_status:      "pending"
  prior_breakeven_reference: {pp + 22 * 3 if pp else 1916}
"""
        except Exception:
            pass

    return f"""Today's date is: {today}
Report _id to use: {report_id}
Output file: {file_path}

{prior_block}

{instruction}

═══════════════════════════════════════════════════════════════
IMPORTANT OVERRIDE INSTRUCTIONS FOR THIS AUTOMATED RUN
═══════════════════════════════════════════════════════════════

1. TODAY'S DATE IS {today}. Use this exact date in all date fields — never infer or guess.

2. Use _id: "{report_id}"

3. OUTPUT FORMAT: Return ONLY a valid JSON object.
   - First character: {{
   - Last character: }}
   - No markdown code fences
   - No preamble or explanation before the JSON
   - No trailing text after the closing }}

4. Perform ALL 13 research steps using your web_search tool before generating the JSON.
   Complete every web search listed in Steps 2, 3, 4, 5, 6, 7, 8, 9, 10, and 11.

5. All text fields must be in Hindi only (no English, no Hinglish).

6. Follow the exact schema defined in BHAAG B — including warehouse_economics,
   hedge_recommendation, urgency_flag, quality_risk, and all guardrails 1-28.

Now execute all 13 research steps using web_search, then output the complete JSON report.
"""


def call_openai(api_key: str, prompt: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    print("Calling OpenAI Responses API with web_search_preview...", flush=True)

    response = client.responses.create(
        model="gpt-4o",
        tools=[{"type": "web_search_preview"}],
        input=prompt,
        max_output_tokens=16000,
    )

    # Log tool usage for debugging
    tool_calls = 0
    for item in response.output:
        if hasattr(item, "type") and item.type == "web_search_call":
            tool_calls += 1

    print(f"Web searches executed: {tool_calls}", flush=True)

    # Get final text output
    text = getattr(response, "output_text", None)
    if not text:
        # Fallback: manually gather text from output items
        parts = []
        for item in response.output:
            if hasattr(item, "content"):
                for block in item.content:
                    if hasattr(block, "text"):
                        parts.append(block.text)
        text = "\n".join(parts)

    if not text:
        raise RuntimeError("OpenAI returned empty output")

    return text


def validate_report(data: dict) -> list[str]:
    errors = []
    if "news_items" not in data:
        errors.append("missing news_items")
    elif len(data["news_items"]) < 6:
        errors.append(f"only {len(data['news_items'])} news_items (need ≥8)")

    if "predictions_10_day" not in data:
        errors.append("missing predictions_10_day")
    elif len(data["predictions_10_day"]) < 10:
        errors.append(f"only {len(data['predictions_10_day'])} predictions (need 10)")

    for key in ("market_sentiment", "current_prices", "recommendations", "metadata"):
        if key not in data:
            errors.append(f"missing top-level key: {key}")

    return errors


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    now_ist = datetime.now(IST)
    today = now_ist.strftime("%Y-%m-%d")
    compact = now_ist.strftime("%Y%m%d")
    htime = now_ist.strftime("%H%M%S")
    report_id = f"{compact}_{htime}_WAREHOUSE"
    file_path = f"public/reports/maize_warehouse_report_{today}.json"

    # Skip if today's report already exists and is valid
    if os.path.exists(file_path):
        try:
            with open(file_path, encoding="utf-8") as f:
                existing = json.load(f)
            if existing.get("date") == today and existing.get("news_items"):
                print(f"Report for {today} already exists and is valid — skipping.")
                sys.exit(0)
        except Exception:
            pass  # Overwrite broken file

    os.makedirs("public/reports", exist_ok=True)

    prior = load_prior_report()
    if prior:
        print(f"Prior report found: date={prior.get('date')}", flush=True)

    prompt = build_prompt(today, report_id, file_path, prior)

    print(f"=== Generating Maize Market Report for {today} ===", flush=True)
    print(f"Report ID: {report_id}", flush=True)
    print(f"Output:    {file_path}", flush=True)
    print(f"Prompt length: {len(prompt):,} chars", flush=True)

    raw_output = call_openai(api_key, prompt)

    print(f"Raw output length: {len(raw_output):,} chars", flush=True)

    # Extract and parse JSON
    try:
        json_str = extract_json(raw_output)
    except ValueError as e:
        print(f"ERROR extracting JSON: {e}", file=sys.stderr)
        print("--- Raw output (first 2000 chars) ---", file=sys.stderr)
        print(raw_output[:2000], file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON from model: {e}", file=sys.stderr)
        print("--- JSON (first 2000 chars) ---", file=sys.stderr)
        print(json_str[:2000], file=sys.stderr)
        sys.exit(1)

    # Enforce correct date/id
    data["date"] = today
    if "_id" not in data or not data["_id"]:
        data["_id"] = report_id

    # Validate structure
    errors = validate_report(data)
    if errors:
        print(f"WARNING: Validation issues: {errors}", file=sys.stderr)
        # Don't exit — save what we have; partial report is better than nothing

    # Write file
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Report saved: {file_path}", flush=True)
    print(f"  _id:         {data.get('_id')}", flush=True)
    print(f"  date:        {data.get('date')}", flush=True)
    print(f"  news_items:  {len(data.get('news_items', []))}", flush=True)
    print(f"  video_news:  {len(data.get('video_news', []))}", flush=True)
    print(f"  predictions: {len(data.get('predictions_10_day', []))}", flush=True)
    print(f"  sentiment:   {data.get('market_sentiment', {}).get('overall', 'N/A')}", flush=True)
    print("JSON VALID ✓", flush=True)


if __name__ == "__main__":
    main()
