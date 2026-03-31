export interface CurrentPrices {
  bihar_avg: number;
  purnea: number;
  indore: number;
  all_india_avg: number;
  unit: string;
}

export interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  impact: "up" | "down" | "neutral";
  severity: "high" | "medium" | "low";
  explanation_hinglish: string;
  price_effect: number;
}

export interface VideoNewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  channel: string;
  published_at: string;
  published_display: string;
  duration: string;
  thumbnail_url: string;
  description: string;
  relevance: string;
  tags: string[];
}

export interface MarketSentiment {
  overall: string;
  strength: string;
  confidence: number;
  direction: string;
  emoji: string;
  summary?: string;
}

export interface Prediction {
  day: number;
  date: string;
  date_formatted: string;
  price: number;
  change: number;
  trend: "up" | "down" | "stable";
}

export interface BuyerRecommendation {
  action: string;
  action_hinglish: string;
  reason: string;
  target_price: number;
  target_date: string;
}

export interface SellerRecommendation {
  action: string;
  action_hinglish: string;
  reason: string;
  alternative: string;
}

export interface Recommendations {
  buyers: BuyerRecommendation;
  sellers: SellerRecommendation;
}

export interface Factors {
  bearish: string[];
  bullish: string[];
  neutral: string[];
}

export interface Metadata {
  report_version: string;
  automation: string;
  fetch_method: string;
  runtime: string;
  model?: string;
}

export interface DailyReport {
  _id: string;
  timestamp: string;
  date: string;
  time: string;
  day_of_week: string;
  /** Short human-readable label for the AI model / source that generated the report */
  model_label: string;
  current_prices: CurrentPrices;
  live_news_raw: string;
  news_items: NewsItem[];
  video_news: VideoNewsItem[];
  market_sentiment: MarketSentiment;
  predictions_10_day: Prediction[];
  recommendations: Recommendations;
  factors: Factors;
  data_sources: string[];
  metadata: Metadata;
}
