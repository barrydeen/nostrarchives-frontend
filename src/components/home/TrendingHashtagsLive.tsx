"use client";

import { useApi } from "@/hooks/useApi";
import { fetchTrendingHashtags } from "@/lib/client-api";
import { TrendingHashtags } from "./TrendingHashtags";
import { SkeletonBox } from "@/components/layout/Skeleton";

export function TrendingHashtagsLive() {
  const { data, loading } = useApi(() => fetchTrendingHashtags(20));

  if (loading) {
    return (
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-3 w-48 animate-pulse rounded-full bg-white/[0.04]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonBox key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </section>
    );
  }

  return <TrendingHashtags hashtags={data?.hashtags ?? []} />;
}
