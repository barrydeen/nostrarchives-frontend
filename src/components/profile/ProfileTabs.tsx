"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, MessageSquare, Zap, UserPlus, Users } from "lucide-react";
import { StoredEvent, ProfileMetadataEntry, ProfileMap, ProfileZapEntry } from "@/lib/types";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { ZapCard } from "@/components/profile/ZapCard";
import { truncateHex } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

type Tab = "notes" | "replies" | "zaps_sent" | "zaps_received" | "followers" | "following";

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface ProfileTabsProps {
  pubkey: string;
  initialNotes: StoredEvent[];
  initialNotesTotal: number;
  initialProfiles: Map<string, ProfileMetadataEntry>;
  followsPubkeys: string[];
  followsCount: number;
  followersPubkeys: string[];
  followersCount: number;
}

function profileMapToMetadataMap(pm: ProfileMap): Map<string, ProfileMetadataEntry> {
  const map = new Map<string, ProfileMetadataEntry>();
  for (const [pk, data] of Object.entries(pm)) {
    map.set(pk, {
      pubkey: pk,
      name: data.name,
      display_name: data.display_name,
      preferred_name: data.display_name || data.name,
      picture: data.picture,
    });
  }
  return map;
}

export function ProfileTabs({
  pubkey,
  initialNotes,
  initialNotesTotal,
  initialProfiles,
  followsPubkeys,
  followsCount,
  followersPubkeys,
  followersCount,
}: ProfileTabsProps) {
  const TABS: TabDef[] = [
    { id: "notes", label: "Notes", icon: <FileText className="size-4" /> },
    { id: "replies", label: "Replies", icon: <MessageSquare className="size-4" /> },
    { id: "followers", label: "Followers", icon: <Users className="size-4" />, count: followersCount },
    { id: "following", label: "Following", icon: <UserPlus className="size-4" />, count: followsCount },
    { id: "zaps_sent", label: "Zaps Sent", icon: <Zap className="size-4" /> },
    { id: "zaps_received", label: "Zaps Received", icon: <Zap className="size-4" /> },
  ];

  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [loading, setLoading] = useState(false);

  // Sort state for each tab
  const [notesSort, setNotesSort] = useState("recent");
  const [repliesSort, setRepliesSort] = useState("recent");
  const [zapsSentSort, setZapsSentSort] = useState("recent");
  const [zapsReceivedSort, setZapsReceivedSort] = useState("recent");

  // Notes state (pre-loaded)
  const [notes, setNotes] = useState(initialNotes);
  const [notesTotal, setNotesTotal] = useState(initialNotesTotal);
  const [notesProfiles, setNotesProfiles] = useState(initialProfiles);

  // Replies state
  const [replies, setReplies] = useState<StoredEvent[]>([]);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [repliesProfiles, setRepliesProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [repliesLoaded, setRepliesLoaded] = useState(false);

  // Zaps sent state
  const [zapsSent, setZapsSent] = useState<ProfileZapEntry[]>([]);
  const [zapsSentTotal, setZapsSentTotal] = useState(0);
  const [zapsSentProfiles, setZapsSentProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [zapsSentLoaded, setZapsSentLoaded] = useState(false);

  // Zaps received state
  const [zapsReceived, setZapsReceived] = useState<ProfileZapEntry[]>([]);
  const [zapsReceivedTotal, setZapsReceivedTotal] = useState(0);
  const [zapsReceivedProfiles, setZapsReceivedProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [zapsReceivedLoaded, setZapsReceivedLoaded] = useState(false);

  // Followers/following profiles (lazy-loaded via bulk metadata)
  const [followersProfiles, setFollowersProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingProfiles, setFollowingProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [followingLoaded, setFollowingLoaded] = useState(false);

  const fetchBulkProfiles = useCallback(async (pubkeys: string[]): Promise<Map<string, ProfileMetadataEntry>> => {
    if (!pubkeys.length) return new Map();
    try {
      const res = await fetch(`${API_BASE_URL}/v1/profiles/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ pubkeys: pubkeys.slice(0, 500) }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      const map = new Map<string, ProfileMetadataEntry>();
      for (const p of data.profiles || []) {
        map.set(p.pubkey, p);
      }
      return map;
    } catch (err) {
      console.error("[ProfileTabs] Failed to fetch bulk profiles:", err);
      return new Map();
    }
  }, []);

  const fetchTab = useCallback(async (tab: Tab, sort?: string) => {
    if (tab === "notes" && sort === "recent" && notesSort === "recent") return;
    if (tab === "replies" && repliesLoaded && !sort) return;
    if (tab === "zaps_sent" && zapsSentLoaded && !sort) return;
    if (tab === "zaps_received" && zapsReceivedLoaded && !sort) return;
    if (tab === "followers" && followersLoaded) return;
    if (tab === "following" && followingLoaded) return;

    // Followers/following use bulk metadata fetch
    if (tab === "followers") {
      setLoading(true);
      const profiles = await fetchBulkProfiles(followersPubkeys);
      setFollowersProfiles(profiles);
      setFollowersLoaded(true);
      setLoading(false);
      return;
    }
    if (tab === "following") {
      setLoading(true);
      const profiles = await fetchBulkProfiles(followsPubkeys);
      setFollowingProfiles(profiles);
      setFollowingLoaded(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const sortParam = sort ? `&sort=${sort}` : "";
      const endpoint =
        tab === "notes" ? `/v1/profiles/${pubkey}/notes?limit=20${sortParam}`
        : tab === "replies" ? `/v1/profiles/${pubkey}/replies?limit=20${sortParam}`
        : tab === "zaps_sent" ? `/v1/profiles/${pubkey}/zaps/sent?limit=20${sortParam}`
        : `/v1/profiles/${pubkey}/zaps/received?limit=20${sortParam}`;

      const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();

      if (tab === "notes") {
        setNotes(data.events || []);
        setNotesTotal(data.total || 0);
        setNotesProfiles(profileMapToMetadataMap(data.profiles || {}));
      } else if (tab === "replies") {
        setReplies(data.events || []);
        setRepliesTotal(data.total || 0);
        setRepliesProfiles(profileMapToMetadataMap(data.profiles || {}));
        setRepliesLoaded(true);
      } else if (tab === "zaps_sent") {
        setZapsSent(data.zaps || []);
        setZapsSentTotal(data.total || 0);
        setZapsSentProfiles(profileMapToMetadataMap(data.profiles || {}));
        setZapsSentLoaded(true);
      } else {
        setZapsReceived(data.zaps || []);
        setZapsReceivedTotal(data.total || 0);
        setZapsReceivedProfiles(profileMapToMetadataMap(data.profiles || {}));
        setZapsReceivedLoaded(true);
      }
    } catch (err) {
      console.error(`[ProfileTabs] Failed to fetch ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  }, [pubkey, repliesLoaded, zapsSentLoaded, zapsReceivedLoaded, followersLoaded, followingLoaded, notesSort, followersPubkeys, followsPubkeys, fetchBulkProfiles]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleNotesSort = (sort: string) => {
    setNotesSort(sort);
    fetchTab("notes", sort);
  };

  const handleRepliesSort = (sort: string) => {
    setRepliesSort(sort);
    fetchTab("replies", sort);
  };

  const handleZapsSentSort = (sort: string) => {
    setZapsSentSort(sort);
    fetchTab("zaps_sent", sort);
  };

  const handleZapsReceivedSort = (sort: string) => {
    setZapsReceivedSort(sort);
    fetchTab("zaps_received", sort);
  };

  return (
    <section>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 mb-4 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "text-white border-neon-blue"
                : "text-white/50 border-transparent hover:text-white/70"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 text-xs ${activeTab === tab.id ? "text-white/70" : "text-white/30"}`}>
                {tab.count.toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {activeTab === "notes" && (
            <EventGrid 
              events={notes} 
              total={notesTotal} 
              profiles={notesProfiles} 
              onSortChange={handleNotesSort}
              currentSort={notesSort}
            />
          )}
          {activeTab === "replies" && (
            <EventGrid 
              events={replies} 
              total={repliesTotal} 
              profiles={repliesProfiles} 
              onSortChange={handleRepliesSort}
              currentSort={repliesSort}
            />
          )}
          {activeTab === "followers" && (
            <ProfileGrid
              pubkeys={followersPubkeys}
              profiles={followersProfiles}
              total={followersCount}
              emptyMessage="No followers found."
            />
          )}
          {activeTab === "following" && (
            <ProfileGrid
              pubkeys={followsPubkeys}
              profiles={followingProfiles}
              total={followsCount}
              emptyMessage="Not following anyone."
            />
          )}
          {activeTab === "zaps_sent" && (
            <ZapGrid 
              zaps={zapsSent} 
              total={zapsSentTotal} 
              profiles={zapsSentProfiles} 
              direction="sent" 
              onSortChange={handleZapsSentSort}
              currentSort={zapsSentSort}
            />
          )}
          {activeTab === "zaps_received" && (
            <ZapGrid 
              zaps={zapsReceived} 
              total={zapsReceivedTotal} 
              profiles={zapsReceivedProfiles} 
              direction="received" 
              onSortChange={handleZapsReceivedSort}
              currentSort={zapsReceivedSort}
            />
          )}
        </>
      )}
    </section>
  );
}

function EventGrid({ events, total, profiles, onSortChange, currentSort }: {
  events: StoredEvent[];
  total: number;
  profiles: Map<string, ProfileMetadataEntry>;
  onSortChange?: (sort: string) => void;
  currentSort?: string;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-white/30 py-8 text-center">No events found.</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/30">{total.toLocaleString()} total</span>
        {onSortChange && (
          <select
            value={currentSort || "recent"}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs bg-card/50 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:border-neon-blue outline-none"
          >
            <option value="recent">Recent</option>
            <option value="likes">Most Liked</option>
            <option value="zaps">Most Zapped</option>
            <option value="reposts">Most Reposted</option>
          </select>
        )}
      </div>
      <div className="columns-1 md:columns-2 gap-3 space-y-3">
        {events.map((event) => (
          <div key={event.id} className="break-inside-avoid">
            <UnifiedNoteCard
              event={event}
              profile={profiles.get(event.pubkey)}
              profiles={profiles}
              engagement={{
                reactions: event.reactions ?? 0,
                replies: event.replies ?? 0,
                reposts: event.reposts ?? 0,
                zap_sats: event.zap_sats ?? 0,
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function ZapGrid({ zaps, total, profiles, direction, onSortChange, currentSort }: {
  zaps: ProfileZapEntry[];
  total: number;
  profiles: Map<string, ProfileMetadataEntry>;
  direction: "sent" | "received";
  onSortChange?: (sort: string) => void;
  currentSort?: string;
}) {
  if (zaps.length === 0) {
    return <p className="text-sm text-white/30 py-8 text-center">No zaps found.</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/30">{total.toLocaleString()} total</span>
        {onSortChange && (
          <select
            value={currentSort || "recent"}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs bg-card/50 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:border-neon-blue outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="amount">Largest Amount</option>
          </select>
        )}
      </div>
      <div className="columns-1 md:columns-2 gap-3 space-y-3">
        {zaps.map((zap) => (
          <div key={zap.event.id} className="break-inside-avoid">
            <ZapCard
              zap={zap}
              profiles={profiles}
              direction={direction}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function ProfileGrid({ pubkeys, profiles, total, emptyMessage }: {
  pubkeys: string[];
  profiles: Map<string, ProfileMetadataEntry>;
  total: number;
  emptyMessage: string;
}) {
  if (pubkeys.length === 0) {
    return <p className="text-sm text-white/30 py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/30">
          Showing {pubkeys.length.toLocaleString()} of {total.toLocaleString()}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pubkeys.map((pk) => {
          const profile = profiles.get(pk);
          const displayName = profile?.preferred_name || profile?.display_name || profile?.name || truncateHex(pk);
          const picture = profile?.picture;

          return (
            <Link
              key={pk}
              href={`/profiles/${pk}`}
              prefetch={false}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-card/70 p-3 transition-all hover:border-white/20 hover:bg-card/90 hover:shadow-lg"
            >
              {/* Avatar */}
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={picture}
                  alt=""
                  className="size-11 shrink-0 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-white/20 transition-all"
                  loading="lazy"
                />
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-blue/30 ring-1 ring-white/10 text-sm font-bold text-white/60 group-hover:ring-white/20 transition-all">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate group-hover:text-white transition-colors">
                  {displayName}
                </p>
                <p className="text-xs text-white/30 truncate mt-0.5">
                  {truncateHex(pk)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-card/70 p-4 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
          <div className="h-3 bg-white/10 rounded w-full mb-2" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
