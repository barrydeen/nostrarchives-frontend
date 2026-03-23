"use client";

import { useState, useEffect } from "react";
import { fetchNewUsers, fetchBulkProfileMetadata } from "@/lib/client-api";
import { NewUsers } from "./NewUsers";
import { SkeletonUserCard } from "@/components/layout/Skeleton";
import type { NewUser, ProfileMetadataEntry } from "@/lib/types";

export function NewUsersLive() {
  const [users, setUsers] = useState<NewUser[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchNewUsers(12);
        if (cancelled) return;

        const usersList = data?.users ?? [];
        setUsers(usersList);

        const pubkeys = usersList.map((u) => u.pubkey);
        if (pubkeys.length > 0) {
          const profileMap = await fetchBulkProfileMetadata(pubkeys);
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

  return <NewUsers users={users} profiles={profiles} />;
}
