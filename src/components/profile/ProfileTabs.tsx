"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, MessageSquare, Zap } from "lucide-react";
import { StoredEvent, ProfileMetadataEntry, ProfileMap, ProfileZapEntry } from "@/lib/types";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { ZapCard } from "@/components/profile/ZapCard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

type Tab = "notes" | "replies" | "zaps_sent" | "zaps_received";

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "notes", label: "Notes", icon: <FileText className="size-4" /> },
  { id: "replies", label: "Replies", icon: <MessageSquare className="size-4" /> },
  { id: "zaps_sent", label: "Zaps Sent", icon: <Zap className="size-4" /> },
  { id: "zaps_received", label: "Zaps Received", icon: <Zap className="size-4" /> },
];

interface ProfileTabsProps {
  pubkey: string;
  initialNotes: StoredEvent[];
  initialNotesTotal: number;
  initialProfiles: Map<string, ProfileMetadataEntry>;
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

export function ProfileTabs({ pubkey, initialNotes, initialNotesTotal, initialProfiles }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [loading, setLoading] = useState(false);

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

  const fetchTab = useCallback(async (tab: Tab) => {
    if (tab === "notes") return; // already loaded
    if (tab === "replies" && repliesLoaded) return;
    if (tab === "zaps_sent" && zapsSentLoaded) return;
    if (tab === "zaps_received" && zapsReceivedLoaded) return;

    setLoading(true);
    try {
      const endpoint =
        tab === "replies" ? `/v1/profiles/${pubkey}/replies?limit=20`
        : tab === "zaps_sent" ? `/v1/profiles/${pubkey}/zaps/sent?limit=20`
        : `/v1/profiles/${pubkey}/zaps/received?limit=20`;

      const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();

      if (tab === "replies") {
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
  }, [pubkey, repliesLoaded, zapsSentLoaded, zapsReceivedLoaded]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
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
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {activeTab === "notes" && (
            <EventGrid events={notes} total={notesTotal} profiles={notesProfiles} />
          )}
          {activeTab === "replies" && (
            <EventGrid events={replies} total={repliesTotal} profiles={repliesProfiles} />
          )}
          {activeTab === "zaps_sent" && (
            <ZapGrid zaps={zapsSent} total={zapsSentTotal} profiles={zapsSentProfiles} direction="sent" />
          )}
          {activeTab === "zaps_received" && (
            <ZapGrid zaps={zapsReceived} total={zapsReceivedTotal} profiles={zapsReceivedProfiles} direction="received" />
          )}
        </>
      )}
    </section>
  );
}

function EventGrid({ events, total, profiles }: {
  events: StoredEvent[];
  total: number;
  profiles: Map<string, ProfileMetadataEntry>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-white/30 py-8 text-center">No events found.</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/30">{total.toLocaleString()} total</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {events.map((event) => (
          <UnifiedNoteCard
            key={event.id}
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
        ))}
      </div>
    </>
  );
}

function ZapGrid({ zaps, total, profiles, direction }: {
  zaps: ProfileZapEntry[];
  total: number;
  profiles: Map<string, ProfileMetadataEntry>;
  direction: "sent" | "received";
}) {
  if (zaps.length === 0) {
    return <p className="text-sm text-white/30 py-8 text-center">No zaps found.</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/30">{total.toLocaleString()} total</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {zaps.map((zap) => (
          <ZapCard
            key={zap.event.id}
            zap={zap}
            profiles={profiles}
            direction={direction}
          />
        ))}
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
