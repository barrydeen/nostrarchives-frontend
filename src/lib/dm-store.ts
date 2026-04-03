"use client";

/**
 * In-memory conversation store for NIP-17 direct messages.
 * Module-level singleton with pub/sub pattern for React integration.
 *
 * Decrypted messages are NEVER persisted to disk — they exist only
 * in memory for the duration of the session. Refreshing the page
 * re-fetches and re-decrypts from relays.
 */

import type { DecryptedDM } from "./nip17";
import type { NostrProfile } from "./nostr-relay";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Conversation {
  /** Canonical conversation id (SHA-256 of sorted participant pubkeys) */
  id: string;
  /** All participant pubkeys (including self) */
  participants: string[];
  /** Participants minus self */
  otherParticipants: string[];
  /** Messages sorted by created_at ascending */
  messages: DecryptedDM[];
  /** Most recent message (for list preview) */
  lastMessage: DecryptedDM | null;
  /** Timestamp of last activity (for sorting) */
  lastActivity: number;
  /** Number of unread messages */
  unreadCount: number;
}

type Listener = () => void;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

class DmStore {
  private conversations = new Map<string, Conversation>();
  private processedWrapIds = new Set<string>();
  private profiles = new Map<string, NostrProfile>();
  private listeners = new Set<Listener>();
  private activeConversationId: string | null = null;
  private ourPubkey: string | null = null;

  // Cached snapshots for useSyncExternalStore (must return stable refs)
  private _sortedSnapshot: Conversation[] = [];
  private _unreadSnapshot: number = 0;
  private _convSnapshots = new Map<string, Conversation | null>();

  /** Set the logged-in user's pubkey. */
  setOurPubkey(pubkey: string) {
    this.ourPubkey = pubkey;
  }

  /** Set which conversation is currently being viewed (for unread tracking). */
  setActiveConversation(conversationId: string | null) {
    this.activeConversationId = conversationId;
    if (conversationId) {
      const conv = this.conversations.get(conversationId);
      if (conv && conv.unreadCount > 0) {
        conv.unreadCount = 0;
        this.notify();
      }
    }
  }

  /** Check if a gift wrap has already been processed (dedup). */
  isProcessed(wrapId: string): boolean {
    return this.processedWrapIds.has(wrapId);
  }

  /** Add a decrypted message to the appropriate conversation. */
  addDecryptedMessage(dm: DecryptedDM) {
    // Dedup by wrap id
    if (this.processedWrapIds.has(dm.wrapId)) return;
    this.processedWrapIds.add(dm.wrapId);

    let conv = this.conversations.get(dm.conversationId);

    if (!conv) {
      // Extract participants from the rumor's p tags
      const participants = dm.tags
        .filter((t) => t[0] === "p" && t[1])
        .map((t) => t[1]);

      // Ensure sender is included
      if (!participants.includes(dm.sender)) {
        participants.push(dm.sender);
      }

      conv = {
        id: dm.conversationId,
        participants,
        otherParticipants: participants.filter((p) => p !== this.ourPubkey),
        messages: [],
        lastMessage: null,
        lastActivity: 0,
        unreadCount: 0,
      };
      this.conversations.set(dm.conversationId, conv);
    }

    // Deduplicate by rumor id (same message may arrive from multiple relays)
    if (conv.messages.some((m) => m.id === dm.id)) return;

    // Insert in sorted order (by created_at ascending)
    const idx = conv.messages.findIndex((m) => m.created_at > dm.created_at);
    if (idx === -1) {
      conv.messages.push(dm);
    } else {
      conv.messages.splice(idx, 0, dm);
    }

    // Update last message
    const last = conv.messages[conv.messages.length - 1];
    conv.lastMessage = last;
    conv.lastActivity = last.created_at;

    // Increment unread unless this is the active conversation or our own message
    if (
      dm.conversationId !== this.activeConversationId &&
      dm.sender !== this.ourPubkey
    ) {
      conv.unreadCount++;
    }

    this.notify();
  }

  /** Mark a conversation as read. */
  markRead(conversationId: string) {
    const conv = this.conversations.get(conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.notify();
    }
  }

  /** Get all conversations sorted by last activity (most recent first). Cached for useSyncExternalStore. */
  getConversationsSorted(): Conversation[] {
    return this._sortedSnapshot;
  }

  /** Get a single conversation by id. Cached for useSyncExternalStore. */
  getConversation(id: string): Conversation | null {
    return this._convSnapshots.get(id) ?? null;
  }

  /**
   * Ensure a conversation exists (e.g., when starting a new DM).
   * If it already exists, returns the existing one.
   */
  ensureConversation(
    conversationId: string,
    participants: string[],
  ): Conversation {
    let conv = this.conversations.get(conversationId);
    if (!conv) {
      conv = {
        id: conversationId,
        participants,
        otherParticipants: participants.filter((p) => p !== this.ourPubkey),
        messages: [],
        lastMessage: null,
        lastActivity: 0,
        unreadCount: 0,
      };
      this.conversations.set(conversationId, conv);
      this.notify();
    }
    return conv;
  }

  /** Get total unread count across all conversations. Cached for useSyncExternalStore. */
  getTotalUnread(): number {
    return this._unreadSnapshot;
  }

  // -- Profile cache --

  setProfile(pubkey: string, profile: NostrProfile) {
    this.profiles.set(pubkey, profile);
    this.notify();
  }

  getProfile(pubkey: string): NostrProfile | undefined {
    return this.profiles.get(pubkey);
  }

  // -- Pub/Sub --

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    // Rebuild cached snapshots so useSyncExternalStore gets stable refs
    this._sortedSnapshot = Array.from(this.conversations.values()).sort(
      (a, b) => b.lastActivity - a.lastActivity,
    );

    let unread = 0;
    for (const conv of this.conversations.values()) {
      unread += conv.unreadCount;
      this._convSnapshots.set(conv.id, conv);
    }
    this._unreadSnapshot = unread;

    for (const listener of this.listeners) {
      listener();
    }
  }

  /** Reset all state (e.g., on logout). */
  reset() {
    this.conversations.clear();
    this.processedWrapIds.clear();
    this.profiles.clear();
    this.activeConversationId = null;
    this.ourPubkey = null;
    this.notify();
  }
}

/** Global singleton instance. */
export const dmStore = new DmStore();
