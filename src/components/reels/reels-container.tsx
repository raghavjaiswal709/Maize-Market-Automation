"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Color palette for reel slide backgrounds.
 * Cycles randomly through these on mount.
 */
const COLORS = [
  "#264653", // deep teal
  "#2a9d8f", // persian green
  "#e9c46a", // maize gold
  "#f4a261", // sandy brown
  "#e76f51", // burnt sienna
  "#1d3557", // prussian blue
  "#457b9d", // steel blue
  "#a8dadc", // powder blue
  "#6d6875", // old lavender
  "#b5838d", // puce
  "#3d405b", // space cadet
  "#81b29a", // cambridge green
  "#f2cc8f", // sunset
  "#0b525b", // midnight green
  "#5f0f40", // tyrian purple
  "#9a031e", // ruby red
  "#fb8500", // orange
  "#023047", // oxford blue
  "#219ebc", // cerulean
  "#8ecae6", // sky blue
];

/**
 * Shuffles array (Fisher–Yates) and returns it.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns white or black text color depending on background luminance.
 */
function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a2e" : "#ffffff";
}

/**
 * Returns a muted version of the text color for secondary text.
 */
function contrastMuted(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "rgba(26,26,46,0.6)" : "rgba(255,255,255,0.65)";
}

export interface SlideColors {
  bg: string;
  text: string;
  muted: string;
}

interface ReelsContainerProps {
  /** Number of slides */
  count: number;
  /** Render function — receives slide index and computed colors */
  renderSlide: (index: number, colors: SlideColors) => React.ReactNode;
}

export function ReelsContainer({ count, renderSlide }: ReelsContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [palette] = useState(() => {
    const shuffled = shuffle(COLORS);
    // Extend if needed to cover all slides
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(shuffled[i % shuffled.length]);
    }
    return result;
  });

  // Track current slide from scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const idx = Math.round(scrollTop / height);
    setCurrentIndex(Math.min(idx, count - 1));
  }, [count]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (direction: "up" | "down") => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const targetIdx = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= count) return;
    containerRef.current.scrollTo({
      top: targetIdx * height,
      behavior: "smooth",
    });
  };

  if (count === 0) return null;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const bg = palette[i];
          const text = contrastText(bg);
          const muted = contrastMuted(bg);
          return (
            <div
              key={i}
              className="h-dvh w-full flex items-center justify-center px-6 py-16 sm:px-10"
              style={{
                scrollSnapAlign: "start",
                backgroundColor: bg,
                color: text,
              }}
            >
              <div className="w-full max-w-lg mx-auto">
                {renderSlide(i, { bg, text, muted })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation dots */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              containerRef.current?.scrollTo({
                top: i * (containerRef.current?.clientHeight || 0),
                behavior: "smooth",
              });
            }}
            className="transition-all duration-300"
            style={{
              width: i === currentIndex ? 10 : 6,
              height: i === currentIndex ? 10 : 6,
              borderRadius: "50%",
              backgroundColor:
                i === currentIndex
                  ? contrastText(palette[currentIndex])
                  : contrastMuted(palette[currentIndex]),
              opacity: i === currentIndex ? 1 : 0.5,
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Up/Down arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => scrollTo("up")}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full backdrop-blur-sm transition-opacity"
          style={{
            backgroundColor: `${contrastText(palette[currentIndex])}20`,
            color: contrastText(palette[currentIndex]),
          }}
          aria-label="Previous slide"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
      {currentIndex < count - 1 && (
        <button
          onClick={() => scrollTo("down")}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full backdrop-blur-sm animate-bounce transition-opacity"
          style={{
            backgroundColor: `${contrastText(palette[currentIndex])}20`,
            color: contrastText(palette[currentIndex]),
          }}
          aria-label="Next slide"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}

      {/* Slide counter */}
      <div
        className="absolute bottom-4 right-3 z-10 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full backdrop-blur-sm"
        style={{
          backgroundColor: `${contrastText(palette[currentIndex])}15`,
          color: contrastText(palette[currentIndex]),
        }}
      >
        {currentIndex + 1}/{count}
      </div>
    </div>
  );
}
