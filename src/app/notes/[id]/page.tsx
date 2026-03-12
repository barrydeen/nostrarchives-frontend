import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { NoteContent } from "@/components/notes/NoteContent";
import { ProfileName } from "@/components/ProfileName";
import { getEventById, getEventInteractions, getEventThread, getBulkProfileMetadata } from "@/lib/api";
import { extractMentionPubkeysFromEvents, extractMentionPubkeys } from "@/lib/mentions";
import { formatRelative } from "@/lib/utils";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

const hexRegex = /^[0-9a-f]{64}$/i;

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;

  if (!hexRegex.test(id)) {
    notFound();
  }

  const [event, thread, interactions] = await Promise.all([
    getEventById(id),
    getEventThread(id),
    getEventInteractions(id),
  ]);

  if (!event) {
    notFound();
  }

  const replies = thread?.replies ?? [];
  const reactions = thread?.reactions ?? [];
  const reactionCount = interactions?.reactions ?? thread?.interactions?.reactions ?? reactions.length;
  const replyCount = interactions?.replies ?? thread?.interactions?.replies ?? replies.length;
  const repostCount = interactions?.reposts ?? thread?.interactions?.reposts ?? 0;
  const zapCount = interactions?.zaps ?? thread?.interactions?.zaps ?? 0;

  // Collect all pubkeys for bulk resolution
  const allPubkeys = new Set<string>();
  allPubkeys.add(event.pubkey);
  replies.forEach((r) => allPubkeys.add(r.pubkey));
  reactions.forEach((r) => allPubkeys.add(r.pubkey));

  extractMentionPubkeys(event.content).forEach((pk) => allPubkeys.add(pk));
  extractMentionPubkeysFromEvents(replies).forEach((pk) => allPubkeys.add(pk));

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
          <span className="inline-flex items-center gap-1.5">❤️ {reactionCount} reactions</span>
          <span className="inline-flex items-center gap-1.5">💬 {replyCount} replies</span>
          <span className="inline-flex items-center gap-1.5">🔁 {repostCount} reposts</span>
          <span className="inline-flex items-center gap-1.5">⚡ {zapCount} zaps</span>
        </div>
      </section>

      {/* Thread context (parent/root) */}
      {thread?.parent_id && (
        <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white/80">Thread context</h2>
          <div className="mt-4 space-y-2 text-sm text-white/60">
            {thread.root_id && thread.root_id !== thread.parent_id && (
              <p>
                Root:{" "}
                <Link href={`/notes/${thread.root_id}`} className="text-neon-blue underline-offset-2 hover:underline">
                  {thread.root_id.slice(0, 12)}…
                </Link>
              </p>
            )}
            <p>
              Replying to:{" "}
              <Link href={`/notes/${thread.parent_id}`} className="text-neon-blue underline-offset-2 hover:underline">
                {thread.parent_id.slice(0, 12)}…
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
