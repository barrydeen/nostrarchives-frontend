"use client";

import { useState, useEffect } from "react";
import { fetchClientLeaderboard, fetchRelayLeaderboard } from "@/lib/client-api";
import { TopClientsRelays } from "./TopClientsRelays";
import { SkeletonBox } from "@/components/layout/Skeleton";
import type { ClientEntry, RelayLeaderboardEntry } from "@/lib/types";

export function TopClientsRelaysLive() {
  const [clients, setClients] = useState<ClientEntry[]>([]);
  const [relays, setRelays] = useState<RelayLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchClientLeaderboard(10), fetchRelayLeaderboard(10)])
      .then(([clientData, relayData]) => {
        if (cancelled) return;
        setClients(clientData?.clients ?? []);
        setRelays(relayData?.relays ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-card/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <SkeletonBox className="h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <SkeletonBox className="h-5 w-24 rounded-full" />
                <SkeletonBox className="h-3 w-36 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <SkeletonBox key={j} className="h-8 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <TopClientsRelays clients={clients} relays={relays} />;
}
