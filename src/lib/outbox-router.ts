"use client";

import type { SimplePool } from "nostr-tools/pool";
import {
  BOOTSTRAP_RELAYS,
  parseRelayListEvent,
  type RelayList,
} from "./nostr-relay";

export interface OutboxPlan {
  /** relay URL → list of author pubkeys to query from that relay */
  relayAuthors: Map<string, string[]>;
  /** Authors with zero relay coverage (no kind-10002 found) */
  uncoveredAuthors: string[];
  totalRelays: number;
}

/**
 * Batch-fetch NIP-65 relay lists (kind 10002) for many pubkeys.
 * Chunks into groups of 500 (the typical relay filter limit) and
 * runs all chunks in parallel. Each chunk has a safety timeout so
 * a slow/down relay doesn't block everything.
 */
export async function batchFetchRelayLists(
  pool: SimplePool,
  pubkeys: string[],
  bootstrapRelays: string[] = BOOTSTRAP_RELAYS,
  batchSize = 500,
  batchTimeoutMs = 5000,
): Promise<Map<string, RelayList>> {
  // Split into chunks
  const chunks: string[][] = [];
  for (let i = 0; i < pubkeys.length; i += batchSize) {
    chunks.push(pubkeys.slice(i, i + batchSize));
  }

  // Run all chunks in parallel
  const batchResults = await Promise.all(
    chunks.map(
      (chunk) =>
        new Promise<import("nostr-tools/core").Event[]>((resolve) => {
          const collected: import("nostr-tools/core").Event[] = [];
          let resolved = false;

          const sub = pool.subscribeMany(
            bootstrapRelays,
            { kinds: [10002], authors: chunk },
            {
              onevent(event) {
                collected.push(event);
              },
              oneose() {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  sub.close();
                  resolve(collected);
                }
              },
            },
          );

          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              sub.close();
              resolve(collected);
            }
          }, batchTimeoutMs);
        }),
    ),
  );

  // Merge results, keeping only the latest event per pubkey
  const result = new Map<string, RelayList>();
  const latestByAuthor = new Map<string, import("nostr-tools/core").Event>();

  for (const events of batchResults) {
    for (const ev of events) {
      const existing = latestByAuthor.get(ev.pubkey);
      if (!existing || ev.created_at > existing.created_at) {
        latestByAuthor.set(ev.pubkey, ev);
      }
    }
  }

  for (const [pubkey, ev] of latestByAuthor) {
    result.set(pubkey, parseRelayListEvent(ev));
  }

  return result;
}

/**
 * Greedy 3× set cover: assign each author to at least `coverageTarget` relays.
 *
 * Algorithm:
 * 1. Build inverted index: relay → set of authors who write to it
 * 2. Track how many times each author is covered
 * 3. Greedily pick the relay covering the most still-uncovered authors
 * 4. Repeat until all authors meet their coverage target
 */
export function greedySetCover(
  authorRelays: Map<string, string[]>,
  coverageTarget = 3,
): OutboxPlan {
  // Build inverted index: relay → set of authors
  const relayToAuthors = new Map<string, Set<string>>();
  for (const [author, relays] of authorRelays) {
    for (const relay of relays) {
      let set = relayToAuthors.get(relay);
      if (!set) {
        set = new Set();
        relayToAuthors.set(relay, set);
      }
      set.add(author);
    }
  }

  // Track coverage per author
  const coverageCount = new Map<string, number>();
  const targetCoverage = new Map<string, number>();
  for (const [author, relays] of authorRelays) {
    coverageCount.set(author, 0);
    targetCoverage.set(author, Math.min(coverageTarget, relays.length));
  }

  // Set of authors still needing more coverage
  const uncovered = new Set<string>();
  for (const [author, target] of targetCoverage) {
    if (target > 0) uncovered.add(author);
  }

  // Result: selected relays and the authors assigned to each
  const selectedRelayAuthors = new Map<string, string[]>();
  const candidateRelays = new Set(relayToAuthors.keys());

  while (uncovered.size > 0 && candidateRelays.size > 0) {
    // Find the relay covering the most uncovered authors
    let bestRelay: string | null = null;
    let bestCount = 0;
    let bestTotalSize = 0;

    for (const relay of candidateRelays) {
      const authors = relayToAuthors.get(relay)!;
      let count = 0;
      for (const a of authors) {
        if (uncovered.has(a)) count++;
      }

      if (
        count > bestCount ||
        (count === bestCount && authors.size > bestTotalSize) ||
        (count === bestCount &&
          authors.size === bestTotalSize &&
          bestRelay !== null &&
          relay < bestRelay)
      ) {
        bestRelay = relay;
        bestCount = count;
        bestTotalSize = authors.size;
      }
    }

    if (!bestRelay || bestCount === 0) break;

    // Select this relay — assign all its authors (not just uncovered ones)
    const relayAuthors = relayToAuthors.get(bestRelay)!;
    selectedRelayAuthors.set(bestRelay, [...relayAuthors]);

    // Update coverage counts
    for (const author of relayAuthors) {
      const current = (coverageCount.get(author) ?? 0) + 1;
      coverageCount.set(author, current);
      const target = targetCoverage.get(author) ?? 0;
      if (current >= target) {
        uncovered.delete(author);
      }
    }

    candidateRelays.delete(bestRelay);
  }

  // Determine truly uncovered authors (0 coverage — no relay lists at all)
  const uncoveredAuthors: string[] = [];
  for (const [author] of authorRelays) {
    if ((coverageCount.get(author) ?? 0) === 0) {
      uncoveredAuthors.push(author);
    }
  }

  return {
    relayAuthors: selectedRelayAuthors,
    uncoveredAuthors,
    totalRelays: selectedRelayAuthors.size,
  };
}

/**
 * Split an author list into chunks of at most `max` (default 500).
 * Most relays reject author filters with more than 500 pubkeys.
 */
export function chunkAuthors(
  authors: string[],
  max = 500,
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < authors.length; i += max) {
    chunks.push(authors.slice(i, i + max));
  }
  return chunks;
}
