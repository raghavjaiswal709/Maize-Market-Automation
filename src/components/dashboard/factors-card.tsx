"use client";

import { Factors } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FactorsCardProps {
  factors: Factors;
}

export function FactorsCard({ factors }: FactorsCardProps) {
  const sections: { key: keyof Factors; label: string; color: string }[] = [
    { key: "bearish", label: "Bearish", color: "destructive" as const },
    { key: "bullish", label: "Bullish", color: "default" as const },
    { key: "neutral", label: "Neutral", color: "secondary" as const },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Market Factors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map(({ key, label, color }) => (
          <div key={key} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {factors[key].map((factor) => (
                <Badge
                  key={factor}
                  variant={color as "destructive" | "default" | "secondary"}
                  className="text-[10px] sm:text-xs font-normal"
                >
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
