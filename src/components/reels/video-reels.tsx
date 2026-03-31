"use client";

import { VideoNewsItem } from "@/types/report";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Play,
  ExternalLink,
  Clock,
  Video,
} from "lucide-react";

interface VideoReelsProps {
  items: VideoNewsItem[];
  reportDate: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Extract YouTube video ID from URL */
function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/** Check if URL is a YouTube video */
function isYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null;
}

// ──────────────────────────────────────────────
// Intro slide
// ──────────────────────────────────────────────
function VideoIntroSlide({ count, date }: { count: number; date: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <Video className="h-14 w-14 opacity-80 text-white" />
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
        Video News
      </h1>
      <p className="text-xl font-bold text-white">
        {count} {count === 1 ? "Video" : "Videos"}
      </p>
      <p className="text-sm font-medium tracking-wide text-white/60">{date}</p>
      <p className="text-xs text-white/50">Swipe up to watch</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Single video slide — YouTube embed with autoplay
// ──────────────────────────────────────────────
function VideoSlide({
  item,
  isActive,
}: {
  item: VideoNewsItem;
  isActive: boolean;
}) {
  const ytId = getYouTubeId(item.url);
  const isYT = isYouTubeUrl(item.url);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Video embed area */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black/40 aspect-video">
        {isYT && ytId ? (
          isActive ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=1&modestbranding=1&rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={item.title}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              {item.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Video className="h-16 w-16 text-white/30" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-14 w-14 text-white/80 fill-white/80" />
              </div>
            </div>
          )
        ) : (
          // Non-YouTube: show thumbnail + external link
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3">
            {item.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Video className="h-16 w-16 text-white/30" />
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-full"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Article
            </a>
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
        {item.title}
      </h2>

      {/* Description */}
      <p className="text-sm leading-relaxed text-white/70 line-clamp-3">
        {item.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          {item.source}
        </span>
        <span className="text-xs font-semibold text-white/60">
          {item.channel}
        </span>
        {item.duration && item.duration !== "N/A" && (
          <span className="flex items-center gap-1 text-xs text-white/60">
            <Clock className="h-3 w-3" />
            {item.duration}
          </span>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Open link */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-bold text-white/80 underline underline-offset-2 mt-auto"
      >
        <ExternalLink className="h-3 w-3" />
        Watch on {item.source}
      </a>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component — custom scroll container (no ReelsContainer)
// ──────────────────────────────────────────────
export function VideoReels({ items, reportDate }: VideoReelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = 1 + items.length; // intro + videos
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const touchDelta = useRef(0);

  /** Navigate exactly one slide */
  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSlides || isAnimating.current) return;
      isAnimating.current = true;
      setCurrentIndex(idx);
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

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchDelta.current = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      touchDelta.current = touchStartY.current - e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      if (isAnimating.current) return;
      if (touchDelta.current > SWIPE_THRESHOLD) scrollTo("down");
      else if (touchDelta.current < -SWIPE_THRESHOLD) scrollTo("up");
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

  if (items.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center space-y-3">
          <Video className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-lg font-bold">No videos available</p>
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
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className="h-dvh w-full flex items-center justify-center px-6 py-16 sm:px-10"
              style={{
                backgroundColor: "#0a0a0a",
              }}
            >
              <div className="w-full max-w-lg mx-auto">
                {i === 0 ? (
                  <VideoIntroSlide count={items.length} date={reportDate} />
                ) : (
                  <VideoSlide
                    item={items[i - 1]}
                    isActive={currentIndex === i}
                  />
                )}
              </div>
            </div>
          ))}
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

      {/* Up/Down arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => scrollTo("up")}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full backdrop-blur-sm bg-white/10 text-white"
          aria-label="Previous slide"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
      {currentIndex < totalSlides - 1 && (
        <button
          onClick={() => scrollTo("down")}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full backdrop-blur-sm bg-white/10 text-white animate-bounce"
          aria-label="Next slide"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}

      {/* Slide counter */}
      <div className="absolute bottom-4 right-3 z-10 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/10 text-white">
        {currentIndex + 1}/{totalSlides}
      </div>
    </div>
  );
}
