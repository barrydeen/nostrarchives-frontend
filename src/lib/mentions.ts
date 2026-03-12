import { nip19 } from "nostr-tools";

const MENTION_REGEX = /(nostr:)?(npub1[a-z0-9]+|nprofile1[a-z0-9]+)/gi;

/**
 * Extract hex pubkeys from content containing `nostr:npub...`, `nostr:nprofile...`,
 * or raw `npub1...` / `nprofile1...` strings.
 */
export function extractMentionPubkeys(content: string): string[] {
  if (!content) return [];

  const pubkeys: string[] = [];

  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    const bech32 = match[2];
    try {
      const decoded = nip19.decode(bech32);
      if (decoded.type === "npub") {
        pubkeys.push(decoded.data as string);
      } else if (decoded.type === "nprofile") {
        const data = decoded.data as { pubkey: string };
        pubkeys.push(data.pubkey);
      }
    } catch {
      // ignore
    }
  }

  return pubkeys;
}

export function extractMentionPubkeysFromEvents(events: Array<{ content: string }>): string[] {
  const out: string[] = [];
  for (const ev of events) {
    out.push(...extractMentionPubkeys(ev.content));
  }
  return out;
}
