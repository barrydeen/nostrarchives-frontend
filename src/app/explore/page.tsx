import Link from "next/link";
import { ArrowLeft, Filter } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getRecentEvents, getBulkProfileMetadata } from "@/lib/api";
import { normalizeEvents } from "@/lib/normalizers";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";

interface ExplorePageProps {
  searchParams: Promise<{
    pubkey?: string;
    kind?: string;
    search?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const limit = 20;
  const payload = await getRecentEvents({
    pubkey: params.pubkey,
    kind: params.kind ? Number(params.kind) : undefined,
    search: params.search,
    limit,
  });
  const events = normalizeEvents(payload);
  const pubkeys = new Set<string>();
  events.forEach((e) => pubkeys.add(e.pubkey));
  extractMentionPubkeysFromEvents(events).forEach((pk) => pubkeys.add(pk));
  const profiles = await getBulkProfileMetadata([...pubkeys]);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 text-sm text-white/60">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
          <ArrowLeft className="size-4" />
          Back home
        </Link>
      </div>
      <SiteHeader />

      <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Advanced explore</p>
            <h1 className="text-3xl font-semibold">Shape your own relay window</h1>
          </div>
          <Filter className="size-5 text-white/50" />
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-4" method="get">
          <input
            name="pubkey"
            placeholder="pubkey (hex)"
            defaultValue={params.pubkey}
            className="rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />
          <input
            name="kind"
            placeholder="kind"
            defaultValue={params.kind}
            className="rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />
          <input
            name="search"
            placeholder="full-text search"
            defaultValue={params.search}
            className="rounded-2xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:col-span-2"
          />
          <div className="md:col-span-4 flex justify-end">
            <button className="rounded-2xl bg-gradient-to-r from-neon-pink/80 to-neon-blue/80 px-6 py-3 text-sm font-semibold shadow-glow">
              Apply filters
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-2xl font-semibold">Results</h2>
          <span className="text-sm text-white/50">{events.length} notes</span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <UnifiedNoteCard
              key={event.id}
              event={event}
              profile={profiles.get(event.pubkey)}
              profiles={profiles}
              engagement={{
                reactions: event.reactions ?? 0,
                replies: event.replies ?? 0,
                reposts: event.reposts ?? 0,
                zap_sats: event.zap_sats ?? 0,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
