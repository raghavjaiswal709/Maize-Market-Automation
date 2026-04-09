"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DailyReport } from "@/types/report";
import { format, parseISO } from "date-fns";

// Reels components
import { OverviewReels } from "@/components/reels/overview-reels";
import { NewsReels } from "@/components/reels/news-reels";
import { VideoReels } from "@/components/reels/video-reels";

// Dashboard components
import { Header } from "@/components/dashboard/header";
import { PriceCards } from "@/components/dashboard/price-cards";
import { SentimentCard } from "@/components/dashboard/sentiment-card";
import { PredictionChart } from "@/components/dashboard/prediction-chart";
import { PredictionTable } from "@/components/dashboard/prediction-table";
import { NewsList } from "@/components/dashboard/news-list";
import { RecommendationsCard } from "@/components/dashboard/recommendations-card";
import { FactorsCard } from "@/components/dashboard/factors-card";
import { DataSourcesCard } from "@/components/dashboard/data-sources-card";
import { RawNewsCard } from "@/components/dashboard/raw-news-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BarChart3, Newspaper, LayoutDashboard, Video, Menu } from "lucide-react";
import { ReportSidebar } from "@/components/sidebar/report-sidebar";

// ═══════════════════════════════════════════════
// Global tab type
// ═══════════════════════════════════════════════
type AppTab = "overview" | "news" | "videos" | "dashboard";

