import { connectToDatabase } from "@/lib/mongodb";
import { normalizeReport } from "@/lib/normalize-report";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "1");
    const offset = parseInt(searchParams.get("offset") || "0");
    const lang = (searchParams.get("lang") || "hinglish") as "hindi" | "hinglish";
    console.log(`[API /reports] Fetching reports with limit=${limit}, offset=${offset}, lang=${lang}`);

    const { db } = await connectToDatabase();
    const collection = db.collection("daily_reports");
    console.log("[API /reports] Connected to database, accessing collection: daily_reports");

    const rawReports = await collection
      .find({})
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments();
    console.log(`[API /reports] Found ${rawReports.length} reports out of ${total} total`);

    const reports = rawReports.map((r) => normalizeReport(r, lang));

    if (reports.length > 0) {
      console.log("[API /reports] Sample report ID:", reports[0]._id);
    }

    return NextResponse.json({
      reports,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("[API /reports] Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[API /reports POST] Received data update request");

    // Accept either a single report object or an array
    const reports = Array.isArray(body) ? body : [body];

    // Validate each report has required fields
    const requiredFields = ["_id", "date", "current_prices", "news_items", "market_sentiment", "predictions_10_day"];
    for (const report of reports) {
      // _id is required for upsert
      if (!report._id) {
        console.error("[API /reports POST] Validation failed: missing _id");
        return NextResponse.json(
          { error: "Invalid report data", details: "Each report must have an _id field" },
          { status: 400 }
        );
      }

      const missing = requiredFields.filter((f) => !(f in report));
      if (missing.length > 0) {
        console.error("[API /reports POST] Validation failed, missing fields:", missing);
        return NextResponse.json(
          {
            error: "Invalid report data",
            details: `Missing required fields: ${missing.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Validate predictions_10_day is an array
      if (!Array.isArray(report.predictions_10_day)) {
        return NextResponse.json(
          { error: "Invalid report data", details: "predictions_10_day must be an array" },
          { status: 400 }
        );
      }

      // Validate news_items is an array
      if (!Array.isArray(report.news_items)) {
        return NextResponse.json(
          { error: "Invalid report data", details: "news_items must be an array" },
          { status: 400 }
        );
      }

      // Validate current_prices has at least one price field
      const cp = report.current_prices;
      if (!cp || typeof cp !== "object") {
        return NextResponse.json(
          { error: "Invalid report data", details: "current_prices must be an object" },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("daily_reports");

    let inserted = 0;
    let updated = 0;

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

    // Check if it's a JSON parse error
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
