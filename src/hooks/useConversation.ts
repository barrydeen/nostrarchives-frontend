"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  sendDirectMessage,
  publishWrappedMessages,
  getConversationRelayConfig,
  type ConversationRelayConfig,
} from "@/lib/nip17";
import { dmStore, type Conversation } from "@/lib/dm-store";
import type { DecryptedDM } from "@/lib/nip17";

type SendState =
  | { status: "idle" }
  | { status: "wrapping"; step: number; total: number }
  | { status: "publishing" }
  | { status: "success"; successes: number; failures: number }
  | { status: "error"; message: string };

/**
 * Hook for a single conversation — messages, sending, relay info.
 */
export function useConversation(conversationId: string) {
  const { pubkey } = useAuth();
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });
  const [relayConfig, setRelayConfig] = useState<ConversationRelayConfig | null>(null);

  // Subscribe to the specific conversation from the store
  // getConversation returns a cached reference (stable between notify() calls)
  const conversation = useSyncExternalStore(
    (cb) => dmStore.subscribe(cb),
    () => dmStore.getConversation(conversationId),
    () => null as Conversation | null,
  );

  const messages: DecryptedDM[] = conversation?.messages ?? [];
  const participants: string[] = conversation?.participants ?? [];
  const otherParticipants: string[] = conversation?.otherParticipants ?? [];

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    dmStore.setActiveConversation(conversationId);
    dmStore.markRead(conversationId);

    return () => {
      dmStore.setActiveConversation(null);
    };
  }, [conversationId]);

  // Mark read when message count changes
  useEffect(() => {
    if (messages.length > 0) {
      dmStore.markRead(conversationId);
    }
  }, [conversationId, messages.length]);

  // Fetch relay config
  useEffect(() => {
    if (!pubkey || otherParticipants.length === 0) return;

    let cancelled = false;
    getConversationRelayConfig(pubkey, otherParticipants).then((config) => {
      if (!cancelled) setRelayConfig(config);
    });

    return () => {
      cancelled = true;
    };
  }, [pubkey, otherParticipants.join(",")]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!pubkey || !content.trim() || otherParticipants.length === 0) return;

      try {
        setSendState({ status: "wrapping", step: 0, total: otherParticipants.length + 1 });

        const wraps = await sendDirectMessage(
          content.trim(),
          otherParticipants,
          pubkey,
          (step, total) => {
            setSendState({ status: "wrapping", step, total });
          },
        );

        setSendState({ status: "publishing" });

        const result = await publishWrappedMessages(wraps);

        setSendState({
          status: "success",
          successes: result.successes,
          failures: result.failures,
        });

        // Auto-reset to idle after a moment
        setTimeout(() => setSendState({ status: "idle" }), 2000);
      } catch (err) {
        setSendState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to send message",
        });
      }
    },
    [pubkey, otherParticipants],
  );

  return {
    messages,
    participants,
    otherParticipants,
    sendMessage,
    sendState,
    relayConfig,
    conversation,
  };
}
