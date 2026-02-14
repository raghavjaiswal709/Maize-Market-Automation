import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "1");
    const offset = parseInt(searchParams.get("offset") || "0");
    console.log(`[API /reports] Fetching reports with limit=${limit}, offset=${offset}`);

    const { db } = await connectToDatabase();
    const collection = db.collection("daily_reports");
    console.log("[API /reports] Connected to database, accessing collection: daily_reports");

    const reports = await collection
      .find({})
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments();
    console.log(`[API /reports] Found ${reports.length} reports out of ${total} total`);
    
    if (reports.length > 0) {
      console.log("[API /reports] Sample report ID:", reports[0]._id);
      console.log("[API /reports] Sample report keys:", Object.keys(reports[0]));
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
