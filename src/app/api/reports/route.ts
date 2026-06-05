import { connectToDatabase } from "@/lib/mongodb";
import { normalizeReport } from "@/lib/normalize-report";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// ─── File-system helpers for public/reports/ ──────────────────────────────────

const REPORTS_DIR = path.join(process.cwd(), "public", "reports");
const FILE_PREFIX = "maize_warehouse_report_";

function listFileReports(): { date: string; filePath: string }[] {
  try {
    if (!fs.existsSync(REPORTS_DIR)) return [];
    return fs
      .readdirSync(REPORTS_DIR)
      .filter((f) => f.startsWith(FILE_PREFIX) && f.endsWith(".json"))
      .map((f) => ({
        date: f.replace(FILE_PREFIX, "").replace(".json", ""),
        filePath: path.join(REPORTS_DIR, f),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

function readFileReport(date: string): Record<string, unknown> | null {
  try {
    const filePath = path.join(REPORTS_DIR, `${FILE_PREFIX}${date}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit  = parseInt(searchParams.get("limit")  || "1");
    const offset = parseInt(searchParams.get("offset") || "0");
    const lang   = (searchParams.get("lang") || "hinglish") as "hindi" | "hinglish";
    const dateFilter = searchParams.get("date");

    console.log(`[API /reports] limit=${limit} offset=${offset} lang=${lang} date=${dateFilter}`);

    const { db } = await connectToDatabase();
    const collection = db.collection("daily_reports");

    // ── Specific-date query ─────────────────────────────────────────────────
    if (dateFilter) {
      const dbReport = await collection.findOne({ date: dateFilter });
      if (dbReport) {
        return NextResponse.json({
          reports: [normalizeReport(dbReport, lang)],
          total: 1,
          hasMore: false,
        });
      }
      // Fallback: try public/reports/
      const fileReport = readFileReport(dateFilter);
      if (fileReport) {
        console.log(`[API /reports] Serving ${dateFilter} from public/reports/`);
        return NextResponse.json({
          reports: [normalizeReport(fileReport, lang)],
          total: 1,
          hasMore: false,
          source: "file",
        });
      }
      return NextResponse.json({ reports: [], total: 0, hasMore: false });
    }

    // ── General query: merge DB + file system ──────────────────────────────
    const dbReports = await collection
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    const dbDates = new Set(dbReports.map((r) => String(r.date)));

    // Load file-based reports only for dates not already in MongoDB
    const fileExtras: Record<string, unknown>[] = listFileReports()
      .filter(({ date }) => !dbDates.has(date))
      .map(({ date }) => readFileReport(date))
      .filter(Boolean) as Record<string, unknown>[];

    const allRaw = [...dbReports, ...fileExtras];

    // Sort newest-first by date then timestamp
    allRaw.sort((a, b) => {
      const d = String(b.date).localeCompare(String(a.date));
      if (d !== 0) return d;
      return String(b.timestamp || "").localeCompare(String(a.timestamp || ""));
    });

    const total = allRaw.length;
    const page  = allRaw.slice(offset, offset + limit);
    const reports = page.map((r) => normalizeReport(r, lang));

    console.log(
      `[API /reports] ${reports.length} reports returned ` +
      `(${dbReports.length} DB + ${fileExtras.length} file)`
    );

    return NextResponse.json({ reports, total, hasMore: offset + limit < total });
  } catch (error) {
    console.error("[API /reports] Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[API /reports POST] Received data update request");

    const reports = Array.isArray(body) ? body : [body];

    const requiredFields = ["_id", "date", "current_prices", "news_items", "market_sentiment", "predictions_10_day"];
    for (const report of reports) {
      if (!report._id) {
        return NextResponse.json(
          { error: "Invalid report data", details: "Each report must have an _id field" },
          { status: 400 }
        );
      }
      const missing = requiredFields.filter((f) => !(f in report));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: "Invalid report data", details: `Missing required fields: ${missing.join(", ")}` },
          { status: 400 }
        );
      }
      if (!Array.isArray(report.predictions_10_day)) {
        return NextResponse.json(
          { error: "Invalid report data", details: "predictions_10_day must be an array" },
          { status: 400 }
        );
      }
      if (!Array.isArray(report.news_items)) {
        return NextResponse.json(
          { error: "Invalid report data", details: "news_items must be an array" },
          { status: 400 }
        );
      }
      if (!report.current_prices || typeof report.current_prices !== "object") {
        return NextResponse.json(
          { error: "Invalid report data", details: "current_prices must be an object" },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("daily_reports");

    let inserted = 0;
    let updated  = 0;

    for (const report of reports) {
      const existing = await collection.findOne({ _id: report._id });
      if (existing) {
        await collection.replaceOne({ _id: report._id }, report);
        updated++;
        console.log(`[API /reports POST] Updated report: ${report._id}`);
      } else {
        await collection.insertOne({ ...report, _id: report._id });
        inserted++;
        console.log(`[API /reports POST] Inserted report: ${report._id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${reports.length} report(s): ${inserted} inserted, ${updated} updated`,
      inserted,
      updated,
    });
  } catch (error) {
    console.error("[API /reports POST] Error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON", details: "The provided data is not valid JSON" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update report data", details: String(error) },
      { status: 500 }
    );
  }
}
