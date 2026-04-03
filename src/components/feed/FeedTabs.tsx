"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users, TrendingUp, Radio } from "lucide-react";
import { FollowFeed } from "./FollowFeed";
import { RelayFeed } from "./RelayFeed";
import { TrendingContent } from "@/components/trending/TrendingContent";
import type { TrendingMetric, TrendingRange } from "@/lib/types";

type FeedTab = "following" | "trending" | "relay";

const TABS: { key: FeedTab; label: string; icon: React.ReactNode }[] = [
  { key: "following", label: "Following", icon: <Users className="size-4" /> },
  { key: "trending", label: "Trending", icon: <TrendingUp className="size-4" /> },
  { key: "relay", label: "Relay", icon: <Radio className="size-4" /> },
];

const VALID_TABS = new Set<string>(["following", "trending", "relay"]);
const VALID_METRICS = new Set(["reactions", "replies", "reposts", "zaps"]);
const VALID_RANGES = new Set(["today", "7d", "30d", "1y", "all"]);

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab") ?? "following";
  const activeTab: FeedTab = VALID_TABS.has(rawTab) ? (rawTab as FeedTab) : "following";

  function setTab(tab: FeedTab) {
    const params = new URLSearchParams();
    if (tab !== "following") params.set("tab", tab);
    const qs = params.toString();
    router.replace(`/feed${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  // Parse trending sub-params for when embedding TrendingContent
  const rawMetric = searchParams.get("metric") ?? "reactions";
  const rawRange = searchParams.get("range") ?? "today";
  const trendingMetric: TrendingMetric = VALID_METRICS.has(rawMetric)
    ? (rawMetric as TrendingMetric)
    : "reactions";
  const trendingRange: TrendingRange = VALID_RANGES.has(rawRange)
    ? (rawRange as TrendingRange)
    : "today";

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "following" && <FollowFeed />}
      {activeTab === "trending" && (
        <TrendingContent
          initialData={null}
          initialMetric={trendingMetric}
          initialRange={trendingRange}
          basePath="/feed"
        />
      )}
      {activeTab === "relay" && <RelayFeed />}
    </div>
  );
}
