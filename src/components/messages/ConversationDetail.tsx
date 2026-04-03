"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useConversation } from "@/hooks/useConversation";
import { dmStore } from "@/lib/dm-store";
import { SafeAvatar } from "@/components/search/SafeAvatar";
import { MessageBubble } from "./MessageBubble";
import { ComposeBar } from "./ComposeBar";
import { RelayBadge } from "./RelayBadge";

interface ConversationDetailProps {
  conversationId: string;
}

export function ConversationDetail({
  conversationId,
}: ConversationDetailProps) {
  const { pubkey } = useAuth();
  const {
    messages,
    otherParticipants,
    sendMessage,
    sendState,
    relayConfig,
    conversation,
  } = useConversation(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGroup = otherParticipants.length > 1;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!pubkey) return null;

  // Build header info
  const profiles = otherParticipants.map((pk) => ({
    pubkey: pk,
    profile: dmStore.getProfile(pk),
  }));

  const headerName = isGroup
    ? profiles
        .map(
          (p) =>
            p.profile?.display_name ||
            p.profile?.name ||
            p.pubkey.slice(0, 8) + "...",
        )
        .join(", ")
    : profiles[0]?.profile?.display_name ||
      profiles[0]?.profile?.name ||
      otherParticipants[0]?.slice(0, 12) + "...";

  // Send state status text
  let statusText: string | undefined;
  if (sendState.status === "wrapping") {
    statusText = `Signing ${sendState.step} of ${sendState.total}...`;
  } else if (sendState.status === "publishing") {
    statusText = "Publishing to relays...";
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <Link
          href="/messages"
          className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </Link>

        {/* Avatar(s) */}
        {isGroup ? (
          <div className="flex items-center -space-x-2">
            {profiles.slice(0, 3).map((p) => (
              <div key={p.pubkey} className="ring-2 ring-background rounded-full">
                <SafeAvatar src={p.profile?.picture ?? null} size="sm" />
              </div>
            ))}
            {profiles.length > 3 && (
              <div className="flex size-9 items-center justify-center rounded-full bg-white/10 ring-2 ring-background text-[11px] font-bold text-white/60">
                +{profiles.length - 3}
              </div>
            )}
          </div>
        ) : (
          <SafeAvatar src={profiles[0]?.profile?.picture ?? null} size="sm" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {headerName}
          </p>
          <p className="text-[11px] text-white/30">
            {isGroup ? (
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {otherParticipants.length + 1} participants
              </span>
            ) : (
              otherParticipants[0]?.slice(0, 16) + "..."
            )}
          </p>
        </div>

        <RelayBadge config={relayConfig} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MessageCircle className="size-10 text-white/10" />
            <p className="text-sm text-white/40">
              No messages yet. Send the first one!
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.wrapId}
              message={msg}
              ourPubkey={pubkey}
              showSender={isGroup}
            />
          ))}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Send state feedback */}
      {sendState.status === "success" && (
        <div className="mx-4 mb-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs text-green-400/80">
          Sent to {sendState.successes} relay
          {sendState.successes !== 1 ? "s" : ""}
          {sendState.failures > 0 && (
            <span className="text-white/40">
              {" "}
              ({sendState.failures} failed)
            </span>
          )}
        </div>
      )}
      {sendState.status === "error" && (
        <div className="mx-4 mb-1 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400/80">
          <AlertCircle className="size-3 shrink-0" />
          {sendState.message}
        </div>
      )}

      {/* Compose bar */}
      <ComposeBar
        onSend={sendMessage}
        disabled={otherParticipants.length === 0}
        sending={
          sendState.status === "wrapping" ||
          sendState.status === "publishing"
        }
        statusText={statusText}
      />
    </div>
  );
}
