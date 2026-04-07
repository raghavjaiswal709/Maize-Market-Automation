"use client";

import { NewsItem } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface NewsListProps {
  items: NewsItem[];
}

/** Get background color based on news sentiment impact */
function sentimentBg(impact: string): string {
  if (impact === "up") return "#0B9981";
  if (impact === "down") return "#F23645";
  return "transparent";
}

export function NewsList({ items }: NewsListProps) {
  return (
    <Card className="border border-border rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Market News & Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {items.map((item, idx) => (
          <div key={item.id}>
            {idx > 0 && <Separator />}
            <div
              className="px-3 py-3 sm:px-6 sm:py-4 space-y-2"
              style={{
                backgroundColor: sentimentBg(item.impact),
                color: item.impact === "up" || item.impact === "down" ? "#ffffff" : undefined,
              }}
            >
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                <h3
                  className="text-sm font-medium leading-snug"
                  style={{
                    color: item.impact === "up" || item.impact === "down" ? "#ffffff" : undefined,
                  }}
                >
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase bg-white/20 text-white">
                    {item.impact}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase ${
                      item.impact === "up" || item.impact === "down"
                        ? "bg-white/15 text-white"
                        : item.severity === "high"
                        ? "border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                        : item.severity === "medium"
                        ? "border border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
              </div>
              <div
                style={{
                  color: item.impact === "up" || item.impact === "down" ? "rgba(255,255,255,0.85)" : undefined,
                }}
              >
                <MarkdownRenderer
                  text={item.explanation_hinglish}
                  className={item.impact === "up" || item.impact === "down" ? "text-white/85" : "text-muted-foreground"}
                />
              </div>
              <div className="flex items-center gap-3 text-[11px]"
                style={{
                  color: item.impact === "up" || item.impact === "down" ? "rgba(255,255,255,0.7)" : undefined,
                }}
              >
                <span>{item.date}</span>
                <span>{item.category}</span>
                <span className="font-medium tabular-nums text-white">
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
