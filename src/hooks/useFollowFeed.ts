"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Event } from "nostr-tools/core";
import {
  getPool,
  BOOTSTRAP_RELAYS,
} from "@/lib/nostr-relay";
import {
  batchFetchRelayLists,
  greedySetCover,
  chunkAuthors,
} from "@/lib/outbox-router";
import { fetchBulkProfileMetadata } from "@/lib/client-api";
import { extractMentionPubkeysFromEvents } from "@/lib/mentions";
import type { ProfileMetadataEntry } from "@/lib/types";

/** Indexer relays optimized for fast kind-10002 lookups. */
const RELAY_LIST_RELAYS = [
  "wss://indexer.nostrarchives.com",
  "wss://indexer.coracle.social",
];

export type FeedStep =
  | "idle"
  | "fetching-follows"
  | "fetching-relay-lists"
  | "computing-outbox-plan"
  | "fetching-notes"
  | "resolving-profiles"
  | "done"
  | "error";

export interface FollowFeedState {
  step: FeedStep;
  progress: string;
  notes: Event[];
  profiles: Map<string, ProfileMetadataEntry>;
  followCount: number;
  error: string | null;
  /** Whether this is the first-time setup (no cached outbox plan) */
  isFirstSetup: boolean;
  /** Re-fetch notes using the cached relay plan */
  refresh: () => void;
  /** Clear the cached relay plan and rebuild from scratch */
  rebuildRelayPlan: () => void;
}

// ─── Outbox plan localStorage cache ────────────────────────────────

const CACHE_VERSION = 1;

interface CachedOutboxPlan {
  version: number;
  timestamp: number;
  followCount: number;
  followPubkeys: string[];
  /** pubkey → write relay URLs */
  authorRelays: Record<string, string[]>;
  plan: {
    relayAuthors: Record<string, string[]>;
    uncoveredAuthors: string[];
    totalRelays: number;
  };
}

function cacheKey(pubkey: string): string {
  return `outbox_plan_${pubkey}`;
}

function saveOutboxPlan(
  pubkey: string,
  followPubkeys: string[],
  authorRelays: Map<string, string[]>,
  plan: import("@/lib/outbox-router").OutboxPlan,
): void {
  const data: CachedOutboxPlan = {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    followCount: followPubkeys.length,
    followPubkeys,
    authorRelays: Object.fromEntries(authorRelays),
    plan: {
      relayAuthors: Object.fromEntries(plan.relayAuthors),
      uncoveredAuthors: plan.uncoveredAuthors,
      totalRelays: plan.totalRelays,
    },
  };
  try {
    localStorage.setItem(cacheKey(pubkey), JSON.stringify(data));
  } catch {
    // Storage full or unavailable — non-fatal
  }
}

function loadOutboxPlan(pubkey: string): {
  followPubkeys: string[];
  authorRelays: Map<string, string[]>;
  plan: import("@/lib/outbox-router").OutboxPlan;
  followCount: number;
} | null {
  try {
    const raw = localStorage.getItem(cacheKey(pubkey));
    if (!raw) return null;
    const data: CachedOutboxPlan = JSON.parse(raw);
    if (data.version !== CACHE_VERSION) return null;
    return {
      followPubkeys: data.followPubkeys,
      followCount: data.followCount,
      authorRelays: new Map(Object.entries(data.authorRelays)),
      plan: {
        relayAuthors: new Map(Object.entries(data.plan.relayAuthors)),
        uncoveredAuthors: data.plan.uncoveredAuthors,
        totalRelays: data.plan.totalRelays,
      },
    };
  } catch {
    return null;
  }
}

function clearOutboxPlan(pubkey: string): void {
  try {
    localStorage.removeItem(cacheKey(pubkey));
  } catch {
    // non-fatal
  }
}

/**
 * Query a single relay for kind-1 notes from the given authors.
 * Has its own safety timeout so we never hang on a dead relay —
 * if oneose doesn't fire within `timeoutMs`, we close and return
 * whatever events arrived.
 */
