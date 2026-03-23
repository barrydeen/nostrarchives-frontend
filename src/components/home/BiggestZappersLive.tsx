"use client";

import { useState, useEffect } from "react";
import { fetchTopZappers, fetchBulkProfileMetadata } from "@/lib/client-api";
import { BiggestZappers } from "./BiggestZappers";
import { SkeletonUserCard } from "@/components/layout/Skeleton";
import type { TopZapper, ProfileMetadataEntry } from "@/lib/types";

export function BiggestZappersLive() {
  const [sent, setSent] = useState<TopZapper[]>([]);
  const [received, setReceived] = useState<TopZapper[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [sentData, receivedData] = await Promise.all([
          fetchTopZappers("sent", 12),
          fetchTopZappers("received", 12),
        ]);
        if (cancelled) return;

        const sentList = sentData?.zappers ?? [];
        const receivedList = receivedData?.zappers ?? [];
        setSent(sentList);
        setReceived(receivedList);

        const pubkeys = new Set<string>();
        sentList.forEach((z) => pubkeys.add(z.pubkey));
        receivedList.forEach((z) => pubkeys.add(z.pubkey));

        if (pubkeys.size > 0) {
          const profileMap = await fetchBulkProfileMetadata([...pubkeys]);
          if (!cancelled) setProfiles(profileMap);
        }
      } catch {
        // Show empty state
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
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonUserCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  return <BiggestZappers sent={sent} received={received} profiles={profiles} />;
}
