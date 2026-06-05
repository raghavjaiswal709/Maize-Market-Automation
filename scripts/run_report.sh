#!/usr/bin/env bash
# Daily Maize Market Report — runs inside GitHub Actions
# Generates the report JSON and saves to public/reports/
set -euo pipefail

TODAY=$(date +%Y-%m-%d)
COMPACT=$(date +%Y%m%d)
HTIME=$(date +%H%M%S)
REPORT_ID="${COMPACT}_${HTIME}_WAREHOUSE"
FILE_PATH="public/reports/maize_warehouse_report_${TODAY}.json"

mkdir -p public/reports

echo "======================================"
echo "Maize Market Report — ${TODAY}"
echo "Report ID : ${REPORT_ID}"
echo "Output    : ${FILE_PATH}"
echo "======================================"

# Build the prompt in a temp file — keeps special chars out of shell quoting
PROMPT_FILE=$(mktemp /tmp/maize_prompt.XXXXXX)
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" << PROMPT_EOF
You are the daily Maize Market Report automation agent running in GitHub Actions.

TODAY      = ${TODAY}
REPORT_ID  = ${REPORT_ID}
FILE_PATH  = ${FILE_PATH}

STEP 1 - Read the research instruction
Read file: public/instruction.txt
Follow every rule in it exactly.

STEP 2 - Get prior report data (Kadam 1)
Run bash: ls -t public/reports/maize_warehouse_report_*.json 2>/dev/null | head -1
If a file is found: Read it and extract the Kadam 1 prior values listed in instruction.txt.
If no file: use the Kadam 1 defaults (prior_purnea_price=1900, prior_confidence=60, etc.)

STEP 3 - Execute all 13 research Kadams from instruction.txt
Use WebSearch for every search query.
Use WebFetch for every URL.
Replace [MONTH YEAR] with the actual current month and year.
Replace [TODAY DATE] with ${TODAY}.
Do not skip any Kadam. Do not combine Kadams.

STEP 4 - Build the complete JSON report
Follow all rules in Bhaag B and Bhaag C of instruction.txt.
Required:
  _id          = ${REPORT_ID}
  date         = ${TODAY}
  timestamp    = ${TODAY} followed by current HH:MM:SS
  All text fields: Hindi only. No English. No Hinglish.
  news_items: exactly 8, each with 4-section structure
  video_news: 10 to 15 items, each YouTube VIDEO_ID exactly 11 chars
  predictions_10_day: exactly 10 days with cumulative_carry and net_pnl_per_qtl
  recommendations key for warehouse holders: use "holders"
  metadata.automation = "github_actions"
  metadata.fetch_method = "claude_code_websearch"

STEP 5 - Write the file
Write the JSON to: ${FILE_PATH}
First character must be { and last character must be }
Pure JSON only — no markdown fences, no preamble, no trailing text.

STEP 6 - Validate
Run bash: python3 -c "import json; json.load(open('${FILE_PATH}')); print('JSON VALID')"
If not valid: fix and rewrite, then validate again.

STEP 7 - Done
Do NOT run any git commands. GitHub Actions handles the commit and push.
Print: REPORT COMPLETE - ${FILE_PATH}

Begin with STEP 1 now.
PROMPT_EOF

echo "Running Claude Code..."
claude \
  --print \
  --allowedTools "WebSearch,WebFetch,Write,Read,Bash,Glob" \
  "$(cat "$PROMPT_FILE")"

echo ""
echo "======================================"
echo "Verifying output..."
echo "======================================"

if [ ! -f "$FILE_PATH" ]; then
  echo "ERROR: Report file not found at $FILE_PATH"
  exit 1
fi

python3 - << 'PYEOF'
import json, sys, os

today = os.popen("date +%Y-%m-%d").read().strip()
fp = f"public/reports/maize_warehouse_report_{today}.json"

with open(fp, encoding="utf-8") as f:
    d = json.load(f)

errors = []
if not d.get("_id"):                              errors.append("missing _id")
if not d.get("date"):                             errors.append("missing date")
if not d.get("current_prices"):                   errors.append("missing current_prices")
if not d.get("market_sentiment"):                 errors.append("missing market_sentiment")
if len(d.get("news_items", [])) < 8:              errors.append(f"only {len(d.get('news_items',[]))} news items (need 8)")
if len(d.get("predictions_10_day", [])) < 10:     errors.append(f"only {len(d.get('predictions_10_day',[]))} predictions (need 10)")

if errors:
    print("VALIDATION FAILED:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print("Validation passed!")
print(f"  _id:         {d.get('_id')}")
print(f"  date:        {d.get('date')}")
print(f"  news_items:  {len(d.get('news_items', []))}")
print(f"  video_news:  {len(d.get('video_news', []))}")
print(f"  predictions: {len(d.get('predictions_10_day', []))}")
print(f"  sentiment:   {d.get('market_sentiment', {}).get('overall', 'N/A')}")
print(f"  purnea:      {d.get('current_prices', {}).get('purnea', {})}")
PYEOF

echo "======================================"
echo "SUCCESS: ${FILE_PATH}"
echo "======================================"
