"use client";

import { DailyReport, Prediction } from "@/types/report";
import { ReelsContainer, SlideColors } from "./reels-container";
import { FormattedText } from "./formatted-text";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Wheat,
  Scale,
  Users,
  Store,
} from "lucide-react";

interface OverviewReelsProps {
  report: DailyReport;
}

// ──────────────────────────────────────────────
// Slide 0: Hero — date, model, day of week
// ──────────────────────────────────────────────
function HeroSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Wheat style={{ color: colors.text }} className="h-14 w-14 opacity-80" />
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: colors.text }}>
        Maize Market
      </h1>
      <div className="space-y-2">
        <p className="text-xl sm:text-2xl font-bold" style={{ color: colors.text }}>
          {report.day_of_week}, {report.date}
        </p>
        <p className="text-sm font-medium tracking-wide uppercase" style={{ color: colors.muted }}>
          {report.time} &middot; {report.model_label}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 1: Bihar Average Price — the main number
// ──────────────────────────────────────────────
function PriceHeroSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const price = report.current_prices.bihar_avg;
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.muted }}>
        Bihar Average
      </p>
      <p className="text-7xl sm:text-8xl font-black tabular-nums" style={{ color: colors.text }}>
        ₹{price > 0 ? price.toLocaleString("en-IN") : "—"}
      </p>
      <p className="text-base font-semibold tracking-wide" style={{ color: colors.muted }}>
        per quintal
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 2: All Prices at a glance
// ──────────────────────────────────────────────
function AllPricesSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const { bihar_avg, purnea, indore, all_india_avg } = report.current_prices;
  const items = [
    { label: "Bihar Average", value: bihar_avg },
    { label: "Purnea", value: purnea },
    { label: "Indore", value: indore },
    { label: "All India Avg", value: all_india_avg },
  ];
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: colors.muted }}>
        Current Prices
      </p>
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-2xl py-5 px-3"
            style={{ backgroundColor: `${colors.text}10` }}
          >
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: colors.muted }}>
              {label}
            </p>
            <p className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: colors.text }}>
              {value > 0 ? `₹${value.toLocaleString("en-IN")}` : "—"}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-center font-medium" style={{ color: colors.muted }}>
        {report.current_prices.unit}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 3: Market Sentiment
