"use client";

import { Recommendations } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface RecommendationsCardProps {
  recommendations: Recommendations;
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const { buyers, sellers } = recommendations;

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {/* Buyers */}
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              For Buyers
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase rounded-sm">
              {buyers.action.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <MarkdownRenderer
            text={buyers.action_hinglish}
            className="text-foreground font-semibold"
          />
          <Separator />
          <MarkdownRenderer text={buyers.reason} className="text-muted-foreground" />
          <div className="flex items-center gap-4 text-xs">
            {buyers.target_price > 0 && (
              <div>
                <span className="text-muted-foreground">Target: </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {buyers.target_price.toLocaleString("en-IN")} INR/q
                </span>
              </div>
            )}
            {buyers.target_date && (
              <div>
                <span className="text-muted-foreground">By: </span>
                <span className="font-medium text-foreground">{buyers.target_date}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sellers */}
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              For Sellers
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase rounded-sm">
              {sellers.action.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <MarkdownRenderer
            text={sellers.action_hinglish}
            className="text-foreground font-semibold"
          />
          <Separator />
          <MarkdownRenderer text={sellers.reason} className="text-muted-foreground" />
          {sellers.alternative && (
            <div>
              <span className="text-xs font-medium text-foreground">Alternative: </span>
              <MarkdownRenderer text={sellers.alternative} className="text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
