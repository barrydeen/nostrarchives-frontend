"use client";

import { useState, useEffect, useRef } from "react";
import { getDmRelaysForPubkey } from "@/lib/nip17";

interface DmRelayState {
  /** Map of pubkey -> resolved DM relays */
  relayMap: Map<string, string[]>;
  loading: boolean;
}

/**
 * Resolve DM relays for a set of pubkeys.
 * Caches results across renders and only fetches new pubkeys.
 */
export function useDmRelays(pubkeys: string[]): DmRelayState {
  const [relayMap, setRelayMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (pubkeys.length === 0) return;

    const uncached = pubkeys.filter((pk) => !cacheRef.current.has(pk));
    if (uncached.length === 0) {
      setRelayMap(new Map(cacheRef.current));
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const results = await Promise.all(
        uncached.map(async (pk) => {
          const relays = await getDmRelaysForPubkey(pk);
          return [pk, relays] as const;
        }),
      );

      if (cancelled) return;

      for (const [pk, relays] of results) {
        cacheRef.current.set(pk, relays);
      }

      setRelayMap(new Map(cacheRef.current));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pubkeys.join(",")]);

  return { relayMap, loading };
}
