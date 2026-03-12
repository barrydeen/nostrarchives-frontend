import { NetworkStatsBar } from "@/components/home/NetworkStatsBar";
import { TrendingNotes } from "@/components/home/TrendingNotes";
import { BiggestZappers } from "@/components/home/BiggestZappers";
import { NewUsers } from "@/components/home/NewUsers";
import { TrendingUsers } from "@/components/home/TrendingUsers";
import { getDailyStats, getTrendingNotes, getNewUsers, getTrendingUsers, getTopZappers, getBulkProfileMetadata } from "@/lib/api";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";

export default async function HomePage() {
  const [dailyStats, trendingNotes, newUsers, trendingUsers, zappersReceived, zappersSent] = await Promise.all([
    getDailyStats(),
    getTrendingNotes(10),
    getNewUsers(12),
    getTrendingUsers(12),
    getTopZappers("received", 10),
    getTopZappers("sent", 10),
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
          <NewUsers users={newUsers?.users ?? []} profiles={profiles} />
          <TrendingUsers users={trendingUsers?.users ?? []} profiles={profiles} />
        </div>
      </div>
    </div>
  );
}
