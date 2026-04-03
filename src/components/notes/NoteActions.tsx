"use client";

import { useState, useCallback } from "react";
import { Heart, Repeat2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getInboxRelays,
  getOurOutboxRelays,
  publishEvent,
  signEvent,
  BOOTSTRAP_RELAYS,
  getPool,
} from "@/lib/nostr-relay";
import { addJob, updateJob } from "@/lib/broadcast-store";

interface NoteActionsProps {
  eventId: string;
  eventPubkey: string;
}

let jobCounter = 0;

export function NoteActions({ eventId, eventPubkey }: NoteActionsProps) {
  const { pubkey } = useAuth();
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);

  const handleLike = useCallback(async () => {
    if (!pubkey || liked) return;
    setLiked(true); // optimistic

    const jobId = `like-${++jobCounter}`;
    try {
      const signed = await signEvent({
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["e", eventId],
          ["p", eventPubkey],
        ],
        content: "+",
      });

      // Fetch both relay sets in parallel
      const [inboxRelays, outboxRelays] = await Promise.all([
        getInboxRelays(eventPubkey),
        getOurOutboxRelays(pubkey),
      ]);
      const relays = [...new Set([...inboxRelays, ...outboxRelays])];

      addJob({ id: jobId, label: "Like", status: "pending", successes: 0, failures: 0, total: relays.length });
      const result = await publishEvent(relays, signed);
      const status = result.successes.length === 0 ? "error"
        : result.failures.length > 0 ? "partial" : "done";
      updateJob(jobId, { status, successes: result.successes.length, failures: result.failures.length });
    } catch {
      setLiked(false);
      updateJob(jobId, { status: "error" });
    }
  }, [pubkey, eventId, eventPubkey, liked]);

  const handleRepost = useCallback(async () => {
    if (!pubkey || reposted) return;
    setReposted(true); // optimistic

    const jobId = `repost-${++jobCounter}`;
    try {
      // Fetch the original event so we can include it as content (NIP-18)
      const [originalEvent, inboxRelays, outboxRelays] = await Promise.all([
        getPool().get(BOOTSTRAP_RELAYS, { ids: [eventId] }),
        getInboxRelays(eventPubkey),
        getOurOutboxRelays(pubkey),
      ]);

      const relays = [...new Set([...inboxRelays, ...outboxRelays])];

      // Pick a relay hint — prefer one of the author's inbox relays
      const relayHint = inboxRelays[0] ?? BOOTSTRAP_RELAYS[0];

      const signed = await signEvent({
        kind: 6,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["e", eventId, relayHint],
          ["p", eventPubkey],
        ],
        content: originalEvent ? JSON.stringify(originalEvent) : "",
      });

      addJob({ id: jobId, label: "Repost", status: "pending", successes: 0, failures: 0, total: relays.length });
      const result = await publishEvent(relays, signed);
      const status = result.successes.length === 0 ? "error"
        : result.failures.length > 0 ? "partial" : "done";
      updateJob(jobId, { status, successes: result.successes.length, failures: result.failures.length });
    } catch {
      setReposted(false);
      updateJob(jobId, { status: "error" });
    }
  }, [pubkey, eventId, eventPubkey, reposted]);

  if (!pubkey) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleLike}
        disabled={liked}
        title={liked ? "Liked" : "Like"}
        className={`relative z-10 inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
          liked
            ? "text-neon-pink"
            : "text-white/40 hover:bg-white/5 hover:text-neon-pink/80"
        } disabled:cursor-default`}
      >
        <Heart className={`size-3.5 ${liked ? "fill-neon-pink" : ""}`} />
      </button>
      <button
        onClick={handleRepost}
        disabled={reposted}
        title={reposted ? "Reposted" : "Repost"}
        className={`relative z-10 inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
          reposted
            ? "text-green-400"
            : "text-white/40 hover:bg-white/5 hover:text-green-400/80"
        } disabled:cursor-default`}
      >
        <Repeat2 className="size-3.5" />
      </button>
    </div>
  );
}
