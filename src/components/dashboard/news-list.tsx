"use client";

import { NewsItem } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/language-provider";

interface NewsListProps {
  items: NewsItem[];
}

export function NewsList({ items }: NewsListProps) {
  const { lang } = useLanguage();

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {lang === "hindi" ? "बाजार समाचार और अपडेट" : "Market News & Updates"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {items.map((item, idx) => (
          <div key={item.id}>
            {idx > 0 && <Separator />}
            <div className="px-3 py-3 sm:px-6 sm:py-4 space-y-2">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="text-sm font-medium text-foreground leading-snug">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant={
                      item.impact === "down"
                        ? "destructive"
                        : item.impact === "up"
                        ? "default"
                        : "secondary"
                    }
                    className="text-[10px] uppercase"
                  >
                    {item.impact}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase ${
                      item.severity === "high"
                        ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                        : item.severity === "medium"
                        ? "border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                        : "border-border"
                    }`}
                  >
                    {item.severity}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.explanation_hinglish}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{item.date}</span>
                <span>{item.category}</span>
                <span
                  className={`font-medium tabular-nums ${
                    item.price_effect > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : item.price_effect < 0
                      ? "text-red-600 dark:text-red-400"
                      : ""
                  }`}
                >
                  {item.price_effect > 0 ? "+" : ""}
                  {item.price_effect} INR
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
