"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Event } from "nostr-tools/core";
import { getSatoshisAmountFromBolt11 } from "nostr-tools/nip57";
import {
  getPool,
  fetchRelayList,
  BOOTSTRAP_RELAYS,
} from "@/lib/nostr-relay";
import { fetchBulkProfileMetadata } from "@/lib/client-api";
import type { ProfileMetadataEntry } from "@/lib/types";

export type NotificationStep =
  | "idle"
  | "fetching-relay-list"
  | "fetching-notifications"
  | "fetching-referenced-notes"
  | "resolving-profiles"
  | "done"
  | "error";

export type NotificationType = "reply" | "mention" | "reaction" | "repost" | "zap";

export interface ParsedNotification {
  id: string;
  type: NotificationType;
  event: Event;
  senderPubkey: string;
  referencedEventId: string | null;
  referencedEvent: Event | null;
  createdAt: number;
  zapAmountSats: number | null;
  reactionContent: string | null;
  /** URL for custom NIP-30 emoji reaction (from "emoji" tags) */
  reactionEmojiUrl: string | null;
}

export interface NotificationsState {
  step: NotificationStep;
  progress: string;
  notifications: ParsedNotification[];
  profiles: Map<string, ProfileMetadataEntry>;
  error: string | null;
  refresh: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────

function parseZapReceipt(event: Event): { senderPubkey: string | null; amountSats: number | null } {
  let senderPubkey: string | null = null;
  let amountSats: number | null = null;

  // Try to get sender + amount from the description tag (kind 9734 zap request)
  const descTag = event.tags.find((t) => t[0] === "description" && t[1]);
  if (descTag) {
    try {
      const zapRequest = JSON.parse(descTag[1]);
      senderPubkey = zapRequest.pubkey || null;
      const amountTag = (zapRequest.tags as string[][] | undefined)?.find(
        (t: string[]) => t[0] === "amount",
      );
      if (amountTag) {
        amountSats = Math.floor(parseInt(amountTag[1], 10) / 1000);
      }
    } catch {
      // ignore parse errors
    }
  }

  // Fall back to decoding the bolt11 invoice for the amount
  if (amountSats == null) {
    const bolt11Tag = event.tags.find((t) => t[0] === "bolt11" && t[1]);
    if (bolt11Tag) {
      try {
        amountSats = getSatoshisAmountFromBolt11(bolt11Tag[1]);
      } catch {
        // ignore decode errors
      }
    }
  }

  return { senderPubkey, amountSats };
}

function getReferencedEventId(event: Event): string | null {
  const eTags = event.tags.filter((t) => t[0] === "e" && t[1]);
  if (eTags.length === 0) return null;

  // Prefer NIP-10 markers
  const replyTag = eTags.find((t) => t[3] === "reply");
  if (replyTag) return replyTag[1];
  const rootTag = eTags.find((t) => t[3] === "root");
  if (rootTag) return rootTag[1];

  // Positional fallback: last e tag
  return eTags[eTags.length - 1][1];
}

function classifyKind1(
  event: Event,
  referencedNotes: Map<string, Event>,
  userPubkey: string,
): "reply" | "mention" {
  const eTags = event.tags.filter((t) => t[0] === "e" && t[1]);
  for (const tag of eTags) {
    const refNote = referencedNotes.get(tag[1]);
    if (refNote && refNote.pubkey === userPubkey) return "reply";
  }
  return "mention";
}

/**
 * Query a single relay for notification events.
 * Has its own safety timeout so we never hang on a dead relay.
 */
function queryRelayForNotifications(
  pool: ReturnType<typeof getPool>,
  relay: string,
  pubkey: string,
  since: number,
  limit: number,
  timeoutMs = 5000,
): Promise<Event[]> {
  return new Promise((resolve) => {
    const events: Event[] = [];
    let resolved = false;

    const sub = pool.subscribeMany(
      [relay],
      { kinds: [1, 6, 7, 9735], "#p": [pubkey], since, limit },
      {
        onevent(event: Event) {
          events.push(event);
        },
        oneose() {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            sub.close();
            resolve(events);
          }
        },
      },
    );

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        sub.close();
        resolve(events);
      }
    }, timeoutMs);
  });
}

/**
 * Query relays for events by IDs.
 */
