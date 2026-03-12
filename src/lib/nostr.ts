/**
 * Client-side NIP-19 entity detection for instant navigation.
 * Uses nostr-tools for decoding npub/nprofile/nevent/note entities.
 */

import { nip19 } from "nostr-tools";

export type EntityType = "profile" | "event";

export interface DecodedEntity {
  type: EntityType;
  /** Hex pubkey (for profile) or hex event id (for event) */
  id: string;
  relays?: string[];
  author?: string;
  kind?: number;
}

const HEX_64 = /^[0-9a-f]{64}$/i;

/**
 * Attempt to decode a string as a Nostr entity.
 * Returns null if the input is not a recognized entity format.
 */
export function decodeEntity(input: string): DecodedEntity | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Raw 64-char hex — ambiguous, don't resolve client-side
  if (HEX_64.test(trimmed)) return null;

  try {
    const decoded = nip19.decode(trimmed);

    switch (decoded.type) {
      case "npub":
        return { type: "profile", id: decoded.data };
      case "nprofile":
        return {
          type: "profile",
          id: decoded.data.pubkey,
          relays: decoded.data.relays,
        };
      case "note":
        return { type: "event", id: decoded.data };
      case "nevent":
        return {
          type: "event",
          id: decoded.data.id,
          relays: decoded.data.relays,
          author: decoded.data.author,
          kind: decoded.data.kind,
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Check if input looks like it could be a Nostr entity (for early detection).
 */
export function looksLikeEntity(input: string): boolean {
  const lower = input.trim().toLowerCase();
  return (
    lower.startsWith("npub1") ||
    lower.startsWith("nprofile1") ||
    lower.startsWith("nevent1") ||
    lower.startsWith("note1") ||
    HEX_64.test(input.trim())
  );
}

/**
 * Get the navigation path for a decoded entity.
 */
export function entityPath(entity: DecodedEntity): string {
  return entity.type === "profile"
    ? `/profiles/${entity.id}`
    : `/notes/${entity.id}`;
}
