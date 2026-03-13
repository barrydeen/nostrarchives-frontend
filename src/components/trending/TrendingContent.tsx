"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, MessageCircle, Repeat2, Zap } from "lucide-react";
import { TopNotesUnifiedResponse, TrendingMetric, TrendingRange, ProfileMetadataEntry } from "@/lib/types";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { SkeletonNoteGrid } from "@/components/layout/Skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

const METRICS: { key: TrendingMetric; label: string; icon: React.ReactNode }[] = [
  { key: "reactions", label: "Reactions", icon: <Heart className="size-3.5" /> },
  { key: "replies", label: "Replies", icon: <MessageCircle className="size-3.5" /> },
  { key: "reposts", label: "Reposts", icon: <Repeat2 className="size-3.5" /> },
  { key: "zaps", label: "Zaps", icon: <Zap className="size-3.5" /> },
];

const RANGES: { key: TrendingRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "1y", label: "1y" },
  { key: "all", label: "All time" },
];

interface TrendingContentProps {
  initialData: TopNotesUnifiedResponse | null;
  initialMetric: TrendingMetric;
  initialRange: TrendingRange;
}

function toProfileMap(profiles: Record<string, { name: string | null; display_name: string | null; picture: string | null; nip05: string | null }>): Map<string, ProfileMetadataEntry> {
  const map = new Map<string, ProfileMetadataEntry>();
  for (const [pubkey, meta] of Object.entries(profiles)) {
    const preferred = meta.display_name || meta.name || null;
    map.set(pubkey, {
      pubkey,
      display_name: meta.display_name,
      name: meta.name,
      preferred_name: preferred,
      picture: meta.picture,
    });
  }
  return map;
}

export function TrendingContent({ initialData, initialMetric, initialRange }: TrendingContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [metric, setMetric] = useState<TrendingMetric>(initialMetric);
  const [range, setRange] = useState<TrendingRange>(initialRange);
  const [data, setData] = useState<TopNotesUnifiedResponse | null>(initialData);
  const [loading, setLoading] = useState(false);

  // Cache with TTL — longer ranges cached longer (matches server ISR)
  const cache = useRef<Map<string, { data: TopNotesUnifiedResponse; ts: number }>>(new Map());

  const ttlFor = (r: TrendingRange): number =>
    r === "today" ? 30 * 60_000     // 30 min
    : r === "7d"  ? 3 * 3600_000    // 3 hours
    : r === "30d" ? 86400_000       // 1 day
    :               604800_000;     // 1 week (1y, all)

  // Seed cache with initial data
  useEffect(() => {
    if (initialData) {
      cache.current.set(`${initialMetric}:${initialRange}`, { data: initialData, ts: Date.now() });
    }
  }, [initialData, initialMetric, initialRange]);

  const fetchData = useCallback(async (m: TrendingMetric, r: TrendingRange) => {
    const cacheKey = `${m}:${r}`;
    const entry = cache.current.get(cacheKey);
    if (entry && Date.now() - entry.ts < ttlFor(r)) {
      setData(entry.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/v1/notes/top?metric=${m}&range=${r}&limit=20`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const json: TopNotesUnifiedResponse = await res.json();
      cache.current.set(cacheKey, { data: json, ts: Date.now() });
      setData(json);
    } catch (err) {
      console.error("[trending] fetch failed", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback((m: TrendingMetric, r: TrendingRange) => {
    setMetric(m);
    setRange(r);

    // If cached and fresh, set immediately (no loading flash)
    const cacheKey = `${m}:${r}`;
    const entry = cache.current.get(cacheKey);
    if (entry && Date.now() - entry.ts < ttlFor(r)) {
      setData(entry.data);
    }

    // Update URL
    startTransition(() => {
      const params = new URLSearchParams();
      if (m !== "reactions") params.set("metric", m);
      if (r !== "today") params.set("range", r);
      const qs = params.toString();
      router.replace(`/trending${qs ? `?${qs}` : ""}`, { scroll: false });
    });

    fetchData(m, r);
  }, [fetchData, router]);

  const profiles = data ? toProfileMap(data.profiles) : new Map<string, ProfileMetadataEntry>();

  // Metric label for the sort column
  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? metric;

  return (
    <div className="space-y-6">
      {/* Metric tabs */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => handleChange(m.key, range)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              metric === m.key
                ? "border-neon-pink/40 bg-neon-pink/10 text-neon-pink shadow-[0_0_12px_rgba(255,94,205,0.15)]"
                : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/15 hover:text-white/70"
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Range tabs */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => handleChange(metric, r.key)}
            className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
              range === r.key
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && !data ? (
        <SkeletonNoteGrid count={6} />
      ) : data?.notes?.length ? (
        <div className="relative">
          {/* Loading overlay — fades stale content and shows skeletons */}
          {loading && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-black/40 backdrop-blur-[1px]">
              <SkeletonNoteGrid count={6} />
            </div>
          )}
          <div className={`grid gap-4 md:grid-cols-2 transition-opacity duration-200 ${loading ? "opacity-30" : "opacity-100"}`}>
            {data.notes.map((entry, i) => (
              <UnifiedNoteCard
                key={entry.event.id}
                event={entry.event}
                profile={profiles.get(entry.event.pubkey)}
                profiles={profiles}
                rank={i + 1}
                engagement={{
                  reactions: entry.reactions,
                  replies: entry.replies,
                  reposts: entry.reposts,
                  zap_sats: entry.zap_sats,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16">
          <p className="text-lg text-white/40">No data for this combination yet.</p>
          <p className="mt-1 text-sm text-white/25">Try a wider time range or different metric.</p>
        </div>
      )}
    </div>
  );
}
