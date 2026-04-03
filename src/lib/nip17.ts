"use client";

/**
 * NIP-17 Private Direct Messages — core protocol layer.
 *
 * Implements gift-wrapping (NIP-59) adapted for NIP-07 browser extensions:
 * - Seal layer uses window.nostr.nip44.encrypt() + window.nostr.signEvent()
 * - Gift wrap layer uses locally-generated ephemeral keys + nostr-tools nip44
 * - Unwrapping uses window.nostr.nip44.decrypt() for both layers
 */

import {
  generateSecretKey,
  getPublicKey as getPubkeyFromSecret,
  finalizeEvent,
  getEventHash,
} from "nostr-tools/pure";
import { encrypt as nip44Encrypt } from "nostr-tools/nip44";
import { getConversationKey } from "nostr-tools/nip44";
import type { Event, EventTemplate } from "nostr-tools/core";
import {
  fetchAllRelayInfo,
  fetchRelayList,
  BOOTSTRAP_RELAYS,
  normalizeRelayUrl,
  getPool,
  publishEvent,
} from "./nostr-relay";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Rumor {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

export interface DecryptedDM {
  /** Rumor event id */
  id: string;
  /** Sender pubkey (from rumor) */
  sender: string;
  /** Message text */
  content: string;
  /** Real timestamp from the rumor (not the randomized wrap timestamp) */
  created_at: number;
  /** Full rumor tags (includes p tags for all participants) */
  tags: string[][];
  /** Gift wrap event id — used for deduplication */
  wrapId: string;
  /** Canonical conversation identifier (hash of sorted participant pubkeys) */
  conversationId: string;
}

export interface WrappedMessage {
  wrap: Event;
  recipientPubkey: string;
}

export interface ConversationRelayConfig {
  ours: string[];
  theirs: Map<string, string[]>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Randomize timestamp up to 2 days in the past per NIP-17 spec. */
function randomizeTimestamp(): number {
  const twoDays = 2 * 24 * 60 * 60;
  return Math.floor(Date.now() / 1000 - Math.random() * twoDays);
}

/**
 * Derive a canonical conversation identifier from participant pubkeys.
 * Sort all pubkeys, join with ":", SHA-256 hash, hex-encode.
 */
export async function deriveConversationId(
  pubkeys: string[],
): Promise<string> {
  const sorted = [...pubkeys].sort();
  const data = new TextEncoder().encode(sorted.join(":"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Short conversation id for URLs (first 16 hex chars). */
export async function shortConversationId(
  pubkeys: string[],
): Promise<string> {
  const full = await deriveConversationId(pubkeys);
  return full.slice(0, 16);
}

/** Check if the browser extension supports NIP-44 encryption. */
export function hasNip44Support(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.nostr?.nip44?.encrypt &&
    !!window.nostr?.nip44?.decrypt
  );
}

// ---------------------------------------------------------------------------
// Wrapping (sending)
// ---------------------------------------------------------------------------

/**
 * Create an unsigned kind 14 rumor event.
 * Per NIP-17, p tags include ALL participants (including the sender).
 */
export function createRumor(
  ourPubkey: string,
  content: string,
  allParticipantPubkeys: string[],
  replyToId?: string,
): Rumor {
  const tags: string[][] = [];

  // Add p tag for every participant (including ourselves)
  for (const pk of allParticipantPubkeys) {
    tags.push(["p", pk]);
  }

  // Reply threading
  if (replyToId) {
    tags.push(["e", replyToId, "", "reply"]);
  }

  const unsigned = {
    pubkey: ourPubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 14,
    tags,
    content,
  };

  const id = getEventHash(unsigned);

  return { ...unsigned, id };
}

/**
 * Seal a rumor for a specific recipient using NIP-07.
 * Encrypts the rumor JSON via the extension's nip44.encrypt,
 * then signs a kind 13 event via the extension's signEvent.
 */
async function sealRumor(
  rumor: Rumor,
  recipientPubkey: string,
): Promise<Event> {
  if (!window.nostr?.nip44) {
    throw new Error("NIP-44 encryption not supported by your Nostr extension");
  }

  // Encrypt the rumor for the recipient
  const encryptedContent = await window.nostr.nip44.encrypt(
    recipientPubkey,
    JSON.stringify(rumor),
  );

  // Build and sign the seal (kind 13)
  const sealTemplate = {
    kind: 13,
    created_at: randomizeTimestamp(),
    tags: [],
    content: encryptedContent,
  };

  const signedSeal = await window.nostr.signEvent(sealTemplate);
  return signedSeal as unknown as Event;
}

/**
 * Gift-wrap a seal for a specific recipient using a locally-generated ephemeral key.
 * This layer does NOT touch the NIP-07 extension.
 */
function wrapSeal(seal: Event, recipientPubkey: string): Event {
  const ephemeralKey = generateSecretKey();
  const conversationKey = getConversationKey(ephemeralKey, recipientPubkey);
  const encryptedSeal = nip44Encrypt(JSON.stringify(seal), conversationKey);

  const wrapTemplate: EventTemplate = {
    kind: 1059,
    created_at: randomizeTimestamp(),
    tags: [["p", recipientPubkey]],
    content: encryptedSeal,
  };

  return finalizeEvent(wrapTemplate, ephemeralKey) as unknown as Event;
}

/**
 * Create gift-wrapped copies of a direct message for all participants.
 *
 * For each recipient (including the sender themselves):
 * 1. Seal the rumor (NIP-07 encrypt + sign) — one extension prompt per recipient
 * 2. Wrap the seal with an ephemeral key (local, no extension interaction)
 *
 * Returns an array of { wrap, recipientPubkey } for publishing.
 */
export async function sendDirectMessage(
  content: string,
  recipientPubkeys: string[],
  ourPubkey: string,
  onProgress?: (step: number, total: number) => void,
): Promise<WrappedMessage[]> {
  // All participants includes self
  const allParticipants = Array.from(
    new Set([ourPubkey, ...recipientPubkeys]),
  );

  const rumor = createRumor(ourPubkey, content, allParticipants);
  const wraps: WrappedMessage[] = [];

  for (let i = 0; i < allParticipants.length; i++) {
    onProgress?.(i + 1, allParticipants.length);
    const pk = allParticipants[i];

    // Each recipient gets their own seal (encrypted specifically for them)
    const seal = await sealRumor(rumor, pk);
    const wrap = wrapSeal(seal, pk);

    wraps.push({ wrap, recipientPubkey: pk });
  }

  return wraps;
}

// ---------------------------------------------------------------------------
// Unwrapping (receiving)
// ---------------------------------------------------------------------------

/**
 * Unwrap a received gift wrap event using NIP-07.
 *
 * 1. Decrypt the gift wrap content (ephemeral pubkey -> our privkey via extension)
 * 2. Parse the seal
 * 3. Decrypt the seal content (sender pubkey -> our privkey via extension)
 * 4. Parse the rumor
 */
export async function unwrapGiftWrap(
  wrap: Event,
  ourPubkey: string,
): Promise<DecryptedDM> {
  if (!window.nostr?.nip44) {
    throw new Error("NIP-44 encryption not supported by your Nostr extension");
  }

  // Layer 1: Decrypt the gift wrap to get the seal
  // wrap.pubkey is the ephemeral key that encrypted for us
  const sealJson = await window.nostr.nip44.decrypt(wrap.pubkey, wrap.content);
  let seal: Event;
  try {
    seal = JSON.parse(sealJson);
  } catch {
    throw new Error("Failed to parse seal from gift wrap");
  }

  if (seal.kind !== 13) {
    throw new Error(`Unexpected seal kind: ${seal.kind}`);
  }

  // Layer 2: Decrypt the seal to get the rumor
  // seal.pubkey is the sender's real pubkey
  const rumorJson = await window.nostr.nip44.decrypt(seal.pubkey, seal.content);
  let rumor: Rumor;
  try {
    rumor = JSON.parse(rumorJson);
  } catch {
    throw new Error("Failed to parse rumor from seal");
  }

  if (rumor.kind !== 14) {
    throw new Error(`Unexpected rumor kind: ${rumor.kind}`);
  }

  // Extract all participant pubkeys from p tags
  const participants = rumor.tags
    .filter((t) => t[0] === "p" && t[1])
    .map((t) => t[1]);

  // Ensure the sender is included (should already be per NIP-17)
  if (!participants.includes(rumor.pubkey)) {
    participants.push(rumor.pubkey);
  }

  const conversationId = await deriveConversationId(participants);

  return {
    id: rumor.id,
    sender: rumor.pubkey,
    content: rumor.content,
    created_at: rumor.created_at,
    tags: rumor.tags,
    wrapId: wrap.id,
    conversationId,
  };
}

// ---------------------------------------------------------------------------
// Relay resolution
// ---------------------------------------------------------------------------

/**
 * Get the DM relays for a pubkey with fallback chain:
 * 1. Kind 10050 (NIP-17 DM relays)
 * 2. Kind 10002 inbox (read) relays
 * 3. Bootstrap relays
 */
export async function getDmRelaysForPubkey(pubkey: string): Promise<string[]> {
  try {
    const info = await fetchAllRelayInfo(pubkey);

    // Prefer DM relays (kind 10050)
    if (info.dm.length > 0) return info.dm;

    // Fall back to inbox (read) relays from NIP-65
    if (info.inbox.length > 0) return info.inbox;
  } catch {
    // Relay fetch failed, use fallback
  }

  return [...BOOTSTRAP_RELAYS];
}

/**
 * Get relay configuration for a conversation — our relays and each partner's relays.
 * Used to display relay info in the UI.
 */
export async function getConversationRelayConfig(
  ourPubkey: string,
  otherPubkeys: string[],
): Promise<ConversationRelayConfig> {
  const [ours, ...theirs] = await Promise.all([
    getDmRelaysForPubkey(ourPubkey),
    ...otherPubkeys.map((pk) => getDmRelaysForPubkey(pk)),
  ]);

  const theirMap = new Map<string, string[]>();
  otherPubkeys.forEach((pk, i) => {
    theirMap.set(pk, theirs[i]);
  });

  return { ours, theirs: theirMap };
}

/**
 * Get the full set of relays to subscribe to for incoming DMs.
 *
 * Senders look up our kind 10050 (DM relays) first, then fall back
 * to kind 10002 (inbox relays), then to popular bootstrap relays.
 * We need to listen on ALL of these to catch messages from every sender,
 * since different senders may resolve our relays differently.
 */
export async function getOurDmRelays(ourPubkey: string): Promise<string[]> {
  const relays = new Set<string>();

  try {
    const info = await fetchAllRelayInfo(ourPubkey);

    // DM relays (kind 10050) — where spec-compliant senders publish
    for (const r of info.dm) relays.add(r);

    // Inbox relays (kind 10002 read) — fallback for senders who
    // don't find our kind 10050, or older clients
    for (const r of info.inbox) relays.add(r);
  } catch {
    // Relay fetch failed
  }

  // Always include bootstrap relays — senders with no relay info
  // for us will fall back to popular relays
  for (const r of BOOTSTRAP_RELAYS) relays.add(r);

  return [...relays];
}

/**
 * Publish wrapped messages — each wrap goes to its recipient's DM relays.
 * Uses NIP-42 AUTH since most DM relays require authentication.
 */
export async function publishWrappedMessages(
  wraps: WrappedMessage[],
): Promise<{ successes: number; failures: number }> {
  let successes = 0;
  let failures = 0;

  for (const { wrap, recipientPubkey } of wraps) {
    const relays = await getDmRelaysForPubkey(recipientPubkey);
    const result = await publishEvent(relays, wrap, { withAuth: true });
    successes += result.successes.length;
    failures += result.failures.length;
  }

  return { successes, failures };
}
