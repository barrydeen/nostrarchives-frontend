import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getTopNotes, getBulkProfileMetadata } from "@/lib/api";
import { TopNotesResponse } from "@/lib/types";
import { NoteCard } from "@/components/cards/NoteCard";

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
  const collectPubkeys = (data: TopNotesResponse | null | undefined) =>
    data?.notes?.forEach((n) => allPubkeys.add(n.event.pubkey));
  collectPubkeys(likesToday);
  collectPubkeys(likesAll);
  collectPubkeys(zapsToday);
  collectPubkeys(zapsAll);
  const profiles = await getBulkProfileMetadata([...allPubkeys]);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 text-sm text-white/60">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
          <ArrowLeft className="size-4" />
          Back home
        </Link>
      </div>
      <SiteHeader />

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <span className="text-sm text-white/50">Powered by nostr-api</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {section.data?.notes?.map((entry) => (
                <NoteCard
                  key={`${section.title}-${entry.event.id}`}
                  event={entry.event}
                  profile={profiles.get(entry.event.pubkey)}
                  metricValue={entry.count}
                  metricLabel={section.data?.metric}
                />
              )) || <p className="text-white/60">No data right now.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
