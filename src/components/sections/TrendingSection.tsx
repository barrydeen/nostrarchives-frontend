import { TopNotesResponse, ProfileMetadataEntry } from "@/lib/types";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";

interface TrendingSectionProps {
  likes?: TopNotesResponse | null;
  zaps?: TopNotesResponse | null;
  profiles?: Map<string, ProfileMetadataEntry>;
}

export function TrendingSection({ likes, zaps, profiles }: TrendingSectionProps) {
  const columns = [
    { label: "Top likes", dataset: likes },
    { label: "Top zaps", dataset: zaps },
  ];

  return (
    <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
      <div className="flex flex-col gap-3 border-b border-white/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">Trending heatmaps</p>
          <h2 className="mt-2 text-3xl font-semibold">What the network is rewarding</h2>
        </div>
        <p className="text-sm text-white/60">
          Powered by <span className="font-semibold text-white">/v1/notes/likes|zaps/top</span>
        </p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {columns.map(({ label, dataset }) => (
          <div key={label} className="space-y-4">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>{label}</span>
              <span className="text-white/50">{dataset?.range === "today" ? "24h" : "All time"}</span>
            </div>
            <div className="grid gap-4">
              {dataset?.notes?.slice(0, 4).map((entry) => (
                <UnifiedNoteCard
                  key={entry.event.id}
                  event={entry.event}
                  profile={profiles?.get(entry.event.pubkey)}
                  profiles={profiles}
                  engagement={{
                    reactions: dataset.metric === "likes" ? entry.count : undefined,
                    zap_sats: dataset.metric === "zaps" ? (entry.total_sats ?? entry.count) : undefined,
                  }}
                  variant="compact"
                />
              )) || <p className="text-white/50">No data yet.</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
