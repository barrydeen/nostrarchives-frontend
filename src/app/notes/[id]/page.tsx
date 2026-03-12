import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { NoteContent } from "@/components/notes/NoteContent";
import { ProfileName } from "@/components/ProfileName";
import { getNoteDetail } from "@/lib/api";
import { extractMentionPubkeysFromEvents, extractMentionPubkeys } from "@/lib/mentions";
import { formatRelative } from "@/lib/utils";
import { ProfileMetadataEntry } from "@/lib/types";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

const hexRegex = /^[0-9a-f]{64}$/i;

/**
 * Convert the profiles map from the note detail endpoint into the
 * Map<string, ProfileMetadataEntry> that components expect.
 */
function buildProfileMap(
  profiles: Record<string, { name: string | null; display_name: string | null; picture: string | null; nip05: string | null }>
): Map<string, ProfileMetadataEntry> {
  const map = new Map<string, ProfileMetadataEntry>();
  for (const [pubkey, meta] of Object.entries(profiles)) {
    map.set(pubkey, {
      pubkey,
      name: meta.name,
      display_name: meta.display_name,
      preferred_name: meta.display_name || meta.name || null,
      picture: meta.picture,
    });
  }
  return map;
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;

  if (!hexRegex.test(id)) {
    notFound();
  }

  // Single API call — returns event, refs, stats, replies, and profiles in one round-trip
  const detail = await getNoteDetail(id);

  if (!detail?.event) {
    notFound();
  }

  const { event, stats, replies: replyEvents } = detail;
  const replies = replyEvents ?? [];
  const profiles = buildProfileMap(detail.profiles ?? {});

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 text-sm text-white/60">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
          <ArrowLeft className="size-4" />
          Back home
        </Link>
      </div>
      <SiteHeader />

      {/* Main note — full rendering with no truncation */}
      <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <ProfileName pubkey={event.pubkey} profile={profiles.get(event.pubkey)} className="text-sm text-white/70" />
          <span className="text-xs text-white/50">{formatRelative(event.created_at)}</span>
        </div>
        <div className="mt-4 text-lg leading-relaxed">
          <NoteContent content={event.content || "(binary event)"} profiles={profiles} maxLines={0} />
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/50">
          <span className="inline-flex items-center gap-1.5">❤️ {stats?.reactions ?? 0} reactions</span>
          <span className="inline-flex items-center gap-1.5">💬 {stats?.replies ?? 0} replies</span>
          <span className="inline-flex items-center gap-1.5">🔁 {stats?.reposts ?? 0} reposts</span>
          <span className="inline-flex items-center gap-1.5">⚡ {stats?.zaps ?? 0} zaps</span>
        </div>
      </section>

      {/* Thread context (parent/root) */}
      {detail.parent_id && (
        <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white/80">Thread context</h2>
          <div className="mt-4 space-y-2 text-sm text-white/60">
            {detail.root_id && detail.root_id !== detail.parent_id && (
              <p>
                Root:{" "}
                <Link href={`/notes/${detail.root_id}`} className="text-neon-blue underline-offset-2 hover:underline">
                  {detail.root_id.slice(0, 12)}…
                </Link>
              </p>
            )}
            <p>
              Replying to:{" "}
              <Link href={`/notes/${detail.parent_id}`} className="text-neon-blue underline-offset-2 hover:underline">
                {detail.parent_id.slice(0, 12)}…
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Replies */}
      <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white/80">Replies ({replies.length})</h2>
        <div className="mt-4 space-y-4">
          {replies.length > 0 ? (
            replies.map((item) => (
              <UnifiedNoteCard
                key={item.id}
                event={item}
                profile={profiles.get(item.pubkey)}
                profiles={profiles}
                variant="compact"
              />
            ))
          ) : (
            <p className="text-sm text-white/60">No replies yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
