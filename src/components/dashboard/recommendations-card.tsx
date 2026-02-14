"use client";

import { Recommendations } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RecommendationsCardProps {
  recommendations: Recommendations;
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const { buyers, sellers } = recommendations;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Buyers */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              For Buyers
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase">
              {buyers.action.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base font-semibold text-foreground leading-snug">
            {buyers.action_hinglish}
          </p>
          <Separator />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {buyers.reason}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Target: </span>
              <span className="font-semibold tabular-nums text-foreground">
                {buyers.target_price.toLocaleString("en-IN")} INR/q
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">By: </span>
              <span className="font-medium text-foreground">{buyers.target_date}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sellers */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              For Sellers
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase">
              {sellers.action.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base font-semibold text-foreground leading-snug">
            {sellers.action_hinglish}
          </p>
          <Separator />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {sellers.reason}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Alternative: </span>
            {sellers.alternative}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
