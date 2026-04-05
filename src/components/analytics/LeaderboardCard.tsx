"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { getBulkProfileMetadata, getTopZappers, getTopPosters, getMostLiked, getMostShared } from "@/lib/api";
import { ProfileMetadataEntry } from "@/lib/types";
import { Zap, PenLine, Heart, Repeat2 } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function truncateHexPubkey(pubkey: string): string {
  if (pubkey.length !== 64) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
}

function formatPubkey(pubkey: string): string {
  try {
    const npub = nip19.npubEncode(pubkey);
    return `${npub.slice(0, 12)}...${npub.slice(-4)}`;
  } catch {
    return truncateHexPubkey(pubkey);
  }
}

function rankBadge(rank: number) {
  if (rank === 1)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-xs font-bold text-black">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-xs font-bold text-black">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-black">
        3
      </span>
    );
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full border border-white/10 text-xs font-medium text-white/40">
      {rank}
    </span>
  );
}

interface TimeframeSwitcherProps {
  value: string;
  onChange: (range: string) => void;
}

function TimeframeSwitcher({ value, onChange }: TimeframeSwitcherProps) {
  const options = [
    { label: "Today", value: "today" },
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface ExtraToggleProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

function ExtraToggle({ options, value, onChange }: ExtraToggleProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

type LeaderboardType = "zappers" | "posters" | "liked" | "shared";

interface LeaderboardConfig {
  title: string;
  icon: React.ReactNode;
  valueKey: string;
  valueLabel: string;
  dataKey: string;
  hasExtraToggle: boolean;
}

const configs: Record<LeaderboardType, LeaderboardConfig> = {
  zappers: {
    title: "Top Zappers",
    icon: <Zap className="size-4" />,
    valueKey: "total_sats",
    valueLabel: "sats",
    dataKey: "zappers",
    hasExtraToggle: true,
  },
  posters: {
    title: "Top Posters",
    icon: <PenLine className="size-4" />,
    valueKey: "note_count",
    valueLabel: "notes",
    dataKey: "authors",
    hasExtraToggle: false,
  },
  liked: {
    title: "Most Liked",
    icon: <Heart className="size-4" />,
    valueKey: "like_count",
    valueLabel: "likes",
    dataKey: "authors",
    hasExtraToggle: false,
  },
  shared: {
    title: "Most Shared",
    icon: <Repeat2 className="size-4" />,
    valueKey: "repost_count",
    valueLabel: "reposts",
    dataKey: "authors",
    hasExtraToggle: false,
  },
};

interface LeaderboardCardProps {
  type: LeaderboardType;
}

export function LeaderboardCard({ type }: LeaderboardCardProps) {
  const config = configs[type];
  const [range, setRange] = useState("7d");
  const [extraValue, setExtraValue] = useState("received"); // For zappers direction
  const [data, setData] = useState<Array<{ pubkey: string; [key: string]: any }>>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch data when range or extra value changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;
        
        switch (type) {
          case "zappers":
            response = await getTopZappers(extraValue as "sent" | "received", 20, range);
            break;
          case "posters":
            response = await getTopPosters(range, 20);
            break;
          case "liked":
            response = await getMostLiked(range, 20);
            break;
          case "shared":
            response = await getMostShared(range, 20);
            break;
        }
        
        if (response) {
          if (type === "zappers" && "zappers" in response) {
            setData(response.zappers);
          } else if ((type === "posters" || type === "liked" || type === "shared") && "authors" in response) {
            setData(response.authors);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${config.title} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, extraValue, type, config.dataKey, config.title]);

  // Fetch profile metadata when data changes
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!data.length) return;
      
      const pubkeys = data.map(item => item.pubkey);
      const profilesMap = await getBulkProfileMetadata(pubkeys);
      setProfiles(profilesMap);
    };

    fetchProfiles();
  }, [data]);

  const top15 = data.slice(0, 15);
  const maxValue = top15[0]?.[config.valueKey] ?? 1;

  const getDisplayName = (pubkey: string) => {
    const profile = profiles.get(pubkey);
    if (profile?.preferred_name) return profile.preferred_name;
    if (profile?.display_name) return profile.display_name;
    if (profile?.name) return profile.name;
    return formatPubkey(pubkey);
  };

  const getAvatar = (pubkey: string) => {
    const profile = profiles.get(pubkey);
    return profile?.picture;
  };

  return (
    <div className="min-w-0 rounded-[28px] border border-white/10 bg-surface/70 p-5 shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="text-neon-blue">{config.icon}</div>
          <h2 className="text-base font-semibold">{config.title}</h2>
        </div>
        <div className="flex gap-2">
          {config.hasExtraToggle && (
            <ExtraToggle
              options={[
                { label: "Received", value: "received" },
                { label: "Sent", value: "sent" },
              ]}
              value={extraValue}
              onChange={setExtraValue}
            />
          )}
          <TimeframeSwitcher value={range} onChange={setRange} />
        </div>
      </div>

      {/* Column headers */}
      <div className="mb-2 flex items-center gap-3 px-1 text-[10px] uppercase tracking-widest text-white/30">
        <span className="w-6" />
        <span className="flex-1">Author</span>
        <span className="w-20 text-right capitalize">{config.valueLabel}</span>
      </div>

      {/* Rows */}
      <div className={`space-y-1 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
        {top15.map((item, idx) => {
          const rank = idx + 1;
          const value = item[config.valueKey];
          const barPct = Math.max(3, (value / maxValue) * 100);
          const displayName = getDisplayName(item.pubkey);
          const avatar = getAvatar(item.pubkey);

          return (
            <div
              key={`${item.pubkey}-${rank}`}
              className="group relative flex items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-white/[0.03]"
            >
              <div className="shrink-0">{rankBadge(rank)}</div>

              {/* Profile + bar */}
              <div className="min-w-0 flex-1">
                <Link href={`/profiles/${item.pubkey}`}>
                  <div className="flex items-center gap-2 hover:text-neon-blue transition-colors">
                    {avatar && (
                      <img
                        src={avatar}
                        alt=""
                        className="size-6 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <p className="truncate text-sm font-medium">
                      {displayName}
                    </p>
                  </div>
                </Link>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon-blue/60 to-neon-blue/30 transition-all duration-500"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>

              {/* Value */}
              <div className="flex w-20 items-center justify-end text-sm tabular-nums text-white/60">
                {formatNumber(value)}
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 15 && (
        <p className="mt-3 text-center text-xs text-white/20">
          +{data.length - 15} more
        </p>
      )}

      {!data.length && !loading && (
        <p className="py-8 text-center text-sm text-white/40">
          No data available
        </p>
      )}
    </div>
  );
}