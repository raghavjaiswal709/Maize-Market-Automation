"use client";

import { Prediction } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PredictionTableProps {
  predictions: Prediction[];
}

/**
 * Return 1-3 arrow characters based on magnitude of change.
 * Thresholds: |change| 0 = "—", 1-10 = 1 arrow, 11-25 = 2, 26+ = 3
 */
function getArrows(change: number): { arrows: string; level: number } {
  const abs = Math.abs(change);
  if (abs === 0) return { arrows: "—", level: 0 };

  const isUp = change > 0;
  const arrow = isUp ? "↑" : "↓";

  if (abs >= 26) return { arrows: `${arrow}${arrow}${arrow}`, level: 3 };
  if (abs >= 11) return { arrows: `${arrow}${arrow}`, level: 2 };
  return { arrows: arrow, level: 1 };
}

function getArrowColor(change: number): string {
  if (change > 0) return "text-emerald-600 dark:text-emerald-400";
  if (change < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

export function PredictionTable({ predictions }: PredictionTableProps) {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Forecast Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 sm:px-0">
        {/* Mobile: compact card rows */}
        <div className="divide-y divide-border">
          {predictions.map((p) => {
            const { arrows } = getArrows(p.change);
            const color = getArrowColor(p.change);

            return (
              <div
                key={p.day}
                className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-6"
              >
                {/* Left: Day + Date */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 tabular-nums">
                    {p.day}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {p.date_formatted}
                  </span>
                </div>

                {/* Right: Price + Arrows */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    ₹{p.price > 0 ? p.price.toLocaleString("en-IN") : "—"}
                  </span>
                  <span
                    className={`text-sm font-bold w-10 text-right ${color}`}
                    title={`${p.change > 0 ? "+" : ""}${p.change}`}
                  >
                    {arrows}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
