"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Event } from "nostr-tools/core";
import { getPool } from "@/lib/nostr-relay";
import { fetchBulkProfileMetadata } from "@/lib/client-api";
import type { ProfileMetadataEntry } from "@/lib/types";

const MAX_NOTES = 100;
const EOSE_TIMEOUT = 8000;

export interface RelayFeedState {
  notes: Event[];
  profiles: Map<string, ProfileMetadataEntry>;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export function useRelayFeed(relayUrl: string | null): RelayFeedState {
  const [notes, setNotes] = useState<Event[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const seenIds = useRef(new Set<string>());
  const profileQueue = useRef(new Set<string>());
  const profileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveProfiles = useCallback(async (pubkeys: string[]) => {
    if (!pubkeys.length) return;
    try {
      const fetched = await fetchBulkProfileMetadata(pubkeys);
      setProfiles((prev) => {
        const next = new Map(prev);
        for (const [k, v] of fetched) next.set(k, v);
        return next;
      });
    } catch {
      // profile resolution is best-effort
    }
  }, []);

  const flushProfileQueue = useCallback(() => {
    const pubkeys = [...profileQueue.current];
    profileQueue.current.clear();
    if (pubkeys.length) resolveProfiles(pubkeys);
  }, [resolveProfiles]);

  useEffect(() => {
    if (!relayUrl) {
      setNotes([]);
      setProfiles(new Map());
      setConnected(false);
      setError(null);
      setLoading(false);
      return;
    }

    seenIds.current.clear();
    profileQueue.current.clear();
    setNotes([]);
    setProfiles(new Map());
    setError(null);
    setLoading(true);
    setConnected(false);

    const pool = getPool();
    let closed = false;
    let eoseReceived = false;
    const collected: Event[] = [];

    const eoseTimer = setTimeout(() => {
      if (!eoseReceived && !closed) {
        eoseReceived = true;
        finalize();
      }
    }, EOSE_TIMEOUT);

    function finalize() {
      if (closed) return;
      collected.sort((a, b) => b.created_at - a.created_at);
      const trimmed = collected.slice(0, MAX_NOTES);
      setNotes(trimmed);
      setLoading(false);
      setConnected(true);

      const pubkeys = [...new Set(trimmed.map((e) => e.pubkey))];
      resolveProfiles(pubkeys);
    }

    let sub: ReturnType<typeof pool.subscribeMany> | null = null;

    try {
      sub = pool.subscribeMany(
        [relayUrl],
        { kinds: [1], limit: 50 },
        {
          onevent(event: Event) {
            if (closed || seenIds.current.has(event.id)) return;
            seenIds.current.add(event.id);

            if (!eoseReceived) {
              collected.push(event);
            } else {
              // Live event after EOSE
              setNotes((prev) => {
                const next = [event, ...prev];
                next.sort((a, b) => b.created_at - a.created_at);
                return next.slice(0, MAX_NOTES);
              });

              // Queue profile resolution with debounce
              profileQueue.current.add(event.pubkey);
              if (profileTimer.current) clearTimeout(profileTimer.current);
              profileTimer.current = setTimeout(flushProfileQueue, 500);
            }
          },
          oneose() {
            if (eoseReceived) return;
            eoseReceived = true;
            clearTimeout(eoseTimer);
            finalize();
          },
        },
      );
    } catch (err) {
      clearTimeout(eoseTimer);
      setError(err instanceof Error ? err.message : "Failed to connect to relay");
      setLoading(false);
      return;
    }

    return () => {
      closed = true;
      clearTimeout(eoseTimer);
      if (profileTimer.current) clearTimeout(profileTimer.current);
      sub?.close();
    };
  }, [relayUrl, resolveProfiles, flushProfileQueue]);

  return { notes, profiles, loading, error, connected };
}
