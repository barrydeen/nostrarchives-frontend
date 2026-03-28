"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SimplePool } from "nostr-tools/pool";
import type { Event } from "nostr-tools/core";
import { ProfileMetadataEntry } from "@/lib/types";

const BATCH_INTERVAL = 3000; // Fetch new profiles every 3s
const BATCH_SIZE = 50; // Max pubkeys per relay query

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
    const display_name =
      meta.display_name || meta.displayName || null;
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
  const pendingRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  const fetchFromRelays = useCallback(async (pks: string[]) => {
    if (!pks.length) return;

    const p = getPool();

    // Track the best (most recent) kind-0 per pubkey
    const best = new Map<string, Event>();

    // Query in batches to avoid overloading relays
    for (let i = 0; i < pks.length; i += BATCH_SIZE) {
      const batch = pks.slice(i, i + BATCH_SIZE);

      try {
        const events = await p.querySync(RELAYS, {
          kinds: [0],
          authors: batch,
        });

        for (const ev of events) {
          const existing = best.get(ev.pubkey);
          if (!existing || ev.created_at > existing.created_at) {
            best.set(ev.pubkey, ev);
          }
        }
      } catch {
        // Relay errors are non-fatal
      }
    }

    // Parse and store results
    let changed = false;
    for (const [pubkey, event] of best) {
      const parsed = parseKind0(event);
      if (parsed) {
        profilesRef.current.set(pubkey, { pubkey, ...parsed });
        changed = true;
      }
      inFlightRef.current.delete(pubkey);
    }

    // Mark pubkeys with no results so we don't retry them
    for (const pk of pks) {
      inFlightRef.current.delete(pk);
    }

    if (changed) {
      setProfiles(new Map(profilesRef.current));
    }
  }, []);

  // Initial bulk fetch
  useEffect(() => {
    if (!pubkeys.length || initialFetchDone.current) return;
    initialFetchDone.current = true;

    fetchFromRelays(pubkeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkeys.length > 0]);

  // Queue unknown pubkeys for batch fetch
  useEffect(() => {
    for (const pk of pubkeys) {
      if (!profilesRef.current.has(pk) && !inFlightRef.current.has(pk)) {
        pendingRef.current.add(pk);
      }
    }
  }, [pubkeys]);

  // Periodically fetch queued pubkeys
  const fetchPending = useCallback(async () => {
    if (pendingRef.current.size === 0) return;
    const batch = Array.from(pendingRef.current).slice(0, BATCH_SIZE * 3);
    pendingRef.current.clear();

    // Mark as in-flight to prevent duplicate requests
    for (const pk of batch) {
      inFlightRef.current.add(pk);
    }

    fetchFromRelays(batch);
  }, [fetchFromRelays]);

  useEffect(() => {
    const interval = setInterval(fetchPending, BATCH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPending]);

  return profiles;
}
