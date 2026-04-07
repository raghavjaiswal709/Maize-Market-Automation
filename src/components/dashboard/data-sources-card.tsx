"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";

interface DataSourcesCardProps {
  sources: string[];
  metadata: {
    report_version: string;
    automation: string;
    fetch_method: string;
    runtime: string;
  };
}

export function DataSourcesCard({ sources, metadata }: DataSourcesCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border border-border rounded-none overflow-hidden">
      {/* Clickable header — toggles expanded/collapsed */}
      <CardHeader
        className="pb-3 cursor-pointer select-none hover:bg-muted/40 transition-colors"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Data Sources & Metadata
          </CardTitle>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1.5">
            {sources.map((source) => (
              <p key={source} className="text-xs text-muted-foreground">
                {source}
              </p>
            ))}
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-y-1.5 text-[11px] sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2 sm:text-xs">
            <div>
              <span className="text-muted-foreground">Version: </span>
              <span className="font-medium text-foreground">{metadata.report_version}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Automation: </span>
              <span className="font-medium text-foreground">{metadata.automation}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Method: </span>
              <span className="font-medium text-foreground">{metadata.fetch_method}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Runtime: </span>
              <span className="font-medium text-foreground">{metadata.runtime}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
