"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ProfileMetadataEntry } from "@/lib/types";
import { fetchBulkProfileMetadata } from "@/lib/client-api";

const BATCH_INTERVAL = 5000; // Fetch new profiles every 5s

export function useOnlineProfiles(pubkeys: string[]) {
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(
    new Map()
  );
  const profilesRef = useRef<Map<string, ProfileMetadataEntry>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  // Initial bulk fetch
  useEffect(() => {
    if (!pubkeys.length || initialFetchDone.current) return;
    initialFetchDone.current = true;

    let cancelled = false;
    fetchBulkProfileMetadata(pubkeys).then((map) => {
      if (cancelled) return;
      profilesRef.current = map;
      setProfiles(new Map(map));
    });

    return () => {
      cancelled = true;
    };
    // Only run on first non-empty pubkeys list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkeys.length > 0]);

  // Queue unknown pubkeys for batch fetch
  useEffect(() => {
    for (const pk of pubkeys) {
      if (!profilesRef.current.has(pk)) {
        pendingRef.current.add(pk);
      }
    }
  }, [pubkeys]);

  // Periodically fetch queued pubkeys
  const fetchPending = useCallback(async () => {
    if (pendingRef.current.size === 0) return;
    const batch = Array.from(pendingRef.current).slice(0, 500);
    pendingRef.current.clear();

    try {
      const newProfiles = await fetchBulkProfileMetadata(batch);
      for (const [pk, profile] of newProfiles) {
        profilesRef.current.set(pk, profile);
      }
      setProfiles(new Map(profilesRef.current));
    } catch {
      // Re-queue on failure
      for (const pk of batch) {
        if (!profilesRef.current.has(pk)) {
          pendingRef.current.add(pk);
        }
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchPending, BATCH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPending]);

  return profiles;
}
