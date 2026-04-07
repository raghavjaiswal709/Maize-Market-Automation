"use client";

import React from "react";

// ──────────────────────────────────────────────────────────────────
// Dashboard Markdown Renderer (light-mode)
// Supports: **bold**, *italic*, `code`
// Auto-bold: ALL-CAPS Hinglish section headers ending with : or —
// Paragraphs split by \n\n, bullet lists with - or •
// Used across all dashboard cards for proper Hinglish text rendering
// ──────────────────────────────────────────────────────────────────

function parseAutoFormatting(text: string, startKey: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = startKey;

  while (remaining.length > 0) {
    const bracketMatch = remaining.match(/^(.*?)\(([^)]+)\)([\s\S]*)/);
    if (bracketMatch) {
      const [, before, inside, after] = bracketMatch;
      if (before) nodes.push(<span key={key++}>{before}</span>);
      nodes.push(
        <em key={key++} className="italic opacity-70">
          ({inside})
        </em>
      );
      remaining = after;
      continue;
    }
    nodes.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return nodes;
}

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  const nodes: React.ReactNode[] = [];
  let keyOffset = 0;

  parts.forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(
        <em key={i} className="italic opacity-80">
          {part.slice(1, -1)}
        </em>
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push(
        <code
          key={i}
          className="font-mono text-[0.85em] bg-muted rounded px-1 py-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    } else {
      const autoNodes = parseAutoFormatting(part, i * 100 + keyOffset);
      keyOffset += autoNodes.length;
      nodes.push(...autoNodes);
    }
  });

  return nodes;
}

function detectSectionHeader(line: string): [string, string] | null {
  const m = line.match(
    /^([A-Z][A-Z0-9 \u0900-\u097F\u0080-\u00FF]{1,60}?)(\s*[:—\-]{1,2}\s*)([\s\S]*)/
  );
  if (!m) return null;
  const header = m[1].trim();
  const rest = m[3].trim();
  if (header.length < 3) return null;
  const upperCount = (header.match(/[A-Z]/g) || []).length;
  if (upperCount < 2) return null;
  return [header + m[2].trimEnd(), rest];
}

function renderBlock(text: string, className: string): React.ReactNode[] {
  const paragraphs = text.split(/\n\n+/);
  const nodes: React.ReactNode[] = [];

  paragraphs.forEach((para, pi) => {
    const lines = para.trim().split("\n");

    const allBullets = lines.every(
      (l) => l.trim().startsWith("- ") || l.trim().startsWith("• ")
    );

    if (allBullets) {
      nodes.push(
        <ul key={pi} className="space-y-1 list-none pl-0 my-1">
          {lines.map((line, li) => (
            <li
              key={li}
              className={`flex items-start gap-1.5 text-xs leading-relaxed ${className}`}
            >
              <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-current opacity-50" />
              <span>{parseInline(line.replace(/^[-•]\s*/, ""))}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      const combined = lines.join(" ").trim();
      if (!combined) return;

      const headerResult = detectSectionHeader(combined);
      if (headerResult) {
        const [header, body] = headerResult;
        nodes.push(
          <div key={pi} className="space-y-0.5 my-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/90">
              {header}
            </p>
            {body && (
              <p className={`text-xs leading-relaxed ${className}`}>
                {parseInline(body)}
              </p>
            )}
          </div>
        );
      } else {
        nodes.push(
          <p key={pi} className={`text-xs leading-relaxed ${className}`}>
            {parseInline(combined)}
          </p>
        );
      }
    }
  });

  return nodes;
}

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

export function MarkdownRenderer({
  text,
  className = "text-muted-foreground",
}: MarkdownRendererProps) {
  if (!text) return null;

  return (
    <div className="space-y-1.5">
      {renderBlock(text, className)}
    </div>
  );
}
