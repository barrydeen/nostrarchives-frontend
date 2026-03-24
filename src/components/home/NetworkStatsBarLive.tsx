"use client";

import { useLiveMetrics } from "@/hooks/useLiveMetrics";
import { NetworkStatsBar } from "./NetworkStatsBar";
import { SkeletonStatCard } from "@/components/layout/Skeleton";

export function NetworkStatsBarLive() {
  const { metrics, connected } = useLiveMetrics();

  if (!metrics) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    );
  }

  return <NetworkStatsBar metrics={metrics} connected={connected} />;
}
