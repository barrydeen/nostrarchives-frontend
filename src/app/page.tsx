import { HeroSection } from "@/components/sections/HeroSection";
import { TrendingSection } from "@/components/sections/TrendingSection";
import { ActivityFeed } from "@/components/sections/ActivityFeed";
import { ProfileSpotlight } from "@/components/sections/ProfileSpotlight";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getGlobalStats, getRecentEvents, getTopNotes, getBulkProfileMetadata } from "@/lib/api";
import { TopNotesResponse } from "@/lib/types";
import { normalizeEvents } from "@/lib/normalizers";

function buildHighlights(dataset?: TopNotesResponse | null, fallback?: TopNotesResponse | null) {
  const source = dataset?.notes?.length ? dataset : fallback;
  if (!source?.notes) return [];
  return source.notes.slice(0, 3).map((entry) => ({
    event: entry.event,
    metricValue: entry.count,
    metricLabel: source.metric,
  }));
}

function buildSpotlight(likes?: TopNotesResponse | null, zaps?: TopNotesResponse | null) {
  const map = new Map<string, { pubkey: string; likes: number; zaps: number }>();

  likes?.notes?.forEach((entry) => {
    const key = entry.event.pubkey;
    const current = map.get(key) ?? { pubkey: key, likes: 0, zaps: 0 };
    current.likes += entry.count;
    map.set(key, current);
  });

  zaps?.notes?.forEach((entry) => {
    const key = entry.event.pubkey;
    const current = map.get(key) ?? { pubkey: key, likes: 0, zaps: 0 };
    current.zaps += entry.count;
    map.set(key, current);
  });

  return Array.from(map.values())
    .sort((a, b) => b.likes + b.zaps - (a.likes + a.zaps))
    .slice(0, 4);
}

export default async function HomePage() {
  const [stats, likesToday, likesAllTime, zapsToday, zapsAllTime, recentEvents] = await Promise.all([
    getGlobalStats(),
    getTopNotes("likes", "today", 6),
    getTopNotes("likes", "all_time", 6),
    getTopNotes("zaps", "today", 6),
    getTopNotes("zaps", "all_time", 6),
    getRecentEvents({ limit: 12 }),
  ]);

  const heroHighlights = buildHighlights(likesToday, likesAllTime);
  const spotlight = buildSpotlight(likesAllTime, zapsAllTime);
  const events = normalizeEvents(recentEvents);

  // Collect all pubkeys from trending notes, spotlight, and activity feed
  const allPubkeys = new Set<string>();
  const addNotes = (data?: TopNotesResponse | null) => data?.notes?.forEach((n) => allPubkeys.add(n.event.pubkey));
  addNotes(likesToday);
  addNotes(likesAllTime);
  addNotes(zapsToday);
  addNotes(zapsAllTime);
  spotlight.forEach((p) => allPubkeys.add(p.pubkey));
  events?.forEach((e) => allPubkeys.add(e.pubkey));

  const profiles = await getBulkProfileMetadata([...allPubkeys]);

  return (
    <div className="space-y-12">
      <SiteHeader />
      <HeroSection stats={stats} highlights={heroHighlights} />
      <TrendingSection likes={likesToday ?? likesAllTime} zaps={zapsToday ?? zapsAllTime} profiles={profiles} />
      {spotlight.length > 0 && <ProfileSpotlight profiles={spotlight} profileMetadata={profiles} />}
      <ActivityFeed events={events} profiles={profiles} />
    </div>
  );
}
