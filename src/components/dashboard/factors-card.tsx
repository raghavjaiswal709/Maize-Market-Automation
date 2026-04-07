"use client";

import { useState } from "react";
import { Factors } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, ShieldAlert, ShieldCheck, Scale } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface FactorsCardProps {
  factors: Factors;
}

export function FactorsCard({ factors }: FactorsCardProps) {
  // openSection: which section accordion is open (null = all collapsed)
  const [openSection, setOpenSection] = useState<string | null>(null);
  // openItem: composite key "${sectionLabel}-${index}" for true mutual exclusion
  const [openItem, setOpenItem] = useState<string | null>(null);

  const sections = [
    {
      key: "bullish" as keyof Factors,
      label: "Bullish",
      icon: ShieldCheck,
      accentClass: "text-green-600",
      bgClass: "bg-green-50 dark:bg-green-950/30",
      borderClass: "border-green-200 dark:border-green-900",
      itemBgClass: "bg-green-50/60 dark:bg-green-950/20",
      countClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    },
    {
      key: "bearish" as keyof Factors,
      label: "Bearish",
      icon: ShieldAlert,
      accentClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950/30",
      borderClass: "border-red-200 dark:border-red-900",
      itemBgClass: "bg-red-50/60 dark:bg-red-950/20",
      countClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    },
    {
      key: "neutral" as keyof Factors,
      label: "Neutral",
      icon: Scale,
      accentClass: "text-slate-500",
      bgClass: "bg-slate-50 dark:bg-slate-900/30",
      borderClass: "border-slate-200 dark:border-slate-800",
      itemBgClass: "bg-slate-50/60 dark:bg-slate-900/20",
      countClass: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
    },
  ];

  function toggleSection(label: string) {
    if (openSection === label) {
      setOpenSection(null);
      setOpenItem(null);
    } else {
      setOpenSection(label);
      setOpenItem(null);
    }
  }

  function toggleItem(sectionLabel: string, idx: number) {
    const key = `${sectionLabel}-${idx}`;
    setOpenItem((prev) => (prev === key ? null : key));
  }

  return (
    <Card className="border border-border w-full overflow-hidden rounded-none">
      <CardHeader className="pb-0 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Market Factors
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-2 space-y-0">
        {sections.map(({ key, label, icon: SectionIcon, accentClass, bgClass, borderClass, itemBgClass, countClass }) => {
          const items = factors[key];
          if (!items || items.length === 0) return null;
          const isSectionOpen = openSection === label;

          return (
            <div
              key={key}
              className={`border-t border-border overflow-hidden`}
            >
              {/* Section header */}
              <button
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${isSectionOpen ? bgClass : "hover:bg-muted/40"}`}
                onClick={() => toggleSection(label)}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon className={`h-3.5 w-3.5 ${accentClass}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${accentClass}`}>
                    {label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${countClass}`}>
                    {items.length}
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${accentClass} ${isSectionOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Factor items */}
              {isSectionOpen && (
                <div className={`divide-y divide-border border-t ${borderClass}`}>
                  {items.map((factor: string, fi: number) => {
                    const itemKey = `${label}-${fi}`;
                    const isItemOpen = openItem === itemKey;

                    return (
                      <div key={fi} className={isItemOpen ? itemBgClass : ""}>
                        {/* Factor row */}
                        <button
                          className="w-full flex items-start justify-between px-4 py-2.5 text-left gap-2 transition-colors hover:bg-muted/30"
                          onClick={() => toggleItem(label, fi)}
                        >
                          <span className="text-xs text-foreground leading-snug flex-1">
                            {factor.length > 80 ? `${factor.slice(0, 80).trimEnd()}…` : factor}
                          </span>
                          <ChevronRight
                            className={`h-3.5 w-3.5 shrink-0 mt-0.5 transition-transform duration-200 text-muted-foreground ${isItemOpen ? "rotate-90" : ""}`}
                          />
                        </button>

                        {/* Expanded detail */}
                        {isItemOpen && (
                          <div className="px-4 pb-3 pt-0.5 border-t border-dashed border-border/60">
                            <MarkdownRenderer
                              text={factor}
                              className="text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
