"use client";

import { useState, useEffect } from "react";
import { useRelayFeed } from "@/hooks/useRelayFeed";
import { UnifiedNoteCard } from "@/components/notes/UnifiedNoteCard";
import { SkeletonNoteCard } from "@/components/layout/Skeleton";
import type { StoredEvent } from "@/lib/types";
import { BOOTSTRAP_RELAYS } from "@/lib/nostr-relay";
import { Radio, AlertCircle, Plug, Inbox } from "lucide-react";

const LS_KEY = "relay_feed_last_url";

const POPULAR_RELAYS = [
  ...BOOTSTRAP_RELAYS,
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
];

export function RelayFeed() {
  const [input, setInput] = useState("");
  const [activeRelay, setActiveRelay] = useState<string | null>(null);
  const feed = useRelayFeed(activeRelay);

  // Load last-used relay on mount
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setInput(saved);
  }, []);

  function connect(url?: string) {
    const relay = url || input.trim();
    if (!relay) return;
    setInput(relay);
    setActiveRelay(relay);
    localStorage.setItem(LS_KEY, relay);
  }

  function disconnect() {
    setActiveRelay(null);
  }

  return (
    <div className="space-y-6">
      {/* Connection controls */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            placeholder="wss://relay.example.com"
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-neon-blue/40 focus:outline-none focus:ring-1 focus:ring-neon-blue/20"
          />
          {activeRelay ? (
            <button
              onClick={disconnect}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white/70"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => connect()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neon-blue/30 bg-neon-blue/10 px-4 py-2.5 text-sm font-medium text-neon-blue transition hover:bg-neon-blue/20"
            >
              <Plug className="size-3.5" />
              Connect
            </button>
          )}
        </div>

        {/* Quick-select relays */}
        {!activeRelay && (
          <div className="flex flex-wrap gap-2">
            {POPULAR_RELAYS.map((url) => (
              <button
                key={url}
                onClick={() => connect(url)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/40 transition hover:border-white/15 hover:text-white/60"
              >
                <Radio className="size-3" />
                {url.replace("wss://", "")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Connected status */}
      {activeRelay && feed.connected && (
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span className="size-1.5 rounded-full bg-neon-green" />
          Connected to {activeRelay.replace("wss://", "")}
          <span className="text-white/20">·</span>
          {feed.notes.length} notes
        </div>
      )}

      {/* Loading */}
      {feed.loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-card/60 px-4 py-3">
            <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
            <p className="text-sm text-white/70">
              Connecting to {activeRelay?.replace("wss://", "")}...
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonNoteCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {feed.error && (
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertCircle className="size-6 text-red-400" />
          </div>
          <h3 className="font-semibold">Connection failed</h3>
          <p className="mt-1 text-sm text-white/40">{feed.error}</p>
          <button
            onClick={() => connect()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm text-white/50 transition hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {feed.connected && !feed.loading && feed.notes.length === 0 && (
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <Inbox className="size-6 text-white/40" />
          </div>
          <h3 className="font-semibold">No notes found</h3>
          <p className="mt-1 text-sm text-white/40">
            This relay doesn&apos;t seem to have any recent text notes.
          </p>
        </div>
      )}

      {/* Notes */}
      {!feed.loading && feed.notes.length > 0 && (
        <div className="flex flex-col gap-4">
          {feed.notes.map((event) => {
            const profile = feed.profiles.get(event.pubkey) ?? null;
            return (
              <UnifiedNoteCard
                key={event.id}
                event={event as unknown as StoredEvent}
                profile={profile}
                profiles={feed.profiles}
                variant="default"
              />
            );
          })}
        </div>
      )}

      {/* No relay selected */}
      {!activeRelay && !feed.loading && (
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-pink/20">
            <Radio className="size-6 text-white/60" />
          </div>
          <h3 className="font-semibold">Connect to a relay</h3>
          <p className="mt-1 text-sm text-white/40">
            Enter a relay URL above or pick one of the popular relays to browse
            its notes.
          </p>
        </div>
      )}
    </div>
  );
}
