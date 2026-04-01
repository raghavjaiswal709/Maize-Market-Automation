"use client";

import { NewsItem } from "@/types/report";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  AlertTriangle,
  Info,
  Zap,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { FormattedText } from "./formatted-text";

interface NewsReelsProps {
  items: NewsItem[];
  reportDate: string;
}

/** Get bg color based on news impact sentiment */
function sentimentBg(impact: string): string {
  if (impact === "up") return "#0B9981";
  if (impact === "down") return "#F23645";
  return "#1a1a2e"; // neutral fallback — dark
}

// ──────────────────────────────────────────────
// Single news card slide
// ──────────────────────────────────────────────
function NewsSlide({ item }: { item: NewsItem }) {
  const ImpactIcon =
    item.impact === "up" ? TrendingUp : item.impact === "down" ? TrendingDown : Minus;

  const SeverityIcon =
    item.severity === "high"
      ? AlertTriangle
      : item.severity === "medium"
        ? Zap
        : Info;

  const severityLabel =
    item.severity === "high" ? "High Impact" : item.severity === "medium" ? "Medium" : "Low";

  return (
    <div className="flex flex-col gap-5">
      {/* Category + severity badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
          {item.category}
        </span>
        <span className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white">
          <SeverityIcon className="h-3 w-3" />
          {severityLabel}
        </span>
      </div>

      {/* Headline */}
      <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white">
        {item.title}
      </h2>

      {/* Explanation */}
      <div className="rounded-2xl bg-white/5 px-4 py-4">
        <FormattedText
          text={item.explanation_hinglish}
          modalTitle={item.category}
          textColorClass="text-white/80"
          modalBgColor={sentimentBg(item.impact)}
          limit={260}
        />
      </div>

      {/* Price impact row */}
      <div className="flex items-center justify-between rounded-2xl px-5 py-4 bg-white/10">
        <div className="flex items-center gap-2">
          <ImpactIcon className="h-7 w-7 text-white" />
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            Price {item.impact === "up" ? "Up" : item.impact === "down" ? "Down" : "Neutral"}
          </span>
        </div>
        {item.price_effect !== 0 && (
          <span className="text-2xl font-black tabular-nums text-white">
            {item.price_effect > 0 ? "+" : ""}
            {item.price_effect}%
          </span>
        )}
      </div>

      {/* Date */}
      <p className="text-xs font-semibold tracking-wide text-center text-white/60">
        {item.date}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Intro slide for the news section
// ──────────────────────────────────────────────
function NewsIntroSlide({ count, date }: { count: number; date: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Newspaper className="h-14 w-14 opacity-80 text-white" />
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
        Market News
      </h1>
      <p className="text-xl font-bold text-white">
        {count} {count === 1 ? "Story" : "Stories"}
      </p>
      <p className="text-sm font-medium tracking-wide text-white/60">
        {date}
      </p>
      <p className="text-xs text-white/50">
        Swipe up to read
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component — custom scroll container
// ──────────────────────────────────────────────
export function NewsReels({ items, reportDate }: NewsReelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = 1 + items.length;
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const touchDelta = useRef(0);

  /** Navigate exactly one slide */
  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSlides || isAnimating.current) return;
      isAnimating.current = true;
      setCurrentIndex(idx);
      // Reset scroll of the destination slide so it always starts at top
      setTimeout(() => {
        slideRefs.current[idx]?.scrollTo({ top: 0 });
      }, 10);
      setTimeout(() => {
        isAnimating.current = false;
      }, 420);
    },
    [totalSlides]
  );

  const scrollTo = useCallback(
    (direction: "up" | "down") => {
      const next = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      goTo(next);
    },
    [currentIndex, goTo]
  );

  // ── Touch handling: one swipe = one slide ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const SWIPE_THRESHOLD = 40;

    let touchInScrollable = false;

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
      if (touchInScrollable) return;
      e.preventDefault();
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
      // Block swipe-down when slide is not at bottom (user scrolling content)
      if (touchDelta.current > SWIPE_THRESHOLD) {
        if (slideScrollTop < slideScrollMax - 4) return; // still content below — don't change slide
        scrollTo("down");
      } else if (touchDelta.current < -SWIPE_THRESHOLD) {
        if (slideScrollTop > 4) return; // still content above — don't change slide
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

  // ── Mouse wheel: one burst = one slide ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating.current) return;
      if (e.deltaY > 20) scrollTo("down");
      else if (e.deltaY < -20) scrollTo("up");
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollTo]);

  /** Get bg for a given slide index */
  const bgForSlide = (i: number): string => {
    if (i === 0) return "#1a1a2e"; // intro slide
    return sentimentBg(items[i - 1].impact);
  };

  if (items.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center space-y-3">
          <Newspaper className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-lg font-bold">No news available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Slide track — transform based, no native scrolling */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <div
          className="w-full transition-transform duration-400 ease-out"
          style={{ transform: `translateY(-${currentIndex * 100}dvh)` }}
        >
          {Array.from({ length: totalSlides }).map((_, i) => {
            const bg = bgForSlide(i);
            const isIntro = i === 0;
            return (
              <div
                key={i}
                ref={(el) => { slideRefs.current[i] = el; }}
                className="h-dvh w-full overflow-y-auto overscroll-contain flex flex-col px-6 sm:px-10"
                style={{
                  backgroundColor: bg,
                  color: "#ffffff",
                  // Intro stays centered; news slides start at top with generous padding
                  justifyContent: isIntro ? "center" : "flex-start",
                  alignItems: isIntro ? "center" : "stretch",
                  paddingTop: isIntro ? 0 : "4.5rem",
                  paddingBottom: "5rem",
                }}
              >
                {isIntro ? (
                  <NewsIntroSlide count={items.length} date={reportDate} />
                ) : (
                  <div className="w-full max-w-lg mx-auto">
                    <NewsSlide item={items[i - 1]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300"
            style={{
              width: i === currentIndex ? 10 : 6,
              height: i === currentIndex ? 10 : 6,
              borderRadius: "50%",
              backgroundColor: i === currentIndex ? "#ffffff" : "rgba(255,255,255,0.4)",
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
            className="p-2 rounded-full backdrop-blur-sm bg-white/15 text-white"
            aria-label="Previous slide"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        )}
        {currentIndex < totalSlides - 1 && (
          <button
            onClick={() => scrollTo("down")}
            className="p-2 rounded-full backdrop-blur-sm bg-white/15 text-white animate-bounce"
            aria-label="Next slide"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-4 right-3 z-10 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/10 text-white">
        {currentIndex + 1}/{totalSlides}
      </div>
    </div>
  );
}
