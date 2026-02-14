"use client";

import { Prediction } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PredictionTableProps {
  predictions: Prediction[];
}

export function PredictionTable({ predictions }: PredictionTableProps) {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Forecast Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs w-[60px]">Day</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs text-right">Price</TableHead>
                <TableHead className="text-xs text-right">Change</TableHead>
                <TableHead className="text-xs text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((p) => (
                <TableRow key={p.day} className="text-sm">
                  <TableCell className="font-medium tabular-nums">{p.day}</TableCell>
                  <TableCell className="text-muted-foreground">{p.date_formatted}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {p.price.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${
                      p.change < 0
                        ? "text-red-600 dark:text-red-400"
                        : p.change > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p.change > 0 ? "+" : ""}
                    {p.change}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center text-xs font-medium capitalize ${
                        p.trend === "down"
                          ? "text-red-600 dark:text-red-400"
                          : p.trend === "up"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {p.trend}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
