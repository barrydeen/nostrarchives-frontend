"use client";

import { useState, useCallback, useMemo } from "react";
import { StoredEvent, ProfileMetadataEntry } from "@/lib/types";
import { ReplyThread, buildReplyTree } from "./ReplyThread";
import { ReplyComposer } from "./ReplyComposer";

interface NoteRepliesSectionProps {
  /** The note being viewed */
  eventId: string;
  eventPubkey: string;
  /** Root of the thread (null if this note IS the root) */
  rootId: string | null;
  /** Server-rendered replies */
  initialReplies: StoredEvent[];
  /** Profiles as a serializable record (converted to Map internally) */
  profilesRecord: Record<string, ProfileMetadataEntry>;
}

export function NoteRepliesSection({
  eventId,
  eventPubkey,
  rootId,
  initialReplies,
  profilesRecord,
}: NoteRepliesSectionProps) {
  const [newReplies, setNewReplies] = useState<StoredEvent[]>([]);

  const profiles = useMemo(() => {
    const map = new Map<string, ProfileMetadataEntry>();
    for (const [pk, meta] of Object.entries(profilesRecord)) {
      map.set(pk, meta);
    }
    return map;
  }, [profilesRecord]);

  const allReplies = useMemo(
    () => [...initialReplies, ...newReplies],
    [initialReplies, newReplies],
  );

  const replyTree = useMemo(
    () => buildReplyTree(allReplies, eventId),
    [allReplies, eventId],
  );

  const handleReplyPublished = useCallback(
    (event: StoredEvent) => {
      setNewReplies((prev) => {
        if (prev.some((r) => r.id === event.id)) return prev;
        return [...prev, event];
      });
    },
    [],
  );

  const actualRootId = rootId || eventId;

  return (
    <>
      {/* Top-level reply composer — reply to the main note */}
      <ReplyComposer
        eventId={eventId}
        eventPubkey={eventPubkey}
        rootId={rootId}
        onPublished={handleReplyPublished}
      />

      {/* Replies */}
      <section className="rounded-[32px] border border-white/10 bg-surface/70 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white/80">
          Replies ({allReplies.length})
        </h2>
        <div className="mt-4">
          {replyTree.length > 0 ? (
            <ReplyThread
              nodes={replyTree}
              profiles={profiles}
              rootEventId={actualRootId}
              onReplyPublished={(event) => handleReplyPublished(event)}
            />
          ) : (
            <p className="text-sm text-white/60">No replies yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
