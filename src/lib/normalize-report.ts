/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Normalize a raw MongoDB report (v2 flat OR v3 bilingual) into the
 * flat shape the UI components expect, using the requested language.
 *
 * Language priority:
 *  - "hindi"    → hindi  → hinglish → english → raw value
 *  - "hinglish" → hinglish → english → hindi → raw value
 */

type Lang = "hindi" | "hinglish";

/** Extract a string from a value that might be a plain string or a {english,hindi,hinglish} object */
function t(val: any, lang: Lang): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && !Array.isArray(val)) {
    if (lang === "hindi") return val.hindi || val.hinglish || val.english || "";
    return val.hinglish || val.english || val.hindi || "";
  }
  return String(val);
}

/** Extract a number from a value that might be a plain number or a {value} object */
function n(val: any): number {
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "value" in val) return val.value;
  return 0;
}

/** Derive a simple sentiment label from raw overall string */
function deriveSentimentLabel(rawOverall: string, lang: Lang): string {
  const lower = rawOverall.toLowerCase();
  if (lower.includes("strongly_bearish") || lower.includes("strongly bearish")) {
    return lang === "hindi" ? "अत्यधिक मंदी" : "Strongly Bearish";
  }
  if (lower.includes("bearish")) {
    return lang === "hindi" ? "मंदी" : "Bearish";
  }
  if (lower.includes("strongly_bullish") || lower.includes("strongly bullish")) {
    return lang === "hindi" ? "अत्यधिक तेजी" : "Strongly Bullish";
  }
  if (lower.includes("bullish")) {
    return lang === "hindi" ? "तेजी" : "Bullish";
  }
  return lang === "hindi" ? "तटस्थ" : "Neutral";
}

function deriveDirection(rawOverall: string): string {
  const lower = rawOverall.toLowerCase();
  if (lower.includes("bearish")) return "down";
  if (lower.includes("bullish")) return "up";
  return "neutral";
}

function deriveStrength(rawOverall: string, lang: Lang): string {
  const lower = rawOverall.toLowerCase();
  if (lower.includes("strongly") || lower.includes("strong")) {
    return lang === "hindi" ? "मजबूत" : "Strong";
  }
  if (lower.includes("moderate")) {
    return lang === "hindi" ? "मध्यम" : "Moderate";
  }
  if (lower.includes("mild") || lower.includes("weak")) {
    return lang === "hindi" ? "हल्की" : "Mild";
  }
  return lang === "hindi" ? "मध्यम" : "Moderate";
}

/** Derive a human-readable model label from metadata */
function deriveModelLabel(meta: any): string {
  // If a model field is explicitly set, use it
  if (meta?.model && typeof meta.model === "string") return meta.model;

  const fetchMethod = (meta?.fetch_method || "").toLowerCase();
  const automation = (meta?.automation || "").toLowerCase();

  // Map known fetch methods to friendly names
  if (fetchMethod.includes("perplexity") && fetchMethod.includes("research")) return "Perplexity Research";
  if (fetchMethod.includes("perplexity") && fetchMethod.includes("sonar")) return "Perplexity Sonar Pro";
  if (fetchMethod.includes("perplexity")) return "Perplexity";
  if (fetchMethod.includes("chatgpt") || fetchMethod.includes("openai") || fetchMethod.includes("gpt")) return "ChatGPT";
  if (fetchMethod.includes("gemini")) return "Gemini";
  if (fetchMethod.includes("claude")) return "Claude";
  if (fetchMethod.includes("sonar")) return "Sonar";

  // Fallback to automation field
  if (automation.includes("github")) return "GitHub Actions";
  if (automation) return automation;

  return "Unknown";
}

