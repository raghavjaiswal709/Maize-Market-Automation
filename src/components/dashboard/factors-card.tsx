"use client";

import { Factors } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";

interface FactorsCardProps {
  factors: Factors;
}

export function FactorsCard({ factors }: FactorsCardProps) {
  const { lang } = useLanguage();

  const sections: { key: keyof Factors; label: string; color: string }[] = [
    { key: "bearish", label: lang === "hindi" ? "मंदी कारण" : "Bearish", color: "destructive" as const },
    { key: "bullish", label: lang === "hindi" ? "तेजी कारण" : "Bullish", color: "default" as const },
    { key: "neutral", label: lang === "hindi" ? "तटस्थ" : "Neutral", color: "secondary" as const },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {lang === "hindi" ? "बाजार कारक" : "Market Factors"}
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
                  className="text-xs font-normal"
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
