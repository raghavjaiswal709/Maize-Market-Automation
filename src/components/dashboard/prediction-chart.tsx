"use client";

import { Prediction } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface PredictionChartProps {
  predictions: Prediction[];
  currentPrice: number;
}

export function PredictionChart({ predictions, currentPrice }: PredictionChartProps) {
  const data = [
    { date_formatted: "Today", price: currentPrice, change: 0 },
    ...predictions,
  ];

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices) - 20;
  const maxPrice = Math.max(...prices) + 20;

  const overallChange = predictions[predictions.length - 1].price - currentPrice;
  const isDown = overallChange < 0;

  return (
    <Card className="border border-border rounded-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            10-Day Price Forecast
          </CardTitle>
          <span
            className={`text-sm font-semibold tabular-nums ${
              isDown ? "text-red-500" : "text-emerald-500"
            }`}
          >
            {overallChange > 0 ? "+" : ""}
            {overallChange} INR
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-3 px-2 sm:px-6 sm:pb-4">
        <div className="h-50 w-full sm:h-70">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isDown ? "hsl(0, 72%, 51%)" : "hsl(160, 84%, 39%)"}
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor={isDown ? "hsl(0, 72%, 51%)" : "hsl(160, 84%, 39%)"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date_formatted"
                tick={{ fontSize: 9 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 9 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v.toLocaleString("en-IN")}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number | undefined) => [
                  `${(value ?? 0).toLocaleString("en-IN")} INR/q`,
                  "Price",
                ]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isDown ? "hsl(0, 72%, 51%)" : "hsl(160, 84%, 39%)"}
                strokeWidth={2}
                fill="url(#priceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
