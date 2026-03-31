"use client";

import { useMemo } from "react";
import { DailyReport } from "@/types/report";
import { format, parseISO } from "date-fns";
import {
  X,
  Calendar,
  FileText,
  ChevronRight,
} from "lucide-react";

interface ReportSidebarProps {
  open: boolean;
  onClose: () => void;
  reports: DailyReport[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Group reports by date, sorted newest first */
function groupByDate(reports: DailyReport[]) {
  const map: Record<string, DailyReport[]> = {};
  for (const r of reports) {
    const d = r.date;
    if (!map[d]) map[d] = [];
    map[d].push(r);
  }
  // Sort within each date by timestamp descending
  for (const d of Object.keys(map)) {
    map[d].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }
  // Return sorted dates (newest first)
  const sortedDates = Object.keys(map).sort().reverse();
  return { map, sortedDates };
}

export function ReportSidebar({
  open,
  onClose,
  reports,
  selectedId,
  onSelect,
}: ReportSidebarProps) {
  const { map, sortedDates } = useMemo(() => groupByDate(reports), [reports]);

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 z-70 h-full w-72 sm:w-80 bg-background border-r border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Reports</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Report list */}
        <div className="overflow-y-auto h-[calc(100%-49px)] pb-8">
          {sortedDates.map((dateStr) => {
            const reportsOnDate = map[dateStr];
            const dateObj = parseISO(dateStr);
            const formattedDate = format(dateObj, "dd MMM yyyy, EEEE");
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

            return (
              <div key={dateStr}>
                {/* Date header */}
                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-muted/80 backdrop-blur-sm border-b border-border/50">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                    {formattedDate}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground uppercase">
                      Today
                    </span>
                  )}
                </div>

                {/* Reports for this date */}
                {reportsOnDate.map((r, idx) => {
                  const isSelected = r._id === selectedId;
                  const label = `Report ${idx + 1}`;
                  const model = r.model_label || "Unknown";

                  return (
                    <button
                      key={r._id}
                      onClick={() => {
                        onSelect(r._id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-border/30 ${
                        isSelected
                          ? "bg-primary/10 border-l-2 border-l-primary"
                          : "hover:bg-accent/60"
                      }`}
                    >
                      <FileText
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {label}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {model}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {r.time}
                        </span>
                      </div>
                      {isSelected && (
                        <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {sortedDates.length === 0 && (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              No reports available
            </div>
          )}
        </div>
      </div>
    </>
  );
}
