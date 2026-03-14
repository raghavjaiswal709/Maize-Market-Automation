"use client";

import { useMemo, useState } from "react";
import { DailyReport } from "@/types/report";
import { useLanguage } from "@/components/language-provider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ReportSelectorProps {
  reports: DailyReport[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Group reports by date → within each date, label variants by model.
 * If a model appears multiple times on the same date, append (1), (2), etc.
 */
function buildDateMap(reports: DailyReport[]) {
  const dateMap: Record<string, DailyReport[]> = {};
  for (const r of reports) {
    const d = r.date; // "2026-02-18"
    if (!dateMap[d]) dateMap[d] = [];
    dateMap[d].push(r);
  }

  // Sort reports within each date by timestamp (latest first)
  for (const d of Object.keys(dateMap)) {
    dateMap[d].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }

  return dateMap;
}

/** Generate variant tab labels like "Perplexity Sonar Pro (1)", "Perplexity Research" */
function buildVariantLabels(variants: DailyReport[]): { id: string; label: string; time: string }[] {
  // Count occurrences per model label
  const modelCounts: Record<string, number> = {};
  for (const v of variants) {
    const m = v.model_label || "Unknown";
    modelCounts[m] = (modelCounts[m] || 0) + 1;
  }

  // Track how many of each model we've seen so far
  const modelSeen: Record<string, number> = {};

  return variants.map((v) => {
    const m = v.model_label || "Unknown";
    modelSeen[m] = (modelSeen[m] || 0) + 1;

    let label = m;
    if (modelCounts[m] > 1) {
      label = `${m} (${modelSeen[m]})`;
    }

    return { id: v._id, label, time: v.time };
  });
}

export function ReportSelector({ reports, selectedId, onSelect }: ReportSelectorProps) {
  const { lang } = useLanguage();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Build date → reports map
  const dateMap = useMemo(() => buildDateMap(reports), [reports]);
  const availableDates = useMemo(() => Object.keys(dateMap).sort().reverse(), [dateMap]);

  // Current report & its date
  const currentReport = reports.find((r) => r._id === selectedId) || reports[0];
  const selectedDate = currentReport?.date || availableDates[0] || "";

  // Variants for the selected date
  const variants = dateMap[selectedDate] || [];
  const variantLabels = useMemo(() => buildVariantLabels(variants), [variants]);

  // Dates that have reports (for calendar highlighting)
  const reportDates = useMemo(
    () => availableDates.map((d) => parseISO(d)),
    [availableDates]
  );

  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const reportsOnDate = dateMap[dateStr];
    if (reportsOnDate && reportsOnDate.length > 0) {
      // Select the first (latest) variant for the chosen date
      onSelect(reportsOnDate[0]._id);
    }
    setCalendarOpen(false);
  };

  // Handle variant tab click
  const handleVariantClick = (id: string) => {
    onSelect(id);
  };

  if (reports.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Calendar date picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-2 text-xs font-medium"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>
                {selectedDate
                  ? format(parseISO(selectedDate), "dd MMM yyyy")
                  : lang === "hindi"
                  ? "तारीख चुनें"
                  : "Select Date"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? parseISO(selectedDate) : undefined}
              onSelect={handleDateSelect}
              modifiers={{
                hasReport: reportDates,
              }}
              modifiersClassNames={{
                hasReport:
                  "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
              }}
              disabled={(date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                return !dateMap[dateStr];
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Show date info */}
        <span className="text-xs text-muted-foreground">
          {variants.length > 1
            ? lang === "hindi"
              ? `${variants.length} रिपोर्ट उपलब्ध`
              : `${variants.length} reports available`
            : ""}
        </span>
      </div>

      {/* Model variant tabs — only show if multiple variants on selected date */}
      {variants.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
          {variantLabels.map(({ id, label, time }) => {
            const isActive = id === currentReport._id;
            return (
              <button
                key={id}
                onClick={() => handleVariantClick(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                  {time}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
