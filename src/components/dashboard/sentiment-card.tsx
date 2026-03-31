"use client";

import { MarketSentiment } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";

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

  const DirectionIcon =
    sentiment.direction === "down"
      ? TrendingDown
      : sentiment.direction === "up"
      ? TrendingUp
      : ArrowRight;

  const directionLabel =
    sentiment.direction === "down"
      ? "Downward"
      : sentiment.direction === "up"
      ? "Upward"
      : "Sideways";

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Market Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <DirectionIcon className={`h-5 w-5 ${directionColor}`} />
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
          <span className={`font-medium ${directionColor}`}>
            {directionLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
