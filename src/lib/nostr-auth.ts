"use client";

/**
 * NIP-07 browser extension interface + NIP-98 HTTP auth helpers.
 */

interface UnsignedEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

interface SignedEvent extends UnsignedEvent {
  id: string;
  pubkey: string;
  sig: string;
}

interface WindowNostr {
  getPublicKey(): Promise<string>;
  signEvent(event: UnsignedEvent): Promise<SignedEvent>;
}

declare global {
  interface Window {
    nostr?: WindowNostr;
  }
}

/** Check if a NIP-07 browser extension (nos2x, Alby, etc.) is available. */
export function hasNostrExtension(): boolean {
  return typeof window !== "undefined" && !!window.nostr;
}

/** Get the user's public key from the NIP-07 extension. */
export async function getPublicKey(): Promise<string> {
  if (!window.nostr) throw new Error("No Nostr extension found");
  return window.nostr.getPublicKey();
}

/**
 * Create a NIP-98 Authorization header value.
 * Signs a kind-27235 event with the browser extension containing
 * the target URL and HTTP method.
 */
export async function createNip98AuthHeader(
  url: string,
  method: string,
): Promise<string> {
  if (!window.nostr) throw new Error("No Nostr extension found");

  const event = await window.nostr.signEvent({
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["u", url],
      ["method", method.toUpperCase()],
    ],
    content: "",
  });

  return `Nostr ${btoa(JSON.stringify(event))}`;
}
