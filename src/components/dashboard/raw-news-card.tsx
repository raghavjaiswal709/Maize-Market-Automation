"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/components/language-provider";

interface RawNewsCardProps {
  content: string;
}

export function RawNewsCard({ content }: RawNewsCardProps) {
  const { lang } = useLanguage();

  // Convert markdown-style content to readable paragraphs
  const lines = content
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      // Strip markdown headings and bold markers for clean display
      return line
        .replace(/^#+\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/\[\d+\]/g, "");
    });

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {lang === "hindi" ? "विस्तृत बाजार जानकारी" : "Detailed Market Intelligence"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6 pb-4">
          <div className="space-y-2.5 pr-4">
            {lines.map((line, i) => {
              // Section headers (originally ## or #)
              const isHeader =
                line.startsWith("Current Market") ||
                line.startsWith("Maize Market") ||
                line.startsWith("Limitations") ||
                line.includes("Prices") ||
                line.includes("District");

              if (isHeader) {
                return (
                  <p
                    key={i}
                    className="text-xs font-semibold text-foreground uppercase tracking-wide pt-2"
                  >
                    {line}
                  </p>
                );
              }

              if (line.startsWith("---")) {
                return <hr key={i} className="border-border my-2" />;
              }

              if (line.startsWith("- ")) {
                return (
                  <p key={i} className="text-xs text-muted-foreground pl-3 leading-relaxed">
                    {line}
                  </p>
                );
              }

              return (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                  {line}
                </p>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
