"use client";

import { useState } from "react";

// ──────────────────────────────────────────────────────────────────
// Inline markdown-lite renderer
// Supports: **bold**, *italic*, `code`, - bullet lists, \n\n paragraphs
// ──────────────────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="font-mono text-[0.85em] bg-white/20 rounded px-1">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function renderBlock(text: string, textColorClass: string): React.ReactNode[] {
  const paragraphs = text.split(/\n\n+/);
  const nodes: React.ReactNode[] = [];

  paragraphs.forEach((para, pi) => {
    const lines = para.trim().split("\n");

    const allBullets = lines.every(
      (l) => l.trim().startsWith("- ") || l.trim().startsWith("• ")
    );

    if (allBullets) {
      nodes.push(
        <ul key={pi} className="space-y-1 list-none pl-0">
          {lines.map((line, li) => (
            <li
              key={li}
              className={`flex items-start gap-1.5 text-sm leading-relaxed ${textColorClass}`}
            >
              <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              <span>{parseInline(line.replace(/^[-•]\s*/, ""))}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      const combined = lines.join(" ").trim();
      if (combined) {
        nodes.push(
          <p key={pi} className={`text-sm leading-relaxed ${textColorClass}`}>
            {parseInline(combined)}
          </p>
        );
      }
    }
  });

  return nodes;
}

// ──────────────────────────────────────────────────────────────────
// Safe truncation — never cut inside a markdown token
// ──────────────────────────────────────────────────────────────────

function safePreview(text: string, limit: number): string {
  const stripped = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

  if (stripped.length <= limit) return text;

  // Walk original text counting only visible chars
  let visibleCount = 0;
  let i = 0;
  while (i < text.length && visibleCount < limit) {
    if (text[i] === "*" && text[i + 1] === "*") { i += 2; continue; }
    if (text[i] === "*") { i++; continue; }
    if (text[i] === "`") { i++; continue; }
    visibleCount++;
    i++;
  }

  // Snap to last whitespace to avoid mid-word cuts
  let cutPos = i;
  while (cutPos > 0 && text[cutPos - 1] !== " " && text[cutPos - 1] !== "\n") {
    cutPos--;
  }
  if (cutPos === 0) cutPos = i;

  return text.slice(0, cutPos).trimEnd() + "…";
}

// ──────────────────────────────────────────────────────────────────
// Main FormattedText — inline expand/collapse, NO modal/overlay
// ──────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 260;

interface FormattedTextProps {
  text: string;
  textColorClass?: string;
  limit?: number;
  // kept for API compat but unused (no modal anymore)
  modalTitle?: string;
  modalBgColor?: string;
}

export function FormattedText({
  text,
  textColorClass = "text-white/75",
  limit = DEFAULT_LIMIT,
}: FormattedTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const plainLen = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1").length;

  const needsTruncation = plainLen > limit;
  const displayText = expanded || !needsTruncation ? text : safePreview(text, limit);

  return (
    <div className="space-y-2">
      {renderBlock(displayText, textColorClass)}

      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-1 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all"
        >
          {expanded ? "Show Less ↑" : "Read More ↓"}
        </button>
      )}
    </div>
  );
}
