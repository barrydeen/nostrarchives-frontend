import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getProfileMetadata, getRecentEvents, getSocialGraph, getBulkProfileMetadata } from "@/lib/api";
import { normalizeEvents } from "@/lib/normalizers";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { ProfileName } from "@/components/ProfileName";
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
  const networkPubkeys = [
    pubkey,
    ...(social?.follows.pubkeys.slice(0, 18) ?? []),
    ...(social?.followers.pubkeys.slice(0, 18) ?? []),
  ];
  const networkProfiles = await getBulkProfileMetadata(networkPubkeys);

  const profile = metadata?.metadata ?? {};
  const name = profile.display_name || profile.name || truncateHex(pubkey);
  const bio = profile.about ?? "No profile text yet.";
  const nip05 = profile.nip05 as string | undefined;
  const picture = typeof profile.picture === "string" ? profile.picture : undefined;

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
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div
            className="size-32 rounded-3xl border border-white/10 bg-gradient-to-br from-neon-pink/40 to-neon-blue/40 shadow-glow"
            style={picture ? { backgroundImage: `url(${picture})`, backgroundSize: "cover" } : undefined}
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold">{name}</h1>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">{truncateHex(pubkey)}</span>
            </div>
            <p className="text-white/70">{bio}</p>
            {nip05 && (
              <p className="inline-flex items-center gap-2 text-sm text-white/60">
                <ExternalLink className="size-4" />
                {nip05}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-surface/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Followers</p>
                <p className="text-2xl font-semibold">{formatNumber(social?.followers.count)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-surface/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Following</p>
                <p className="text-2xl font-semibold">{formatNumber(social?.follows.count)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-surface/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Notes indexed</p>
                <p className="text-2xl font-semibold">{formatNumber(totalNotes)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-2xl font-semibold">Latest notes</h2>
          <span className="text-sm text-white/50">/v1/events?pubkey={pubkey}</span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <UnifiedNoteCard key={event.id} event={event} profile={networkProfiles.get(event.pubkey)} profiles={networkProfiles} />
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-white/60">
          <Users className="size-4" />
          <h2 className="text-lg font-semibold">Network</h2>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-white/60">Following</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {social?.follows.pubkeys.slice(0, 18).map((follow) => (
                <Link
                  key={follow}
                  href={`/profiles/${follow}`}
                  prefetch={false}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                >
                  <ProfileName pubkey={follow} profile={networkProfiles.get(follow)} className="text-xs" />
                </Link>
              )) || <p className="text-sm text-white/50">No data yet.</p>}
            </div>
          </div>
          <div>
            <p className="text-sm text-white/60">Followers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {social?.followers.pubkeys.slice(0, 18).map((follower) => (
                <Link
                  key={follower}
                  href={`/profiles/${follower}`}
                  prefetch={false}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                >
                  <ProfileName pubkey={follower} profile={networkProfiles.get(follower)} className="text-xs" />
                </Link>
              )) || <p className="text-sm text-white/50">No data yet.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
