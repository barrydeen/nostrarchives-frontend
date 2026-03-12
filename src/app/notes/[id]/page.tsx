import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Heart, Zap, Repeat2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProfileName } from "@/components/ProfileName";
import { getEventById, getEventInteractions, getEventThread, getBulkProfileMetadata } from "@/lib/api";
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

  // Use thread data if available, fall back to standalone event + interactions
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

      {/* Main note */}
      <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <ProfileName pubkey={event.pubkey} profile={profiles.get(event.pubkey)} className="text-sm text-white/70" />
          <span className="text-xs text-white/50">{formatRelative(event.created_at)}</span>
        </div>
        <p className="mt-4 text-2xl font-semibold text-white/90">{event.content || "(binary event)"}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/70">
          <span className="inline-flex items-center gap-2">
            <Heart className="size-4 text-neon-pink" />
            {reactionCount} reactions
          </span>
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="size-4 text-neon-blue" />
            {replyCount} replies
          </span>
          <span className="inline-flex items-center gap-2">
            <Repeat2 className="size-4 text-white/80" />
            {repostCount} reposts
          </span>
          <span className="inline-flex items-center gap-2">
            <Zap className="size-4 text-neon-amber" />
            {zapCount} zaps
          </span>
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
              <article key={item.id} className="rounded-2xl border border-white/10 bg-card/70 p-4">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <ProfileName pubkey={item.pubkey} profile={profiles.get(item.pubkey)} className="text-xs" />
                  <span>{formatRelative(item.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{item.content}</p>
                <div className="mt-2 flex justify-end">
                  <Link href={`/notes/${item.id}`} className="text-xs text-white/50 underline-offset-2 hover:underline">
                    Open note →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-white/60">No replies yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
