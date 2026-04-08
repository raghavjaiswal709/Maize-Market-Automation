"use client";

import { useEffect, useState, useCallback } from "react";
import { DailyReport } from "@/types/report";

// Reels components
import { OverviewReels } from "@/components/reels/overview-reels";
import { NewsReels } from "@/components/reels/news-reels";
import { VideoReels } from "@/components/reels/video-reels";

// Dashboard components (kept as-is for Tab 3)
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
import { ReportSelector } from "@/components/dashboard/report-selector";
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
// Dashboard View — EXACT COPY of existing layout
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
  return (
    <div className="pt-12">
      <Header report={report} onDataUpdated={() => fetchReports(false)} />

      <main className="container mx-auto px-3 py-4 space-y-4 max-w-6xl sm:px-4 sm:py-6 sm:space-y-6">
        {/* Report selector — calendar + model variant tabs */}
        <section>
          <ReportSelector
            reports={reports}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        </section>

        {/* Price overview */}
        <section>
          <PriceCards prices={report.current_prices} />
        </section>

        {/* Tabbed section — distinct muted background to stand out from page */}
        <div className="bg-muted/40 border border-border rounded-none p-3 sm:p-4">
          <Tabs defaultValue="news" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-8 sm:h-9">
              <TabsTrigger value="news" className="text-[10px] sm:text-xs">
                News
              </TabsTrigger>
              <TabsTrigger value="advice" className="text-[10px] sm:text-xs">
                Advice
              </TabsTrigger>
              <TabsTrigger value="forecast" className="text-[10px] sm:text-xs">
                Forecast
              </TabsTrigger>
              <TabsTrigger value="intel" className="text-[10px] sm:text-xs">
                Intel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="news" className="mt-3 sm:mt-4 space-y-4">
              <NewsList items={report.news_items} />
            </TabsContent>

            <TabsContent value="advice" className="mt-3 sm:mt-4 space-y-4">
              <RecommendationsCard recommendations={report.recommendations} />
            </TabsContent>

            <TabsContent value="forecast" className="mt-3 sm:mt-4 space-y-4">
              {/* Chart + Sentiment inside Forecast tab */}
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

        {/* Factors + Sources */}
        <section className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          <FactorsCard factors={report.factors} />
          <DataSourcesCard
            sources={report.data_sources}
            metadata={report.metadata}
          />
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-3 pb-6 sm:pt-4 sm:pb-8">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground text-center leading-relaxed">
            {report._id} &middot; {report.model_label}
          </p>
        </footer>
      </main>
    </div>
  );
}