import { SiteHeader } from "@/components/layout/SiteHeader";
import { NetworkStatsBar } from "@/components/home/NetworkStatsBar";
import { TrendingNotes } from "@/components/home/TrendingNotes";
import { NewUsers } from "@/components/home/NewUsers";
import { TrendingUsers } from "@/components/home/TrendingUsers";
import { getDailyStats, getTrendingNotes, getNewUsers, getTrendingUsers, getBulkProfileMetadata } from "@/lib/api";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";

export default async function HomePage() {
  const [dailyStats, trendingNotes, newUsers, trendingUsers] = await Promise.all([
    getDailyStats(),
    getTrendingNotes(15),
    getNewUsers(12),
    getTrendingUsers(12),
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

  const profiles = await getBulkProfileMetadata([...allPubkeys]);

  return (
    <div className="space-y-10">
      <SiteHeader />
      <NetworkStatsBar stats={dailyStats} />
      <TrendingNotes notes={trendingNotes?.notes ?? []} profiles={profiles} />
      <div className="grid gap-10 lg:grid-cols-2">
        <TrendingUsers users={trendingUsers?.users ?? []} profiles={profiles} />
        <NewUsers users={newUsers?.users ?? []} profiles={profiles} />
      </div>
    </div>
  );
}
