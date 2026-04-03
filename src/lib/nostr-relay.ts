"use client";

import { SimplePool } from "nostr-tools/pool";
import type { Event, EventTemplate } from "nostr-tools/core";

/**
 * Shared SimplePool instance for relay connections.
 * Lazy-initialized on first use.
 */
let pool: SimplePool | null = null;

export function getPool(): SimplePool {
  if (!pool) {
    pool = new SimplePool();
  }
  return pool;
}

/** Default relays to query for relay lists when we have nothing else. */
export const BOOTSTRAP_RELAYS = [
  "wss://indexer.nostrarchives.com",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
];

export interface RelayList {
  read: string[];
  write: string[];
}

/** All relay information we can gather from public relays for a given pubkey. */
export interface RelayInfo {
  /** NIP-65 inbox (read) relays */
  inbox: string[];
  /** NIP-65 outbox (write) relays */
  outbox: string[];
  /** NIP-17 DM relays (kind 10050) */
  dm: string[];
  /** Search relays (kind 10007) */
  search: string[];
  /** Relays from contact list content (kind 3) */
  contactListRelays: { url: string; policy: { read: boolean; write: boolean } }[];
  /** Blocked relays (kind 10006) */
  blocked: string[];
}

/** Profile metadata parsed from a kind 0 event. */
export interface NostrProfile {
  name: string | null;
  display_name: string | null;
  picture: string | null;
  nip05: string | null;
}

/**
 * Fetch a pubkey's profile metadata (kind 0) from bootstrap relays.
 * Returns parsed name, display_name, picture, and nip05.
 */
export async function fetchProfileMetadata(pubkey: string): Promise<NostrProfile | null> {
  const p = getPool();

  const event = await p.get(BOOTSTRAP_RELAYS, {
    kinds: [0],
    authors: [pubkey],
  });

  if (!event?.content) return null;

  try {
    const meta = JSON.parse(event.content);
    return {
      name: meta.name || null,
      display_name: meta.display_name || null,
      picture: meta.picture || null,
      nip05: meta.nip05 || null,
    };
  } catch {
    return null;
  }
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
export function parseRelayListEvent(event: Event): RelayList {
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
export function normalizeRelayUrl(url: string): string {
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

/**
 * Fetch a pubkey's contact list (kind 3) from bootstrap relays.
 * Returns the latest kind-3 event or null if none found.
 */
export async function fetchContactList(pubkey: string): Promise<Event | null> {
  const p = getPool();

  const event = await p.get(BOOTSTRAP_RELAYS, {
    kinds: [3],
    authors: [pubkey],
  });

  return event;
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

/**
 * Fetch all relay information for a pubkey from indexer relays.
 * Queries for NIP-65 relay list, DM relays, search relays,
 * contact list relays, and blocked relays — all from public relays only.
 */
export async function fetchAllRelayInfo(pubkey: string): Promise<RelayInfo> {
  const p = getPool();

  // Fetch all relevant replaceable events in parallel
  const [relayListEvent, dmRelayEvent, searchRelayEvent, contactListEvent, blockedRelayEvent] =
    await Promise.all([
      p.get(BOOTSTRAP_RELAYS, { kinds: [10002], authors: [pubkey] }),
      p.get(BOOTSTRAP_RELAYS, { kinds: [10050], authors: [pubkey] }),
      p.get(BOOTSTRAP_RELAYS, { kinds: [10007], authors: [pubkey] }),
      p.get(BOOTSTRAP_RELAYS, { kinds: [3], authors: [pubkey] }),
      p.get(BOOTSTRAP_RELAYS, { kinds: [10006], authors: [pubkey] }),
    ]);

  // Parse NIP-65 relay list (kind 10002)
  const { read: inbox, write: outbox } = relayListEvent
    ? parseRelayListEvent(relayListEvent)
    : { read: [] as string[], write: [] as string[] };

  // Parse DM relays (kind 10050) — "relay" tags
  const dm: string[] = [];
  if (dmRelayEvent) {
    for (const tag of dmRelayEvent.tags) {
      if (tag[0] === "relay" && tag[1]) {
        dm.push(normalizeRelayUrl(tag[1]));
      }
    }
  }

  // Parse search relays (kind 10007) — "relay" tags
  const search: string[] = [];
  if (searchRelayEvent) {
    for (const tag of searchRelayEvent.tags) {
      if (tag[0] === "relay" && tag[1]) {
        search.push(normalizeRelayUrl(tag[1]));
      }
    }
  }

  // Parse contact list content (kind 3) — JSON in content field
  const contactListRelays: RelayInfo["contactListRelays"] = [];
  if (contactListEvent?.content) {
    try {
      const relayObj = JSON.parse(contactListEvent.content);
      for (const [url, policy] of Object.entries(relayObj)) {
        const p = policy as { read?: boolean; write?: boolean } | null;
        contactListRelays.push({
          url: normalizeRelayUrl(url),
          policy: { read: p?.read ?? true, write: p?.write ?? true },
        });
      }
    } catch {
      // Content may not be valid JSON relay data
    }
  }

  // Parse blocked relays (kind 10006) — "relay" tags
  const blocked: string[] = [];
  if (blockedRelayEvent) {
    for (const tag of blockedRelayEvent.tags) {
      if (tag[0] === "relay" && tag[1]) {
        blocked.push(normalizeRelayUrl(tag[1]));
      }
    }
  }

  return { inbox, outbox, dm, search, contactListRelays, blocked };
}
