import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Users } from "lucide-react";
import { getProfileMetadata, getRecentEvents, getSocialGraph, getBulkProfileMetadata } from "@/lib/api";
import { normalizeEvents } from "@/lib/normalizers";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { ProfileName } from "@/components/ProfileName";
import { TruncatedBio } from "@/components/profile/TruncatedBio";
import { formatNumber, truncateHex } from "@/lib/utils";

interface ProfilePageProps {
  params: Promise<{ pubkey: string }>;
}

function isHex(input: string) {
  return /^[0-9a-f]{64}$/i.test(input);
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { pubkey } = await params;

  if (!isHex(pubkey)) {
    notFound();
  }

  const [social, metadata, eventsResponse] = await Promise.all([
    getSocialGraph(pubkey),
    getProfileMetadata(pubkey),
    getRecentEvents({ pubkey, limit: 12, kind: 1 }),
  ]);

  const events = normalizeEvents(eventsResponse);
  const totalNotes = (eventsResponse && !Array.isArray(eventsResponse) && "total" in eventsResponse)
    ? (eventsResponse as { total?: number }).total ?? events.length
    : events.length;

  // Bulk-fetch profile names for follows/followers chips and the page owner
  const networkPubkeys = new Set<string>();
  networkPubkeys.add(pubkey);
  (social?.follows.pubkeys.slice(0, 18) ?? []).forEach((pk) => networkPubkeys.add(pk));
  (social?.followers.pubkeys.slice(0, 18) ?? []).forEach((pk) => networkPubkeys.add(pk));

  // Include mention pubkeys from latest notes so @DisplayName renders in content
  extractMentionPubkeysFromEvents(events).forEach((pk) => networkPubkeys.add(pk));

  const networkProfiles = await getBulkProfileMetadata([...networkPubkeys]);

  const profile = metadata?.metadata ?? {};
  const name = profile.display_name || profile.name || truncateHex(pubkey);
  const bio = profile.about ?? "";
  const nip05 = profile.nip05 as string | undefined;
  const picture = typeof profile.picture === "string" ? profile.picture : undefined;

  return (
    <div className="space-y-6">
      {/* ── Compact Profile Header ── */}
      <section className="rounded-2xl border border-white/10 bg-card/70 p-4 sm:p-5 shadow-xl">
        {/* Top row: avatar + identity */}
        <div className="flex items-start gap-4">
          <div
            className="size-16 sm:size-20 shrink-0 rounded-2xl border border-white/10 bg-gradient-to-br from-neon-pink/40 to-neon-blue/40 shadow-glow"
            style={picture ? { backgroundImage: `url(${picture})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold truncate">{name}</h1>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50 shrink-0">
                {truncateHex(pubkey)}
              </span>
            </div>
            {nip05 && (
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-white/50 truncate max-w-full">
                <ExternalLink className="size-3 shrink-0" />
                <span className="truncate">{nip05}</span>
              </p>
            )}
            {/* Inline stats row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                <span className="font-semibold text-white">{formatNumber(social?.followers.count)}</span>
                <span className="ml-1 text-white/50">Followers</span>
              </span>
              <span>
                <span className="font-semibold text-white">{formatNumber(social?.follows.count)}</span>
                <span className="ml-1 text-white/50">Following</span>
              </span>
              <span>
                <span className="font-semibold text-white">{formatNumber(totalNotes)}</span>
                <span className="ml-1 text-white/50">Notes</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio — truncated to 2 lines on mobile */}
        {bio && (
          <div className="mt-3">
            <TruncatedBio text={bio} maxLines={2} />
          </div>
        )}
      </section>

      {/* ── Notes Feed ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <span className="text-xs text-white/30">{formatNumber(totalNotes)} indexed</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((event) => (
            <UnifiedNoteCard
              key={event.id}
              event={event}
              profile={networkProfiles.get(event.pubkey)}
              profiles={networkProfiles}
              engagement={{
                reactions: event.reactions ?? 0,
                replies: event.replies ?? 0,
                reposts: event.reposts ?? 0,
                zap_sats: event.zap_sats ?? 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Network ── */}
      <section className="rounded-2xl border border-white/10 bg-card/70 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-2 text-white/60">
          <Users className="size-4" />
          <h2 className="text-base font-semibold">Network</h2>
        </div>
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs text-white/50 mb-2">Following</p>
            <div className="flex flex-wrap gap-1.5">
              {social?.follows.pubkeys.slice(0, 18).map((follow) => (
                <Link
                  key={follow}
                  href={`/profiles/${follow}`}
                  prefetch={false}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/70 hover:border-white/20 transition-colors"
                >
                  <ProfileName pubkey={follow} profile={networkProfiles.get(follow)} className="text-xs" showAvatar />
                </Link>
              )) || <p className="text-xs text-white/40">No data yet.</p>}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/50 mb-2">Followers</p>
            <div className="flex flex-wrap gap-1.5">
              {social?.followers.pubkeys.slice(0, 18).map((follower) => (
                <Link
                  key={follower}
                  href={`/profiles/${follower}`}
                  prefetch={false}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/70 hover:border-white/20 transition-colors"
                >
                  <ProfileName pubkey={follower} profile={networkProfiles.get(follower)} className="text-xs" showAvatar />
                </Link>
              )) || <p className="text-xs text-white/40">No data yet.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
