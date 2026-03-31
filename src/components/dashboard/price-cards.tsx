"use client";

import { CurrentPrices } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceCardsProps {
  prices: CurrentPrices;
}

const priceLabels: Record<string, string> = {
  bihar_avg: "Bihar Avg",
  purnea: "Purnea",
  indore: "Indore",
  all_india_avg: "All India Avg",
};

export function PriceCards({ prices }: PriceCardsProps) {
  const entries = Object.entries(priceLabels);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
      {entries.map(([key, label]) => {
        const value = prices[key as keyof CurrentPrices] as number;
        return (
          <Card key={key} className="border border-border">
            <CardHeader className="pb-0.5 pt-3 px-3 sm:pb-1 sm:pt-4 sm:px-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
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
