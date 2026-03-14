"use client";

import { DailyReport } from "@/types/report";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { UpdateDataPanel } from "@/components/dashboard/update-data-panel";
import { useLanguage } from "@/components/language-provider";

interface HeaderProps {
  report: DailyReport;
  onDataUpdated: () => void;
}

export function Header({ report, onDataUpdated }: HeaderProps) {
  const { lang } = useLanguage();
  const formattedDate = format(new Date(report.date), "dd MMM yyyy");
  const sentiment = report.market_sentiment;

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
              {lang === "hindi" ? "मक्का बाजार" : "Maize Market"}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm truncate">
              {formattedDate} · {report.day_of_week} · {report.time}
              {report.model_label && (
                <span className="ml-1 text-[11px] sm:text-xs">
                  · {report.model_label}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap sm:gap-2">
            {sentiment.emoji && <span className="text-sm sm:text-base">{sentiment.emoji}</span>}
            <Badge
              variant={sentiment.direction === "down" ? "destructive" : sentiment.direction === "up" ? "default" : "secondary"}
              className="text-[10px] sm:text-xs font-medium"
            >
              {sentiment.overall} · {sentiment.strength}
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              {sentiment.confidence}% {lang === "hindi" ? "विश्वास" : "confidence"}
            </Badge>
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto sm:ml-1">
              <LanguageToggle />
              <UpdateDataPanel onSuccess={onDataUpdated} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
