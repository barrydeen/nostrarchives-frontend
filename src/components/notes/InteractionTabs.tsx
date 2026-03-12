"use client";

import { useState } from "react";
import Link from "next/link";
import { SafeAvatar } from "@/components/search/SafeAvatar";

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
}: InteractionTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: "reactions", label: "Reactions", icon: "❤️", count: reactions.length },
    { key: "reposts", label: "Reposts", icon: "🔁", count: reposts.length },
    { key: "zaps", label: "Zaps", icon: "⚡", count: zaps.length },
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
              <span>{tab.count}</span>
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
                    profile={profiles[r.pubkey]}
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
                    profile={profiles[r.pubkey]}
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
                    profile={profiles[z.pubkey]}
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
