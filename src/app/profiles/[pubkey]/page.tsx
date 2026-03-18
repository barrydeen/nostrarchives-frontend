import { notFound } from "next/navigation";
import { ExternalLink, Zap } from "lucide-react";
import { getProfileMetadata, getSocialGraph, getBulkProfileMetadata, getProfileNotes, getProfileReplies, getProfileZapStats } from "@/lib/api";
import { TruncatedBio } from "@/components/profile/TruncatedBio";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { formatNumber, truncateHex } from "@/lib/utils";
import { ProfileMetadataEntry } from "@/lib/types";

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

  const [social, metadata, notesResponse, repliesResponse, zapStats] = await Promise.all([
    getSocialGraph(pubkey),
    getProfileMetadata(pubkey),
    getProfileNotes(pubkey, 20, 0),
    getProfileReplies(pubkey, 1, 0),
    getProfileZapStats(pubkey),
  ]);

  const events = notesResponse?.events ?? [];
  const totalNotes = notesResponse?.total ?? events.length;
  const totalReplies = repliesResponse?.total ?? 0;
  const totalKind1 = totalNotes + totalReplies;

  // Build profiles map from notes response + network pubkeys
  const networkPubkeys = new Set<string>();
  networkPubkeys.add(pubkey);
  (social?.follows.pubkeys.slice(0, 18) ?? []).forEach((pk) => networkPubkeys.add(pk));
  (social?.followers.pubkeys.slice(0, 18) ?? []).forEach((pk) => networkPubkeys.add(pk));
  events.forEach((e) => networkPubkeys.add(e.pubkey));

  // Merge API response profiles with bulk-fetched network profiles
  const networkProfiles = await getBulkProfileMetadata([...networkPubkeys]);

  // Also merge in profiles from notes response
  if (notesResponse?.profiles) {
    for (const [pk, data] of Object.entries(notesResponse.profiles)) {
      if (!networkProfiles.has(pk)) {
        networkProfiles.set(pk, {
          pubkey: pk,
          name: data.name,
          display_name: data.display_name,
          preferred_name: data.display_name || data.name,
          picture: data.picture,
        } as ProfileMetadataEntry);
      }
    }
  }

  const profile = metadata?.metadata ?? {};
  const name = profile.display_name || profile.name || truncateHex(pubkey);
  const bio = profile.about ?? "";
  const nip05 = profile.nip05 as string | undefined;
  const picture = typeof profile.picture === "string" ? profile.picture : undefined;

  const zapsSentSats = zapStats?.sent?.total_sats ?? 0;
  const zapsReceivedSats = zapStats?.received?.total_sats ?? 0;

  return (
    <div className="min-w-0 space-y-6">
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
                <span className="font-semibold text-white">{formatNumber(totalKind1)}</span>
                <span className="ml-1 text-white/50">Notes</span>
              </span>
              {zapsSentSats > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Zap className="size-3 text-amber-400" />
                  <span className="font-semibold text-amber-300">{formatNumber(zapsSentSats)}</span>
                  <span className="text-white/50">Sent</span>
                </span>
              )}
              {zapsReceivedSats > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Zap className="size-3 text-amber-400" />
                  <span className="font-semibold text-amber-300">{formatNumber(zapsReceivedSats)}</span>
                  <span className="text-white/50">Received</span>
                </span>
              )}
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

      {/* ── Tabbed Content ── */}
      <ProfileTabs
        pubkey={pubkey}
        initialNotes={events}
        initialNotesTotal={totalNotes}
        initialProfiles={networkProfiles}
        followsPubkeys={social?.follows.pubkeys ?? []}
        followsCount={social?.follows.count ?? 0}
        followersPubkeys={social?.followers.pubkeys ?? []}
        followersCount={social?.followers.count ?? 0}
      />
    </div>
  );
}
