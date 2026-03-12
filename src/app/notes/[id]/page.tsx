import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Heart, Zap, Repeat2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getEventById, getEventInteractions, getEventThread } from "@/lib/api";
import { formatRelative, truncateHex } from "@/lib/utils";

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

  const relatedReplies = thread?.replies ?? [];
  const ancestors = thread?.ancestors ?? [];

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
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">{truncateHex(event.pubkey)}</span>
          <span className="text-xs text-white/50">{formatRelative(event.created_at)}</span>
          <Link href={`/profiles/${event.pubkey}`} className="text-xs text-neon-blue">View profile</Link>
        </div>
        <p className="mt-4 text-2xl font-semibold text-white/90">{event.content || "(binary event)"}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/70">
          <span className="inline-flex items-center gap-2">
            <Heart className="size-4 text-neon-pink" />
            {interactions?.reactions ?? 0} reactions
          </span>
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="size-4 text-neon-blue" />
            {interactions?.replies ?? relatedReplies.length} replies
          </span>
          <span className="inline-flex items-center gap-2">
            <Repeat2 className="size-4 text-white/80" />
            {interactions?.reposts ?? 0} reposts
          </span>
          <span className="inline-flex items-center gap-2">
            <Zap className="size-4 text-neon-amber" />
            {interactions?.zaps ?? 0} zaps
          </span>
        </div>
      </section>

      {ancestors.length > 0 && (
        <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white/80">Thread context</h2>
          <div className="mt-4 space-y-4">
            {ancestors.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-card/70 p-4">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{truncateHex(item.pubkey)}</span>
                  <span>{formatRelative(item.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{item.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white/80">Replies</h2>
        <div className="mt-4 space-y-4">
          {relatedReplies.length ? (
            relatedReplies.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-card/70 p-4">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{truncateHex(item.pubkey)}</span>
                  <span>{formatRelative(item.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{item.content}</p>
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
