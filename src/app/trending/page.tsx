import { getTopNotes, getBulkProfileMetadata } from "@/lib/api";
import { TopNotesResponse } from "@/lib/types";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";

export default async function TrendingPage() {
  const [likesToday, likesAll, zapsToday, zapsAll] = await Promise.all([
    getTopNotes("likes", "today", 12),
    getTopNotes("likes", "all_time", 12),
    getTopNotes("zaps", "today", 12),
    getTopNotes("zaps", "all_time", 12),
  ]);

  const sections = [
    { title: "Likes · Today", data: likesToday },
    { title: "Likes · All time", data: likesAll },
    { title: "Zaps · Today", data: zapsToday },
    { title: "Zaps · All time", data: zapsAll },
  ];

  // Collect all pubkeys from all sections
  const allPubkeys = new Set<string>();
  const collectPubkeys = (data: TopNotesResponse | null | undefined) => {
    const events = data?.notes?.map((n) => n.event) ?? [];
    events.forEach((e) => allPubkeys.add(e.pubkey));
    extractMentionPubkeysFromEvents(events).forEach((pk) => allPubkeys.add(pk));
  };
  collectPubkeys(likesToday);
  collectPubkeys(likesAll);
  collectPubkeys(zapsToday);
  collectPubkeys(zapsAll);
  const profiles = await getBulkProfileMetadata([...allPubkeys]);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <span className="text-sm text-white/50">Powered by nostr-api</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {section.data?.notes?.map((entry) => (
                <UnifiedNoteCard
                  key={`${section.title}-${entry.event.id}`}
                  event={entry.event}
                  profile={profiles.get(entry.event.pubkey)}
                  profiles={profiles}
                  engagement={{
                    reactions: entry.reactions ?? 0,
                    replies: entry.replies ?? 0,
                    reposts: entry.reposts ?? 0,
                    zap_sats: entry.zap_sats ?? 0,
                  }}
                />
              )) || <p className="text-white/60">No data right now.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
