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
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const touchDelta = useRef(0);
  const [palette] = useState(() => {
    const shuffled = shuffle(COLORS);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(shuffled[i % shuffled.length]);
    }
    return result;
  });

  /** Navigate exactly one slide in the given direction */
  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= count || isAnimating.current) return;
      isAnimating.current = true;
      setCurrentIndex(idx);
      // Unlock after the CSS transition finishes
      setTimeout(() => {
        isAnimating.current = false;
      }, 420);
    },
    [count]
  );

  const scrollTo = useCallback(
    (direction: "up" | "down") => {
      const next = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      goTo(next);
    },
    [currentIndex, goTo]
  );

  // ── Touch handling: one swipe = one slide, strictly ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 40; // px – minimum drag to trigger a slide change

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchDelta.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // prevent native scroll
      touchDelta.current = touchStartY.current - e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      if (isAnimating.current) return;
      if (touchDelta.current > SWIPE_THRESHOLD) {
        // Swiped up → next slide
        scrollTo("down");
      } else if (touchDelta.current < -SWIPE_THRESHOLD) {
        // Swiped down → prev slide
        scrollTo("up");
      }
      touchDelta.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scrollTo]);

  // ── Mouse-wheel handling: one wheel burst = one slide ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating.current) return;
      if (e.deltaY > 20) {
        scrollTo("down");
      } else if (e.deltaY < -20) {
        scrollTo("up");
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollTo]);

  if (count === 0) return null;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Slide track — translated via CSS transform, no native scrolling */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <div
          className="w-full transition-transform duration-400 ease-out"
          style={{
            transform: `translateY(-${currentIndex * 100}dvh)`,
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
      </div>

      {/* Navigation dots */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
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

      {/* Up/Down arrows — right edge */}
      <div className="absolute right-3 bottom-16 z-10 flex flex-col gap-2">
        {currentIndex > 0 && (
          <button
            onClick={() => scrollTo("up")}
            className="p-2 rounded-full backdrop-blur-sm transition-opacity"
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
            className="p-2 rounded-full backdrop-blur-sm animate-bounce transition-opacity"
            style={{
              backgroundColor: `${contrastText(palette[currentIndex])}20`,
              color: contrastText(palette[currentIndex]),
            }}
            aria-label="Next slide"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

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
