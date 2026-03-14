"use client";

import { CurrentPrices } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";

interface PriceCardsProps {
  prices: CurrentPrices;
}

const priceLabels: Record<string, { hinglish: string; hindi: string }> = {
  bihar_avg: { hinglish: "Bihar Avg", hindi: "बिहार औसत" },
  purnea: { hinglish: "Purnea", hindi: "पूर्णिया" },
  indore: { hinglish: "Indore", hindi: "इंदौर" },
  all_india_avg: { hinglish: "All India Avg", hindi: "अखिल भारत औसत" },
};

export function PriceCards({ prices }: PriceCardsProps) {
  const { lang } = useLanguage();
  const entries = Object.entries(priceLabels);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
      {entries.map(([key, labels]) => {
        const value = prices[key as keyof CurrentPrices] as number;
        return (
          <Card key={key} className="border border-border">
            <CardHeader className="pb-0.5 pt-3 px-3 sm:pb-1 sm:pt-4 sm:px-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {lang === "hindi" ? labels.hindi : labels.hinglish}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              <p className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground">
                {value > 0 ? `₹${value.toLocaleString("en-IN")}` : "—"}
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                {prices.unit}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
