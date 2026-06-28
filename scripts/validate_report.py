#!/usr/bin/env python3
"""Validates the generated JSON report. Called by GitHub Actions after generation."""

import json
import os
import sys
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))
today = datetime.now(IST).strftime("%Y-%m-%d")
path = f"public/reports/maize_warehouse_report_{today}.json"

if not os.path.exists(path):
    print(f"ERROR: Report file not found: {path}", file=sys.stderr)
    sys.exit(1)

with open(path, encoding="utf-8") as f:
    d = json.load(f)

errors = []
if d.get("date") != today:
    errors.append(f"date mismatch: got {d.get('date')!r}, expected {today!r}")
if len(d.get("news_items", [])) == 0:
    errors.append("news_items is empty")
if len(d.get("predictions_10_day", [])) < 10:
    errors.append(f"predictions_10_day has {len(d.get('predictions_10_day', []))} entries (need 10)")
if "market_sentiment" not in d:
    errors.append("missing market_sentiment")
if "current_prices" not in d:
    errors.append("missing current_prices")
if "recommendations" not in d:
    errors.append("missing recommendations")

if errors:
    print("VALIDATION ERRORS:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print("Report valid")
print(f"  _id:         {d.get('_id')}")
print(f"  date:        {d.get('date')}")
print(f"  news_items:  {len(d.get('news_items', []))}")
print(f"  video_news:  {len(d.get('video_news', []))}")
print(f"  predictions: {len(d.get('predictions_10_day', []))}")
print(f"  sentiment:   {d.get('market_sentiment', {}).get('overall', 'N/A')}")
