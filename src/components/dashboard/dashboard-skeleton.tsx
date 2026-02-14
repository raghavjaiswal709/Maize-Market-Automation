"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-52" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-6">
        {/* Price cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border">
              <CardHeader className="pb-1 pt-4 px-4">
                <Skeleton className="h-3 w-16" />
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-14" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart & Sentiment */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-36" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[240px] w-full" />
              </CardContent>
            </Card>
          </div>
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        </div>

        {/* Recommendation cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border border-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
