"use client";

import { SimplePool } from "nostr-tools/pool";
import type { Event, EventTemplate } from "nostr-tools/core";

/**
 * Shared SimplePool instance for relay connections.
 * Lazy-initialized on first use.
 */
let pool: SimplePool | null = null;

function getPool(): SimplePool {
  if (!pool) {
    pool = new SimplePool();
  }
  return pool;
}

/** Default relays to query for relay lists when we have nothing else. */
const BOOTSTRAP_RELAYS = [
  "wss://indexer.nostrarchives.com",
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
];

export interface RelayList {
  read: string[];
  write: string[];
}

/**
 * Fetch a pubkey's NIP-65 relay list (kind 10002) from bootstrap relays.
 * Returns the parsed read/write relay URLs.
 */
export async function fetchRelayList(pubkey: string): Promise<RelayList> {
  const p = getPool();

  const event = await p.get(BOOTSTRAP_RELAYS, {
    kinds: [10002],
    authors: [pubkey],
  });

  if (!event) {
    return { read: [], write: [] };
  }

  return parseRelayListEvent(event);
}

/**
 * Parse a NIP-65 kind 10002 event into read/write relay lists.
 *
 * Tag format: ["r", "wss://relay.example.com", "read"|"write"]
 * If no marker is present, the relay is used for both read and write.
 */
function parseRelayListEvent(event: Event): RelayList {
  const read: string[] = [];
  const write: string[] = [];

  for (const tag of event.tags) {
    if (tag[0] !== "r" || !tag[1]) continue;

    const url = normalizeRelayUrl(tag[1]);
    const marker = tag[2]?.toLowerCase();

    if (marker === "read") {
      read.push(url);
    } else if (marker === "write") {
      write.push(url);
    } else {
      // No marker = both
      read.push(url);
      write.push(url);
    }
  }

  return { read, write };
}

/** Normalize relay URLs: ensure trailing slash, lowercase protocol. */
function normalizeRelayUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

/**
 * Compute the set of relays to publish a reply to, following the outbox model:
 * - Our own write (outbox) relays
 * - The target author's read (inbox) relays
 *
 * Falls back to bootstrap relays if neither list is available.
 */
export async function getOutboxRelays(
  ourPubkey: string,
  targetPubkey: string,
): Promise<string[]> {
  const [ourList, targetList] = await Promise.all([
    fetchRelayList(ourPubkey),
    fetchRelayList(targetPubkey),
  ]);

  const relays = new Set<string>();

  // Our write (outbox) relays
  for (const r of ourList.write) relays.add(r);

  // Target's read (inbox) relays
  for (const r of targetList.read) relays.add(r);

  // If we got nothing, fall back to bootstrap relays
  if (relays.size === 0) {
    for (const r of BOOTSTRAP_RELAYS) relays.add(r);
  }

  return [...relays];
}

export interface PublishResult {
  successes: string[];
  failures: { relay: string; error: string }[];
}

/**
 * Publish a signed event to a list of relays.
 * Returns which relays accepted vs rejected.
 */
export async function publishEvent(
  relays: string[],
  event: Event,
): Promise<PublishResult> {
  const p = getPool();
  const result: PublishResult = { successes: [], failures: [] };

  const promises = p.publish(relays, event);

  const settled = await Promise.allSettled(
    promises.map((promise, i) =>
      promise
        .then((url) => {
          result.successes.push(url || relays[i]);
        })
        .catch((err) => {
          result.failures.push({
            relay: relays[i],
            error: err?.message || String(err),
          });
        }),
    ),
  );

  return result;
}

/**
 * Sign an event template using the NIP-07 browser extension.
 * Returns the fully signed event.
 */
export async function signEvent(template: EventTemplate): Promise<Event> {
  if (!window.nostr) {
    throw new Error("No Nostr extension found");
  }
  const signed = await window.nostr.signEvent(template as any);
  return signed as unknown as Event;
}
