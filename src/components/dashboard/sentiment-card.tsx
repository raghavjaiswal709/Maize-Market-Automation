"use client";

import { MarketSentiment } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";

interface SentimentCardProps {
  sentiment: MarketSentiment;
}

export function SentimentCard({ sentiment }: SentimentCardProps) {
  const { lang } = useLanguage();

  const directionColor =
    sentiment.direction === "down"
      ? "text-red-500"
      : sentiment.direction === "up"
      ? "text-emerald-500"
      : "text-muted-foreground";

  const barColor =
    sentiment.direction === "down"
      ? "bg-red-500"
      : sentiment.direction === "up"
      ? "bg-emerald-500"
      : "bg-muted-foreground";

  const directionLabel = sentiment.direction === "down"
    ? (lang === "hindi" ? "↓ गिरावट" : "↓ Downward")
    : sentiment.direction === "up"
    ? (lang === "hindi" ? "↑ तेजी" : "↑ Upward")
    : (lang === "hindi" ? "→ स्थिर" : "→ Sideways");

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {lang === "hindi" ? "बाजार भावना" : "Market Sentiment"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {sentiment.emoji && <span className="text-xl">{sentiment.emoji}</span>}
            <span className={`text-2xl font-bold leading-tight ${directionColor}`}>
              {sentiment.overall}
            </span>
          </div>
          {sentiment.strength && (
            <p className="text-sm text-muted-foreground">
              {sentiment.strength}
            </p>
          )}
          {sentiment.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {sentiment.summary}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{lang === "hindi" ? "विश्वास" : "Confidence"}</span>
            <span className="font-medium tabular-nums">{sentiment.confidence}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${sentiment.confidence}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{lang === "hindi" ? "दिशा:" : "Direction:"}</span>
          <span className={`font-medium ${directionColor}`}>
            {directionLabel}
          </span>
        </div>

        {sentiment.emoji && (
          <div className="text-lg">{sentiment.emoji}</div>
        )}
      </CardContent>
    </Card>
  );
}
