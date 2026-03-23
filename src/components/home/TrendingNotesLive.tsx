"use client";

import { useState, useEffect } from "react";
import { fetchTrendingNotes, fetchBulkProfileMetadata } from "@/lib/client-api";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";
import { TrendingNotes } from "./TrendingNotes";
import { SkeletonNoteCard } from "@/components/layout/Skeleton";
import type { TrendingNote, ProfileMetadataEntry } from "@/lib/types";

export function TrendingNotesLive() {
  const [notes, setNotes] = useState<TrendingNote[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchTrendingNotes(10);
        if (cancelled) return;

        const notesList = data?.notes ?? [];
        setNotes(notesList);

        // Gather pubkeys for profile resolution
        const pubkeys = new Set<string>();
        notesList.forEach((n) => pubkeys.add(n.event.pubkey));
        extractMentionPubkeysFromEvents(notesList.map((n) => n.event)).forEach((pk) => pubkeys.add(pk));

        if (pubkeys.size > 0) {
          const profileMap = await fetchBulkProfileMetadata([...pubkeys]);
          if (!cancelled) setProfiles(profileMap);
        }
      } catch {
        // Show empty state on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-3 w-48 animate-pulse rounded-full bg-white/[0.04]" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonNoteCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  return <TrendingNotes notes={notes} profiles={profiles} />;
}
