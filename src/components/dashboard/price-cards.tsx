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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {entries.map(([key, label]) => {
        const value = prices[key as keyof CurrentPrices] as number;
        return (
          <Card key={key} className="border border-border">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {value.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {prices.unit}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
