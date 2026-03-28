"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useOnlineProfiles } from "@/hooks/useOnlineProfiles";
import { OnlineUserCard } from "./OnlineUserCard";
import { formatNumber } from "@/lib/utils";

export function OnlinePageClient() {
  const { users, connected, recentlyUpdated } = useOnlineUsers();
  const pubkeys = useMemo(() => users.map((u) => u.pubkey), [users]);
  const profiles = useOnlineProfiles(pubkeys);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-neon-green/10 p-3">
          <Users className="size-6 text-neon-green" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight gradient-text">
              Online Now
            </h1>
            {connected && (
              <span className="relative flex size-2.5 mt-1">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-green-400" />
              </span>
            )}
          </div>
          <p className="text-sm text-white/50 mt-1">
            {users.length > 0 ? (
              <>
                <span className="text-white/80 font-semibold tabular-nums">
                  {formatNumber(users.length)}
                </span>{" "}
                users active in the last 10 minutes
              </>
            ) : connected ? (
              "Watching for activity..."
            ) : (
              "Connecting..."
            )}
          </p>
        </div>
      </div>

      {/* Grid */}
      {users.length > 0 ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {users.map((user, index) => (
            <OnlineUserCard
              key={user.pubkey}
              pubkey={user.pubkey}
              lastActiveMs={user.last_active_ms}
              activityKind={user.activity_kind}
              profile={profiles.get(user.pubkey)}
              isRecentlyUpdated={recentlyUpdated.has(user.pubkey)}
              index={index}
            />
          ))}
        </div>
      ) : connected ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <Users className="size-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No active users right now</p>
          <p className="text-sm mt-1">Check back in a moment</p>
        </div>
      ) : (
        /* Loading skeleton */
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-card/60 p-4 animate-pulse"
            >
              <div className="size-14 rounded-full bg-white/[0.06]" />
              <div className="h-4 w-20 rounded bg-white/[0.06]" />
              <div className="h-3 w-16 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
