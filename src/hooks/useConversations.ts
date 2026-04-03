"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPool, fetchProfileMetadata, nip42AuthHandler } from "@/lib/nostr-relay";
import { unwrapGiftWrap, getOurDmRelays, hasNip44Support } from "@/lib/nip17";
import { dmStore, type Conversation } from "@/lib/dm-store";
import type { Event } from "nostr-tools/core";

// Stable empty snapshots for SSR — must be the same reference every call
const EMPTY_CONVERSATIONS: Conversation[] = [];

/**
 * How far back each fetch window extends (in seconds).
 * We use 30-day pages — note that NIP-17 randomizes wrap timestamps
 * up to 2 days, so the real message dates may be up to 2 days newer
 * than the wrap's created_at.
 */
const PAGE_WINDOW_SECS = 30 * 24 * 60 * 60; // 30 days

/**
 * Hook to manage the DM conversation list.
 *
 * - Subscribes to kind 1059 gift wraps on our DM relays
 * - Decrypts each event via NIP-07 and populates the dm-store
 * - Fetches profile metadata for new participants
 * - Supports loading older messages via loadMore()
 * - Returns sorted conversation list
 */
export function useConversations() {
  const { pubkey } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subRef = useRef<any>(null);
  const profilesFetchedRef = useRef(new Set<string>());
  const decryptQueueRef = useRef<Event[]>([]);
  const processingRef = useRef(false);
  const relaysRef = useRef<string[]>([]);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track the oldest timestamp we've queried so far for pagination
  const oldestQueriedRef = useRef<number>(0);

  // Subscribe to dm-store changes (snapshots are cached inside dmStore)
  const conversations = useSyncExternalStore(
    (cb) => dmStore.subscribe(cb),
    () => dmStore.getConversationsSorted(),
    () => EMPTY_CONVERSATIONS,
  );

  const totalUnread = useSyncExternalStore(
    (cb) => dmStore.subscribe(cb),
    () => dmStore.getTotalUnread(),
    () => 0,
  );

  // Process the decryption queue sequentially to avoid overwhelming the extension
  const processQueue = useCallback(async () => {
    if (!pubkey || processingRef.current) return;
    processingRef.current = true;

    while (decryptQueueRef.current.length > 0) {
      const event = decryptQueueRef.current.shift()!;

      if (dmStore.isProcessed(event.id)) continue;

      try {
        const dm = await unwrapGiftWrap(event, pubkey);
        dmStore.addDecryptedMessage(dm);

        // Fetch profiles for unknown participants
        const unknownPubkeys = dm.tags
          .filter((t) => t[0] === "p" && t[1])
          .map((t) => t[1])
          .filter(
            (pk) =>
              !profilesFetchedRef.current.has(pk) && !dmStore.getProfile(pk),
          );

        for (const pk of unknownPubkeys) {
          profilesFetchedRef.current.add(pk);
          fetchProfileMetadata(pk).then((profile) => {
            if (profile) dmStore.setProfile(pk, profile);
          });
        }
      } catch (err) {
        // Skip malformed events silently
        console.warn("Failed to unwrap gift wrap:", event.id, err);
      }
    }

    processingRef.current = false;
  }, [pubkey]);

  // Set up relay subscription — initial load fetches last 30 days,
  // then keeps a live subscription open for new messages
  useEffect(() => {
    if (!pubkey) {
      setLoading(false);
      return;
    }

    if (!hasNip44Support()) {
      setError(
        "Your Nostr extension does not support NIP-44 encryption. Please update to a compatible extension (Alby, nos2x-fox, etc.).",
      );
      setLoading(false);
      return;
    }

    dmStore.setOurPubkey(pubkey);
    setLoading(true);
    setError(null);

    let cancelled = false;

    (async () => {
      try {
        const relays = await getOurDmRelays(pubkey);
        relaysRef.current = relays;

        if (cancelled) return;

        const now = Math.floor(Date.now() / 1000);
        // Initial fetch: 30 days back (+ 2 day buffer for randomized timestamps)
        const since = now - PAGE_WINDOW_SECS - 2 * 24 * 60 * 60;
        oldestQueriedRef.current = since;

        const pool = getPool();

        // Track EOSE per relay to know when initial load is done
        let eoseCount = 0;

        subRef.current = pool.subscribeMany(
          relays,
          {
            kinds: [1059],
            "#p": [pubkey],
            since,
          },
          {
            onevent(event: Event) {
              if (cancelled) return;
              if (dmStore.isProcessed(event.id)) return;
              decryptQueueRef.current.push(event);
              processQueue();
            },
            oneose() {
              eoseCount++;
              if (eoseCount >= relays.length && !cancelled) {
                setInitialLoadDone(true);
                setLoading(false);
              }
            },
            // NIP-42: DM relays typically require AUTH before serving events
            onauth: nip42AuthHandler,
          },
        );

        // Safety timeout for EOSE
        setTimeout(() => {
          if (!cancelled) {
            setInitialLoadDone(true);
            setLoading(false);
          }
        }, 15000);

        // Poll every 15 seconds as a backup for live subscription.
        // NIP-17's randomized timestamps can cause some relays to not
        // forward new gift wraps to live subscribers (the wrap's created_at
        // is in the past, so the relay may treat it as a stored event).
        // Uses subscribeManyEose (not querySync) because it supports onauth
        // — DM relays require NIP-42 AUTH.
        const pollInterval = setInterval(() => {
          if (cancelled) return;
          const recentSince = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60;
          pool.subscribeManyEose(
            relays,
            {
              kinds: [1059],
              "#p": [pubkey],
              since: recentSince,
            },
            {
              onevent(event: Event) {
                if (cancelled) return;
                if (!dmStore.isProcessed(event.id)) {
                  decryptQueueRef.current.push(event);
                  processQueue();
                }
              },
              onauth: nip42AuthHandler,
            },
          );
        }, 15_000);

        pollIntervalRef.current = pollInterval;
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to connect to DM relays",
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (subRef.current?.close) {
        subRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pubkey, processQueue]);

  /**
   * Load older messages — fetches the next 30-day window before
   * the oldest timestamp we've already queried.
   */
  const loadMore = useCallback(() => {
    if (!pubkey || loadingMore || !relaysRef.current.length) return;

    setLoadingMore(true);

    const until = oldestQueriedRef.current;
    const since = until - PAGE_WINDOW_SECS;
    oldestQueriedRef.current = since;

    const pool = getPool();

    pool.subscribeManyEose(
      relaysRef.current,
      {
        kinds: [1059],
        "#p": [pubkey],
        since,
        until,
      },
      {
        onevent(event: Event) {
          if (!dmStore.isProcessed(event.id)) {
            decryptQueueRef.current.push(event);
            processQueue();
          }
        },
        onclose() {
          setLoadingMore(false);
        },
        onauth: nip42AuthHandler,
      },
    );
  }, [pubkey, loadingMore, processQueue]);

  return {
    conversations,
    totalUnread,
    loading,
    loadingMore,
    error,
    initialLoadDone,
    loadMore,
  };
}
