# Daily Maize Market Report Generator

⚠️ DATE RULE — PEHLE YEH KARO, KOI BHI AUR KAAM SE PEHLE:
Run this Bash command RIGHT NOW and remember its output as TODAY_DATE:
```
date +%Y-%m-%d
```
Then check if today's report already exists:
```
ls public/reports/maize_warehouse_report_$(date +%Y-%m-%d).json 2>/dev/null && echo "ALREADY EXISTS — STOP" || echo "OK TO PROCEED"
```
If output is "ALREADY EXISTS — STOP": do nothing, report is already done for today.
If output is "OK TO PROCEED": continue below.

NEVER use any date you see written in this file or in existing report filenames as TODAY_DATE.
TODAY_DATE must always come from the live `date +%Y-%m-%d` Bash command above.

---

Read the full research instruction from `public/instruction.txt` and execute it exactly as written.

The instruction tells you to:
1. Check `public/reports/` for the most recent prior report (Kadam 1) — READ ONLY, never overwrite it
2. Run 13 research steps using WebSearch and WebFetch tools
3. Assemble the full JSON report
4. Write it to `public/reports/maize_warehouse_report_[TODAY_DATE].json` (TODAY_DATE from Bash above)
5. Validate the JSON with python3
6. Git commit and push to origin main

Start now by reading the instruction file:

```
Read public/instruction.txt
```

Then follow every step in order. Do not skip any step. Do not ask for confirmation — execute the full research and delivery automatically.