// ──────────────────────────────────────────────
function SentimentSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const { overall, confidence, direction, strength, summary } = report.market_sentiment;
  const isUp = direction?.toLowerCase().includes("up") || direction?.toLowerCase().includes("bullish");
  const isDown = direction?.toLowerCase().includes("down") || direction?.toLowerCase().includes("bearish");
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Icon style={{ color: colors.text }} className="h-16 w-16" />
      <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight" style={{ color: colors.text }}>
        {overall}
      </h2>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: colors.muted }}>
            Confidence
          </p>
          <p className="text-3xl font-black" style={{ color: colors.text }}>
            {confidence}%
          </p>
        </div>
        <div
          className="w-px h-12"
          style={{ backgroundColor: `${colors.text}30` }}
        />
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: colors.muted }}>
            Strength
          </p>
          <p className="text-3xl font-black" style={{ color: colors.text }}>
            {strength}
          </p>
        </div>
      </div>
      {summary && (
        <FormattedText
          text={summary}
          modalTitle="Market Sentiment"
          textColorClass="text-white/75"
          modalBgColor="#1a1a2e"
          limit={160}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 4: 10-Day Forecast — summary
// ──────────────────────────────────────────────
function ForecastSummarySlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const preds = report.predictions_10_day;
  if (!preds || preds.length === 0) return null;

  const first = preds[0];
  const last = preds[preds.length - 1];
  const netChange = last.price - first.price;
  const percentChange = first.price > 0 ? ((netChange / first.price) * 100).toFixed(1) : "0.0";
  const isPositive = netChange >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <BarChart3 style={{ color: colors.text }} className="h-12 w-12 opacity-80" />
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.muted }}>
        10-Day Forecast
      </p>
      <div className="flex items-center gap-3">
        <Icon style={{ color: colors.text }} className="h-10 w-10" />
        <p className="text-5xl sm:text-6xl font-black tabular-nums" style={{ color: colors.text }}>
          {isPositive ? "+" : ""}
          {percentChange}%
        </p>
      </div>
      <div className="flex items-center gap-6 text-sm font-semibold">
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: colors.muted }}>
            Day 1
          </p>
          <p className="text-2xl font-black tabular-nums" style={{ color: colors.text }}>
            ₹{first.price.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.muted }}>→</div>
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: colors.muted }}>
            Day {last.day}
          </p>
          <p className="text-2xl font-black tabular-nums" style={{ color: colors.text }}>
            ₹{last.price.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 5: Forecast detail — top 5 predictions
// ──────────────────────────────────────────────
function ForecastDetailSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const preds = report.predictions_10_day.slice(0, 5);

  function getArrows(change: number) {
    const abs = Math.abs(change);
    if (abs === 0) return { icon: Minus, count: 1 };
    const count = abs <= 10 ? 1 : abs <= 25 ? 2 : 3;
    const icon = change > 0 ? TrendingUp : TrendingDown;
    return { icon, count };
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: colors.muted }}>
        Forecast Detail
      </p>
      <div className="space-y-3">
        {preds.map((p: Prediction) => {
          const { icon: ArrowIcon, count } = getArrows(p.change);
          return (
            <div
              key={p.day}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: `${colors.text}10` }}
            >
              <div className="flex flex-col">
                <p className="text-xs font-bold uppercase" style={{ color: colors.muted }}>
                  Day {p.day}
                </p>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                  {p.date_formatted || p.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-black tabular-nums" style={{ color: colors.text }}>
                  ₹{p.price.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center">
                  {Array.from({ length: count }).map((_, i) => (
                    <ArrowIcon key={i} className="h-4 w-4" style={{ color: colors.text }} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {report.predictions_10_day.length > 5 && (
        <p className="text-xs text-center font-medium" style={{ color: colors.muted }}>
          +{report.predictions_10_day.length - 5} more days in Dashboard
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 6: Buyer recommendation
// ──────────────────────────────────────────────
function BuyerSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const { buyers } = report.recommendations;
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <Users style={{ color: colors.text }} className="h-12 w-12 opacity-80" />
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.muted }}>
        For Buyers
      </p>
      <div
        className="rounded-2xl px-5 py-2 text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: `${colors.text}20`, color: colors.text }}
      >
        {buyers.action.replace(/_/g, " ")}
      </div>
      <FormattedText
        text={buyers.action_hinglish}
        modalTitle="Buyer Action"
        textColorClass="text-white"
        modalBgColor="#1a1a2e"
        limit={160}
      />
      <FormattedText
        text={buyers.reason}
        modalTitle="Why — Buyer Reason"
        textColorClass="text-white/70"
        modalBgColor="#1a1a2e"
        limit={140}
      />
      {buyers.target_price > 0 && (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: colors.text }} />
          <p className="text-lg font-black tabular-nums" style={{ color: colors.text }}>
            ₹{buyers.target_price.toLocaleString("en-IN")} INR/q
          </p>
          {buyers.target_date && (
            <span className="text-xs font-medium" style={{ color: colors.muted }}>
              by {buyers.target_date}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 7: Seller recommendation
// ──────────────────────────────────────────────
function SellerSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const { sellers } = report.recommendations;
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <Store style={{ color: colors.text }} className="h-12 w-12 opacity-80" />
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.muted }}>
        For Sellers
      </p>
      <div
        className="rounded-2xl px-5 py-2 text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: `${colors.text}20`, color: colors.text }}
      >
        {sellers.action.replace(/_/g, " ")}
      </div>
      <FormattedText
        text={sellers.action_hinglish}
        modalTitle="Seller Action"
        textColorClass="text-white"
        modalBgColor="#1a1a2e"
        limit={160}
      />
      <FormattedText
        text={sellers.reason}
        modalTitle="Why — Seller Reason"
        textColorClass="text-white/70"
        modalBgColor="#1a1a2e"
        limit={140}
      />
      {sellers.alternative && (
        <FormattedText
          text={`Alternative: ${sellers.alternative}`}
          modalTitle="Alternative"
          textColorClass="text-white/60"
          modalBgColor="#1a1a2e"
          limit={120}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Slide 8: Market Factors
// ──────────────────────────────────────────────
function FactorsSlide({ report, colors }: { report: DailyReport; colors: SlideColors }) {
  const { bearish, bullish, neutral } = report.factors;
  const sections = [
    { label: "Bullish", items: bullish, icon: ShieldCheck },
    { label: "Bearish", items: bearish, icon: ShieldAlert },
    { label: "Neutral", items: neutral, icon: Scale },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-bold uppercase tracking-widest text-center" style={{ color: colors.muted }}>
        Market Factors
      </p>
      {sections.map(({ label, items, icon: SectionIcon }) => (
        items.length > 0 && (
          <div key={label}>
            <div className="flex items-center gap-2 mb-2">
              <SectionIcon className="h-4 w-4" style={{ color: colors.text }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.text }}>
                {label}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.slice(0, 4).map((f: string, i: number) => (
                <span
                  key={i}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `${colors.text}15`, color: colors.text }}
                >
                  {f}
                </span>
              ))}
              {items.length > 4 && (
                <span className="text-xs font-medium self-center" style={{ color: colors.muted }}>
                  +{items.length - 4} more
                </span>
              )}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component — assembles all slides
// ──────────────────────────────────────────────
export function OverviewReels({ report }: OverviewReelsProps) {
  const slides = [
    (colors: SlideColors) => <HeroSlide report={report} colors={colors} />,
    (colors: SlideColors) => <PriceHeroSlide report={report} colors={colors} />,
    (colors: SlideColors) => <AllPricesSlide report={report} colors={colors} />,
    (colors: SlideColors) => <SentimentSlide report={report} colors={colors} />,
    (colors: SlideColors) => <ForecastSummarySlide report={report} colors={colors} />,
    (colors: SlideColors) => <ForecastDetailSlide report={report} colors={colors} />,
    (colors: SlideColors) => <BuyerSlide report={report} colors={colors} />,
    (colors: SlideColors) => <SellerSlide report={report} colors={colors} />,
    (colors: SlideColors) => <FactorsSlide report={report} colors={colors} />,
  ];

  return (
    <ReelsContainer
      count={slides.length}
      renderSlide={(index, colors) => slides[index](colors)}
    />
  );
}
