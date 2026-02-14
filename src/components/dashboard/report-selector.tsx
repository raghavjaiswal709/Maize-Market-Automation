"use client";

import { DailyReport } from "@/types/report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportSelectorProps {
  reports: DailyReport[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ReportSelector({ reports, selectedId, onSelect }: ReportSelectorProps) {
  if (reports.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">Report:</span>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {reports.map((r) => (
            <SelectItem key={r._id} value={r._id} className="text-xs">
              {r.date} &middot; {r.time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
