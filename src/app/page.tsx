"use client";

import { useEffect, useState, useCallback } from "react";
import { DailyReport } from "@/types/report";
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

export default function Home() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[Frontend] Fetching reports from /api/reports?limit=10");
      const res = await fetch("/api/reports?limit=10");
      console.log("[Frontend] Response status:", res.status, res.statusText);
      
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      console.log("[Frontend] Received data:", {
        reportsCount: data.reports?.length || 0,
        total: data.total,
        hasMore: data.hasMore
      });
      
      if (data.reports && data.reports.length > 0) {
        console.log("[Frontend] First report:", data.reports[0]);
      }
      
      setReports(data.reports);
      setError(null);
    } catch (err) {
      console.error("[Frontend] Error fetching reports:", err);
      setError("Unable to load market data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) return <DashboardSkeleton />;

  if (error || reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3 px-4">
          <p className="text-sm text-destructive font-medium">
            {error || "No reports available"}
          </p>
          <button
            onClick={fetchReports}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const report = reports[selectedIndex];

  return (
    <div className="min-h-screen bg-background">
      <Header report={report} />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Report selector if multiple */}
        {reports.length > 1 && (
          <div className="flex justify-end">
            <ReportSelector
              reports={reports}
              selectedId={report._id}
              onSelect={(id) => {
                const idx = reports.findIndex((r) => r._id === id);
                if (idx >= 0) setSelectedIndex(idx);
              }}
            />
          </div>
        )}

        {/* Price overview */}
        <section>
          <PriceCards prices={report.current_prices} />
        </section>

        {/* Chart + Sentiment side by side */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PredictionChart
              predictions={report.predictions_10_day}
              currentPrice={report.current_prices.bihar_avg}
            />
          </div>
          <div>
            <SentimentCard sentiment={report.market_sentiment} />
          </div>
        </section>

        {/* Tabbed section for detailed data */}
        <Tabs defaultValue="forecast" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="forecast" className="text-xs">
              Forecast
            </TabsTrigger>
            <TabsTrigger value="news" className="text-xs">
              News
            </TabsTrigger>
            <TabsTrigger value="advice" className="text-xs">
              Advice
            </TabsTrigger>
            <TabsTrigger value="intel" className="text-xs">
              Intel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="mt-4 space-y-4">
            <PredictionTable predictions={report.predictions_10_day} />
          </TabsContent>

          <TabsContent value="news" className="mt-4 space-y-4">
            <NewsList items={report.news_items} />
          </TabsContent>

          <TabsContent value="advice" className="mt-4 space-y-4">
            <RecommendationsCard recommendations={report.recommendations} />
          </TabsContent>

          <TabsContent value="intel" className="mt-4 space-y-4">
            <RawNewsCard content={report.live_news_raw} />
          </TabsContent>
        </Tabs>

        {/* Factors + Sources */}
        <section className="grid gap-4 lg:grid-cols-2">
          <FactorsCard factors={report.factors} />
          <DataSourcesCard
            sources={report.data_sources}
            metadata={report.metadata}
          />
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-4 pb-8">
          <p className="text-[11px] text-muted-foreground text-center">
            Report ID: {report._id} &middot; Generated via {report.metadata.automation} &middot; {report.metadata.fetch_method}
          </p>
        </footer>
      </main>
    </div>
  );
}