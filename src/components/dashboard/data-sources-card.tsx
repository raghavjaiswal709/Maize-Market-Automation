"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Data Sources & Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
    </Card>
  );
}
