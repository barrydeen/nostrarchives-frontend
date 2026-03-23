"use client";

import { useApi } from "@/hooks/useApi";
import { fetchDailyStats } from "@/lib/client-api";
import { NetworkStatsBar } from "./NetworkStatsBar";
import { SkeletonStatCard } from "@/components/layout/Skeleton";

export function NetworkStatsBarLive() {
  const { data, loading } = useApi(fetchDailyStats);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    );
  }

  return <NetworkStatsBar stats={data} />;
}