function queryRelay(
  pool: ReturnType<typeof getPool>,
  relay: string,
  authors: string[],
  limit: number,
  timeoutMs = 4000,
): Promise<Event[]> {
  return new Promise((resolve) => {
    const events: Event[] = [];
    let resolved = false;

    const sub = pool.subscribeMany(
      [relay],
      { kinds: [1], authors, limit },
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

interface QueryResult {
  relay: string;
  authors: string[];
  events: Event[];
  failed: boolean;
}

export function useFollowFeed(pubkey: string | null): FollowFeedState {
  const [step, setStep] = useState<FeedStep>("idle");
  const [progress, setProgress] = useState("");
  const [notes, setNotes] = useState<Event[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMetadataEntry>>(
    new Map(),
  );
  const [followCount, setFollowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rebuildKey, setRebuildKey] = useState(0);
  const cancelledRef = useRef(false);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const rebuildRelayPlan = useCallback(() => {
    if (pubkey) clearOutboxPlan(pubkey);
    setRebuildKey((k) => k + 1);
  }, [pubkey]);

  useEffect(() => {
    if (!pubkey) {
      setStep("idle");
      setNotes([]);
      setProfiles(new Map());
      setFollowCount(0);
      setError(null);
      setIsFirstSetup(false);
      return;
    }

    cancelledRef.current = false;

    async function run() {
      const cancelled = () => cancelledRef.current;
      const pool = getPool();

      try {
        // Check for cached outbox plan
        const cached = loadOutboxPlan(pubkey!);

        let followPubkeys: string[];
        let authorRelays: Map<string, string[]>;
        let plan: import("@/lib/outbox-router").OutboxPlan;

        if (cached) {
          // ── Cache hit: skip steps 1-3, go straight to fetching notes ──
          setIsFirstSetup(false);
          followPubkeys = cached.followPubkeys;
          authorRelays = cached.authorRelays;
          plan = cached.plan;
          setFollowCount(cached.followCount);

          if (followPubkeys.length === 0) {
            setStep("done");
            setNotes([]);
            return;
          }
        } else {
          // ── Cache miss: full setup ──
          setIsFirstSetup(true);

          // Step 1: Fetch follow list
          setStep("fetching-follows");
          setProgress("Loading your follow list...");

          const contactEvent = await new Promise<Event | null>((resolve) => {
            let best: Event | null = null;
            let resolved = false;

            const sub = pool.subscribeMany(
              RELAY_LIST_RELAYS,
              { kinds: [3], authors: [pubkey!] },
              {
                onevent(event: Event) {
                  if (!best || event.created_at > best.created_at) {
                    best = event;
                  }
                },
                oneose() {
                  if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    sub.close();
                    resolve(best);
                  }
                },
              },
            );

            const timer = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                sub.close();
                resolve(best);
              }
            }, 3000);
          });
          if (cancelled()) return;

          followPubkeys = [];
          if (contactEvent) {
            for (const tag of contactEvent.tags) {
              if (tag[0] === "p" && tag[1]) {
                followPubkeys.push(tag[1]);
              }
            }
          }
          setFollowCount(followPubkeys.length);

          if (followPubkeys.length === 0) {
            setStep("done");
            setNotes([]);
            return;
          }

          // Step 2: Fetch relay lists
          setStep("fetching-relay-lists");
          setProgress(
            `Fetching relay lists for ${followPubkeys.length} follows...`,
          );

          const relayLists = await batchFetchRelayLists(
            pool,
            followPubkeys,
            RELAY_LIST_RELAYS,
          );
          if (cancelled()) return;

          setProgress(
            `Got relay lists for ${relayLists.size}/${followPubkeys.length} follows`,
          );

          // Step 3: Compute outbox plan
          setStep("computing-outbox-plan");
          setProgress("Computing optimal relay plan...");

          authorRelays = new Map<string, string[]>();
          for (const pk of followPubkeys) {
            const list = relayLists.get(pk);
            if (list && list.write.length > 0) {
              authorRelays.set(pk, list.write);
            } else {
              authorRelays.set(pk, []);
            }
          }

          plan = greedySetCover(authorRelays, 3);
          if (cancelled()) return;

          // Save to localStorage for next time
          saveOutboxPlan(pubkey!, followPubkeys, authorRelays, plan);
        }

        // Step 4: Fetch notes — two-pass with relay failure reassignment
        setStep("fetching-notes");
        setProgress(
          `Fetching notes from ${plan.totalRelays} relays...`,
        );

        // Build all query tasks: relay + chunked authors
        const queryTasks: Array<{ relay: string; authors: string[] }> = [];

        for (const [relay, authors] of plan.relayAuthors) {
          const chunks = chunkAuthors(authors, 500);
          for (const chunk of chunks) {
            queryTasks.push({ relay, authors: chunk });
          }
        }

        // Fallback: query uncovered authors from bootstrap relays
        if (plan.uncoveredAuthors.length > 0) {
          const chunks = chunkAuthors(plan.uncoveredAuthors, 500);
          for (const chunk of chunks) {
            for (const relay of BOOTSTRAP_RELAYS) {
              queryTasks.push({ relay, authors: chunk });
            }
          }
        }

        // --- Pass 1: query all relays in parallel (4s timeout each) ---
        const pass1Results: QueryResult[] = await Promise.all(
          queryTasks.map(async (task) => {
            const events = await queryRelay(
              pool,
              task.relay,
              task.authors,
              50,
              4000,
            );
            // A relay that returned 0 events after timeout is likely down
            // (a working relay with no matching events still sends EOSE quickly)
            const failed = events.length === 0;
            return {
              relay: task.relay,
              authors: task.authors,
              events,
              failed,
            };
          }),
        );
        if (cancelled()) return;

        // Collect events and track which relays failed
        const eventMap = new Map<string, Event>();
        const failedRelays = new Set<string>();
        const succeededRelays = new Set<string>();

        for (const r of pass1Results) {
          if (r.failed) {
            failedRelays.add(r.relay);
          } else {
            succeededRelays.add(r.relay);
            for (const ev of r.events) {
              if (!eventMap.has(ev.id)) eventMap.set(ev.id, ev);
            }
          }
        }

        // --- Pass 2: reassign authors from failed relays to alternate relays ---
        if (failedRelays.size > 0) {
          // Find authors whose coverage was reduced by failures
          const authorsCoveredBySuccess = new Set<string>();
          for (const r of pass1Results) {
            if (!r.failed) {
              for (const a of r.authors) authorsCoveredBySuccess.add(a);
            }
          }

          // Authors that were ONLY on failed relays need reassignment
          const needsReassignment: string[] = [];
          for (const r of pass1Results) {
            if (r.failed) {
              for (const a of r.authors) {
                if (!authorsCoveredBySuccess.has(a)) {
                  needsReassignment.push(a);
                }
              }
            }
          }

          const uniqueReassign = [...new Set(needsReassignment)];

          if (uniqueReassign.length > 0) {
            setProgress(
              `${failedRelays.size} relays down, reassigning ${uniqueReassign.length} authors...`,
            );

            // Find alternate relays for these authors (not already tried or failed)
            const triedRelays = new Set([
              ...failedRelays,
              ...succeededRelays,
            ]);
            const altRelayToAuthors = new Map<string, string[]>();

            for (const pk of uniqueReassign) {
              const relays = authorRelays.get(pk) ?? [];
              for (const relay of relays) {
                if (!triedRelays.has(relay)) {
                  let list = altRelayToAuthors.get(relay);
                  if (!list) {
                    list = [];
                    altRelayToAuthors.set(relay, list);
                  }
                  list.push(pk);
                }
              }
            }

            // Also try bootstrap relays for any still-unassigned authors
            const altAssigned = new Set<string>();
            for (const authors of altRelayToAuthors.values()) {
              for (const a of authors) altAssigned.add(a);
            }
            const stillUnassigned = uniqueReassign.filter(
              (pk) => !altAssigned.has(pk),
            );
            if (stillUnassigned.length > 0) {
              for (const relay of BOOTSTRAP_RELAYS) {
                if (!triedRelays.has(relay)) {
                  altRelayToAuthors.set(relay, stillUnassigned);
                }
              }
            }

            // Build and execute pass-2 tasks
            const pass2Tasks: Array<{
              relay: string;
              authors: string[];
            }> = [];
            for (const [relay, authors] of altRelayToAuthors) {
              const chunks = chunkAuthors(authors, 500);
              for (const chunk of chunks) {
                pass2Tasks.push({ relay, authors: chunk });
              }
            }

            if (pass2Tasks.length > 0) {
              const pass2Results = await Promise.all(
                pass2Tasks.map(async (task) => {
                  const events = await queryRelay(
                    pool,
                    task.relay,
                    task.authors,
                    200,
                    4000,
                  );
                  return events;
                }),
              );
              if (cancelled()) return;

              for (const events of pass2Results) {
                for (const ev of events) {
                  if (!eventMap.has(ev.id)) eventMap.set(ev.id, ev);
                }
              }
            }
          }
        }

        // Filter out replies (events with an "e" tag) and sort by created_at descending
        const sortedNotes = [...eventMap.values()]
          .filter((ev) => !ev.tags.some((t) => t[0] === "e"))
          .sort((a, b) => b.created_at - a.created_at);
        setNotes(sortedNotes);

        // Step 5: Resolve profiles
        setStep("resolving-profiles");
        setProgress("Loading profiles...");

        const authorPubkeys = new Set<string>();
        for (const ev of sortedNotes) {
          authorPubkeys.add(ev.pubkey);
        }
        // Also get mention pubkeys
        const mentionPubkeys = extractMentionPubkeysFromEvents(
          sortedNotes.map((ev) => ({ content: ev.content })),
        );
        for (const pk of mentionPubkeys) {
          authorPubkeys.add(pk);
        }

        if (cancelled()) return;

        // Fetch profiles in chunks of 500
        const allPubkeys = [...authorPubkeys];
        const profileMap = new Map<string, ProfileMetadataEntry>();
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
        setError(err instanceof Error ? err.message : "Failed to load feed");
      }
    }

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [pubkey, refreshKey, rebuildKey]);

  return {
    step,
    progress,
    notes,
    profiles,
    followCount,
    error,
    isFirstSetup,
    refresh,
    rebuildRelayPlan,
  };
}
