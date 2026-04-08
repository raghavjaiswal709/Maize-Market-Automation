"use client";

import { useState } from "react";
import { NewsItem } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ChevronDown } from "lucide-react";

interface NewsListProps {
  items: NewsItem[];
}

function sentimentBg(impact: string): string {
  if (impact === "up") return "#0B9981";
  if (impact === "down") return "#F23645";
  return "transparent";
}

function sentimentBgMuted(impact: string): string {
  if (impact === "up") return "rgba(11,153,129,0.12)";
  if (impact === "down") return "rgba(242,54,69,0.12)";
  return "transparent";
}

export function NewsList({ items }: NewsListProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <Card className="border border-border rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Market News & Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {items.map((item, idx) => {
          const isOpen = openId === item.id;
          const isColored = item.impact === "up" || item.impact === "down";
          const bg = sentimentBg(item.impact);
          const bgMuted = sentimentBgMuted(item.impact);

          return (
            <div key={item.id}>
              {idx > 0 && <Separator />}

              {/* Accordion header — always visible, clickable */}
              <button
                className="w-full text-left px-3 py-3 sm:px-4 sm:py-3 flex items-start gap-3 transition-colors"
                style={{
                  backgroundColor: isOpen ? bg : bgMuted,
                }}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-medium leading-snug"
                    style={{ color: isOpen && isColored ? "#ffffff" : undefined }}
                  >
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {/* Impact badge */}
                    <span
                      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        isOpen && isColored
                          ? "bg-white/20 text-white"
                          : isColored
                          ? "text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                      style={
                        isColored && !isOpen
                          ? { backgroundColor: bg, color: "#fff" }
                          : undefined
                      }
                    >
                      {item.impact}
                    </span>
                    {/* Severity badge */}
                    <span
                      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        isOpen && isColored
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
                    {/* Price effect */}
                    {item.price_effect !== 0 && (
                      <span
                        className={`text-[10px] font-semibold tabular-nums ${
                          isOpen && isColored
                            ? "text-white/80"
                            : item.price_effect > 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.price_effect > 0 ? "+" : ""}
                        {item.price_effect} INR
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 mt-0.5 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  } ${isOpen && isColored ? "text-white/70" : "text-muted-foreground"}`}
                />
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div
                  className="px-3 pb-4 sm:px-4 sm:pb-4 pt-0 border-t"
                  style={{
                    backgroundColor: bg,
                    borderColor: isColored ? "rgba(255,255,255,0.1)" : undefined,
                  }}
                >
                  <div className="pt-3">
                    <MarkdownRenderer
                      text={item.explanation_hinglish}
                      className={isColored ? "text-white/85" : "text-muted-foreground"}
                    />
                  </div>
                  <div
                    className="flex items-center gap-3 mt-2 text-[11px]"
                    style={{
                      color: isColored ? "rgba(255,255,255,0.6)" : undefined,
                    }}
                  >
                    <span className={!isColored ? "text-muted-foreground" : ""}>
                      {item.date}
                    </span>
                    <span className={!isColored ? "text-muted-foreground" : ""}>
                      {item.category}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
