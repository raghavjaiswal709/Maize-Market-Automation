"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface RawNewsCardProps {
  content: string;
}

export function RawNewsCard({ content }: RawNewsCardProps) {
  return (
    <Card className="border border-border rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Detailed Market Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownRenderer text={content} className="text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
