"use client";

import { DailyReport } from "@/types/report";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface HeaderProps {
  report: DailyReport;
  onDataUpdated: () => void;
}

export function Header({ report }: HeaderProps) {
  const formattedDate = format(new Date(report.date), "dd MMM yyyy");
  const sentiment = report.market_sentiment;

  const direction = sentiment.direction?.toLowerCase() || "";
  const SentimentIcon = direction.includes("up") || direction.includes("bullish")
    ? TrendingUp
    : direction.includes("down") || direction.includes("bearish")
      ? TrendingDown
      : Minus;

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-3 py-3 max-w-6xl sm:px-4 sm:py-4">
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
              Maize Market
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {formattedDate} · {report.day_of_week} · {report.time}
              {report.model_label && (
                <span className="ml-1 text-[11px] sm:text-xs">
                  · {report.model_label}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap sm:gap-2">
            <SentimentIcon className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={sentiment.direction === "down" ? "destructive" : sentiment.direction === "up" ? "default" : "secondary"}
              className="text-[10px] sm:text-xs font-medium"
            >
              {sentiment.overall} · {sentiment.strength}
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              {sentiment.confidence}% confidence
            </Badge>
          </div>
        </div>

        {/* Daily summary — full markdown-rendered text */}
        {sentiment.summary && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <MarkdownRenderer
              text={sentiment.summary}
              className="text-muted-foreground"
            />
          </div>
        )}
      </div>
    </header>
  );
}