export function normalizeReport(raw: any, lang: Lang) {
  // --- current_prices ---
  const cp = raw.current_prices || {};
  const current_prices = {
    bihar_avg: n(cp.bihar_avg),
    purnea: n(cp.purnea),
    indore: n(cp.indore),
    all_india_avg: n(cp.all_india_avg),
    unit: cp.unit || "INR/quintal",
  };

  // --- day_of_week ---
  const day_of_week = t(raw.day_of_week, lang);

  // --- live_news_raw ---
  const live_news_raw = t(raw.live_news_raw, lang);

  // --- news_items ---
  const news_items = (raw.news_items || []).map((item: any) => ({
    id: item.id,
    title: t(item.title, lang),
    date: item.date,
    category: t(item.category, lang),
    impact: item.impact,
    severity: item.severity,
    explanation_hinglish: t(item.explanation || item.explanation_hinglish, lang),
    price_effect: item.price_effect,
  }));

  // --- market_sentiment ---
  const ms = raw.market_sentiment || {};

  // Determine raw overall keyword (always a plain string like "bearish", "strongly_bearish")
  const rawOverallStr = typeof ms.overall === "string" ? ms.overall : "";

  // For display: if v3 has ms.text (bilingual), extract; otherwise derive from keyword
  const sentimentSummary = ms.summary ? t(ms.summary, lang) : "";

  const market_sentiment = {
    overall: deriveSentimentLabel(rawOverallStr, lang),
    strength: ms.strength ? t(ms.strength, lang) : deriveStrength(rawOverallStr, lang),
    confidence: ms.confidence || 0,
    direction: ms.direction || deriveDirection(rawOverallStr),
    emoji: ms.emoji || "",
    summary: sentimentSummary,
  };

  // --- predictions_10_day ---
  const predictions_10_day = (raw.predictions_10_day || []).map((p: any) => {
    // v3 has date_display:{english,hindi,hinglish}, v2 has date_formatted string
    let dateFormatted = "";
    if (p.date_display) {
      dateFormatted = t(p.date_display, lang);
    } else if (p.date_formatted) {
      dateFormatted = p.date_formatted;
    } else if (p.date) {
      // fallback: extract from date string
      const d = new Date(p.date);
      if (!isNaN(d.getTime())) {
        dateFormatted = `${d.getDate()} ${d.toLocaleDateString("en", { month: "short" })}`;
      }
    }

    // v3 has trend_text:{english,hindi,hinglish}, v2 just has trend
    const trendDisplay = p.trend_text ? t(p.trend_text, lang) : p.trend;

    // v3 has day_name:{english,hindi,hinglish}
    const dayName = p.day_name ? t(p.day_name, lang) : "";

    return {
      day: p.day,
      date: p.date,
      date_formatted: dateFormatted,
      day_name: dayName,
      price: p.price,
      change: p.change,
      trend: p.trend,
      trend_display: trendDisplay,
    };
  });

  // --- recommendations ---
  const rec = raw.recommendations || {};
  const buyers = rec.buyers || {};
  const sellers = rec.sellers || {};

  // v3: action_text is {english,hindi,hinglish}, reason is {english,hindi,hinglish}, advice is {english,hindi,hinglish}
  // v2: action_hinglish is string, reason is string
  const recommendations = {
    buyers: {
      action: buyers.action || "",
      action_hinglish: t(buyers.action_text || buyers.action_hinglish, lang),
      reason: t(buyers.reason, lang),
      advice: buyers.advice ? t(buyers.advice, lang) : "",
      target_price: buyers.target_price || 0,
      target_date: buyers.target_date || "",
    },
    sellers: {
      action: sellers.action || "",
      action_hinglish: t(sellers.action_text || sellers.action_hinglish, lang),
      reason: t(sellers.reason, lang),
      advice: sellers.advice ? t(sellers.advice, lang) : "",
      alternative: t(sellers.alternative, lang),
    },
  };

  // --- factors ---
  const fac = raw.factors || {};
  const factors = {
    bearish: (fac.bearish || []).map((f: any) => t(f, lang)),
    bullish: (fac.bullish || []).map((f: any) => t(f, lang)),
    neutral: (fac.neutral || []).map((f: any) => t(f, lang)),
  };

  // --- metadata ---
  const meta = raw.metadata || {};
  const metadata = {
    report_version: meta.report_version || "",
    automation: meta.automation || "",
    fetch_method: meta.fetch_method || "",
    runtime: meta.runtime || "",
  };

  return {
    _id: raw._id,
    timestamp: raw.timestamp,
    date: raw.date,
    time: raw.time,
    day_of_week,
    model_label: deriveModelLabel(raw.metadata),
    current_prices,
    live_news_raw,
    news_items,
    market_sentiment,
    predictions_10_day,
    recommendations,
    factors,
    data_sources: raw.data_sources || [],
    metadata,
  };
}
