"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SimplePool } from "nostr-tools/pool";
import type { Event } from "nostr-tools/core";
import { ProfileMetadataEntry } from "@/lib/types";

const BATCH_INTERVAL = 3000; // Fetch new profiles every 3s
const BATCH_SIZE = 80; // Max pubkeys per relay subscription
const FLUSH_INTERVAL = 500; // Flush new profiles to state every 500ms

const RELAYS = [
  "wss://indexer.coracle.social",
  "wss://indexer.nostrarchives.com",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.damus.io",
  "wss://relay.nos.social",
];

let pool: SimplePool | null = null;
function getPool(): SimplePool {
  if (!pool) pool = new SimplePool();
  return pool;
}

function parseKind0(event: Event): Omit<ProfileMetadataEntry, "pubkey"> | null {
  try {
    const meta = JSON.parse(event.content);
    const display_name = meta.display_name || meta.displayName || null;
    const name = meta.name || null;
    const picture = meta.picture || meta.image || null;
    const nip05 = meta.nip05 || null;
    const lud16 = meta.lud16 || null;
    const preferred_name = display_name || name || null;
    return { display_name, name, preferred_name, picture, nip05, lud16 };
  } catch {
    return null;
  }
}

export function useOnlineProfiles(pubkeys: string[]) {
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(
    new Map()
  );
  const profilesRef = useRef<Map<string, ProfileMetadataEntry>>(new Map());
  // Track best (most recent) created_at per pubkey to keep only the latest kind-0
  const bestTimestamps = useRef<Map<string, number>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const requestedRef = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);
  const dirtyRef = useRef(false);

  // Periodic flush: push accumulated profiles to React state
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        setProfiles(new Map(profilesRef.current));
      }
    }, FLUSH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to relays for kind-0 events — profiles arrive one by one as relays deliver them
  const subscribeFromRelays = useCallback((pks: string[]) => {
    if (!pks.length) return;

    const p = getPool();

    // Mark all as requested so we don't re-request
    for (const pk of pks) {
      requestedRef.current.add(pk);
    }

    // Subscribe in batches
    for (let i = 0; i < pks.length; i += BATCH_SIZE) {
      const batch = pks.slice(i, i + BATCH_SIZE);

      const sub = p.subscribeMany(RELAYS, [{ kinds: [0], authors: batch }], {
        onevent(event: Event) {
          const existing = bestTimestamps.current.get(event.pubkey);
          if (existing && event.created_at <= existing) return;

          const parsed = parseKind0(event);
          if (parsed) {
            bestTimestamps.current.set(event.pubkey, event.created_at);
            profilesRef.current.set(event.pubkey, { pubkey: event.pubkey, ...parsed });
            dirtyRef.current = true;
          }
        },
        oneose() {
          // All relays sent their stored events — close the subscription
          sub.close();
        },
      });
    }
  }, []);

  // Initial fetch when first pubkeys arrive
  useEffect(() => {
    if (!pubkeys.length || initialFetchDone.current) return;
    initialFetchDone.current = true;
    subscribeFromRelays(pubkeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkeys.length > 0]);

  // Queue unknown pubkeys for batch fetch
  useEffect(() => {
    for (const pk of pubkeys) {
      if (!profilesRef.current.has(pk) && !requestedRef.current.has(pk)) {
        pendingRef.current.add(pk);
      }
    }
  }, [pubkeys]);

  // Periodically subscribe for queued pubkeys
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingRef.current.size === 0) return;
      const batch = Array.from(pendingRef.current);
      pendingRef.current.clear();
      subscribeFromRelays(batch);
    }, BATCH_INTERVAL);
    return () => clearInterval(interval);
  }, [subscribeFromRelays]);

  return profiles;
}