export default function Home() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchReports = useCallback(
    async (preserveSelection = false) => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports?limit=50&lang=hinglish`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setReports(data.reports);
        if (!preserveSelection && data.reports.length > 0) {
          if (
            !selectedId ||
            !data.reports.find((r: DailyReport) => r._id === selectedId)
          ) {
            setSelectedId(data.reports[0]._id);
          }
        }
        setError(null);
      } catch (err) {
        console.error("[Frontend] Error fetching reports:", err);
        setError("Unable to load market data. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedId]
  );

  useEffect(() => {
    fetchReports(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────── Loading ───────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <GlobalTabBar active={activeTab} onChange={setActiveTab} onMenuClick={() => setSidebarOpen(true)} />
        <div className="pt-11">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // ─────────────────────── Error / Empty ───────────────────────
  if (error || reports.length === 0) {
    return (
      <div className="min-h-dvh bg-background">
        <GlobalTabBar active={activeTab} onChange={setActiveTab} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex items-center justify-center min-h-[80dvh]">
          <div className="text-center space-y-3 px-4">
            <p className="text-sm text-destructive font-medium">
              {error || "No reports available"}
            </p>
            <button
              onClick={() => fetchReports(false)}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const report = reports.find((r) => r._id === selectedId) || reports[0];

  return (
    <div className="min-h-dvh bg-background">
      {/* ═══ SIDEBAR ═══ */}
      <ReportSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        reports={reports}
        selectedId={report._id}
        onSelect={(id) => {
          setSelectedId(id);
          setSidebarOpen(false);
        }}
        onDataUpdated={() => fetchReports(false)}
      />

      {/* ═══ GLOBAL TAB BAR ═══ */}
      <GlobalTabBar active={activeTab} onChange={setActiveTab} onMenuClick={() => setSidebarOpen(true)} />

      {/* ═══ TAB CONTENT ═══ */}
      {activeTab === "overview" && <OverviewReels report={report} />}

      {activeTab === "news" && (
        <NewsReels items={report.news_items} reportDate={report.date} />
      )}

      {activeTab === "videos" && (
        <VideoReels items={report.video_news} reportDate={report.date} />
      )}

      {activeTab === "dashboard" && (
        <DashboardView
          reports={reports}
          report={report}
          selectedId={report._id}
          setSelectedId={setSelectedId}
          fetchReports={fetchReports}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Global Tab Bar — fixed at top, always visible
// ═══════════════════════════════════════════════
function GlobalTabBar({
  active,
  onChange,
  onMenuClick,
}: {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  onMenuClick: () => void;
}) {
  const tabs: { key: AppTab; label: string; icon: typeof BarChart3 }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "news", label: "News", icon: Newspaper },
    { key: "videos", label: "Videos", icon: Video },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none pt-2 px-2 pb-1 flex justify-center">
      {/* On mobile: full width. On desktop: fixed-width centered pill */}
      <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-105 sm:max-w-130">
        {/* Hamburger — separate floating glass circle */}
        <button
          onClick={onMenuClick}
          className="glass-pill pointer-events-auto h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Open report list"
        >
          <Menu className="h-4 w-4 text-foreground/80" />
        </button>

        {/* Tabs — grouped in a floating glass pill */}
        <div className="glass-pill pointer-events-auto flex items-center p-0.75 rounded-full flex-1 min-w-0">
          {tabs.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => onChange(key)}
                className={`flex items-center justify-center gap-1 flex-1 min-w-0 py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-normal transition-all duration-200 ${
                  isActive
                    ? "glass-pill-active text-foreground"
                    : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Dashboard View
// ═══════════════════════════════════════════════
function DashboardView({
  reports,
  report,
  selectedId,
  setSelectedId,
  fetchReports,
}: {
  reports: DailyReport[];
  report: DailyReport;
  selectedId: string;
  setSelectedId: (id: string) => void;
  fetchReports: (preserveSelection?: boolean) => Promise<void>;
}) {
  // sortedReports[0] = newest, sortedReports[last] = oldest
  const sortedReports = [...reports].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (b.timestamp || "").localeCompare(a.timestamp || "");
  });

  const currentIdx = sortedReports.findIndex((r) => r._id === selectedId);

  // ── Flash / slide overlay ────────────────────────────────
  // swipeDir: the physical direction the finger moved
  //   "right" = finger moved right (left-to-right) = going to OLDER
  //   "left"  = finger moved left  (right-to-left) = going to NEWER
  const [flashInfo, setFlashInfo] = useState<{
    dateStr: string;
    dayName: string;
    swipeDir: "left" | "right"; // physical swipe direction
    isNewer: boolean;
  } | null>(null);

  // Live drag offset while finger is moving (for rubber-band feel)
  const [dragX, setDragX] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeLocked = useRef(false);
  const isDragging = useRef(false);

  const navigateTo = useCallback(
    (targetIdx: number, swipeDir: "left" | "right") => {
      if (swipeLocked.current) return;
      if (targetIdx < 0 || targetIdx >= sortedReports.length) return;

      swipeLocked.current = true;
      setDragX(0);
      const target = sortedReports[targetIdx];
      const isNewer = targetIdx < currentIdx; // lower index = newer

      const dateObj = parseISO(target.date);
      setFlashInfo({
        dateStr: format(dateObj, "dd MMM yyyy"),
        dayName: format(dateObj, "EEEE"),
        swipeDir,
        isNewer,
      });

      setTimeout(() => {
        setSelectedId(target._id);
        setFlashInfo(null);
        swipeLocked.current = false;
      }, 520);
    },
    [currentIdx, sortedReports, setSelectedId]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (swipeLocked.current) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (swipeLocked.current || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Only track horizontal drag if clearly more horizontal than vertical
    if (Math.abs(dx) > Math.abs(dy) * 1.5) {
      isDragging.current = true;
      // Rubber-band: full movement near center, dampen at edges
      const damped = dx * 0.35;
      setDragX(damped);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      setDragX(0);

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Must be clearly horizontal and at least 52px
      if (absDx < 52 || absDy > absDx * 0.65) return;

      if (dx > 0) {
        // ← Finger moved RIGHT (left-to-right) → OLDER report
        navigateTo(currentIdx + 1, "right");
      } else {
        // → Finger moved LEFT (right-to-left) → NEWER report
        navigateTo(currentIdx - 1, "left");
      }
    },
    [currentIdx, navigateTo]
  );

  const sameDate = sortedReports.filter((r) => r.date === report.date);
  const hasVariants = sameDate.length > 1;

  // Can we go newer / older?
  const canGoNewer = currentIdx > 0;
  const canGoOlder = currentIdx < sortedReports.length - 1;

  return (
    <div
      className="pt-12 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined,
        transition: dragX === 0 ? "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
        willChange: "transform",
      }}
    >
      {/* ── Swipe direction flash overlay ────────────────── */}
      {flashInfo && (
        <div
          key={flashInfo.dateStr + flashInfo.swipeDir}
          className={`fixed inset-0 z-200 flex flex-col items-center justify-center pointer-events-none
            ${flashInfo.swipeDir === "left"
              ? "animate-in slide-in-from-right-full"
              : "animate-in slide-in-from-left-full"
            } duration-300`}
          style={{
            background: flashInfo.isNewer
              ? "linear-gradient(135deg, rgba(11,153,129,0.92) 0%, rgba(6,95,70,0.96) 100%)"
              : "linear-gradient(135deg, rgba(100,116,139,0.92) 0%, rgba(51,65,85,0.96) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Direction arrow */}
          <div className={`flex items-center gap-2 mb-4 ${flashInfo.swipeDir === "left" ? "flex-row" : "flex-row-reverse"}`}>
            <span className="text-2xl text-white/60">
              {flashInfo.swipeDir === "left" ? "→" : "←"}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              {flashInfo.isNewer ? "Newer" : "Older"}
            </span>
          </div>

          {/* Date — big */}
          <p className="text-5xl sm:text-6xl font-black text-white tabular-nums leading-none drop-shadow-lg">
            {flashInfo.dateStr.split(" ")[0]}
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-white/80 mt-1 tracking-wide">
            {flashInfo.dateStr.split(" ").slice(1).join(" ")}
          </p>
          <p className="text-sm sm:text-base font-medium text-white/60 mt-2 uppercase tracking-widest">
            {flashInfo.dayName}
          </p>

          {/* Thin progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white/70"
              style={{ animation: "swipe-progress 0.52s linear forwards" }}
            />
          </div>
        </div>
      )}

      {/* ── Edge hint indicators (subtle arrows at viewport edges) ── */}
      {canGoOlder && !flashInfo && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center justify-center w-6 h-14 rounded-l-full bg-foreground/8 opacity-40">
          <span className="text-[10px] text-foreground/60">›</span>
        </div>
      )}
      {canGoNewer && !flashInfo && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center justify-center w-6 h-14 rounded-r-full bg-foreground/8 opacity-40">
          <span className="text-[10px] text-foreground/60">‹</span>
        </div>
      )}

      <Header report={report} onDataUpdated={() => fetchReports(false)} />

      <main className="container mx-auto px-3 py-4 space-y-4 max-w-6xl sm:px-4 sm:py-6 sm:space-y-6">

        {/* ── Model variant picker ── */}
        {hasVariants && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            {sameDate.map((r, idx) => {
              const isActive = r._id === selectedId;
              const model = r.model_label || `Report ${idx + 1}`;
              return (
                <button
                  key={r._id}
                  onClick={() => setSelectedId(r._id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span>{model}</span>
                  <span className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                    {r.time}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Tabbed section ── */}
        <div className="bg-muted/40 border border-border rounded-none p-3 sm:p-4">
          <Tabs defaultValue="news" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-8 sm:h-9">
              <TabsTrigger value="news" className="text-[10px] sm:text-xs">News</TabsTrigger>
              <TabsTrigger value="advice" className="text-[10px] sm:text-xs">Advice</TabsTrigger>
              <TabsTrigger value="forecast" className="text-[10px] sm:text-xs">Forecast</TabsTrigger>
              <TabsTrigger value="intel" className="text-[10px] sm:text-xs">Intel</TabsTrigger>
            </TabsList>
            <TabsContent value="news" className="mt-3 sm:mt-4 space-y-4">
              <NewsList items={report.news_items} />
            </TabsContent>
            <TabsContent value="advice" className="mt-3 sm:mt-4 space-y-4">
              <RecommendationsCard recommendations={report.recommendations} />
            </TabsContent>
            <TabsContent value="forecast" className="mt-3 sm:mt-4 space-y-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-2">
                  <PredictionChart
                    predictions={report.predictions_10_day}
                    currentPrice={report.current_prices.bihar_avg}
                  />
                </div>
                <div>
                  <SentimentCard sentiment={report.market_sentiment} />
                </div>
              </div>
              <PredictionTable predictions={report.predictions_10_day} />
            </TabsContent>
            <TabsContent value="intel" className="mt-3 sm:mt-4 space-y-4">
              <RawNewsCard content={report.live_news_raw} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Price overview ── */}
        <section>
          <PriceCards prices={report.current_prices} />
        </section>

        {/* ── Factors + Sources ── */}
        <section className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          <FactorsCard factors={report.factors} />
          <DataSourcesCard
            sources={report.data_sources}
            metadata={report.metadata}
          />
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border pt-3 pb-6 sm:pt-4 sm:pb-8">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground text-center leading-relaxed">
            {report._id} &middot; {report.model_label}
          </p>
        </footer>
      </main>
    </div>
  );
}