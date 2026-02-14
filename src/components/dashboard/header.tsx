"use client";

import { DailyReport } from "@/types/report";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  report: DailyReport;
}

export function Header({ report }: HeaderProps) {
  const formattedDate = format(new Date(report.date), "dd MMM yyyy");
  const sentiment = report.market_sentiment;

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Maize Market
            </h1>
            <p className="text-sm text-muted-foreground">
              {formattedDate} &middot; {report.day_of_week} &middot; {report.time}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={sentiment.direction === "down" ? "destructive" : sentiment.direction === "up" ? "default" : "secondary"}
              className="text-xs font-medium uppercase"
            >
              {sentiment.overall} &middot; {sentiment.strength}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sentiment.confidence}% confidence
            </Badge>
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