function queryRelayForEvents(
  pool: ReturnType<typeof getPool>,
  relay: string,
  ids: string[],
  timeoutMs = 5000,
): Promise<Event[]> {
  return new Promise((resolve) => {
    const events: Event[] = [];
    let resolved = false;

    const sub = pool.subscribeMany(
      [relay],
      { ids },
      {
        onevent(event: Event) {
          events.push(event);
        },
        oneose() {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            sub.close();
            resolve(events);
          }
        },
      },
    );

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        sub.close();
        resolve(events);
      }
    }, timeoutMs);
  });
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useNotifications(pubkey: string | null): NotificationsState {
  const [step, setStep] = useState<NotificationStep>("idle");
  const [progress, setProgress] = useState("");
  const [notifications, setNotifications] = useState<ParsedNotification[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelledRef = useRef(false);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!pubkey) {
      setStep("idle");
      setNotifications([]);
      setProfiles(new Map());
      setError(null);
      return;
    }

    cancelledRef.current = false;

    async function run() {
      const cancelled = () => cancelledRef.current;
      const pool = getPool();

      try {
        // Step 1: Fetch user's inbox relays
        setStep("fetching-relay-list");
        setProgress("Discovering your relays...");

        const relayList = await fetchRelayList(pubkey!);
        if (cancelled()) return;

        const relaySet = new Set<string>([
          ...relayList.read,
          ...BOOTSTRAP_RELAYS,
        ]);
        const relays = [...relaySet];

        // Step 2: Fetch notification events from all relays
        setStep("fetching-notifications");
        setProgress(`Fetching notifications from ${relays.length} relays...`);

        const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // 30 days ago

        const results = await Promise.all(
          relays.map((relay) =>
            queryRelayForNotifications(pool, relay, pubkey!, since, 150),
          ),
        );
        if (cancelled()) return;

        // Deduplicate by event ID
        const eventMap = new Map<string, Event>();
        for (const events of results) {
          for (const ev of events) {
            if (!eventMap.has(ev.id)) eventMap.set(ev.id, ev);
          }
        }

        // Filter out self-interactions
        const allEvents = [...eventMap.values()].filter(
          (ev) => ev.pubkey !== pubkey,
        );

        setProgress(`Found ${allEvents.length} notifications`);

        if (allEvents.length === 0) {
          setNotifications([]);
          setProfiles(new Map());
          setStep("done");
          setProgress("");
          return;
        }

        // Step 3: Extract referenced event IDs and fetch them
        setStep("fetching-referenced-notes");
        setProgress("Loading referenced notes...");

        // Parse initial notification data
        const parsed: ParsedNotification[] = [];
        for (const ev of allEvents) {
          let senderPubkey = ev.pubkey;
          let zapAmountSats: number | null = null;
          let reactionContent: string | null = null;

          if (ev.kind === 9735) {
            const zap = parseZapReceipt(ev);
            if (zap.senderPubkey) senderPubkey = zap.senderPubkey;
            zapAmountSats = zap.amountSats;
            // Filter out self-zaps
            if (senderPubkey === pubkey) continue;
          }

          if (ev.kind === 7) {
            reactionContent = ev.content || "+";
          }

          // Resolve NIP-30 custom emoji shortcodes for reactions
          // Reaction content may be ":shortcode:" — look for matching emoji tag
          let reactionEmojiUrl: string | null = null;
          if (reactionContent) {
            const shortcodeMatch = reactionContent.match(/^:([^:]+):$/);
            if (shortcodeMatch) {
              const emojiTag = ev.tags.find(
                (t) => t[0] === "emoji" && t[1] === shortcodeMatch[1] && t[2],
              );
              if (emojiTag) {
                reactionEmojiUrl = emojiTag[2];
              }
            }
          }

          const referencedEventId = getReferencedEventId(ev);

          parsed.push({
            id: ev.id,
            type: "reaction", // temporary, will be classified after fetching refs
            event: ev,
            senderPubkey,
            referencedEventId,
            referencedEvent: null,
            createdAt: ev.created_at,
            zapAmountSats,
            reactionContent,
            reactionEmojiUrl,
          });
        }

        // Fetch referenced notes
        const refIds = new Set<string>();
        for (const n of parsed) {
          if (n.referencedEventId) refIds.add(n.referencedEventId);
        }

        const referencedNotes = new Map<string, Event>();

        if (refIds.size > 0) {
          const idArray = [...refIds];
          // Chunk IDs (max 500 per query)
          for (let i = 0; i < idArray.length; i += 500) {
            const chunk = idArray.slice(i, i + 500);
            const refResults = await Promise.all(
              relays.map((relay) =>
                queryRelayForEvents(pool, relay, chunk),
              ),
            );
            if (cancelled()) return;

            for (const events of refResults) {
              for (const ev of events) {
                if (!referencedNotes.has(ev.id)) {
                  referencedNotes.set(ev.id, ev);
                }
              }
            }
          }
        }

        // Assign referenced events and classify types
        for (const n of parsed) {
          if (n.referencedEventId) {
            n.referencedEvent = referencedNotes.get(n.referencedEventId) ?? null;
          }

          // Classify type
          if (n.event.kind === 7) {
            n.type = "reaction";
          } else if (n.event.kind === 6) {
            n.type = "repost";
          } else if (n.event.kind === 9735) {
            n.type = "zap";
          } else if (n.event.kind === 1) {
            n.type = classifyKind1(n.event, referencedNotes, pubkey!);
          }
        }

        // Sort by created_at descending
        parsed.sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(parsed);

        // Step 4: Resolve profiles
        setStep("resolving-profiles");
        setProgress("Loading profiles...");

        const pubkeysToResolve = new Set<string>();
        for (const n of parsed) {
          pubkeysToResolve.add(n.senderPubkey);
          if (n.referencedEvent) {
            pubkeysToResolve.add(n.referencedEvent.pubkey);
          }
        }

        const profileMap = new Map<string, ProfileMetadataEntry>();
        const allPubkeys = [...pubkeysToResolve];
        for (let i = 0; i < allPubkeys.length; i += 500) {
          const chunk = allPubkeys.slice(i, i + 500);
          try {
            const batch = await fetchBulkProfileMetadata(chunk);
            for (const [pk, profile] of batch) {
              profileMap.set(pk, profile);
            }
          } catch {
            // Profile resolution failures are non-fatal
          }
        }
        if (cancelled()) return;

        setProfiles(profileMap);
        setStep("done");
        setProgress("");
      } catch (err) {
        if (cancelled()) return;
        setStep("error");
        setError(
          err instanceof Error ? err.message : "Failed to load notifications",
        );
      }
    }

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [pubkey, refreshKey]);

  return {
    step,
    progress,
    notifications,
    profiles,
    error,
    refresh,
  };
}
