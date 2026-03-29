"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Zap, Loader2 } from "lucide-react";
import {
  getSocialGraph,
  getBulkProfileMetadata,
  getProfileNotes,
  getProfileZapStats,
} from "@/lib/api";
import { TruncatedBio } from "@/components/profile/TruncatedBio";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { BlockButton } from "@/components/profile/BlockButton";
import { FollowButton } from "@/components/profile/FollowButton";
import { formatNumber, truncateHex } from "@/lib/utils";
import type {
  ProfileMetadataEntry,
  SocialResponse,
  ProfileNotesResponse,
  ProfileZapStatsResponse,
  StoredEvent,
} from "@/lib/types";

interface ProfileHeaderProps {
  pubkey: string;
}

export function ProfileHeader({ pubkey }: ProfileHeaderProps) {
  const [social, setSocial] = useState<SocialResponse | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [notesResponse, setNotesResponse] = useState<ProfileNotesResponse | null>(null);
  const [zapStats, setZapStats] = useState<ProfileZapStatsResponse | null>(null);
  const [networkProfiles, setNetworkProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [socialRes, notesRes, zapRes] = await Promise.all([
        getSocialGraph(pubkey).catch(() => null),
        getProfileNotes(pubkey, 20, 0).catch(() => null),
        getProfileZapStats(pubkey).catch(() => null),
      ]);

      if (cancelled) return;

      setSocial(socialRes);
      setNotesResponse(notesRes);
      setZapStats(zapRes);

      // Build network pubkeys for bulk metadata fetch (includes this profile)
      const networkPubkeys = new Set<string>();
      networkPubkeys.add(pubkey);
      (socialRes?.follows.pubkeys.slice(0, 18) ?? []).forEach((pk) => networkPubkeys.add(pk));
      (socialRes?.followers.pubkeys.slice(0, 18) ?? []).forEach((pk) => networkPubkeys.add(pk));
      (notesRes?.events ?? []).forEach((e: StoredEvent) => networkPubkeys.add(e.pubkey));

      const profiles = await getBulkProfileMetadata([...networkPubkeys]).catch(() => new Map<string, ProfileMetadataEntry>());

      if (cancelled) return;

      // Merge profiles from notes response
      if (notesRes?.profiles) {
        for (const [pk, data] of Object.entries(notesRes.profiles)) {
          if (!profiles.has(pk)) {
            profiles.set(pk, {
              pubkey: pk,
              name: data.name,
              display_name: data.display_name,
              preferred_name: data.display_name || data.name,
              picture: data.picture,
            } as ProfileMetadataEntry);
          }
        }
      }

      // Extract this profile's metadata from bulk response
      const myProfile = profiles.get(pubkey);
      if (myProfile) {
        setProfile({
          display_name: myProfile.display_name,
          name: myProfile.name,
          picture: myProfile.picture,
          about: myProfile.about,
          nip05: myProfile.nip05,
          lud16: myProfile.lud16,
        });
      }

      setNetworkProfiles(profiles);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [pubkey]);

  const name = (profile.display_name || profile.name || truncateHex(pubkey)) as string;
  const bio = (profile.about ?? "") as string;
  const nip05 = profile.nip05 as string | undefined;
  const picture = typeof profile.picture === "string" ? profile.picture : undefined;
  const lightningAddress = (profile.lud16 as string | undefined) || null;
  const zapsSentSats = zapStats?.sent?.total_sats ?? 0;
  const zapsReceivedSats = zapStats?.received?.total_sats ?? 0;
  const events = notesResponse?.events ?? [];

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
              <h1 className="text-xl sm:text-2xl font-semibold truncate">
                {loading && !profile.name ? (
                  <span className="inline-flex items-center gap-2 text-white/40">
                    <Loader2 className="size-4 animate-spin" />
                    {truncateHex(pubkey)}
                  </span>
                ) : name}
              </h1>
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <FollowButton pubkey={pubkey} />
          <ProfileActions pubkey={pubkey} lightningAddress={lightningAddress} />
          <BlockButton pubkey={pubkey} />
        </div>
      </section>

      {/* ── Tabbed Content ── */}
      <ProfileTabs
        pubkey={pubkey}
        initialNotes={events}
        initialProfiles={networkProfiles}
        followsPubkeys={social?.follows.pubkeys ?? []}
        followsCount={social?.follows.count ?? 0}
        followersPubkeys={social?.followers.pubkeys ?? []}
        followersCount={social?.followers.count ?? 0}
      />
    </div>
  );
}
