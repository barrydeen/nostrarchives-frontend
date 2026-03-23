import { TrendingMetric, TrendingRange } from "@/lib/types";
import { TrendingContent } from "@/components/trending/TrendingContent";

const VALID_METRICS = new Set(["reactions", "replies", "reposts", "zaps"]);
const VALID_RANGES = new Set(["today", "7d", "30d", "1y", "all"]);

interface TrendingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TrendingPage({ searchParams }: TrendingPageProps) {
  const params = await searchParams;
  const rawMetric = typeof params.metric === "string" ? params.metric : "reactions";
  const rawRange = typeof params.range === "string" ? params.range : "today";

  const metric: TrendingMetric = VALID_METRICS.has(rawMetric)
    ? (rawMetric as TrendingMetric)
    : "reactions";
  const range: TrendingRange = VALID_RANGES.has(rawRange)
    ? (rawRange as TrendingRange)
    : "today";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trending</h1>
        <p className="mt-1 text-sm text-white/40">
          Top notes ranked by engagement from credible actors on the Nostr network.
        </p>
      </div>

      <TrendingContent
        initialData={null}
        initialMetric={metric}
        initialRange={range}
      />
    </div>
  );
}
