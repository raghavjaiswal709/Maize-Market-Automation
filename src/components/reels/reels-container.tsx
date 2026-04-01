"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Fixed semantic dark color palette — one color per slide type.
 * Index maps to Overview slide order:
 *   0 Hero, 1 PriceHero, 2 AllPrices, 3 Sentiment,
 *   4 ForecastSummary, 5 ForecastDetail, 6 Buyers, 7 Sellers, 8 Factors
 * For extra slides it wraps around.
 */
const SLIDE_PALETTE: string[] = [
  "#0d1117", // 0 Hero        — near-black ink
  "#0a1628", // 1 PriceHero   — deep oxford blue
  "#0f2232", // 2 AllPrices   — dark navy
  "#0e1e16", // 3 Sentiment   — dark forest (neutral; sentiment-aware override possible)
  "#130a24", // 4 ForecastSum — deep indigo/violet
  "#1a0d2e", // 5 ForecastDet — deep purple
  "#0a1f1a", // 6 Buyers      — dark teal/green (growth)
  "#1f0a0f", // 7 Sellers     — dark crimson (risk)
  "#141020", // 8 Factors     — dark plum
];

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
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const touchDelta = useRef(0);
  // Each slide gets its fixed semantic dark color by index
  const palette = Array.from({ length: count }, (_, i) => SLIDE_PALETTE[i % SLIDE_PALETTE.length]);

  /** Navigate exactly one slide in the given direction */
  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= count || isAnimating.current) return;
      isAnimating.current = true;
      setCurrentIndex(idx);
      setTimeout(() => { slideRefs.current[idx]?.scrollTo({ top: 0 }); }, 10);
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
  // Allows native scrolling inside overflow-y-auto slide content.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 40; // px
    // Track whether the touch started inside an inner scrollable element
    let touchInScrollable = false;

    /** Walk up from target to see if it (or a parent) is a scrollable inner element */
    function isInsideScrollable(target: EventTarget | null): boolean {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        if (
          node.scrollHeight > node.clientHeight + 2 &&
          (getComputedStyle(node).overflowY === "auto" ||
            getComputedStyle(node).overflowY === "scroll")
        ) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchDelta.current = 0;
      touchInScrollable = isInsideScrollable(e.target);
    };

    const onTouchMove = (e: TouchEvent) => {
      touchDelta.current = touchStartY.current - e.touches[0].clientY;
      // If touch began inside a scrollable child, let native scroll handle it
      if (touchInScrollable) return;
      e.preventDefault(); // prevent native scroll only for slide-level swipes
    };

    const onTouchEnd = () => {
      if (isAnimating.current) return;
      if (touchInScrollable) {
        touchDelta.current = 0;
        return;
      }
      const slideEl = slideRefs.current[currentIndex];
      const slideScrollTop = slideEl?.scrollTop ?? 0;
      const slideScrollMax = (slideEl?.scrollHeight ?? 0) - (slideEl?.clientHeight ?? 0);
      if (touchDelta.current > SWIPE_THRESHOLD) {
        if (slideScrollTop < slideScrollMax - 4) return;
        scrollTo("down");
      } else if (touchDelta.current < -SWIPE_THRESHOLD) {
        if (slideScrollTop > 4) return;
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
  }, [scrollTo, currentIndex]);

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
                ref={(el) => { slideRefs.current[i] = el; }}
                className="h-dvh w-full overflow-y-auto overscroll-contain flex flex-col items-center px-6 sm:px-10"
                style={{
                  backgroundColor: bg,
                  color: text,
                  paddingTop: "4.5rem",
                  paddingBottom: "5rem",
                  justifyContent: "center",
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
