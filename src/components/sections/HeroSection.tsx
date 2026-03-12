import { StatsResponse } from "@/lib/types";
import { StatCard } from "@/components/cards/StatCard";
import { SearchBar } from "@/components/search/SearchBar";
import { Activity } from "lucide-react";

interface HeroSectionProps {
  stats?: StatsResponse | null;
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-[32px] border border-white/10 bg-heroGradient/10 p-8 shadow-glow">
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">Live telemetry</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">
            Observe every note, reaction, zap, and relay hop
            <span className="gradient-text block text-lg font-normal text-white/70">powered by nostr-api ingestion</span>
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Events indexed" value={stats?.total_events} hint="All time" />
            <StatCard label="Unique pubkeys" value={stats?.unique_pubkeys} hint="Deduped" />
            <StatCard
              label="Ingestion / min"
              value={stats?.ingestion_rate_per_min}
              hint="Rolling 60s"
              icon={<Activity className="size-4 text-neon-green" />}
            />
          </div>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
          <h3 className="text-sm uppercase tracking-[0.4em] text-white/60">Deep search</h3>
          <p className="mt-2 text-lg font-semibold">Reshape the feed by pubkey, hashtag, kind, or free text.</p>
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
