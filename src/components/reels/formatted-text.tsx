"use client";

import { useState } from "react";

// ──────────────────────────────────────────────────────────────────
// Inline markdown-lite renderer
// Supports:
//   **bold**, *italic*, `code`
//   Auto-bold: ALL-CAPS Hinglish section headers ending with : or —
//     e.g. "KYA HUA:", "YE KYUN HOTA HAI:", "MATLAB KYA HAI —"
//   Auto-italic: text inside parentheses (...)
// ──────────────────────────────────────────────────────────────────

/**
 * Splits a segment of plain text (no markdown tokens) into further chunks
 * for auto-bold headers and auto-italic brackets.
 */
function parseAutoFormatting(text: string, startKey: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = startKey;

  while (remaining.length > 0) {
    // ── Auto-italic: (bracketed text) ──
    const bracketMatch = remaining.match(/^(.*?)\(([^)]+)\)([\s\S]*)/);
    if (bracketMatch) {
      const [, before, inside, after] = bracketMatch;
      if (before) nodes.push(<span key={key++}>{before}</span>);
      nodes.push(
        <em key={key++} className="italic opacity-80">
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

/**
 * Tokenises a single line/paragraph into bold/italic/code/auto-format spans.
 */
function parseInline(text: string): React.ReactNode[] {
  // Split on markdown tokens: **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  const nodes: React.ReactNode[] = [];
  let keyOffset = 0;

  parts.forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(
        <em key={i} className="italic opacity-85">
          {part.slice(1, -1)}
        </em>
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push(
        <code key={i} className="font-mono text-[0.85em] bg-white/20 rounded px-1">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      // Plain text — apply auto-formatting
      const autoNodes = parseAutoFormatting(part, i * 100 + keyOffset);
      keyOffset += autoNodes.length;
      nodes.push(...autoNodes);
    }
  });

  return nodes;
}

/**
 * Detects a Hinglish section header pattern at the start of a paragraph.
 * Matches patterns like:
 *   "KYA HUA:" / "KYA HUA —" / "YE KYUN HOTA HAI:" etc.
 * The header is ALLCAPS (allows spaces, numbers, Hindi chars).
 * Returns [headerText, restText] or null if not a header.
 */
function detectSectionHeader(line: string): [string, string] | null {
  // Pattern: ALL-CAPS words (possibly with spaces) followed by : or —
  const m = line.match(/^([A-Z][A-Z0-9 \u0900-\u097F\u0080-\u00FF]{1,60}?)(\s*[:—\-]{1,2}\s*)([\s\S]*)/);
  if (!m) return null;
  const header = m[1].trim();
  const rest = m[3].trim();
  // Must be at least 3 chars and contain at least 2 uppercase letters
  if (header.length < 3) return null;
  const upperCount = (header.match(/[A-Z]/g) || []).length;
  if (upperCount < 2) return null;
  return [header + m[2].trimEnd(), rest];
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
      if (!combined) return;

      // Check for Hinglish section header pattern
      const headerResult = detectSectionHeader(combined);
      if (headerResult) {
        const [header, body] = headerResult;
        nodes.push(
          <div key={pi} className="space-y-0.5">
            <p className="text-xs font-black uppercase tracking-wider text-white/90">
              {header}
            </p>
            {body && (
              <p className={`text-sm leading-relaxed ${textColorClass}`}>
                {parseInline(body)}
              </p>
            )}
          </div>
        );
      } else {
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
