"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SafeAvatar } from "@/components/search/SafeAvatar";
import { fetchBulkProfileMetadata } from "@/lib/nostr-relay";

interface InteractorProfile {
  pubkey: string;
  name: string | null;
  display_name: string | null;
  picture: string | null;
}

interface InteractionTabsProps {
  reactions: { pubkey: string; emoji: string }[];
  reposts: { pubkey: string }[];
  zaps: { pubkey: string; sats?: number }[];
  profiles: Record<string, InteractorProfile>;
  /** Counter-based stats from the DB (reactions/reposts are counter-only, events not stored) */
  stats?: { reactions?: number; reposts?: number; zaps?: number };
}

type Tab = "reactions" | "reposts" | "zaps";

function shortPubkey(pk: string) {
  return `${pk.slice(0, 8)}…${pk.slice(-4)}`;
}

function ProfileRow({
  pubkey,
  profile,
  extra,
}: {
  pubkey: string;
  profile?: InteractorProfile;
  extra?: React.ReactNode;
}) {
  const displayName = profile?.display_name || profile?.name || shortPubkey(pubkey);
  return (
    <Link
      href={`/profiles/${pubkey}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
    >
      <SafeAvatar src={profile?.picture ?? null} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm text-white/80">
        {displayName}
      </span>
      {extra}
    </Link>
  );
}

export function InteractionTabs({
  reactions,
  reposts,
  zaps,
  profiles,
  stats,
}: InteractionTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [relayProfiles, setRelayProfiles] = useState<Record<string, InteractorProfile>>({});
  const fetchedRef = useRef(false);

  const totalZapSats = zaps.reduce((sum, z) => sum + (z.sats ?? 0), 0);
  const zapCount = stats?.zaps ?? zaps.length;

  // Lazily fetch missing zap sender profiles from public relays
  useEffect(() => {
    if (activeTab !== "zaps" || fetchedRef.current) return;
    fetchedRef.current = true;

    const missingPubkeys = zaps
      .map((z) => z.pubkey)
      .filter((pk) => !profiles[pk] && !relayProfiles[pk]);
    const unique = [...new Set(missingPubkeys)];
    if (unique.length === 0) return;

    fetchBulkProfileMetadata(unique).then((fetched) => {
      const newProfiles: Record<string, InteractorProfile> = {};
      for (const [pubkey, p] of fetched) {
        newProfiles[pubkey] = {
          pubkey,
          name: p.name,
          display_name: p.display_name,
          picture: p.picture,
        };
      }
      setRelayProfiles((prev) => ({ ...prev, ...newProfiles }));
    });
  }, [activeTab, zaps, profiles, relayProfiles]);

  // Merge backend profiles with relay-fetched profiles
  const allProfiles = { ...profiles, ...relayProfiles };

  // Prefer counter-based stats (accurate even when individual events aren't stored).
  // Fall back to array length for backwards compatibility.
  const tabs: { key: Tab; label: string; icon: string; display: React.ReactNode }[] = [
    { key: "reactions", label: "Reactions", icon: "❤️", display: stats?.reactions ?? reactions.length },
    { key: "reposts", label: "Reposts", icon: "🔁", display: stats?.reposts ?? reposts.length },
    {
      key: "zaps",
      label: "Zaps",
      icon: "⚡",
      display: (
        <>
          {totalZapSats.toLocaleString()} sats
          <span className="text-white/40"> ({zapCount})</span>
        </>
      ),
    },
  ];

  return (
    <div>
      {/* Tab buttons — also serves as the stats row */}
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(isActive ? null : tab.key)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.display}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      {activeTab && (
        <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-surface/50 p-2">
          {activeTab === "reactions" && (
            reactions.length > 0 ? (
              <div className="space-y-0.5">
                {reactions.map((r, i) => (
                  <ProfileRow
                    key={`${r.pubkey}-${i}`}
                    pubkey={r.pubkey}
                    profile={allProfiles[r.pubkey]}
                    extra={
                      <span className="shrink-0 text-base">{r.emoji}</span>
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="px-3 py-4 text-sm text-white/40">No reactions yet.</p>
            )
          )}

          {activeTab === "reposts" && (
            reposts.length > 0 ? (
              <div className="space-y-0.5">
                {reposts.map((r, i) => (
                  <ProfileRow
                    key={`${r.pubkey}-${i}`}
                    pubkey={r.pubkey}
                    profile={allProfiles[r.pubkey]}
                  />
                ))}
              </div>
            ) : (
              <p className="px-3 py-4 text-sm text-white/40">No reposts yet.</p>
            )
          )}

          {activeTab === "zaps" && (
            zaps.length > 0 ? (
              <div className="space-y-0.5">
                {zaps.map((z, i) => (
                  <ProfileRow
                    key={`${z.pubkey}-${i}`}
                    pubkey={z.pubkey}
                    profile={allProfiles[z.pubkey]}
                    extra={
                      z.sats ? (
                        <span className="shrink-0 text-xs text-yellow-400">
                          ⚡ {z.sats.toLocaleString()} sats
                        </span>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="px-3 py-4 text-sm text-white/40">No zaps yet.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
