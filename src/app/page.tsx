import { NetworkStatsBar } from "@/components/home/NetworkStatsBar";
import { TrendingNotes } from "@/components/home/TrendingNotes";
import { BiggestZappers } from "@/components/home/BiggestZappers";
import { NewUsers } from "@/components/home/NewUsers";
import { TrendingUsers } from "@/components/home/TrendingUsers";
import { TrendingHashtags } from "@/components/home/TrendingHashtags";
import { TopClientsRelays } from "@/components/home/TopClientsRelays";
import { getDailyStats, getTrendingNotes, getNewUsers, getTrendingUsers, getTopZappers, getTrendingHashtags, getClientLeaderboard, getRelayLeaderboard, getBulkProfileMetadata } from "@/lib/api";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";

export default async function HomePage() {
  const [dailyStats, trendingNotes, newUsers, trendingUsers, zappersReceived, zappersSent, trendingHashtags, clientData, relayData] = await Promise.all([
    getDailyStats(),
    getTrendingNotes(10),
    getNewUsers(12),
    getTrendingUsers(12),
    getTopZappers("received", 12),
    getTopZappers("sent", 12),
    getTrendingHashtags(20),
    getClientLeaderboard(10),
    getRelayLeaderboard(10),
  ]);

  // Collect all pubkeys for bulk metadata fetch
  const allPubkeys = new Set<string>();
  trendingNotes?.notes?.forEach((n) => allPubkeys.add(n.event.pubkey));
  // Also resolve mentioned npubs in note content so @DisplayName renders
  if (trendingNotes?.notes?.length) {
    extractMentionPubkeysFromEvents(trendingNotes.notes.map((n) => n.event)).forEach((pk) => allPubkeys.add(pk));
  }
  newUsers?.users?.forEach((u) => allPubkeys.add(u.pubkey));
  trendingUsers?.users?.forEach((u) => allPubkeys.add(u.pubkey));
  zappersReceived?.zappers?.forEach((z) => allPubkeys.add(z.pubkey));
  zappersSent?.zappers?.forEach((z) => allPubkeys.add(z.pubkey));

  const profiles = await getBulkProfileMetadata([...allPubkeys]);

  return (
    <div className="space-y-10">
      <NetworkStatsBar stats={dailyStats} />
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Trending Notes (narrower) */}
        <div className="lg:col-span-5">
          <TrendingNotes notes={trendingNotes?.notes ?? []} profiles={profiles} />
        </div>
        {/* Right: User Discovery */}
        <div className="flex flex-col gap-8 lg:col-span-7">
          <BiggestZappers
            sent={zappersSent?.zappers ?? []}
            received={zappersReceived?.zappers ?? []}
            profiles={profiles}
          />
          <TrendingHashtags hashtags={trendingHashtags?.hashtags ?? []} />
          <NewUsers users={newUsers?.users ?? []} profiles={profiles} />
          <TrendingUsers users={trendingUsers?.users ?? []} profiles={profiles} />
        </div>
      </div>

      {/* Tech Stack — full width, below the main grid */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2">
            <svg className="size-5 text-white/60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Tech Stack</h2>
            <p className="text-xs text-white/50">Most popular clients and relays across the network</p>
          </div>
        </div>
        <TopClientsRelays
          clients={clientData?.clients ?? []}
          relays={relayData?.relays ?? []}
        />
      </section>
    </div>
  );
}
