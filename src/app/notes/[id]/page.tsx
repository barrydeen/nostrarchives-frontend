import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteContent } from "@/components/notes/NoteContent";
import { ProfileName } from "@/components/ProfileName";
import { InteractionTabs } from "@/components/notes/InteractionTabs";
import { ReplyThread, buildReplyTree } from "@/components/notes/ReplyThread";
import { getNoteDetail, getEventThread, getBulkProfileMetadata } from "@/lib/api";
import { extractMentionPubkeysFromEvents, extractMentionPubkeys } from "@/lib/mentions";
import { formatRelative } from "@/lib/utils";
import { ProfileMetadataEntry, StoredEvent } from "@/lib/types";

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

  // Fetch note detail + thread data in parallel
  const [detail, thread] = await Promise.all([
    getNoteDetail(id),
    getEventThread(id),
  ]);

  if (!detail?.event) {
    notFound();
  }

  const { event, stats, replies: replyEvents } = detail;
  const replies = replyEvents ?? [];
  const profiles = buildProfileMap(detail.profiles ?? {});

  // Extract interaction events from thread response
  const reactionEvents = thread?.reactions ?? [];
  const repostEvents = thread?.reposts ?? [];
  const zapEvents = thread?.zaps ?? [];

  // Collect all unique pubkeys from interactors that we don't already have profiles for
  const interactorPubkeys = [
    ...reactionEvents.map((e: StoredEvent) => e.pubkey),
    ...repostEvents.map((e: StoredEvent) => e.pubkey),
    ...zapEvents.map((e: StoredEvent) => e.pubkey),
  ];
  const missingPubkeys = [...new Set(interactorPubkeys)].filter(
    (pk) => !profiles.has(pk)
  );

  // Bulk-fetch missing profiles
  let extraProfiles = new Map<string, ProfileMetadataEntry>();
  if (missingPubkeys.length > 0) {
    extraProfiles = await getBulkProfileMetadata(missingPubkeys);
  }

  // Merge all profiles into a flat record for the client component
  const allInteractorProfiles: Record<string, {
    pubkey: string;
    name: string | null;
    display_name: string | null;
    picture: string | null;
  }> = {};
  for (const pk of new Set(interactorPubkeys)) {
    const p = profiles.get(pk) ?? extraProfiles.get(pk);
    if (p) {
      allInteractorProfiles[pk] = {
        pubkey: pk,
        name: p.name ?? null,
        display_name: p.display_name ?? null,
        picture: p.picture ?? null,
      };
    }
  }

  // Parse interaction data
  const reactions = reactionEvents.map((e: StoredEvent) => ({
    pubkey: e.pubkey,
    emoji: e.content === "+" || e.content === "" ? "❤️" : e.content,
  }));
  const reposts = repostEvents.map((e: StoredEvent) => ({ pubkey: e.pubkey }));
  const zaps = zapEvents.map((e: StoredEvent) => {
    // Try to parse zap amount from bolt11 in tags
    const bolt11Tag = e.tags?.find((t) => t[0] === "bolt11");
    let sats: number | undefined;
    if (bolt11Tag?.[1]) {
      // Simple extraction: look for amount in description tag instead
      const descTag = e.tags?.find((t) => t[0] === "description");
      if (descTag?.[1]) {
        try {
          const desc = JSON.parse(descTag[1]);
          const amountTag = desc.tags?.find((t: string[]) => t[0] === "amount");
          if (amountTag?.[1]) {
            sats = Math.floor(Number(amountTag[1]) / 1000);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return { pubkey: e.pubkey, sats };
  });

  return (
    <div className="space-y-10">
      {/* Main note — full rendering with no truncation */}
      <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <ProfileName pubkey={event.pubkey} profile={profiles.get(event.pubkey)} className="text-sm text-white/70" />
          <span className="text-xs text-white/50">{formatRelative(event.created_at)}</span>
        </div>
        <div className="mt-4 text-lg leading-relaxed">
          <NoteContent content={event.content || "(binary event)"} profiles={profiles} maxLines={0} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/50">
          <span className="inline-flex items-center gap-1.5">💬 {stats?.replies ?? 0} replies</span>
        </div>
        <div className="mt-4">
          <InteractionTabs
            reactions={reactions}
            reposts={reposts}
            zaps={zaps}
            profiles={allInteractorProfiles}
          />
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
        <div className="mt-4">
          {replies.length > 0 ? (
            <ReplyThread
              nodes={buildReplyTree(replies, id)}
              profiles={profiles}
            />
          ) : (
            <p className="text-sm text-white/60">No replies yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
