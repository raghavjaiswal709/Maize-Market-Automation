"use client";

import { MarketSentiment } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SentimentCardProps {
  sentiment: MarketSentiment;
}

export function SentimentCard({ sentiment }: SentimentCardProps) {
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

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Market Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold capitalize ${directionColor}`}>
            {sentiment.overall}
          </span>
          <span className="text-sm text-muted-foreground capitalize">
            {sentiment.strength}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confidence</span>
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
          <span className="text-muted-foreground">Direction:</span>
          <span className={`font-medium capitalize ${directionColor}`}>
            {sentiment.direction === "down" ? "Downward" : sentiment.direction === "up" ? "Upward" : "Sideways"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
