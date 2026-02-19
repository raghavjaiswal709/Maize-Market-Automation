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
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {lang === "hindi" ? "मक्का बाजार" : "Maize Market"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formattedDate} &middot; {report.day_of_week} &middot; {report.time}
              {report.model_label && (
                <span className="ml-1.5 text-xs">
                  &middot; {report.model_label}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {sentiment.emoji && <span className="text-base">{sentiment.emoji}</span>}
            <Badge
              variant={sentiment.direction === "down" ? "destructive" : sentiment.direction === "up" ? "default" : "secondary"}
              className="text-xs font-medium"
            >
              {sentiment.overall} &middot; {sentiment.strength}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sentiment.confidence}% {lang === "hindi" ? "विश्वास" : "confidence"}
            </Badge>
            <div className="flex items-center gap-1.5 ml-1">
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
